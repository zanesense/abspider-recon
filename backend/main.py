import asyncio
import collections
import ipaddress
import socket
import time
import httpx
from urllib.parse import urljoin, urlparse
from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse, Response

app = FastAPI(title="ABSpider Proxy API")

ALLOWED_HEADERS = {
    "accept",
    "accept-encoding",
    "accept-language",
    "user-agent",
    "authorization",
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
