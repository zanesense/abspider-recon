import asyncio
import collections
import ipaddress
import json
import os
import re
import socket
import ssl
import time
import httpx
from urllib.parse import quote, urljoin, urlparse
from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse, Response

app = FastAPI(title="ABSpider Proxy API")

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_REST_URL = f"{SUPABASE_URL}/rest/v1"
SUPABASE_AUTH_URL = f"{SUPABASE_URL}/auth/v1"

PROVIDER_AUTH = {
    "shodan": {"type": "query", "param": "key"},
    "virustotal": {"type": "header", "header": "x-apikey"},
    "securitytrails": {"type": "header", "header": "APIKEY"},
    "builtwith": {"type": "query", "param": "KEY"},
    "opencage": {"type": "query", "param": "key"},
    "hunterio": {"type": "query", "param": "api_key"},
    "clearbit": {"type": "header", "header": "Authorization", "prefix": "Bearer "},
}

PROVIDER_HOSTS = {
    "shodan": "api.shodan.io",
    "virustotal": "www.virustotal.com",
    "securitytrails": "api.securitytrails.com",
    "builtwith": "api.builtwith.com",
    "opencage": "api.opencagedata.com",
    "hunterio": "api.hunter.io",
    "clearbit": "company.clearbit.com",
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
_rate_limit_locks: dict[str, asyncio.Lock] = collections.defaultdict(asyncio.Lock)
_LAST_BUCKET_CLEANUP = time.monotonic()
BUCKET_CLEANUP_INTERVAL = 300


def get_cors_headers(origin: str) -> dict:
    allow_origin = origin if origin in ALLOWED_ORIGINS else "null"
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Expose-Headers": "X-ABSpider-Proxy, X-ABSpider-Target-URL, X-ABSpider-Upstream-Server, X-ABSpider-Upstream-Headers",
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


async def _resolve_and_pin(url: str) -> tuple[str, list[tuple]]:
    """Resolve hostname to IPs, validate none are private, return safe addrs.

    Raises ValueError if the target is blocked.
    Returns (safe_ip, addrs) for the caller to connect directly (no TOCTOU).
    """
    parsed = urlparse(url)
    host = parsed.hostname or ""
    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    if host in BLOCKED_HOSTNAMES:
        raise ValueError("Target URL is not allowed")
    if _is_private_ip(host):
        raise ValueError("Target URL is not allowed")

    loop = asyncio.get_running_loop()
    addrs = await loop.getaddrinfo(host, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)
    safe_ips = []
    for fam, typ, pro, canon, sockaddr in addrs:
        ip_str = sockaddr[0]
        if _is_private_ip(ip_str) or ip_str in BLOCKED_HOSTNAMES:
            raise ValueError("Target URL is not allowed")
        safe_ips.append((fam, typ, pro, canon, sockaddr))
    if not safe_ips:
        raise ValueError("No resolvable IPs for target")
    return safe_ips[0][4][0], safe_ips


async def _http_fetch(
    method: str, url: str, headers: dict, body: bytes | None = None, *,
    timeout: float = 30.0
) -> tuple[int, dict[str, str], bytes]:
    """Make an HTTP request with pinned DNS (SSRF-safe via asyncio sockets)."""
    parsed = urlparse(url)
    host = parsed.hostname or ""
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    is_https = parsed.scheme == "https"

    safe_ip, _ = await _resolve_and_pin(url)

    ssl_ctx = ssl.create_default_context() if is_https else None
    server_hostname = host if is_https else None

    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(safe_ip, port, ssl=ssl_ctx, server_hostname=server_hostname),
            timeout=timeout,
        )
    except Exception as e:
        raise ConnectionError(f"Could not connect to {host} ({safe_ip}:{port})") from e

    try:
        path = parsed.path or "/"
        if parsed.query:
            path = f"{path}?{parsed.query}"

        host_header = host
        if (is_https and port != 443) or (not is_https and port != 80):
            host_header = f"{host}:{port}"

        req_headers = {key: value for key, value in headers.items() if key.lower() != "accept-encoding"}
        req_headers.setdefault("Host", host_header)
        req_headers.setdefault("Connection", "close")
        req_headers["Accept-Encoding"] = "identity"
        if body is not None:
            req_headers["Content-Length"] = str(len(body))

        req_line = f"{method} {path} HTTP/1.1\r\n"
        hdrs = "".join(f"{k}: {v}\r\n" for k, v in req_headers.items())
        req_bytes = req_line.encode() + hdrs.encode() + b"\r\n" + (body or b"")

        writer.write(req_bytes)
        await writer.drain()

        # Read status line
        status_line = b""
        while True:
            c = await asyncio.wait_for(reader.read(1), timeout=timeout)
            if c == b"\n":
                break
            status_line += c
        status_parts = status_line.decode("utf-8", errors="replace").strip().split(" ", 2)
        status_code = int(status_parts[1]) if len(status_parts) >= 2 else 0

        # Read headers
        resp_headers = {}
        transfer_encoding_chunked = False
        content_length = -1
        while True:
            line_b = b""
            while True:
                c = await asyncio.wait_for(reader.read(1), timeout=timeout)
                if c == b"\n":
                    break
                line_b += c
            line = line_b.decode("utf-8", errors="replace").strip()
            if not line:
                break
            if ":" in line:
                k, v = line.split(":", 1)
                resp_headers[k.strip().lower()] = v.strip()

        te = resp_headers.get("transfer-encoding", "")
        if "chunked" in te:
            transfer_encoding_chunked = True
        cl = resp_headers.get("content-length", "")
        if cl:
            content_length = int(cl)

        # Read body
        body_bytes = b""
        if method == "HEAD" or 100 <= status_code < 200 or status_code in (204, 304):
            body_bytes = b""
        elif transfer_encoding_chunked:
            while True:
                chunk_size_line = b""
                while True:
                    c = await asyncio.wait_for(reader.read(1), timeout=timeout)
                    if c == b"\n":
                        break
                    chunk_size_line += c
                size_str = chunk_size_line.strip()
                if not size_str:
                    continue
                chunk_size = int(size_str, 16)
                if chunk_size == 0:
                    break
                chunk = await asyncio.wait_for(reader.readexactly(chunk_size), timeout=timeout)
                body_bytes += chunk
                await asyncio.wait_for(reader.readexactly(2), timeout=timeout)
            while True:
                line_b = b""
                while True:
                    c = await asyncio.wait_for(reader.read(1), timeout=timeout)
                    if c == b"\n":
                        break
                    line_b += c
                if not line_b.strip():
                    break
        elif content_length >= 0:
            body_bytes = await asyncio.wait_for(reader.readexactly(content_length), timeout=timeout)
        else:
            body_bytes = await asyncio.wait_for(reader.read(), timeout=timeout)

        return status_code, resp_headers, body_bytes
    finally:
        writer.close()


@app.options("/proxy")
@app.options("/api/proxy")
async def proxy_options(request: Request):
    origin = request.headers.get("origin", "")
    return Response(status_code=204, headers=get_cors_headers(origin))


@app.api_route("/proxy", methods=["GET", "HEAD", "POST"])
@app.api_route("/api/proxy", methods=["GET", "HEAD", "POST"])
async def proxy_handler(
    request: Request,
    url: str = Query(...),
    test_origin: str | None = Query(None, alias="origin"),
    redirect: str | None = Query(None),
):
    origin = request.headers.get("origin", "")
    cors = get_cors_headers(origin)

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
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

    if test_origin is not None and (len(test_origin) > 2048 or "\r" in test_origin or "\n" in test_origin):
        return JSONResponse(status_code=400, content={"error": "Invalid origin"}, headers=cors)

    # Use X-Forwarded-For if behind a reverse proxy
    forwarded = request.headers.get("x-forwarded-for")
    client_ip = (forwarded.split(",")[0].strip() if forwarded
                 else (request.client.host if request.client else "unknown"))
    now = time.time()
    lock = _rate_limit_locks[client_ip]
    async with lock:
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

    # Periodic cleanup of empty buckets
    global _LAST_BUCKET_CLEANUP
    if time.monotonic() - _LAST_BUCKET_CLEANUP > BUCKET_CLEANUP_INTERVAL:
        _LAST_BUCKET_CLEANUP = time.monotonic()
        empty = [k for k, v in _rate_limit_buckets.items() if not v]
        for k in empty:
            del _rate_limit_buckets[k]
            _rate_limit_locks.pop(k, None)

    headers = {}
    for key, value in request.headers.items():
        if key.lower() in ALLOWED_HEADERS:
            headers[key] = value

    if "user-agent" not in {k.lower() for k in headers}:
        headers["User-Agent"] = DEFAULT_UA
    if test_origin is not None:
        headers["Origin"] = test_origin

    try:
        body = await request.body() if request.method not in ("GET", "HEAD") else None
        method = request.method
        current_url = url

        for _ in range(5):
            status_code, resp_headers, content = await _http_fetch(
                method=method, url=current_url, headers=headers, body=body, timeout=30.0,
            )
            if status_code < 300 or status_code >= 400 or redirect == "manual":
                preserved_names = (
                    "server", "set-cookie", "content-length", "access-control-allow-origin",
                    "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers",
                )
                preserved = {name: resp_headers[name] for name in preserved_names if name in resp_headers}
                upstream_server = resp_headers.get("server")
                resp_headers.update(cors)
                if upstream_server:
                    resp_headers["X-ABSpider-Upstream-Server"] = upstream_server
                resp_headers["X-ABSpider-Upstream-Headers"] = quote(json.dumps(preserved), safe="")
                resp_headers["X-ABSpider-Target-URL"] = url
                resp_headers.pop("content-encoding", None)
                resp_headers.pop("content-length", None)
                resp_headers.pop("transfer-encoding", None)
                resp_headers.pop("set-cookie", None)
                return Response(content=content, status_code=status_code, headers=resp_headers)

            location = resp_headers.get("location")
            if not location:
                break
            current_url = urljoin(current_url, location)
            try:
                await _resolve_and_pin(current_url)
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Redirect target URL is not allowed"},
                    headers=cors,
                )

        resp_headers.pop("content-encoding", None)
        resp_headers.pop("transfer-encoding", None)
        preserved_names = (
            "server", "set-cookie", "content-length", "access-control-allow-origin",
            "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers",
        )
        preserved = {name: resp_headers[name] for name in preserved_names if name in resp_headers}
        upstream_server = resp_headers.get("server")
        resp_headers.update(cors)
        if upstream_server:
            resp_headers["X-ABSpider-Upstream-Server"] = upstream_server
        resp_headers["X-ABSpider-Upstream-Headers"] = quote(json.dumps(preserved), safe="")
        resp_headers["X-ABSpider-Target-URL"] = url
        resp_headers.pop("content-length", None)
        resp_headers.pop("set-cookie", None)
        return Response(content=content, status_code=status_code, headers=resp_headers)
    except asyncio.TimeoutError:
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


def _validate_api_key(key: str) -> bool:
    return bool(key) and not re.search(r"[\r\n\0]", key)


def _attach_auth(url: str, headers: dict, provider: str, api_key: str) -> tuple[str, dict]:
    config = PROVIDER_AUTH.get(provider)
    if not config:
        return url, headers
    if config["type"] == "header":
        prefix = config.get("prefix", "")
        headers[config["header"]] = f"{prefix}{api_key}"
    elif config["type"] == "query":
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}{config['param']}={quote(api_key, safe='')}"
    return url, headers


def _is_allowed_provider_url(provider: str, target_url: str) -> bool:
    parsed = urlparse(target_url)
    return parsed.scheme == "https" and parsed.hostname == PROVIDER_HOSTS.get(provider)


@app.options("/keys")
@app.options("/keys/proxy")
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


@app.get("/keys")
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


@app.post("/keys")
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


@app.post("/keys/proxy")
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
    if not _is_allowed_provider_url(provider, target_url):
        return JSONResponse(status_code=400, content={"error": "Provider URL is not allowed"}, headers=cors)

    # Allow caller to provide an explicit key (e.g. for testing a new key before saving)
    api_key = body.get("api_key")
    if not api_key:
        keys = await _supabase_get_keys(user["id"])
        api_key = keys.get(provider)
        if not api_key:
            return JSONResponse(status_code=400, content={"error": f"API key not configured for {provider}"}, headers=cors)

    if not _validate_api_key(api_key):
        return JSONResponse(status_code=400, content={"error": "Invalid API key"}, headers=cors)

    target_url, req_headers = _attach_auth(target_url, req_headers, provider, api_key)
    req_headers.setdefault("User-Agent", DEFAULT_UA)

    try:
        status_code, resp_headers, content = await _http_fetch(
            method=method, url=target_url, headers=req_headers,
            body=req_body.encode() if isinstance(req_body, str) else req_body,
            timeout=30.0,
        )
        for hop in ("content-encoding", "transfer-encoding", "content-length"):
            resp_headers.pop(hop, None)
        resp_headers.update(cors)
        return Response(content=content, status_code=status_code, headers=resp_headers)
    except asyncio.TimeoutError:
        return JSONResponse(status_code=504, content={"error": "Upstream request timed out"}, headers=cors)
    except Exception:
        return JSONResponse(status_code=502, content={"error": "Upstream request failed"}, headers=cors)
