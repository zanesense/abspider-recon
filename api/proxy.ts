
export const config = {
  runtime: 'edge', // Use Edge Runtime for better performance
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  // CORS headers for the proxy functionality itself
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing "url" query parameter' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    // Validate URL
    new URL(targetUrl);

    // Prepare headers for the target request
    const headers = new Headers();
    
    // Copy relevant headers from the original request
    // We strictly filter what we pass to avoid issues
    const allowedHeaders = ['accept', 'accept-encoding', 'accept-language', 'user-agent', 'authorization', 'content-type'];
    
    req.headers.forEach((value, key) => {
      if (allowedHeaders.includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // Ensure we have a valid User-Agent if one wasn't provided
    if (!headers.get('user-agent')) {
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' ? req.body : undefined,
      redirect: 'follow',
    });

    // Create a new response with CORS headers and the target's body
    const responseHeaders = new Headers(response.headers);
    
    // Add our CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch target URL', details: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
