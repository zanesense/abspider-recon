import asyncio
import collections
import ipaddress
import os
import socket
import time
import httpx
from urllib.parse import urljoin, urlparse
from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse, Response

app = FastAPI(title="ABSpider Proxy API")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_REST_URL = f"{SUPABASE_URL}/rest/v1"
SUPABASE_AUTH_URL = f"{SUPABASE_URL}/auth/v1"

PROVIDER_AUTH = {
    "shodan": {"type": "query", "param": "key"},
    "virustotal": {"type": "header", "header": "x-apikey"},
    "securitytrails": {"type": "header", "header": "APIKEY"},
    "builtwith": {"type": "query", "param": "key"},
    "opencage": {"type": "query", "param": "key"},
    "hunterio": {"type": "query", "param": "api_key"},
    "clearbit": {"type": "header", "header": "Authorization", "prefix": "Bearer "},
}

ALLOWED_HEADERS = {
    "accept",
    "accept-encoding",
    "accept-language",
    "user-agent",
    "content-type",
}

DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

ALLOWED_ORIGINS = {
    "https://abspider.zanesense.dev",
    "http://localhost:5000",
    "http://localhost:3000",
    "http://localhost:5173",
}

ALLOWED_TARGET_HOSTS = {
    "api.example.com",
    "example.com",
}

BLOCKED_HOSTNAMES = {"localhost", "169.254.169.254", "metadata.google.internal", "metadata.internal"}

RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX = 120
_rate_limit_buckets: dict[str, list[float]] = collections.defaultdict(list)


def get_cors_headers(origin: str) -> dict:
    allow_origin = origin if origin in ALLOWED_ORIGINS else "null"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Expose-Headers": "X-ABSpider-Proxy, X-ABSpider-Target-URL",
        "Vary": "Origin",
        "X-ABSpider-Proxy": "fastapi",
    }


def _is_private_ip(host: str) -> bool:
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_unspecified
    )


async def is_ssrf_target(url: str) -> bool:
    try:
        parsed = urlparse(url)
        host = parsed.hostname or ""
        if host in BLOCKED_HOSTNAMES:
            return True
        if _is_private_ip(host):
            return True
        try:
            loop = asyncio.get_running_loop()
            addrs = await loop.getaddrinfo(host, None, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
            for addr in addrs:
                ip_str = addr[4][0]
                if _is_private_ip(ip_str):
                    return True
        except OSError:
            return True
        return False
    except Exception:
        return True


@app.options("/api/proxy")
async def proxy_options(request: Request):
    origin = request.headers.get("origin", "")
    return Response(status_code=204, headers=get_cors_headers(origin))


@app.api_route("/api/proxy", methods=["GET", "POST"])
async def proxy_handler(request: Request, url: str = Query(...)):
    origin = request.headers.get("origin", "")
    cors = get_cors_headers(origin)

    if not url.startswith(("http://", "https://")):
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid URL. Must start with http:// or https://"},
            headers=cors,
        )

    if await is_ssrf_target(url):
        return JSONResponse(
            status_code=400,
            content={"error": "Target URL is not allowed"},
            headers=cors,
        )

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    timestamps = _rate_limit_buckets[client_ip]
    cutoff = now - RATE_LIMIT_WINDOW
    while timestamps and timestamps[0] < cutoff:
        timestamps.pop(0)
    if len(timestamps) >= RATE_LIMIT_MAX:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded. Try again later."},
            headers=cors,
        )
    timestamps.append(now)

    headers = {}
    for key, value in request.headers.items():
        if key.lower() in ALLOWED_HEADERS:
            headers[key] = value

    if "user-agent" not in {k.lower() for k in headers}:
        headers["User-Agent"] = DEFAULT_UA

    async with httpx.AsyncClient(follow_redirects=False, timeout=30.0) as client:
        try:
            body = await request.body() if request.method != "GET" else None
            method = request.method
            current_url = url

            for _ in range(5):
                response = await client.request(
                    method=method,
                    url=current_url,
                    headers=headers,
                    content=body,
                )
                if response.status_code < 300 or response.status_code >= 400:
                    break
                location = response.headers.get("location")
                if not location:
                    break
                current_url = urljoin(current_url, location)
                if await is_ssrf_target(current_url):
                    return JSONResponse(
                        status_code=400,
                        content={"error": "Redirect target URL is not allowed"},
                        headers=cors,
                    )

            resp_headers = dict(response.headers)
            resp_headers.pop("content-encoding", None)
            resp_headers.pop("content-length", None)
            resp_headers.pop("transfer-encoding", None)
            resp_headers.update(cors)
            resp_headers["X-ABSpider-Target-URL"] = url

            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=resp_headers,
            )
        except httpx.TimeoutException:
            return JSONResponse(
                status_code=504,
                content={"error": "Request timed out"},
                headers=cors,
            )
        except Exception:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to fetch target URL"},
                headers=cors,
            )


# ---------------------------------------------------------------------------
# Secure API key proxy — keys never reach the browser
# ---------------------------------------------------------------------------

async def _supabase_get_user(token: str) -> dict | None:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    async with httpx.AsyncClient() as c:
        resp = await c.get(
            f"{SUPABASE_AUTH_URL}/user",
            headers={"Authorization": f"Bearer {token}", "apikey": SUPABASE_SERVICE_ROLE_KEY},
        )
        return resp.json() if resp.status_code == 200 else None


async def _supabase_get_keys(user_id: str) -> dict:
    if not SUPABASE_URL:
        return {}
    async with httpx.AsyncClient() as c:
        resp = await c.get(
            f"{SUPABASE_REST_URL}/user_api_keys",
            params={"user_id": f"eq.{user_id}"},
            headers={"Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}", "apikey": SUPABASE_SERVICE_ROLE_KEY},
        )
        rows = resp.json()
        return rows[0].get("api_keys", {}) if isinstance(rows, list) and rows else {}


async def _supabase_upsert_keys(user_id: str, api_keys: dict) -> bool:
    if not SUPABASE_URL:
        return False
    async with httpx.AsyncClient() as c:
        resp = await c.post(
            f"{SUPABASE_REST_URL}/user_api_keys",
            json={"user_id": user_id, "api_keys": api_keys},
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Prefer": "resolution=merge-duplicates",
            },
        )
        return resp.status_code in (200, 201)


def _authenticate_user(user: dict | None, cors: dict) -> JSONResponse | None:
    if user is None:
        return JSONResponse(status_code=401, content={"error": "Invalid or expired token"}, headers=cors)
    return None


def _attach_auth(url: str, headers: dict, provider: str, api_key: str) -> tuple[str, dict]:
    config = PROVIDER_AUTH.get(provider)
    if not config:
        return url, headers
    if config["type"] == "header":
        prefix = config.get("prefix", "")
        headers[config["header"]] = f"{prefix}{api_key}"
    elif config["type"] == "query":
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}{config['param']}={api_key}"
    return url, headers


@app.options("/api/keys")
@app.options("/api/keys/proxy")
async def keys_options(request: Request):
    origin = request.headers.get("origin", "")
    return Response(status_code=204, headers=get_cors_headers(origin))


def _bearer_token(request: Request) -> str | None:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    return auth.removeprefix("Bearer ")


@app.get("/api/keys")
async def get_api_keys(request: Request):
    origin = request.headers.get("origin", "")
    cors = get_cors_headers(origin)
    token = _bearer_token(request)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Missing Authorization header"}, headers=cors)
    user = await _supabase_get_user(token)
    err = _authenticate_user(user, cors)
    if err:
        return err
    keys = await _supabase_get_keys(user["id"])
    return JSONResponse(content=keys, headers=cors)


@app.post("/api/keys")
async def save_api_keys(request: Request):
    origin = request.headers.get("origin", "")
    cors = get_cors_headers(origin)
    token = _bearer_token(request)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Missing Authorization header"}, headers=cors)
    user = await _supabase_get_user(token)
    err = _authenticate_user(user, cors)
    if err:
        return err
    body = await request.json()
    ok = await _supabase_upsert_keys(user["id"], body)
    if not ok:
        return JSONResponse(status_code=500, content={"error": "Failed to save API keys"}, headers=cors)
    return JSONResponse(content={"ok": True}, headers=cors)


@app.post("/api/keys/proxy")
async def proxy_api_key_request(request: Request):
    origin = request.headers.get("origin", "")
    cors = get_cors_headers(origin)
    token = _bearer_token(request)
    if not token:
        return JSONResponse(status_code=401, content={"error": "Missing Authorization header"}, headers=cors)
    user = await _supabase_get_user(token)
    err = _authenticate_user(user, cors)
    if err:
        return err

    body = await request.json()
    provider = body.get("provider")
    target_url = body.get("url")
    method = body.get("method", "GET")
    req_headers = dict(body.get("headers") or {})
    req_body = body.get("body")

    if not provider or not target_url:
        return JSONResponse(status_code=400, content={"error": "provider and url are required"}, headers=cors)
    if provider not in PROVIDER_AUTH:
        return JSONResponse(status_code=400, content={"error": f"Unknown provider: {provider}"}, headers=cors)

    # Allow caller to provide an explicit key (e.g. for testing a new key before saving)
    api_key = body.get("api_key")
    if not api_key:
        keys = await _supabase_get_keys(user["id"])
        api_key = keys.get(provider)
        if not api_key:
            return JSONResponse(status_code=400, content={"error": f"API key not configured for {provider}"}, headers=cors)

    target_url, req_headers = _attach_auth(target_url, req_headers, provider, api_key)
    req_headers.setdefault("User-Agent", DEFAULT_UA)

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.request(method=method, url=target_url, headers=req_headers, content=req_body)
            resp_headers = dict(resp.headers)
            for hop in ("content-encoding", "transfer-encoding", "content-length"):
                resp_headers.pop(hop, None)
            resp_headers.update(cors)
            return Response(content=resp.content, status_code=resp.status_code, headers=resp_headers)
        except httpx.TimeoutException:
            return JSONResponse(status_code=504, content={"error": "Upstream request timed out"}, headers=cors)
        except Exception:
            return JSONResponse(status_code=502, content={"error": "Upstream request failed"}, headers=cors)
