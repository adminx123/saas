export const toolReply = async ({ inputType, message, sessionId, clientConfig }) => {
  try {
    const apiKey = clientConfig.xaiApiKey;
    if (!apiKey) {
      throw new Error('xaiApiKey not found in client config');
    }

    // Mock response for test key
    if (apiKey === 'test-key-for-local-dev') {
      return {
        reply: `Mock response: I received your message "${message}". This is test mode since using test API key.`,
        sessionId: sessionId || 'default',
        inputType,
      };
    }

    console.log('[toolReply] Using xAI API key starting with:', apiKey.substring(0, 10) + '...');

    let systemPrompt = '';
    if (inputType === 'chat') {
      systemPrompt = `You are ${clientConfig.brand_name}, ${clientConfig.brand_voice}. ${clientConfig.business_synopsis.description} ${clientConfig.business_synopsis.key_areas ? 'Key areas: ' + clientConfig.business_synopsis.key_areas.join(', ') : ''}. ${clientConfig.business_synopsis.mission ? 'Mission: ' + clientConfig.business_synopsis.mission : ''}.

${clientConfig.enhancedPromptAdditions}

Respond conversationally to the user message. Use the provided knowledge base collections to give accurate, specific information about ${clientConfig.brand_name} services and processes.`;
    } else if (inputType === 'dm' || inputType === 'post') {
      systemPrompt = `You are responding on social media. Keep responses professional, engaging, and concise.`;
    }

    // Direct fetch to xAI API (matching working implementation)
    const requestBody = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      model: 'grok-3',
      stream: false,
      temperature: 0.7,
      collections: clientConfig.xaiCollection ? [clientConfig.xaiCollection] : []  // Use configured XAI collection if available
    };

    console.log('[toolReply] Sending request to xAI:', { url: 'https://api.x.ai/v1/chat/completions', body: requestBody });

    const apiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[toolReply] xAI API response status:', apiResponse.status);
    console.log('[toolReply] xAI API response headers:', Object.fromEntries(apiResponse.headers.entries()));

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[toolReply] xAI API error response:', errorText);
      throw new Error(`xAI API error: ${errorText}`);
    }

    const apiResult = await apiResponse.json();
    console.log('[toolReply] xAI API success response:', apiResult);

    const reply = apiResult.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    return {
      reply,
      sessionId: sessionId || 'default',
      inputType,
    };
  } catch (error) {
    console.error('[toolReply] Error:', error);
    return {
      reply: 'Sorry, I encountered an error generating a response.',
      sessionId: sessionId || 'default',
      inputType,
      error: error.message,
    };
  }
};