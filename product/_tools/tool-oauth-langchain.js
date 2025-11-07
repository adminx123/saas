/**
 * LangChain-compatible OAuth Tool for Inexasli orchestrator
 * Based on the Cloudflare Worker OAuth implementation
 * Handles OAuth flows for X (Twitter), Instagram, and Facebook
 */

import { Tool } from 'langchain/tools';
import crypto from 'crypto';

export class OAuthTool extends Tool {
  name = 'oauth_tool';
  description = 'Handles OAuth authentication for social media platforms (X/Twitter, Instagram, Facebook). Can initiate OAuth flows, exchange tokens, and check connection status.';

  constructor(env) {
    super();
    this.env = env; // Environment variables with secrets
  }

  async _call(input) {
    const { action, platform, userId, code, callbackUrl } = JSON.parse(input);

    try {
      switch (action) {
        case 'start_oauth':
          return await this.startOAuth(platform, callbackUrl);
        case 'exchange_token':
          return await this.exchangeToken(platform, code, callbackUrl);
        case 'check_status':
          return await this.checkStatus(userId, platform);
        case 'disconnect':
          return await this.disconnect(userId, platform);
        default:
          return 'Invalid action. Supported: start_oauth, exchange_token, check_status, disconnect';
      }
    } catch (error) {
      return `OAuth error: ${error.message}`;
    }
  }

  async startOAuth(platform, callbackUrl) {
    switch (platform) {
      case 'x':
        return await this.getXRequestToken(callbackUrl);
      case 'instagram':
        return this.getInstagramAuthUrl(callbackUrl);
      case 'facebook':
        return this.getFacebookAuthUrl(callbackUrl);
      default:
        throw new Error('Unsupported platform');
    }
  }

  async exchangeToken(platform, code, callbackUrl) {
    switch (platform) {
      case 'instagram':
        return await this.getInstagramAccessToken(code, callbackUrl);
      case 'facebook':
        return await this.getFacebookAccessToken(code, callbackUrl);
      default:
        throw new Error('Token exchange not supported for this platform');
    }
  }

  async checkStatus(userId, platform) {
    // Simplified status check - in real implementation, check stored tokens
    return { connected: false, platform, userId }; // Placeholder
  }

  async disconnect(userId, platform) {
    // Simplified disconnect - in real implementation, remove stored tokens
    return { success: true, message: `${platform} disconnected for user ${userId}` };
  }

  // X (Twitter) OAuth 1.0a implementation
  async getXRequestToken(callbackUrl) {
    const consumerKey = this.env.X_CONSUMER_KEY;
    const consumerSecret = this.env.X_CONSUMER_SECRET;

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

    const signature = await this.generateOAuthSignature(method, url, oauthParams, consumerSecret);
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
    const oauthToken = params.get('oauth_token');

    const authUrl = `https://api.twitter.com/oauth/authorize?oauth_token=${oauthToken}`;
    return { authUrl, oauthToken };
  }

  // Instagram OAuth 2.0
  getInstagramAuthUrl(callbackUrl) {
    const params = new URLSearchParams({
      client_id: this.env.INSTAGRAM_APP_ID,
      redirect_uri: callbackUrl,
      scope: 'instagram_business_basic,instagram_business_content_publish',
      response_type: 'code'
    });

    return { authUrl: `https://api.instagram.com/oauth/authorize?${params.toString()}` };
  }

  async getInstagramAccessToken(code, callbackUrl) {
    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.env.INSTAGRAM_APP_ID,
        client_secret: this.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: callbackUrl,
        code: code
      })
    });

    const data = await response.json();
    if (data.access_token) {
      return { accessToken: data.access_token, userId: data.user_id };
    } else {
      throw new Error('Failed to get Instagram access token');
    }
  }

  // Facebook OAuth
  getFacebookAuthUrl(callbackUrl) {
    const params = new URLSearchParams({
      client_id: this.env.FACEBOOK_APP_ID,
      redirect_uri: callbackUrl,
      scope: 'pages_messaging,pages_show_list,pages_read_engagement',
      response_type: 'code'
    });

    return { authUrl: `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}` };
  }

  async getFacebookAccessToken(code, callbackUrl) {
    const response = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${this.env.FACEBOOK_APP_ID}&client_secret=${this.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(callbackUrl)}&code=${code}`);
    const data = await response.json();

    if (data.access_token) {
      return { accessToken: data.access_token };
    } else {
      throw new Error('Failed to get Facebook access token');
    }
  }

  // OAuth 1.0a signature generation
  async generateOAuthSignature(method, url, params, consumerSecret, tokenSecret = '') {
    const paramString = Object.keys(params).sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

    const hmac = crypto.createHmac('sha1', signingKey);
    hmac.update(signatureBase);
    const signature = hmac.digest('base64');

    return signature;
  }
}