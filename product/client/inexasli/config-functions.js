// Config functions for Inexasli worker
// Handles request processing, CORS, and endpoints

// CORS headers for development and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Handle resource management requests
async function handleResource(request, env) {
  try {
    const { action, key, value } = await request.json();

    let result;
    switch (action) {
      case 'kv_get':
        result = await env.CLIENT_TOKENS.get(key);
        break;
      case 'kv_put':
        await env.CLIENT_TOKENS.put(key, value);
        result = 'Stored successfully';
        break;
      case 'kv_delete':
        await env.CLIENT_TOKENS.delete(key);
        result = 'Deleted successfully';
        break;
      case 'r2_get':
        const object = await env.IMAGES_BUCKET.get(key);
        result = object ? await object.text() : null;
        break;
      case 'r2_put':
        await env.IMAGES_BUCKET.put(key, value);
        result = 'Uploaded successfully';
        break;
      default:
        return new Response('Unknown action', { status: 400 });
    }

    return new Response(JSON.stringify({ result }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Handle config requests (legacy endpoint) - public config without secrets
function handleConfig(INEXASLI_SHARED_CONFIG) {
  const publicConfig = {
    ...INEXASLI_SHARED_CONFIG,
    xaiApiKey: undefined // Remove API key from public response
  };
  return new Response(JSON.stringify(publicConfig), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Handle full config requests (internal use only)
function handleFullConfig(env, INEXASLI_SHARED_CONFIG) {
  const fullConfig = {
    ...INEXASLI_SHARED_CONFIG,
    xaiApiKey: env.XAI_API_KEY,
    xaiCollection: env.XAI_COLLECTION
  };
  return new Response(JSON.stringify(fullConfig), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

// Default: Return the client configuration as JSON (public, sanitized)
function handleDefault(INEXASLI_SHARED_CONFIG) {
  const publicConfig = {
    ...INEXASLI_SHARED_CONFIG,
    xaiApiKey: undefined // Remove API key from public response
  };
  return new Response(JSON.stringify(publicConfig), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Main request handler
export async function handleRequest(request, env, INEXASLI_SHARED_CONFIG) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(request.url);

  // Handle resource management requests
  if (url.pathname === '/resource' && request.method === 'POST') {
    return await handleResource(request, env);
  }

  // Handle config requests (legacy endpoint) - public config without secrets
  if (url.pathname === '/config') {
    return handleConfig(INEXASLI_SHARED_CONFIG);
  }

  // Handle full config requests (internal use only)
  if (url.pathname === '/full-config') {
    return handleFullConfig(env, INEXASLI_SHARED_CONFIG);
  }

  // Default: Return the client configuration as JSON (public, sanitized)
  return handleDefault(INEXASLI_SHARED_CONFIG);
}