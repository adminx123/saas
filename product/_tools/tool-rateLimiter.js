export const toolRateLimiter = async ({ sessionId, clientConfig }) => {
  try {
    // In real implementation, check KV for rate limit counters
    // For now, mock: allow if under limit
    const allowed = true; // Mock logic

    return {
      allowed,
      sessionId,
      remaining: 100, // Mock remaining requests
    };
  } catch (error) {
    console.error('Error in toolRateLimiter:', error);
    return {
      allowed: false,
      error: error.message,
      sessionId,
    };
  }
};