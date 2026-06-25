import httpx
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
    if not url.startswith(("http://", "https://")):
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid URL. Must start with http:// or https://"},
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
