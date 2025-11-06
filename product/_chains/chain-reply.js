// chain-reply.js - Reply chain for agent-based chat responses

import { LLMChain } from '@langchain/community/chains';
import { ChatOpenAI } from '@langchain/openai';

export const chainReply = new LLMChain({
  llm: new ChatOpenAI({ modelName: 'grok-3-mini-beta' }),
  prompt: `You are {brand_name}, {brand_voice}. {business_synopsis.description} {business_synopsis.key_areas ? 'Key areas: ' + business_synopsis.key_areas.join(', ') : ''}. {business_synopsis.mission ? 'Mission: ' + business_synopsis.mission : ''}.

{enhancedPromptAdditions}

Respond conversationally to the user message. Use the provided knowledge base collections to give accurate, specific information about {brand_name} services and processes.

User message: {input}`,
  // Add more chain logic as needed
});