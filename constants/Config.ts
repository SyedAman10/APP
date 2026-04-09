// Environment configuration
export const Config = {
  // AI API Configuration
  AI_API_KEY: process.env.EXPO_PUBLIC_AI_API_KEY || '',
  AI_API_URL: process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.openai.com/v1',
  AI_MODEL: process.env.EXPO_PUBLIC_AI_MODEL || 'gpt-4o-mini',
  
  // App Configuration
  APP_NAME: 'LMN8',
  APP_VERSION: '1.0.0',
  
  // Backend API Configuration
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://lumen8health.com',
  BACKEND_URL:
    process.env.EXPO_PUBLIC_BACKEND_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'https://5b54a16a5c98.ngrok-free.app',
  
  // Chat Configuration
  MAX_CONVERSATION_HISTORY: 10,
  DEFAULT_TEMPERATURE: 0.2,
  DEFAULT_MAX_TOKENS: 180,
};

// Validate required environment variables
export const validateConfig = () => {
  if (!Config.AI_API_KEY) {
    console.warn('AI_API_KEY is not set. AI chat functionality will be disabled.');
    return false;
  }
  return true;
};
