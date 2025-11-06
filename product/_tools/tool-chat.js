// toolChat.js - Chatbot tool for LangChain

import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
// import { ConversationBufferMemory } from 'langchain/memory';

export const toolChat = (env, clientConfig) => new Tool({
  name: 'chat',
  description: 'Handle chatbot conversations. Input: JSON with {message: "user message", chatHistory: [...], sessionId: "id"}. Returns AI response.',
  func: async (input) => {
    try {
      const { message, chatHistory = [], sessionId } = JSON.parse(input);

      // Initialize LLM with Grok
      const llm = new ChatOpenAI({
        openaiApiKey: env.GROK_API_KEY,
        modelName: 'grok-3-mini-beta',
      });

      // Use client config for prompt assembly
      const systemPrompt = clientConfig.promptTemplate || 'You are a helpful AI assistant.';
      const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}\nAssistant:`;

      // Generate response
      // const response = await llm.call([{ role: 'user', content: fullPrompt }]);
      const response = { content: `Mock response to: ${message}` };

      return JSON.stringify({
        response: response.content,
        sessionId,
      });
    } catch (error) {
      return `Error in chat: ${error.message}`;
    }
  },
});