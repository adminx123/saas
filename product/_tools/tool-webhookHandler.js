export const toolWebhookHandler = async ({ message, sessionId, clientConfig }) => {
  try {
    const webhookUrl = clientConfig.webhookUrl;
    if (!webhookUrl) {
      return {
        sent: false,
        message: 'No webhook URL configured',
        sessionId,
      };
    }

    // In real implementation, make HTTP request to webhookUrl with message data
    // For now, mock success
    console.log(`Webhook triggered to ${webhookUrl} with message: ${message}`);

    return {
      sent: true,
      url: webhookUrl,
      sessionId,
    };
  } catch (error) {
    console.error('Error in toolWebhookHandler:', error);
    return {
      sent: false,
      error: error.message,
      sessionId,
    };
  }
};