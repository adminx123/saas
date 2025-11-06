// chain-gmcr.js - Custom GMCR pipeline chain

import { Chain } from '@langchain/core';
import { toolRateLimiter } from '../_tools/tool-rateLimiter.js';
import { toolBusinessRelevance } from '../_tools/tool-businessRelevance.js';
import { toolIntentDetection } from '../_tools/tool-intentDetection.js';
import { toolKnowledgeUpdate } from '../_tools/tool-knowledgeUpdate.js';
import { toolWebhookHandler } from '../_tools/tool-webhookHandler.js';
import { toolUsageTracking } from '../_tools/tool-usageTracking.js';
import { toolResourceManager } from '../_tools/tool-resourceManager.js';
import { toolReply } from '../_tools/tool-reply.js';

export class ChainGMCR extends Chain {
  constructor() {
    super();
    this.inputKeys = ['input']; // Adjust based on input structure
    this.outputKeys = ['output']; // Adjust based on output
  }

  async _call(inputs) {
    let data = inputs.input;

    // 1. Rate Limiting
    const rateLimitResult = await toolRateLimiter(data);
    if (!rateLimitResult.allowed) {
      return { output: { type: 'rate_limit_exceeded', message: 'Rate limit exceeded. Please try again later.' } };
    }
    data = rateLimitResult;

    // 2. Business Relevance
    const relevanceResult = await toolBusinessRelevance(data);
    if (!relevanceResult.isRelevant) {
      return { output: { type: 'off_topic', message: 'This message appears to be off-topic. Please ask about business-related matters.' } };
    }
    data = relevanceResult;

    // 3. Intent Detection
    data = await toolIntentDetection(data);

    // 4. Knowledge Update
    data = await toolKnowledgeUpdate(data);

    // 5. Webhook Handler
    data = await toolWebhookHandler(data);

    // 6. Usage Tracking
    data = await toolUsageTracking(data);

    // 7. Resource Manager
    data = await toolResourceManager(data);

    // 8. AI Reply
    const replyResult = await toolReply(data);

    return { output: { type: 'reply', reply: replyResult.reply } };
  }
}

export const chainGMCR = new ChainGMCR();