/**
 * Configuration and resource management tool for Inexasli orchestrator
 */

/**
 * Handle resource management operations
 * @param {string} action - Action to perform (kv_get, kv_put, kv_delete, r2_get, r2_put)
 * @param {string} key - Resource key
 * @param {*} value - Value for put operations
 * @param {object} env - Environment variables
 * @returns {Promise<*>} - Operation result
 */
export async function manageResource(action, key, value, env) {
  try {
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
        throw new Error('Unknown action');
    }

    return result;
  } catch (error) {
    throw new Error(`Resource management error: ${error.message}`);
  }
}

/**
 * Get sanitized public configuration
 * @param {object} fullConfig - Full configuration object
 * @returns {object} - Public configuration without secrets
 */
export function getPublicConfig(fullConfig) {
  return {
    ...fullConfig,
    xaiApiKey: undefined // Remove API key from public response
  };
}

/**
 * Get full configuration with secrets (internal use only)
 * @param {object} baseConfig - Base configuration object
 * @param {object} env - Environment variables
 * @returns {object} - Full configuration with secrets
 */
export function getFullConfig(baseConfig, env) {
  return {
    ...baseConfig,
    xaiApiKey: env.XAI_API_KEY
  };
}