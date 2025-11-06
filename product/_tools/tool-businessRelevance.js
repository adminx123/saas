export const toolBusinessRelevance = async ({ message, clientConfig }) => {
  try {
    const apiKey = clientConfig.xaiApiKey;
    if (!apiKey) {
      throw new Error('xaiApiKey not found in client config');
    }

    // Mock response for test key
    if (apiKey === 'test-key-for-local-dev') {
      return {
        isRelevant: message.toLowerCase().includes('business') || message.toLowerCase().includes('work'),
        confidence: 0.8,
      };
    }

    const systemPrompt = `You are a relevance classifier. Analyze the user's message and determine if it's business-related (e.g., work, professional inquiries, sales, services). Respond with JSON: {"isRelevant": true/false, "confidence": 0.0-1.0}`;

    // Direct fetch to xAI API
    const apiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        model: 'grok-3',
        stream: false,
        temperature: 0.1,
        collections: []
      })
    });

    if (!apiResponse.ok) {
      const error = await apiResponse.text();
      throw new Error(`xAI API error: ${error}`);
    }

    const apiResult = await apiResponse.json();
    const response = apiResult.choices?.[0]?.message?.content || '';

    const result = JSON.parse(response);
    return result;
  } catch (error) {
    console.error('Error in toolBusinessRelevance:', error);
    return {
      isRelevant: true, // Default to relevant on error
      confidence: 0.5,
      error: error.message,
    };
  }
};