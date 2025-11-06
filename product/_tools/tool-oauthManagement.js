/**
 * OAuth Management Tool for Inexasli orchestrator
 * Handles OAuth flows for X (Twitter), Instagram, and Facebook
 */

// ============================================================================
// OAUTH 1.0a SIGNATURE GENERATION
// ============================================================================

/**
 * Generate OAuth 1.0a signature for requests using Web Crypto API
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} params - OAuth parameters
 * @param {string} consumerSecret - Consumer secret
 * @param {string} tokenSecret - Token secret (optional)
 * @returns {string} - OAuth signature
 */
async function generateOAuthSignatureLocal(method, url, params, consumerSecret, tokenSecret = '') {
  // Create parameter string
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // Create signature base string
  const signatureBase = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;

  // Create signing key
  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  // Generate HMAC-SHA1 signature using Web Crypto API
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(signatureBase);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = new Uint8Array(signature);
  
  // Convert to base64
  const binaryString = Array.from(signatureArray, byte => String.fromCharCode(byte)).join('');
  const signatureBase64 = btoa(binaryString);

  return signatureBase64;
}

// ============================================================================
// X (TWITTER) OAUTH 1.0a FUNCTIONS
// ============================================================================

/**
 * Get X OAuth 1.0a request token
 * @param {object} env - Environment variables
 * @param {string} callbackUrl - OAuth callback URL
 * @returns {string} - Authorization URL
 */
export async function getXRequestToken(env, callbackUrl) {
  const consumerKey = env.X_CONSUMER_KEY;
  const consumerSecret = env.X_CONSUMER_SECRET;

  const url = 'https://api.twitter.com/oauth/request_token';
  const method = 'POST';

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: Math.random().toString(36).substring(2, 15),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_callback: callbackUrl
  };

  const signature = await generateOAuthSignatureLocal(method, url, oauthParams, consumerSecret);
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    throw new Error(`Request token failed: ${response.status}`);
  }

  const data = await response.text();
  const params = new URLSearchParams(data);
  const token = params.get('oauth_token');

  return `https://api.twitter.com/oauth/authorize?oauth_token=${token}`;
}

/**
 * Exchange OAuth verifier for X access token
 * @param {object} env - Environment variables
 * @param {string} oauthToken - Request token
 * @param {string} oauthVerifier - OAuth verifier
 * @returns {object} - Access token data
 */
export async function getXAccessToken(env, oauthToken, oauthVerifier) {
  const consumerKey = env.X_CONSUMER_KEY;
  const consumerSecret = env.X_CONSUMER_SECRET;

  const url = 'https://api.twitter.com/oauth/access_token';
  const method = 'POST';

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: oauthToken,
    oauth_nonce: Math.random().toString(36).substring(2, 15),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    oauth_verifier: oauthVerifier
  };

  const signature = await generateOAuthSignatureLocal(method, url, oauthParams, consumerSecret);
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    throw new Error(`Access token failed: ${response.status}`);
  }

  const data = await response.text();
  const params = new URLSearchParams(data);

  return {
    accessToken: params.get('oauth_token'),
    accessTokenSecret: params.get('oauth_token_secret'),
    userId: params.get('user_id'),
    screenName: params.get('screen_name')
  };
}

// ============================================================================
// INSTAGRAM OAUTH 2.0 FUNCTIONS
// ============================================================================

/**
 * Get Instagram OAuth authorization URL
 * @param {object} env - Environment variables
 * @param {string} callbackUrl - OAuth callback URL
 * @returns {string} - Authorization URL
 */
export function getInstagramAuthUrl(env, callbackUrl) {
  const appId = env.INSTAGRAM_APP_ID;
  const scope = 'user_profile,user_media,instagram_basic,instagram_content_publish';

  return `https://api.instagram.com/oauth/authorize?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code`;
}

/**
 * Exchange authorization code for Instagram access token
 * @param {object} env - Environment variables
 * @param {string} code - Authorization code
 * @param {string} callbackUrl - OAuth callback URL
 * @returns {object} - Access token data
 */
export async function getInstagramAccessToken(env, code, callbackUrl) {
  const appId = env.INSTAGRAM_APP_ID;
  const appSecret = env.INSTAGRAM_APP_SECRET;

  const tokenUrl = `https://api.instagram.com/oauth/access_token`;

  const formData = new FormData();
  formData.append('client_id', appId);
  formData.append('client_secret', appSecret);
  formData.append('grant_type', 'authorization_code');
  formData.append('redirect_uri', callbackUrl);
  formData.append('code', code);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Instagram token exchange failed: ${response.status}`);
  }

  const data = await response.json();

  // Get user info
  const userResponse = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${data.access_token}`);
  const userData = await userResponse.json();

  return {
    accessToken: data.access_token,
    userId: userData.id,
    username: userData.username
  };
}

// ============================================================================
// FACEBOOK OAUTH 2.0 FUNCTIONS
// ============================================================================

/**
 * Get Facebook OAuth authorization URL
 * @param {object} env - Environment variables
 * @param {string} callbackUrl - OAuth callback URL
 * @returns {string} - Authorization URL
 */
export function getFacebookAuthUrl(env, callbackUrl) {
  const appId = env.FACEBOOK_APP_ID;
  const scope = 'pages_messaging,pages_show_list,pages_read_engagement';

  return `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${appId}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=code`;
}

/**
 * Exchange authorization code for Facebook access token
 * @param {object} env - Environment variables
 * @param {string} code - Authorization code
 * @param {string} callbackUrl - OAuth callback URL
 * @returns {object} - Access token data
 */
export async function getFacebookAccessToken(env, code, callbackUrl) {
  const appId = env.FACEBOOK_APP_ID;
  const appSecret = env.FACEBOOK_APP_SECRET;

  const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
    `client_id=${appId}&` +
    `client_secret=${appSecret}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `code=${code}`;

  const response = await fetch(tokenUrl);
  const data = await response.json();

  if (!data.access_token) {
    throw new Error('Facebook token exchange failed');
  }

  // Get user pages
  const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${data.access_token}`;
  const pagesResponse = await fetch(pagesUrl);
  const pagesData = await pagesResponse.json();

  if (!pagesData.data || pagesData.data.length === 0) {
    throw new Error('No Facebook pages found');
  }

  const page = pagesData.data[0]; // Use first page

  return {
    accessToken: data.access_token,
    userId: page.id,
    username: page.name,
    pageId: page.id,
    pageName: page.name
  };
}

// ============================================================================
// TOKEN STORAGE FUNCTIONS
// ============================================================================

/**
 * Store user OAuth tokens in KV storage
 * @param {object} env - Environment variables
 * @param {string} key - Storage key
 * @param {string} userId - User ID
 * @param {object} tokenData - Token data to store
 * @returns {boolean} - Success status
 */
export async function storeUserTokens(env, key, userId, tokenData) {
  try {
    const dataToStore = {
      ...tokenData,
      storedAt: new Date().toISOString(),
      userId: userId
    };

    await env.CLIENT_TOKENS.put(key, JSON.stringify(dataToStore));

    // Also store under user-specific key for status checks
    const userKey = `user:${key.split(':')[0]}:${userId}`;
    await env.CLIENT_TOKENS.put(userKey, JSON.stringify(dataToStore));

    return true;
  } catch (error) {
    console.error('Token storage failed:', error);
    return false;
  }
}

/**
 * Get stored user tokens
 * @param {object} env - Environment variables
 * @param {string} key - Storage key
 * @returns {object|null} - Token data or null
 */
export async function getStoredTokens(env, key) {
  try {
    const data = await env.CLIENT_TOKENS.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Token retrieval failed:', error);
    return null;
  }
}

// ============================================================================
// OAUTH STATUS AND MANAGEMENT
// ============================================================================

/**
 * Check OAuth connection status for a platform
 * @param {object} env - Environment variables
 * @param {string} platform - Platform name (x, instagram, facebook)
 * @param {string} userId - User ID to check
 * @returns {object} - Status result
 */
export async function checkOAuthStatus(env, platform, userId) {
  try {
    const key = `user:${platform}:${userId}`;
    const tokens = await getStoredTokens(env, key);

    return {
      connected: !!tokens,
      platform: platform,
      userId: userId,
      hasAccessToken: !!(tokens && tokens.accessToken),
      storedAt: tokens ? tokens.storedAt : null
    };
  } catch (error) {
    console.error('Status check failed:', error);
    return {
      connected: false,
      platform: platform,
      userId: userId,
      error: error.message
    };
  }
}

/**
 * Disconnect OAuth for a platform
 * @param {object} env - Environment variables
 * @param {string} platform - Platform name
 * @param {string} userId - User ID
 * @returns {object} - Disconnect result
 */
export async function disconnectOAuth(env, platform, userId) {
  try {
    const userKey = `user:${platform}:${userId}`;

    // Find and delete all related keys
    const keys = await env.CLIENT_TOKENS.list();
    let deletedCount = 0;

    for (const key of keys.keys) {
      if (key.name.includes(`${platform}:`) && key.name.includes(userId)) {
        await env.CLIENT_TOKENS.delete(key.name);
        deletedCount++;
      }
    }

    return {
      success: true,
      platform: platform,
      userId: userId,
      deletedRecords: deletedCount
    };
  } catch (error) {
    console.error('Disconnect failed:', error);
    return {
      success: false,
      platform: platform,
      userId: userId,
      error: error.message
    };
  }
}