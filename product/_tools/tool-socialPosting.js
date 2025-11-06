/**
 * Social Posting Tool for Inexasli orchestrator
 * Handles content generation and multi-platform posting
 */

// ============================================================================
// CONTENT GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate context prompt for social media posting
 * @param {object} clientConfig - Client configuration
 * @param {string} contentType - Type of content to generate
 * @param {string} targetAudience - Target audience
 * @returns {string} - Context prompt
 */
export function assembleContextPrompt(clientConfig, contentType, targetAudience) {
  if (!clientConfig || !clientConfig.promptTemplate) {
    throw new Error('Invalid clientConfig: promptTemplate is required');
  }
  return clientConfig.promptTemplate
    .replace(/\$\{contentType\}/g, contentType)
    .replace(/\$\{targetAudience\}/g, targetAudience);
}

/**
 * Generate image prompt for social media
 * @param {object} clientConfig - Client configuration
 * @param {string} imageStyle - Image style preference
 * @returns {string} - Image prompt
 */
export function assembleImagePrompt(clientConfig, imageStyle) {
  if (!clientConfig || !clientConfig.brand_name) {
    throw new Error('Invalid clientConfig: brand_name is required for image prompts');
  }
  return `Create a professional social media image for ${clientConfig.brand_name} with ${imageStyle} style. The image should reflect ${clientConfig.brand_voice} and be suitable for ${clientConfig.supported_platforms?.join(', ') || 'social media'} platforms.`;
}

/**
 * Generate dynamic context prompt with client config
 * @param {object} clientConfig - Client configuration
 * @param {array} dynamicContentArray - Dynamic content topics
 * @returns {object} - System and user prompts
 */
export function assembleDynamicContextPrompt(clientConfig, dynamicContentArray) {
  if (!clientConfig || !dynamicContentArray || !clientConfig.contextPromptTemplate) {
    throw new Error('Invalid clientConfig: dynamicContentArray and contextPromptTemplate required');
  }

  const currentTopic = getPromptForToday(dynamicContentArray);
  const seed = Date.now() % 1000;

  const systemPrompt = clientConfig.contextPromptTemplate.systemPrompt;
  const userMessage = clientConfig.contextPromptTemplate.userMessageTemplate
    .replace(/\$\{currentTopic\}/g, currentTopic)
    .replace(/\$\{seed\}/g, seed);

  return { systemPrompt, userMessage };
}

/**
 * Generate dynamic image prompt
 * @param {object} clientConfig - Client configuration
 * @param {string} contentText - Content text
 * @param {array} dynamicContentArray - Dynamic content topics
 * @param {array} imageStyleArray - Image style options
 * @returns {string} - Image prompt
 */
export function assembleDynamicImagePrompt(clientConfig, contentText, dynamicContentArray, imageStyleArray) {
  if (!clientConfig || !dynamicContentArray || !imageStyleArray || !clientConfig.imagePromptTemplate) {
    throw new Error('Invalid clientConfig: dynamicContentArray, imageStyleArray, and imagePromptTemplate required');
  }

  const currentTopic = getPromptForToday(dynamicContentArray);
  const seed = Date.now() % 1000;
  const styleIndex = seed % imageStyleArray.length;
  const selectedStyle = imageStyleArray[styleIndex];

  const topicElement = clientConfig.topicElementMappings?.[currentTopic] || 'consciousness patterns';

  const prompt = clientConfig.imagePromptTemplate
    .replace(/\$\{selectedStyle\.style\}/g, selectedStyle.style)
    .replace(/\$\{contentText\}/g, contentText.substring(0, 100))
    .replace(/\$\{topicElement\}/g, topicElement)
    .replace(/\$\{selectedStyle\.mood\}/g, selectedStyle.mood)
    .replace(/\$\{selectedStyle\.colors\}/g, selectedStyle.colors)
    .replace(/\$\{selectedStyle\.composition\}/g, selectedStyle.composition)
    .replace(/\$\{selectedStyle\.elements\}/g, selectedStyle.elements)
    .replace(/\$\{seed\}/g, seed);

  return prompt;
}

/**
 * Get topic for today from array
 * @param {array} topics - Array of topics
 * @returns {string} - Today's topic
 */
function getPromptForToday(topics) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return topics[dayOfWeek % topics.length];
}

// ============================================================================
// STATIC CONTENT FUNCTIONS
// ============================================================================

/**
 * Get static post for today
 * @param {array} staticContextArray - Static content array
 * @returns {object} - Static post object
 */
export function assembleStaticPost(staticContextArray) {
  const now = new Date();
  const dayIndex = now.getDay(); // 0 = Sunday, 6 = Saturday
  return staticContextArray[dayIndex % staticContextArray.length];
}

/**
 * Get static text for today
 * @param {array} staticContextArray - Static content array
 * @returns {string} - Static text content
 */
export function getStaticText(staticContextArray) {
  const staticPost = assembleStaticPost(staticContextArray);
  return staticPost.text;
}

/**
 * Get static image for today
 * @param {array} staticContextArray - Static content array
 * @returns {string} - Static image path
 */
export function getStaticImage(staticContextArray) {
  const staticPost = assembleStaticPost(staticContextArray);
  return staticPost.image;
}

// ============================================================================
// XAI API INTEGRATION
// ============================================================================

const XAI_TEXT_MODEL = "grok-3-mini-beta";
const XAI_IMAGE_MODEL = "grok-2-image-1212";
const XAI_MAX_TOKENS = 2800;
const XAI_RESPONSE_KEY = "tweetText";
const XAI_API_ENDPOINT = "https://api.x.ai/v1/chat/completions";
const XAI_IMAGE_ENDPOINT = "https://api.x.ai/v1/images/generations";

/**
 * Generate text content using XAI API
 * @param {object} promptObj - Prompt object with system and user messages
 * @param {object} env - Environment variables
 * @returns {string} - Generated text content
 */
export async function generateContextXAI(promptObj, env) {
  try {
    const apiKey = env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI API key is missing');
    }

    const requestBody = {
      model: XAI_TEXT_MODEL,
      messages: [
        { role: 'system', content: promptObj.systemPrompt },
        { role: 'user', content: promptObj.userMessage }
      ],
      max_tokens: XAI_MAX_TOKENS,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    };

    const xaiRes = await fetch(XAI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!xaiRes.ok) {
      const errorText = await xaiRes.text();
      throw new Error(`XAI API error: ${xaiRes.status} | ${errorText}`);
    }

    const xaiData = await xaiRes.json();
    const aiContent = xaiData.choices?.[0]?.message?.content || "";

    if (!aiContent) {
      throw new Error('No AI content in XAI response');
    }

    const parsedContent = JSON.parse(aiContent);
    let text = parsedContent[XAI_RESPONSE_KEY] || parsedContent.content || parsedContent.tweetText;

    // Enforce 280 character limit
    if (text && text.length > 280) {
      text = text.substring(0, 277) + '...';
    }

    return text || 'XAI: No response';
  } catch (error) {
    throw new Error(`XAI text generation failed: ${error.message}`);
  }
}

/**
 * Generate image using XAI API
 * @param {string} sceneText - Text content for image generation
 * @param {object} env - Environment variables
 * @param {string} customImagePrompt - Custom image prompt
 * @param {string} folderPath - Folder path for storage
 * @returns {object} - Image buffer and URL
 */
export async function generateImageXAI(sceneText, env, customImagePrompt = null, folderPath = 'generated-images') {
  try {
    const apiKey = env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('XAI API key missing for image generation');
    }

    const imagePrompt = customImagePrompt || `Create a vibrant, engaging visual representation of: ${sceneText}. Style: modern, urban, lifestyle photography aesthetic with warm lighting.`;

    const requestBody = {
      model: XAI_IMAGE_MODEL,
      prompt: imagePrompt,
      n: 1,
      response_format: "url"
    };

    const xaiRes = await fetch(XAI_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!xaiRes.ok) {
      throw new Error(`XAI Image API error: ${xaiRes.status}`);
    }

    const xaiData = await xaiRes.json();
    const xaiImageUrl = xaiData.data?.[0]?.url;

    if (!xaiImageUrl) {
      throw new Error('No image URL found in XAI response');
    }

    // Download the image
    const imageRes = await fetch(xaiImageUrl);
    if (!imageRes.ok) {
      throw new Error('Failed to download image from XAI URL');
    }

    const imageBuffer = await imageRes.arrayBuffer();

    return {
      imageBuffer: imageBuffer,
      imageUrl: xaiImageUrl
    };

  } catch (error) {
    throw new Error(`XAI image generation failed: ${error.message}`);
  }
}

// ============================================================================
// PLATFORM POSTING FUNCTIONS
// ============================================================================

/**
 * Post to Twitter/X using OAuth 1.0a
 * @param {string} content - Content to post
 * @param {string} clientName - Client brand name
 * @param {object} credentials - OAuth credentials
 * @param {object} env - Environment variables
 * @param {string} customImagePrompt - Custom image prompt
 * @param {ArrayBuffer} imageBuffer - Image buffer
 * @returns {object} - Posting result
 */
export async function postToTwitter(content, clientName, credentials, env, customImagePrompt = null, imageBuffer = null) {
  try {
    let mediaId = null;

    if (imageBuffer) {
      mediaId = await uploadImageToTwitter(imageBuffer, credentials, env);
    } else if (customImagePrompt) {
      const generatedImage = await generateImageXAI(content, env, customImagePrompt);
      if (generatedImage.imageBuffer) {
        mediaId = await uploadImageToTwitter(generatedImage.imageBuffer, credentials, env);
      }
    }

    const tweetData = { text: content };
    if (mediaId) {
      tweetData.media = { media_ids: [mediaId] };
    }

    // OAuth signature for tweet post
    const url = 'https://api.twitter.com/2/tweets';
    const method = 'POST';
    const params = {
      oauth_consumer_key: credentials.consumerKey,
      oauth_nonce: Math.random().toString(36).substring(2, 15),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: credentials.accessToken,
      oauth_version: '1.0'
    };

    const signature = await generateOAuthSignature(method, url, params, credentials.consumerSecret, credentials.accessTokenSecret);
    params.oauth_signature = signature;

    const authHeader = 'OAuth ' + Object.keys(params).map(key => `${key}="${encodeURIComponent(params[key])}"`).join(', ');

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tweetData)
    });

    if (resp.ok) {
      return { success: true, platform: 'twitter' };
    } else if (resp.status === 403) {
      // Try v1.1 API fallback
      return await postToTwitterV11(content, mediaId, credentials);
    } else {
      return { success: false, error: `Twitter API error: ${resp.status}`, platform: 'twitter' };
    }

  } catch (error) {
    return { success: false, error: error.message, platform: 'twitter' };
  }
}

/**
 * Twitter v1.1 API fallback
 * @param {string} tweetText - Tweet text
 * @param {string} mediaId - Media ID
 * @param {object} credentials - OAuth credentials
 * @returns {object} - Posting result
 */
async function postToTwitterV11(tweetText, mediaId, credentials) {
  try {
    const url = 'https://api.twitter.com/1.1/statuses/update.json';
    const method = 'POST';

    const params = {
      status: tweetText,
      oauth_consumer_key: credentials.consumerKey,
      oauth_nonce: Math.random().toString(36).substring(2, 15),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: credentials.accessToken,
      oauth_version: '1.0'
    };

    if (mediaId) {
      params.media_ids = mediaId;
    }

    const signature = await generateOAuthSignature(method, url, params, credentials.consumerSecret, credentials.accessTokenSecret);
    params.oauth_signature = signature;

    const oauthParams = {};
    Object.keys(params).forEach(key => {
      if (key.startsWith('oauth_')) {
        oauthParams[key] = params[key];
      }
    });

    const authHeader = 'OAuth ' + Object.keys(oauthParams).map(key =>
      `${key}="${encodeURIComponent(oauthParams[key])}"`
    ).join(', ');

    const formBody = new URLSearchParams();
    formBody.append('status', tweetText);
    if (mediaId) {
      formBody.append('media_ids', mediaId);
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody.toString()
    });

    if (resp.ok) {
      return { success: true, platform: 'twitter' };
    } else {
      return { success: false, error: `Twitter v1.1 API error: ${resp.status}`, platform: 'twitter' };
    }

  } catch (error) {
    return { success: false, error: error.message, platform: 'twitter' };
  }
}

/**
 * Upload image to Twitter
 * @param {ArrayBuffer} imageBuffer - Image buffer
 * @param {object} credentials - OAuth credentials
 * @param {object} env - Environment variables
 * @returns {string} - Media ID
 */
async function uploadImageToTwitter(imageBuffer, credentials, env) {
  const twitterCreds = {
    consumerKey: credentials?.consumerKey || env.X_CONSUMER_KEY,
    consumerSecret: credentials?.consumerSecret || env.X_CONSUMER_SECRET,
    accessToken: credentials?.accessToken || env.X_ACCESS_TOKEN,
    accessTokenSecret: credentials?.accessTokenSecret || env.X_ACCESS_TOKEN_SECRET
  };

  const uint8Array = new Uint8Array(imageBuffer);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    binaryString += String.fromCharCode.apply(null, chunk);
  }
  const base64Image = btoa(binaryString);

  const oauthParams = {
    oauth_consumer_key: twitterCreds.consumerKey,
    oauth_token: twitterCreds.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: Math.random().toString(36).substring(2, 15),
    oauth_version: '1.0'
  };

  const signature = await generateOAuthSignature('POST', 'https://upload.twitter.com/1.1/media/upload.json', oauthParams, twitterCreds.consumerSecret, twitterCreds.accessTokenSecret);
  oauthParams.oauth_signature = signature;

  const authHeader = 'OAuth ' + Object.keys(oauthParams)
    .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  const formData = new FormData();
  formData.append('media_data', base64Image);

  const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
    method: 'POST',
    headers: {
      'Authorization': authHeader
    },
    body: formData
  });

  if (!uploadRes.ok) {
    throw new Error(`Twitter media upload failed: ${uploadRes.status}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.media_id_string;
}

// ============================================================================
// INSTAGRAM POSTING FUNCTIONS
// ============================================================================

const INSTAGRAM_API_BASE = 'https://graph.instagram.com';

/**
 * Post to Instagram
 * @param {string} content - Content to post
 * @param {string} imageUrl - Image URL
 * @param {string} accessToken - Instagram access token
 * @param {string} userId - Instagram user ID
 * @returns {object} - Posting result
 */
export async function postToInstagram(content, imageUrl, accessToken, userId) {
  try {
    // Step 1: Upload media
    const uploadUrl = `${INSTAGRAM_API_BASE}/${userId}/media`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: content,
        access_token: accessToken
      })
    });

    const uploadResult = await uploadResponse.json();
    if (!uploadResponse.ok) {
      throw new Error(`Instagram media upload failed: ${uploadResult.error?.message}`);
    }

    // Step 2: Publish post
    const publishUrl = `${INSTAGRAM_API_BASE}/${userId}/media_publish`;
    const publishResponse = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: uploadResult.id,
        access_token: accessToken
      })
    });

    const publishResult = await publishResponse.json();
    if (!publishResponse.ok) {
      throw new Error(`Instagram publish failed: ${publishResult.error?.message}`);
    }

    return { success: true, postId: publishResult.id, platform: 'instagram' };

  } catch (error) {
    return { success: false, error: error.message, platform: 'instagram' };
  }
}

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Get platform credentials from KV storage
 * @param {object} env - Environment variables
 * @param {object} handles - Platform handles
 * @returns {object} - Credentials object
 */
export async function getCredentials(env, handles = {}) {
  const credentials = {
    x: {
      consumerKey: env.X_CONSUMER_KEY,
      consumerSecret: env.X_CONSUMER_SECRET,
      accessToken: env.X_ACCESS_TOKEN,
      accessTokenSecret: env.X_ACCESS_TOKEN_SECRET
    },
    instagram: {
      accessToken: env.INSTAGRAM_ACCESS_TOKEN,
      userId: env.INSTAGRAM_USER_ID
    },
    facebook: {
      accessToken: env.FACEBOOK_PAGE_TOKEN,
      pageId: env.FACEBOOK_PAGE_ID
    }
  };

  // Try to retrieve platform-specific tokens from KV storage
  if (env.CLIENT_TOKENS) {
    // Instagram tokens
    if (handles.instagram) {
      const instagramKeys = [
        `instagram:${handles.instagram}`,
        `instagram:user:${handles.instagram}`,
        `${handles.instagram}:instagram`
      ];

      for (const key of instagramKeys) {
        try {
          const storedTokens = await env.CLIENT_TOKENS.get(key);
          if (storedTokens) {
            const tokenData = JSON.parse(storedTokens);
            credentials.instagram = {
              accessToken: tokenData.accessToken,
              userId: tokenData.userId || tokenData.instagramUserId
            };
            break;
          }
        } catch (e) {
          // Continue to next key
        }
      }
    }

    // X/Twitter tokens
    if (handles.twitter) {
      const xKeys = [
        `x:${handles.twitter}`,
        `twitter:${handles.twitter}`,
        `${handles.twitter}:x`
      ];

      for (const key of xKeys) {
        try {
          const storedTokens = await env.CLIENT_TOKENS.get(key);
          if (storedTokens) {
            const tokenData = JSON.parse(storedTokens);
            credentials.x = {
              consumerKey: tokenData.consumerKey || env.X_CONSUMER_KEY,
              consumerSecret: tokenData.consumerSecret || env.X_CONSUMER_SECRET,
              accessToken: tokenData.accessToken,
              accessTokenSecret: tokenData.accessTokenSecret
            };
            break;
          }
        } catch (e) {
          // Continue to next key
        }
      }
    }

    // Facebook tokens
    if (handles.facebook) {
      const facebookKeys = [
        `facebook:${handles.facebook}`,
        `facebook:page:${handles.facebook}`,
        `${handles.facebook}:facebook`
      ];

      for (const key of facebookKeys) {
        try {
          const storedTokens = await env.CLIENT_TOKENS.get(key);
          if (storedTokens) {
            const tokenData = JSON.parse(storedTokens);
            credentials.facebook = {
              accessToken: tokenData.accessToken,
              pageId: tokenData.pageId || tokenData.facebookPageId
            };
            break;
          }
        } catch (e) {
          // Continue to next key
        }
      }
    }
  }

  return credentials;
}

// ============================================================================
// MAIN CONTENT ORCHESTRATION
// ============================================================================

/**
 * Main content generation and posting orchestration
 * @param {object} clientConfig - Client configuration
 * @param {object} credentials - Platform credentials
 * @param {object} env - Environment variables
 * @param {object} forceParams - Force parameters for testing
 * @returns {object} - Posting results
 */
export async function orchestrateContentAndPost(clientConfig, credentials, env, forceParams = {}) {
  try {
    const now = new Date();
    const hour = now.getUTCHours();
    const dayOfWeek = now.getDay();

    const currentHourString = hour.toString().padStart(2, '0') + ':00';

    const dayNameToNumber = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6
    };
    const doublePostDays = (clientConfig.double_post_days || []).map(day => dayNameToNumber[day.toLowerCase()]);
    const isDoublePostDay = doublePostDays.includes(dayOfWeek);

    const activePostTimes = isDoublePostDay && clientConfig.double_post_times
      ? clientConfig.double_post_times
      : clientConfig.post_times;

    const isScheduledPostingTime = activePostTimes.includes(currentHourString);

    let content;
    let contentType;
    let imagePrompt;
    let imageBuffer, imageUrl;
    let shouldPost = false;

    // Handle force parameters
    if (forceParams.force_dynamic) {
      const dynamicPromptObj = assembleDynamicContextPrompt(clientConfig, clientConfig.dynamicContentArray);
      content = await generateContextXAI(dynamicPromptObj, env);
      contentType = 'DYNAMIC';
      imagePrompt = assembleDynamicImagePrompt(clientConfig, content, clientConfig.dynamicContentArray, clientConfig.imageStyleArray);
      shouldPost = true;
    } else if (forceParams.force_static) {
      const staticPost = assembleStaticPost(clientConfig.staticContentArray);
      content = staticPost.text;
      contentType = 'STATIC';
      shouldPost = true;
    } else if (isScheduledPostingTime) {
      // Scheduled posting logic
      if (isDoublePostDay && currentHourString === '09:00') {
        const staticPost = assembleStaticPost(clientConfig.staticContentArray);
        content = staticPost.text;
        contentType = 'STATIC';
        shouldPost = true;
      } else {
        const dynamicPromptObj = assembleDynamicContextPrompt(clientConfig, clientConfig.dynamicContentArray);
        content = await generateContextXAI(dynamicPromptObj, env);
        contentType = 'DYNAMIC';
        imagePrompt = assembleDynamicImagePrompt(clientConfig, content, clientConfig.dynamicContentArray, clientConfig.imageStyleArray);
        shouldPost = true;
      }
    }

    if (!shouldPost) {
      return {
        success: true,
        message: 'Skipped post - not a scheduled posting time',
        content: null,
        results: []
      };
    }

    // Generate images for dynamic content
    if (contentType === 'DYNAMIC' && imagePrompt) {
      const result = await generateImageXAI(content, env, imagePrompt);
      imageBuffer = result.imageBuffer;
      imageUrl = result.imageUrl;
    }

    const results = [];

    // Post to Instagram
    if (credentials.instagram?.accessToken && credentials.instagram?.userId && imageUrl) {
      const instagramResult = await postToInstagram(content, imageUrl, credentials.instagram.accessToken, credentials.instagram.userId);
      results.push(instagramResult);
    } else {
      results.push({ platform: 'instagram', success: false, message: 'Instagram credentials not available' });
    }

    // Post to Twitter
    if (credentials.x?.accessToken) {
      const twitterResult = await postToTwitter(content, clientConfig.brand_name, credentials.x, env, null, imageBuffer);
      results.push(twitterResult);
    } else {
      results.push({ platform: 'twitter', success: false, message: 'Twitter credentials not available' });
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Posted to ${successCount}/${results.length} platforms`,
      content: content,
      results: results
    };

  } catch (error) {
    throw new Error(`Content orchestration failed: ${error.message}`);
  }
}