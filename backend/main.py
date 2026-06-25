import httpx
from urllib.parse import urlparse
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

ALLOWED_TARGET_HOSTS = {
    "api.example.com",
    "example.com",
}

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Expose-Headers": "X-ABSpider-Proxy, X-ABSpider-Target-URL",
    "X-ABSpider-Proxy": "fastapi",
}


@app.options("/api/proxy")
async def proxy_options():
    return Response(status_code=200, headers=CORS_HEADERS)


@app.api_route("/api/proxy", methods=["GET", "POST"])
async def proxy_handler(request: Request, url: str = Query(...)):
    parsed_url = urlparse(url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.hostname:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid URL. Must be an absolute http(s) URL"},
            headers=CORS_HEADERS,
        )

    if parsed_url.hostname.lower() not in ALLOWED_TARGET_HOSTS:
        return JSONResponse(
            status_code=400,
            content={"error": "Target host is not allowed"},
            headers=CORS_HEADERS,
        )

    headers = {}
    for key, value in request.headers.items():
        if key.lower() in ALLOWED_HEADERS:
            headers[key] = value

    if "user-agent" not in {k.lower() for k in headers}:
        headers["User-Agent"] = DEFAULT_UA

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        try:
            body = await request.body() if request.method != "GET" else None
            method = request.method

            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=body,
            )

            resp_headers = dict(response.headers)
            resp_headers.pop("content-encoding", None)
            resp_headers.pop("content-length", None)
            resp_headers.pop("transfer-encoding", None)
            resp_headers.update(CORS_HEADERS)
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
                headers=CORS_HEADERS,
            )
        except Exception as e:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to fetch target URL", "details": str(e)},
                headers=CORS_HEADERS,
            )
