// agent-structured-chat.js - Structured Chat Agent

import { createStructuredChatAgent } from '@langchain/community/agents';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationBufferMemory } from '@langchain/core/memory';

export function createStructuredChatAgent(tools, clientConfig) {
  const llm = new ChatOpenAI({
    openaiApiKey: clientConfig.apiKey,
    modelName: 'grok-3-mini-beta',
  });

  const memory = new ConversationBufferMemory();

  return createStructuredChatAgent(llm, tools);
}