export const toolIntentDetection = async ({ message, clientConfig }) => {
  try {
    const apiKey = clientConfig.xaiApiKey;
    if (!apiKey) {
      throw new Error('xaiApiKey not found in client config');
    }

    // Mock response for test key
    if (apiKey === 'test-key-for-local-dev') {
      return {
        intent: 'customer',
        confidence: 0.9,
      };
    }

    const systemPrompt = `You are an intent detector. Classify the user's message into one of these roles: customer, lead, prospect, existing_client, other. Respond with JSON: {"intent": "role", "confidence": 0.0-1.0}`;

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
    console.error('Error in toolIntentDetection:', error);
    return {
      intent: 'other',
      confidence: 0.5,
      error: error.message,
    };
  }
};