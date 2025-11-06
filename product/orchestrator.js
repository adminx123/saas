import { sendInstagramMessage, processInstagramWebhook, verifyInstagramWebhook } from './_tools/tool-instagramWebhook.js';
import { processFacebookWebhook, verifyFacebookWebhook } from './_tools/tool-facebookWebhook.js';
import { processTwitterWebhook, verifyTwitterWebhook } from './_tools/tool-twitterWebhook.js';
import { getXRequestToken, getXAccessToken, getInstagramAuthUrl, getInstagramAccessToken, getFacebookAuthUrl, getFacebookAccessToken, storeUserTokens, checkOAuthStatus, disconnectOAuth } from './_tools/tool-oauthManagement.js';
import { orchestrateContentAndPost, getCredentials } from './_tools/tool-socialPosting.js';
import { manageResource, getPublicConfig, getFullConfig } from './_tools/tool-configManager.js';
import { createReActAgent } from './_agents/agent-react.js';
import { ChainGMCR } from './_chains/chain-gmcr.js';

// CORS headers for development and production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    console.log('Request received:', url.pathname);

    // Handle Instagram webhooks
    if (url.pathname === '/webhook/instagram') {
      if (request.method === 'GET') {
        // Instagram webhook verification
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');

        // Fetch client config from bound service
        try {
          const configResponse = await env.CONFIG_INEXASLI.fetch(new Request('https://config-inexasli/full-config', { method: 'GET' }));
          if (!configResponse.ok) {
            throw new Error('Failed to fetch client config');
          }
          const clientConfig = await configResponse.json();

          const verification = verifyInstagramWebhook(mode, token, challenge, clientConfig);
          if (verification.verified) {
            console.log('Instagram webhook verified');
            return new Response(verification.challenge, {
              status: 200,
              headers: corsHeaders
            });
          } else {
            return new Response('Verification failed', {
              status: 403,
              headers: corsHeaders
            });
          }
        } catch (error) {
          console.error('Error verifying Instagram webhook:', error);
          return new Response('Verification error', {
            status: 500,
            headers: corsHeaders
          });
        }
      }

      if (request.method === 'POST') {
        try {
          const payload = await request.json();
          console.log('Instagram webhook received:', JSON.stringify(payload, null, 2));

          const messageData = processInstagramWebhook(payload);
          if (!messageData) {
            return new Response('OK', { status: 200, headers: corsHeaders });
          }

          // Fetch client config from bound service
          const configResponse = await env.CONFIG_INEXASLI.fetch(new Request('https://config-inexasli/full-config', { method: 'GET' }));
          if (!configResponse.ok) {
            throw new Error('Failed to fetch client config');
          }
          const clientConfig = await configResponse.json();

          // Process through GMCR chain
          const gmcrChain = new ChainGMCR();
          const inputData = {
            sessionId: messageData.sessionId,
            message: messageData.messageText,
            clientConfig,
            inputType: 'instagram_dm',
            action: 'instagram_dm'
          };
          const result = await gmcrChain.call({ input: inputData });

          if (result.output.type === 'rate_limit_exceeded' || result.output.type === 'off_topic') {
            await sendInstagramMessage(messageData.senderId, result.output.message, env);
            return new Response('OK', { status: 200, headers: corsHeaders });
          }

          // Send AI response back to Instagram
          await sendInstagramMessage(messageData.senderId, result.output.reply, env);

          return new Response('OK', {
            status: 200,
            headers: corsHeaders
          });
        } catch (error) {
          console.error('Instagram webhook error:', error);
          return new Response('Error processing webhook', {
            status: 500,
            headers: corsHeaders
          });
        }
      }

      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    // Handle Facebook webhooks (placeholder)
    if (url.pathname === '/webhook/facebook') {
      // TODO: Implement Facebook webhook handling
      console.log('Facebook webhook received (not implemented)');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // Handle Twitter webhooks (placeholder)
    if (url.pathname === '/webhook/twitter') {
      // TODO: Implement Twitter webhook handling
      console.log('Twitter webhook received (not implemented)');
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    // ============================================================================
    // SOCIAL MEDIA OAUTH ROUTES
    // ============================================================================

    // OAuth connect page
    if (url.pathname === '/oauth/connect') {
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Connect Your Social Accounts</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .button { color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 10px 0; }
        .button.x { background: #1d9bf0; }
        .button.x:hover { background: #1a8cd8; }
        .button.instagram { background: #E4405F; }
        .button.instagram:hover { background: #C13584; }
        .button.facebook { background: #1877F2; }
        .button.facebook:hover { background: #155EBB; }
        .platform-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
    </style>
</head>
<body>
    <h1>Connect Your Social Accounts</h1>
    <p>Connect your social media accounts automatically.</p>

    <div class="platform-section">
        <h2>X (Twitter)</h2>
        <p>Connect your X account to enable posting tweets.</p>
        <a href="/oauth/x/start" class="button x">Connect X Account</a>
    </div>

    <div class="platform-section">
        <h2>Instagram</h2>
        <p>Connect your Instagram account to enable posting content.</p>
        <a href="/oauth/instagram/start" class="button instagram">Connect Instagram Account</a>
    </div>

    <div class="platform-section">
        <h2>Facebook</h2>
        <p>Connect your Facebook Page to enable messaging automation.</p>
        <a href="/oauth/facebook/start" class="button facebook">Connect Facebook Page</a>
    </div>
</body>
</html>`;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      });
    }

    // Start X OAuth flow
    if (url.pathname === '/oauth/x/start') {
      try {
        const callbackUrl = `${url.origin}/oauth/x/callback`;
        const authUrl = await getXRequestToken(env, callbackUrl);
        return Response.redirect(authUrl, 302);
      } catch (error) {
        console.error('X OAuth start error:', error);
        return new Response('OAuth initialization failed', { status: 500, headers: corsHeaders });
      }
    }

    // Handle X OAuth callback
    if (url.pathname === '/oauth/x/callback') {
      try {
        const oauthToken = url.searchParams.get('oauth_token');
        const oauthVerifier = url.searchParams.get('oauth_verifier');

        if (!oauthToken || !oauthVerifier) {
          return new Response('Missing OAuth parameters', { status: 400, headers: corsHeaders });
        }

        const tokenData = await getXAccessToken(env, oauthToken, oauthVerifier);

        // Store tokens
        const handleIdentifier = tokenData.screenName;
        const stored = await storeUserTokens(env, `x:${handleIdentifier}`, tokenData.userId, {
          accessToken: tokenData.accessToken,
          accessTokenSecret: tokenData.accessTokenSecret,
          userId: tokenData.userId,
          screenName: tokenData.screenName,
          consumerKey: env.X_CONSUMER_KEY,
          consumerSecret: env.X_CONSUMER_SECRET
        });

        if (!stored) {
          throw new Error('Failed to store tokens');
        }

        const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Success</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .success { color: #059669; font-size: 2.5em; font-weight: bold; margin-top: 40px; }
        .client-info { color: #6b7280; font-size: 1.2em; margin: 10px 0; }
    </style>
    <script>
      setTimeout(function() {
        window.location.href = 'https://inexasli.com/product/salesfunnel/oauth-connect.html?x=connected&screen_name=${encodeURIComponent(tokenData.screenName)}';
      }, 2000);
    </script>
</head>
<body>
    <div class="success">✅ Success</div>
    <div class="client-info">X: @${tokenData.screenName} | Platform: X</div>
</body>
</html>`;

        return new Response(successHtml, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } catch (error) {
        console.error('X OAuth callback error:', error);
        return new Response('OAuth callback failed', { status: 500, headers: corsHeaders });
      }
    }

    // Start Instagram OAuth flow
    if (url.pathname === '/oauth/instagram/start') {
      try {
        const callbackUrl = `${url.origin}/oauth/instagram/callback`;
        const authUrl = getInstagramAuthUrl(env, callbackUrl);
        return Response.redirect(authUrl, 302);
      } catch (error) {
        console.error('Instagram OAuth start error:', error);
        return new Response('OAuth initialization failed', { status: 500, headers: corsHeaders });
      }
    }

    // Handle Instagram OAuth callback
    if (url.pathname === '/oauth/instagram/callback') {
      try {
        const code = url.searchParams.get('code');
        if (!code) {
          return new Response('Missing authorization code', { status: 400, headers: corsHeaders });
        }

        const callbackUrl = `${url.origin}/oauth/instagram/callback`;
        const tokenData = await getInstagramAccessToken(env, code, callbackUrl);

        // Store tokens
        const handleIdentifier = `@${tokenData.username}`;
        const stored = await storeUserTokens(env, `instagram:${handleIdentifier}`, tokenData.userId, {
          accessToken: tokenData.accessToken,
          userId: tokenData.userId,
          username: tokenData.username,
          screenName: handleIdentifier
        });

        if (!stored) {
          throw new Error('Failed to store tokens');
        }

        const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Success</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .success { color: #059669; font-size: 2.5em; font-weight: bold; margin-top: 40px; }
        .client-info { color: #6b7280; font-size: 1.2em; margin: 10px 0; }
    </style>
    <script>
      setTimeout(function() {
        window.location.href = 'https://inexasli.com/product/salesfunnel/oauth-connect.html?instagram=connected&username=${encodeURIComponent(handleIdentifier)}';
      }, 2000);
    </script>
</head>
<body>
    <div class="success">✅ Success</div>
    <div class="client-info">Instagram: ${handleIdentifier} | Platform: Instagram</div>
</body>
</html>`;

        return new Response(successHtml, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } catch (error) {
        console.error('Instagram OAuth callback error:', error);
        return new Response('OAuth callback failed', { status: 500, headers: corsHeaders });
      }
    }

    // Start Facebook OAuth flow
    if (url.pathname === '/oauth/facebook/start') {
      try {
        const callbackUrl = `${url.origin}/oauth/facebook/callback`;
        const authUrl = getFacebookAuthUrl(env, callbackUrl);
        return Response.redirect(authUrl, 302);
      } catch (error) {
        console.error('Facebook OAuth start error:', error);
        return new Response('OAuth initialization failed', { status: 500, headers: corsHeaders });
      }
    }

    // Handle Facebook OAuth callback
    if (url.pathname === '/oauth/facebook/callback') {
      try {
        const code = url.searchParams.get('code');
        if (!code) {
          return new Response('Missing authorization code', { status: 400, headers: corsHeaders });
        }

        const callbackUrl = `${url.origin}/oauth/facebook/callback`;
        const tokenData = await getFacebookAccessToken(env, code, callbackUrl);

        // Store tokens
        const handleIdentifier = tokenData.pageName;
        const stored = await storeUserTokens(env, `facebook:${handleIdentifier}`, tokenData.userId, {
          accessToken: tokenData.accessToken,
          userId: tokenData.userId,
          username: tokenData.username,
          pageId: tokenData.pageId,
          pageName: tokenData.pageName,
          screenName: tokenData.pageName
        });

        if (!stored) {
          throw new Error('Failed to store tokens');
        }

        const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Success</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background: #fff; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .success { color: #059669; font-size: 2.5em; font-weight: bold; margin-top: 40px; }
        .client-info { color: #6b7280; font-size: 1.2em; margin: 10px 0; }
    </style>
    <script>
      setTimeout(function() {
        window.location.href = 'https://inexasli.com/product/salesfunnel/oauth-connect.html?facebook=connected&username=${encodeURIComponent(handleIdentifier)}';
      }, 2000);
    </script>
</head>
<body>
    <div class="success">✅ Success</div>
    <div class="client-info">Facebook: ${handleIdentifier} | Platform: Facebook</div>
</body>
</html>`;

        return new Response(successHtml, {
          headers: { 'Content-Type': 'text/html', ...corsHeaders }
        });
      } catch (error) {
        console.error('Facebook OAuth callback error:', error);
        return new Response('OAuth callback failed', { status: 500, headers: corsHeaders });
      }
    }

    // OAuth status endpoint
    if (url.pathname === '/oauth/status' && request.method === 'GET') {
      try {
        const userId = url.searchParams.get('user_id');
        const platform = url.searchParams.get('platform');

        if (!userId) {
          return new Response(JSON.stringify({ error: 'user_id required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const status = await checkOAuthStatus(env, platform, userId);
        return new Response(JSON.stringify(status), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('OAuth status error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // OAuth disconnect endpoint
    if (url.pathname === '/oauth/disconnect' && request.method === 'POST') {
      try {
        const reqData = await request.json();
        const result = await disconnectOAuth(env, reqData.platform, reqData.user_id);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('OAuth disconnect error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // ============================================================================
    // SOCIAL MEDIA POSTING ROUTES
    // ============================================================================

    // Manual social media posting endpoint
    if (url.pathname === '/social/post' && request.method === 'POST') {
      try {
        // Fetch client config
        const configResponse = await env.CONFIG_INEXASLI.fetch(new Request('https://config-inexasli/full-config', { method: 'GET' }));
        if (!configResponse.ok) {
          throw new Error('Failed to fetch client config');
        }
        const clientConfig = await configResponse.json();

        // Get credentials
        const credentials = await getCredentials(env, clientConfig.handles);

        // Parse force parameters
        const reqData = await request.json();
        const forceParams = {
          force_dynamic: reqData.force_dynamic === true,
          force_static: reqData.force_static === true
        };

        // Orchestrate content and post
        const result = await orchestrateContentAndPost(clientConfig, credentials, env, forceParams);

        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Social posting error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // Social media health check
    if (url.pathname === '/social/health') {
      try {
        const configResponse = await env.CONFIG_INEXASLI.fetch(new Request('https://config-inexasli/full-config', { method: 'GET' }));
        const clientConfig = configResponse.ok ? await configResponse.json() : null;

        const credentials = clientConfig ? await getCredentials(env, clientConfig.handles) : {};

        return new Response(JSON.stringify({
          status: 'healthy',
          client: clientConfig?.client_id || 'unknown',
          brand: clientConfig?.brand_name || 'unknown',
          hasXCredentials: !!(credentials.x?.consumerKey && credentials.x?.accessToken),
          hasInstagramCredentials: !!(credentials.instagram?.accessToken && credentials.instagram?.userId),
          hasFacebookCredentials: !!(credentials.facebook?.accessToken && credentials.facebook?.pageId),
          postingSchedule: clientConfig?.post_times || [],
          doublePostDays: clientConfig?.double_post_days || []
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Social health check error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { inputType, message, sessionId } = body;

        // Fetch client config from bound service
        const configResponse = await env.CONFIG_INEXASLI.fetch(new Request('https://config-inexasli/full-config', { method: 'GET' }));
        if (!configResponse.ok) {
          throw new Error('Failed to fetch client config');
        }
        const clientConfig = await configResponse.json();

        // Check rate limit
        const rateLimit = await toolRateLimiter({ sessionId, clientConfig });
        if (!rateLimit.allowed) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            },
          });
        }

        // Check business relevance
        const relevance = await toolBusinessRelevance({ message, clientConfig });
        if (!relevance.isRelevant) {
          return new Response(JSON.stringify({ reply: 'This message appears to be off-topic. Please ask about business-related matters.' }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            },
          });
        }

        // Detect intent/role
        const intent = await toolIntentDetection({ message, clientConfig });

        // Check for knowledge update (TRAIN)
        const knowledgeUpdate = await toolKnowledgeUpdate({ message, sessionId, clientConfig });

        // Handle webhook if configured
        const webhook = await toolWebhookHandler({ message, sessionId, clientConfig });

        // Track usage
        const usage = await toolUsageTracking({ sessionId, clientConfig, action: 'chat' });

        // Generate reply - use agent for advanced reasoning
        let reply;
        const useAgent = url.searchParams.get('agent') === 'true'; // Optional query param to enable agent
        
        if (useAgent) {
          // Create agent with available tools
          const agent = createReActAgent([], clientConfig); // Pass empty tools array for now, can add more later
          const agentResult = await agent.call({ input: message });
          reply = {
            reply: agentResult.output,
            sessionId,
            inputType,
          };
        } else {
          // Use traditional tool-reply
          reply = await toolReply({
            inputType,
            message,
            sessionId,
            clientConfig,
          });
        }

        return new Response(JSON.stringify({
          reply: reply.reply,
          sessionId: reply.sessionId,
          inputType: reply.inputType,
          relevance,
          intent,
          knowledgeUpdated: knowledgeUpdate.updated,
          webhookSent: webhook.sent,
          usageTracked: usage.tracked,
        }), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
        });
      } catch (error) {
        console.error('Error in /chat:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          },
        });
      }
    }

    // Default response
    return new Response('Hello World from orchestrator', { status: 200 });
  },
};