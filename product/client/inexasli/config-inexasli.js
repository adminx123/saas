/**
 * Config worker for Inexasli client
 * Pure configuration and resource management - no functions
 */

// Shared configuration object
export const INEXASLI_SHARED_CONFIG = {
  xaiApiKey: null, // Will be set from env in runtime
  xaiCollection: null, // Will be set from env in runtime
  client_id: 'inexasli',
  brand_name: 'INEXASLI',
  brand_voice: 'AI automation expert empowering businesses with 24/7 intelligent solutions that save time, reduce costs, and unlock growth opportunities',
  default_tone: 'professional',
  handles: {
    instagram: '@inexasli_',
    twitter: '@inexasli_',
    facebook: '61552695448547'
  },
  trainPhone: '+16043699667',
  supportEmail: 'support@inexli.com',
  legalUrls: {
    terms: 'https://inexasli.com/terms-of-service',
    privacy: 'https://inexasli.com/privacy-policy',
    dpa: 'https://inexasli.com/data-deletion'
  },
  enabled_features: ['chat', 'booking', 'payment', 'support'],
  enabled_social_platforms: ['instagram'], // Can be extended to ['instagram', 'facebook', 'twitter']
  enabled_roles: ['admin_assistant_template', 'customer_service_rep_template', 'hr_assistant_template', 'it_support_template', 'order_fulfillment_template', 'sales_assistant_template', 'support_technician_template', 'team_coordinator_template'],
  rateLimitStore: 'RATE_LIMIT_CHAT',
  rateLimitMax: 1,
  rateLimitTtl: 3600,
  rateLimitKeyPrefix: 'rate_limit:',
  model: 'grok-3-mini-beta',
  maxTokens: 1000,
  temperature: 0.7,
  instagramVerifyToken: 'inexasli_webhook_verify_2025', // For webhook verification
  enhancedPromptAdditions: '\n\nIMPORTANT: For questions you cannot answer based on INEXASLI knowledge:\n- If relevant but lacking info: Respond with "Thank you for your question! This is a valid INEXASLI-related inquiry. Our AI is currently being trained and updated. The owner has been notified of your unanswered question and will provide an answer to update the chat within 24 hours. For immediate assistance, contact support@inexli.com."\n- If completely irrelevant: Respond with "This question is outside my expertise in INEXASLI services."',
  business_synopsis: {
    description: "Inexasli is an AI-powered platform that provides intelligent business solutions, automation tools, data analysis, workflow optimization, and AI consulting services to help businesses streamline operations and make data-driven decisions.",
    key_areas: [
      "AI-powered business intelligence",
      "workflow automation",
      "data analysis and insights",
      "AI consulting and implementation",
      "business process optimization",
      "intelligent customer service solutions"
    ],
    mission: "Empowering businesses with intelligent automation and AI-driven insights to achieve operational excellence and competitive advantage."
  },

  // ============================================================================
  // SOCIAL MEDIA CONFIGURATION
  // ============================================================================

  // Posting schedule (UTC times) - social-specific
  post_times: ['13:00'], // Regular days: 1 PM philosophical only
  double_post_times: ['09:00', '13:00'], // Double post days: 9 AM sales + 1 PM philosophical
  double_post_days: ['Wednesday', 'Saturday'], // These days get both 9 AM sales + 1 PM philosophical

  // Mixed content mode - enables hybrid static/dynamic content
  mixed_mode: 'dynamic_text_static_image', // Can be 'static_text_dynamic_image' or 'dynamic_text_static_image'

  // Topic-to-element mappings for image prompts (client-injected)
  topicElementMappings: {
    'Ancient Stoicism Applied to Modern Workplace Stress': 'ancient scrolls meets modern office, zen circles',
    'Aristotelian Ethics in Digital Age Relationships': 'classical columns merged with digital hearts, virtue symbols',
    'Buddhist Mindfulness for Tech Addiction Recovery': 'meditation bells breaking phone chains, lotus tech',
    'Platonic Ideals vs. Social Media Reality': 'cave shadows dancing with screen reflections, truth mirrors',
    'Nietzschean Will to Power in Entrepreneurship': 'mountain peaks conquering digital landscapes, strength symbols',
    'Confucian Social Harmony in Remote Work Culture': 'ancient bridges connecting modern screens, balance patterns',
    'Existentialist Freedom in Consumer Choice Overload': 'crossroads multiplying infinitely, choice labyrinths'
  },

  // Prompt templates for config injection
  contextPromptTemplate: {
    systemPrompt: `You are the world's leading expert in translating ancient philosophical wisdom into practical modern insights. Your specialty is revealing unexpected connections between classical philosophy and contemporary life.

CRITICAL CONSTRAINT: ALL content MUST be 280 characters or less. Count characters carefully before responding.

Style Guidelines:
- Lead with unexpected insights that surprise people
- Connect ancient wisdom to modern situations
- Make philosophy practical and actionable
- Use simple language, profound insights
- Include one surprising "aha!" moment per post
- Format: Ancient concept → Modern application → Unexpected insight
- ABSOLUTELY MUST stay within 280 characters total

Output Format: {"tweetText": "your insight here"}`,
    userMessageTemplate: `Create an unexpected insight connecting ancient philosophy to modern life about: \${currentTopic}

ABSOLUTELY CRITICAL: The final tweet MUST NOT exceed 280 characters. Count the characters in your response.

The tweet should:
1. Start with an ancient philosophical concept
2. Connect it to a modern situation/problem
3. Reveal an unexpected insight or parallel
4. Be practical and actionable
5. Surprise readers with the connection
6. CRITICAL: Stay within 280 characters maximum
7. Make ancient wisdom feel relevant today

Format suggestion: "[Ancient concept] → [Modern situation]. Insight: [Unexpected connection]"

Variation seed: \${seed}.

Return only valid JSON with the tweet content. Character count limit: 280 MAX.`
  },

  imagePromptTemplate: `Create \${selectedStyle.style} for: "\${contentText}..."
Incorporate \${topicElement} with \${selectedStyle.mood} mood.
\${selectedStyle.colors}. \${selectedStyle.composition}.
Include \${selectedStyle.elements}.
Ancient wisdom meets modern life, philosophical bridges, timeless insights. Seed: \${seed}.`,

  // Static content arrays (Sales Messages - 9 AM posts)
  staticContentArray: [
    {
      text: "🚀 Ready to supercharge your business with AI? Our intelligent chatbots handle customer inquiries 24/7, turning leads into sales while you sleep. Simple setup, maximum results. DM to get started!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    },
    {
      text: "📧 Email overload killing your productivity? Our AI assistant reads, categorizes, and drafts responses automatically. Save 5+ hours daily while maintaining professional communication. Perfect for busy entrepreneurs!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    },
    {
      text: "📝 Need consistent, high-quality content? AI generates blog posts, social media, and marketing copy in your brand voice. Scale your content marketing without the writer's block. Professional results guaranteed!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    },
    {
      text: "📊 Hidden insights in your spreadsheets? AI analyzes business data and creates stunning dashboards with trends and recommendations. Make data-driven decisions without the complexity. Transform your business intelligence!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    },
    {
      text: "📄 Manual document processing wasting time? AI reads, extracts, and organizes invoices, receipts, and documents automatically. Save hours on paperwork while reducing errors. Simple document AI for modern businesses!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    },
    {
      text: "💬 Customer inquiries piling up? Website chatbots answer questions instantly and qualify leads 24/7. Never miss a sales opportunity again. Easy integration, immediate results. Your sales team will thank you!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    },
    {
      text: "📅 Calendar chaos costing you money? AI optimizes schedules, suggests meeting times, and sends smart reminders. Professional time management that adapts to your priorities. Take control of your most valuable asset - time!",
      image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
    }
  ],

  // Dynamic content arrays (Philosophical Topics - 1 PM posts)
  dynamicContentArray: [
    'Ancient Stoicism Applied to Modern Workplace Stress',
    'Aristotelian Ethics in Digital Age Relationships',
    'Buddhist Mindfulness for Tech Addiction Recovery',
    'Platonic Ideals vs. Social Media Reality',
    'Nietzschean Will to Power in Entrepreneurship',
    'Confucian Social Harmony in Remote Work Culture',
    'Existentialist Freedom in Consumer Choice Overload'
  ],

  // Image style arrays
  imageStyleArray: [
    {
      style: 'surreal pop art collage with philosophical symbolism',
      mood: 'dreamlike, provocative, mind-bending',
      colors: 'vibrant neons, electric magentas, metallic golds',
      aesthetic: 'psychedelic, contemporary, thought-provoking',
      composition: 'close-up with dramatic lighting, multiple perspectives',
      elements: 'floating geometric shapes, distorted reality, comic book influences'
    },
    {
      style: 'minimalist symbolic abstraction with hidden meanings',
      mood: 'contemplative, mysterious, intellectually stimulating',
      colors: 'monochromatic with single accent color, high contrast',
      aesthetic: 'modern, sophisticated, enigmatic',
      composition: 'centered composition with negative space, clean lines',
      elements: 'subtle metaphors, optical illusions, symbolic representations'
    },
    {
      style: 'vintage surrealist illustration with philosophical allegory',
      mood: 'nostalgic, profound, timeless wisdom',
      colors: 'sepia tones, rich burgundies, antique golds',
      aesthetic: 'classical, artistic, meaningful',
      composition: 'wide-angle view with classical framing, ornate details',
      elements: 'mythical creatures, ancient symbols, dreamlike scenarios'
    },
    {
      style: 'neon digital art with philosophical themes',
      mood: 'futuristic, intense, consciousness-expanding',
      colors: 'neon pinks, electric blues, holographic silvers',
      aesthetic: 'avant-garde, technological, mind-altering',
      composition: 'dramatic angles, urban dystopia backdrop, dynamic energy',
      elements: 'digital glitches, holographic projections, neural networks'
    },
    {
      style: 'nature-meets-abstract conceptual art with philosophical depth',
      mood: 'organic, transcendent, spiritually awakening',
      colors: 'bioluminescent greens, cosmic purples, flowing aquas',
      aesthetic: 'natural, mystical, enlightening',
      composition: 'macro photography style, natural patterns, ethereal lighting',
      elements: 'living fractals, symbiotic relationships, evolutionary metaphors'
    },
    {
      style: 'steampunk philosophical machinery with symbolic mechanisms',
      mood: 'ingenious, complex, mechanically profound',
      colors: 'brass golds, deep coppers, smoky charcoals',
      aesthetic: 'victorian, intricate, intellectually complex',
      composition: 'detailed close-up of mechanisms, layered complexity',
      elements: 'clockwork brains, symbolic gears, alchemical processes'
    },
    {
      style: 'cosmic abstract expressionism with philosophical constellations',
      mood: 'infinite, awe-inspiring, existentially profound',
      colors: 'galactic blues, stellar whites, nebula purples',
      aesthetic: 'cosmic, transcendent, philosophically vast',
      composition: 'expansive space scene, infinite depth, celestial scale',
      elements: 'constellation patterns, quantum particles, universal connections'
    },
    {
      style: 'urban street art philosophy with graffiti symbolism',
      mood: 'raw, authentic, socially conscious',
      colors: 'concrete grays, spray paint colors, neon accents',
      aesthetic: 'contemporary, rebellious, thought-provoking',
      composition: 'street level perspective, urban decay backdrop, raw energy',
      elements: 'graffiti tags, protest symbols, social commentary motifs'
    }
  ]
};

import { handleRequest } from './config-functions.js';

export default {
  async fetch(request, env) {
    return handleRequest(request, env, INEXASLI_SHARED_CONFIG);
  }
};