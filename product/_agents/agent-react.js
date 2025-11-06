// agent-react.js - ReAct Agent

import { ReActAgent } from '@langchain/agents';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationBufferMemory } from '@langchain/core/memory';
import { chainReply } from '../_chains/chain-reply.js';

export function createReActAgent(tools, clientConfig) {
  const llm = new ChatOpenAI({
    openaiApiKey: clientConfig.apiKey,
    modelName: 'grok-3-mini-beta',
  });

  const memory = new ConversationBufferMemory();

  // Add chains as tools for the agent
  const chainTools = [
    {
      name: 'reply_chain',
      description: 'Use this chain to generate business chat responses with knowledge base access',
      func: async (input) => {
        const result = await chainReply.call({
          input,
          brand_name: clientConfig.brand_name,
          brand_voice: clientConfig.brand_voice,
          business_synopsis: clientConfig.business_synopsis,
          enhancedPromptAdditions: clientConfig.enhancedPromptAdditions,
        });
        return result.text;
      },
    },
  ];

  const allTools = [...tools, ...chainTools];

  return new ReActAgent({
    llm,
    tools: allTools,
    memory,
    // Add client-specific config
  });
}