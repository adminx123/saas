/**
 * Inexasli MCP Server
 * Model Context Protocol server exposing business AI tools
 * Based on product/ architecture with GMCR components as modular tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import business logic from existing masters
import { checkBusinessRelevance, collectionSearch, detectIntentAndPlanFlow, generateSelfFeedingResponse } from '../_hub/masterHub.js';
import { assembleReplyPrompt, processAIResponse } from '../_reply/masterReply.js';
import { assembleContextPrompt, getCredentials } from '../_social/masterSocial.js';

class InexasliMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'inexasli-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // Core GMCR Business Logic Tools
          {
            name: 'business_relevance_check',
            description: 'Check if user query is relevant to Inexasli business offerings',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'User message to evaluate' },
                clientConfig: { type: 'object', description: 'Client configuration with business synopsis' }
              },
              required: ['message', 'clientConfig']
            }
          },
          {
            name: 'collection_search',
            description: 'Search XAI collections for relevant knowledge and information',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                collections: { type: 'array', items: { type: 'string' }, description: 'Collection IDs to search' }
              },
              required: ['query']
            }
          },
          {
            name: 'intent_detection',
            description: 'Analyze user intent and assign appropriate response strategy',
            inputSchema: {
              type: 'object',
              properties: {
                message: { type: 'string', description: 'User message' },
                knowledge: { type: 'string', description: 'Relevant knowledge context' },
                config: { type: 'object', description: 'Client configuration' },
                platform: { type: 'string', description: 'Platform type (chat, social, etc.)' }
              },
              required: ['message', 'config']
            }
          },
          {
            name: 'response_generation',
            description: 'Generate intelligent response using self-feeding reasoning',
            inputSchema: {
              type: 'object',
              properties: {
                goal: { type: 'string', description: 'Response objective' },
                message: { type: 'string', description: 'User message' },
                chatHistory: { type: 'array', items: { type: 'object' }, description: 'Conversation history' },
                knowledge: { type: 'object', description: 'Search results and context' },
                config: { type: 'object', description: 'Client configuration' }
              },
              required: ['goal', 'message', 'config']
            }
          },
          // External API Tools
          {
            name: 'xai_chat_completion',
            description: 'Generate AI response using XAI/Grok API',
            inputSchema: {
              type: 'object',
              properties: {
                messages: { type: 'array', items: { type: 'object' }, description: 'Chat messages' },
                model: { type: 'string', description: 'Model to use', default: 'grok-3-mini-beta' },
                temperature: { type: 'number', description: 'Response temperature', default: 0.7 },
                collections: { type: 'array', items: { type: 'string' }, description: 'Collection IDs' }
              },
              required: ['messages']
            }
          },
          {
            name: 'stripe_create_price',
            description: 'Create a new price for a Stripe product',
            inputSchema: {
              type: 'object',
              properties: {
                product: { type: 'string', description: 'Product ID or name to create price for' },
                unit_amount: { type: 'number', description: 'Price amount in cents' },
                currency: { type: 'string', description: 'Currency code', default: 'usd' },
                recurring: { 
                  type: 'object', 
                  description: 'Recurring price configuration',
                  properties: {
                    interval: { type: 'string', enum: ['day', 'week', 'month', 'year'], description: 'Billing interval' },
                    interval_count: { type: 'number', description: 'Number of intervals between billings', default: 1 }
                  }
                },
                metadata: { type: 'object', description: 'Additional price metadata' }
              },
              required: ['product', 'unit_amount']
            }
          },
          {
            name: 'social_media_post',
            description: 'Post content to social media platforms',
            inputSchema: {
              type: 'object',
              properties: {
                platform: { type: 'string', enum: ['instagram', 'twitter', 'facebook'], description: 'Social platform' },
                content: { type: 'string', description: 'Content to post' },
                config: { type: 'object', description: 'Client social configuration' }
              },
              required: ['platform', 'content', 'config']
            }
          },
          {
            name: 'sms_send',
            description: 'Send SMS message via Twilio',
            inputSchema: {
              type: 'object',
              properties: {
                to: { type: 'string', description: 'Recipient phone number' },
                message: { type: 'string', description: 'SMS content' }
              },
              required: ['to', 'message']
            }
          },
          // Training & Learning Tools
          {
            name: 'training_data_store',
            description: 'Store new training data for knowledge expansion',
            inputSchema: {
              type: 'object',
              properties: {
                answer: { type: 'string', description: 'Expert answer' },
                role: { type: 'string', description: 'Role/category for the answer' },
                clientId: { type: 'string', description: 'Client identifier' }
              },
              required: ['answer', 'role', 'clientId']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'business_relevance_check':
            return await this.handleBusinessRelevanceCheck(args);

          case 'collection_search':
            return await this.handleCollectionSearch(args);

          case 'intent_detection':
            return await this.handleIntentDetection(args);

          case 'response_generation':
            return await this.handleResponseGeneration(args);

          case 'xai_chat_completion':
            return await this.handleXAIChatCompletion(args);

          case 'stripe_create_price':
            return await this.handleStripeCreatePrice(args);

          case 'social_media_post':
            return await this.handleSocialPost(args);

          case 'sms_send':
            return await this.handleSMSSend(args);

          case 'training_data_store':
            return await this.handleTrainingStore(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  // Tool handler implementations
  async handleBusinessRelevanceCheck(args) {
    const { message, clientConfig } = args;

    // This would use the existing checkBusinessRelevance function
    // For now, return mock result
    const result = {
      isRelevant: message.toLowerCase().includes('ai') || message.toLowerCase().includes('business') || message.toLowerCase().includes('chat'),
      confidence: 0.85,
      reasoning: 'Query contains business-relevant keywords'
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleCollectionSearch(args) {
    const { query, collections = [] } = args;

    // This would use the existing collectionSearch function
    // For now, return mock result
    const result = {
      matches: [
        {
          file_id: 'business_info',
          chunk_content: `Relevant information about: ${query}`,
          score: 0.95
        }
      ],
      totalMatches: 1
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleIntentDetection(args) {
    const { message, knowledge = '', config, platform = 'chat' } = args;

    // This would use the existing detectIntentAndPlanFlow function
    // For now, return mock result
    const result = {
      intent: message.toLowerCase().includes('buy') || message.toLowerCase().includes('pricing') ? 'purchase' : 'information',
      role: 'general_assistant',
      confidence: 0.8,
      guided_flow_needs: ['response'],
      ui_elements: [],
      urgency_level: 'medium',
      complexity: 'simple'
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleResponseGeneration(args) {
    const { goal, message, chatHistory = [], knowledge = {}, config } = args;

    // This would use the existing generateSelfFeedingResponse function
    // For now, return mock result
    const result = {
      response: `Based on your question "${message}", here's a helpful response tailored to ${goal}.`,
      reasoning: 'Generated using self-feeding reasoning pipeline',
      goal: goal
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleXAIChatCompletion(args) {
    const { messages, model = 'grok-3-mini-beta', temperature = 0.7, collections = [] } = args;

    // This would make actual XAI API call
    // For now, return mock result
    const result = {
      choices: [{
        message: {
          content: 'This is a mock XAI response. In production, this would call the actual XAI API.'
        }
      }],
      usage: { tokens: 150 }
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleStripeCreatePrice(args) {
    const { product, unit_amount, currency = 'usd', recurring, metadata = {} } = args;

    // This would call Stripe API to create price
    // For now, return mock result
    const result = {
      price: {
        id: 'price_mock_' + Date.now(),
        product: product,
        unit_amount: unit_amount,
        currency: currency,
        recurring: recurring,
        metadata: metadata,
        active: true,
        created: Math.floor(Date.now() / 1000)
      }
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleSocialPost(args) {
    const { platform, content, config } = args;

    // This would use existing social posting logic
    // For now, return mock result
    const result = {
      success: true,
      platform: platform,
      postId: 'mock_post_123',
      content: content.substring(0, 50) + '...'
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleSMSSend(args) {
    const { to, message } = args;

    // This would use existing SMS sending logic
    // For now, return mock result
    const result = {
      success: true,
      to: to,
      messageId: 'mock_sms_123',
      status: 'sent'
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async handleTrainingStore(args) {
    const { answer, role, clientId } = args;

    // This would use existing training storage logic
    // For now, return mock result
    const result = {
      success: true,
      stored: true,
      answer: answer,
      role: role,
      clientId: clientId,
      timestamp: new Date().toISOString()
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Inexasli MCP Server running...');
  }
}

// Start the server
const server = new InexasliMCPServer();
server.run().catch(console.error);