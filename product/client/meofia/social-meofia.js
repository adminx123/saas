// PROMPT-MEOFIA.JS
// Meofia-specific content configuration and prompt generation functions
// This file contains all client-specific logic for Meofia's mafia cat social media posting

// ============================================================================
// MEOFIA CLIENT CONFIGURATION
// ============================================================================

export const MEOFIA_CONFIG = {
  client_id: 'meofia',
  brand_name: 'Meofia',
  brand_voice: 'philosophical wisdom from the godfather, often in parable form',

  // Platform-specific handles for automatic token lookup
  handles: {
    instagram: '@meofia',
    twitter: '@meofia'
  },

  // Posting schedule (UTC times)
  post_times: ['09:00', '18:00'], // 9 AM and 6 PM mafia wisdom
  double_post_times: null, // Meofia doesn't use different times for double post days
  double_post_days: [], // No double posts for meofia

  // Mixed content mode - enables hybrid static/dynamic content
  mixed_mode: null // Pure dynamic content for mafia cats
};

// ============================================================================
// STATIC CONTENT ARRAYS (Sales Messages - if needed)
// ============================================================================

export const STATIC_CONTENT_ARRAY = [
  {
    text: "🐱‍👤 The Family offers protection for your digital empire. Our AI soldiers work the streets 24/7, ensuring your business never sleeps. Capisce?",
    image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
  },
  {
    text: "🎩 In this business, information is power. Our AI reads between the lines, extracts what matters, keeps your operations smooth. The Don approves.",
    image: "https://pub-b70c309587ed8ba2bfa06320792ea457.r2.dev/logo-512x512.png"
  }
];

// ============================================================================
// DYNAMIC CONTENT ARRAYS (Mafia Cat Wisdom - main posts)
// ============================================================================

export const DYNAMIC_CONTENT_ARRAY = [
  'cats committing crime',
  'cats hanging out with family',
  'cats hanging out with friends', 
  'cats hanging out with female companion',
  'cats in business dealings',
  'cats in leisure activities',
  'cats in contemplation'
];

// ============================================================================
// IMAGE STYLE ARRAYS
// ============================================================================

export const IMAGE_STYLE_ARRAY = [
  {
    style: 'anthropomorphic cats in elaborate mafia/godfather scenarios',
    mood: 'wise, powerful, godfather-like',
    colors: 'classic black and white with gold accents',
    aesthetic: 'cinematic mob movie, high detail',
    composition: 'dramatic lighting, urban settings',
    elements: 'tailored suits, fedoras, feline characters embodying power and wisdom'
  },
  {
    style: 'sophisticated cat crime families in vintage settings',
    mood: 'mysterious, authoritative, family-oriented',
    colors: 'sepia tones with deep shadows and warm highlights',
    aesthetic: 'classic film noir with feline characters',
    composition: 'dramatic angles, smoke-filled rooms',
    elements: 'pinstripe suits, vintage cars, family gatherings, respect and honor'
  }
];

// ============================================================================
// DYNAMIC CONTENT GENERATION (XAI Prompts)
// ============================================================================

// Get topic for today from provided topics array
export function getPromptForToday(topics) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  return topics[dayOfWeek % topics.length];
}

// Generate tweet prompt with configurable topics and brand voice (generic name for scaffolding)
export function assembleContextPrompt(topics, brandVoice = 'philosophical wisdom from the godfather, often in parable form') {
  const currentTopic = getPromptForToday(topics);

  // Add date seed for uniqueness
  const seed = Date.now() % 1000;

  return {
    systemPrompt: `You are the Don of a mafia cat family, dispensing wisdom through parables and philosophical observations. Your voice combines street wisdom with deep philosophical insights, always maintaining the respect and authority of a godfather.

CRITICAL CONSTRAINT: ALL content MUST be 280 characters or less. Count characters carefully before responding.

Your tone should be:
- Wise and authoritative like a godfather
- Philosophical but accessible 
- Using mafia/family terminology naturally
- Speaking in parables or wisdom when appropriate
- ${brandVoice}

Create content about: "${currentTopic}"

The content should offer wisdom about life, family, loyalty, or business through the lens of a wise cat don.

Return only valid JSON with this structure:
{
  "tweetText": "your wisdom here"
}

Character count limit: 280 MAX.`,

    userMessage: `Generate philosophical mafia cat wisdom about "${currentTopic}". 
Channel the wisdom of a cat don who has seen much and learned from the streets and family life.
Topic: ${currentTopic}
Style: ${brandVoice}
Seed: ${seed}

Remember: 280 characters maximum. Be wise, be respectful, be the Don.

Return only valid JSON with the tweet content. Character count limit: 280 MAX.`
  };
}

// Generate image prompt with configurable styles and topics (generic name for scaffolding)
export function assembleImagePrompt(contentText, topics, imageStyles) {
  const currentTopic = getPromptForToday(topics);
  const seed = Date.now() % 1000;
  const styleIndex = seed % imageStyles.length;
  const selectedStyle = imageStyles[styleIndex];

  // Mafia cat topic elements mapping
  const topicElements = {
    'cats committing crime': 'heist planning, street operations, cunning strategies',
    'cats hanging out with family': 'family gatherings, respect, tradition, unity',
    'cats hanging out with friends': 'loyalty bonds, brotherhood, trust, camaraderie',
    'cats hanging out with female companion': 'romance, protection, devotion, elegance',
    'cats in business dealings': 'negotiations, handshakes, territory agreements, respect',
    'cats in leisure activities': 'cigars, fine dining, contemplation, luxury',
    'cats in contemplation': 'wisdom, reflection, philosophical moments, solitude'
  };

  const topicElement = topicElements[currentTopic] || 'mafia cat wisdom and authority';

  return `Create ${selectedStyle.style} for: "${contentText.substring(0, 100)}..."
Incorporate ${topicElement} with ${selectedStyle.mood} mood.
${selectedStyle.colors}. ${selectedStyle.composition}.
Include ${selectedStyle.elements}.
Mafia wisdom, family values, street smart. Seed: ${seed}.`;
}

// ============================================================================
// WORKER INTEGRATION
// ============================================================================

// Import masterSocial functions for worker creation
import {
  orchestrateContentAndPost,
  createWorker,
  logDebug,
  logError,
  logEnvCheck
} from '../masterSocial.js';

// Create the clientPromptFunctions object that masterSocial expects
export const MEOFIA_PROMPT_FUNCTIONS = {
  assembleContextPromptFn: assembleContextPrompt,
  assembleImagePromptFn: assembleImagePrompt
};

// Export for use by masterSocial
export {
  MEOFIA_CONFIG as clientConfig,
  STATIC_CONTENT_ARRAY as staticContentArray,
  DYNAMIC_CONTENT_ARRAY as dynamicContentArray,
  IMAGE_STYLE_ARRAY as imageStyleArray,
  MEOFIA_PROMPT_FUNCTIONS as clientPromptFunctions
};

// ============================================================================
// CLOUDFLARE WORKER EXPORT
// ============================================================================

// Export the configured worker - this makes prompt-meofia.js directly deployable
export default createWorker(
  MEOFIA_CONFIG,
  STATIC_CONTENT_ARRAY,
  DYNAMIC_CONTENT_ARRAY,
  IMAGE_STYLE_ARRAY,
  MEOFIA_PROMPT_FUNCTIONS
);
