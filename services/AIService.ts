import { Config } from '@/constants/Config';
import { aiAPI } from '@/services/APIService';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  user?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AIUserProfile {
  idol: string;
  personality: string;
  goals: string;
  challenges: string;
  communicationStyle: string;
  interests: string;
  values: string;
  supportNeeds: string;
}

interface BackendAIMessageRequest {
  message: string;
  conversationHistory: {
    role: 'user' | 'assistant';
    content: string;
  }[];
  userProfile?: AIUserProfile;
  temperature?: number;
  maxTokens?: number;
}

interface BackendAIMessageResponse {
  success?: boolean;
  message?: string;
  response?: string;
  data?: {
    message?: string;
    response?: string;
    choices?: {
      message?: {
        content?: string;
      };
    }[];
  };
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

export class AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(
    message: string,
    conversationHistory: ChatMessage[] = [],
    options?: {
      userProfile?: AIUserProfile;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<ChatCompletionResponse> {
    const requestBody: BackendAIMessageRequest = {
      message,
      conversationHistory: conversationHistory
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
      userProfile: options?.userProfile,
      temperature: options?.temperature ?? Config.DEFAULT_TEMPERATURE,
      maxTokens: options?.maxTokens ?? Config.DEFAULT_MAX_TOKENS,
    };

    try {
      console.log('🤖 Sending AI request with timeout:', 45000);
      const response = await aiAPI.post<BackendAIMessageResponse>('/api/backend/ai/message', requestBody, {
        'User-Agent': 'LMN8-App/1.0.0',
      });

      console.log('🤖 AI API Response received:', {
        success: response.success,
        status: response.status,
        hasData: !!response.data
      });

      if (!response.success) {
        throw new Error(response.error || `HTTP error! status: ${response.status}`);
      }

      // Support multiple backend response shapes while keeping the existing return contract.
      const content =
        response.data?.data?.message ||
        response.data?.data?.response ||
        response.data?.message ||
        response.data?.response ||
        response.data?.data?.choices?.[0]?.message?.content ||
        response.data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No response content returned from AI endpoint.');
      }

      return {
        id: response.data?.data?.choices?.[0]?.message?.content ? 'backend-openai-style' : 'backend-message',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: Config.AI_MODEL,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };
    } catch (error) {
      console.error('AI API Error:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('AI request timed out. Please try again.');
      }
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    options?: {
      userProfile?: AIUserProfile;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    try {
      const response = await this.chatCompletion(userMessage, conversationHistory, options);
      
      if (response.choices && response.choices.length > 0) {
        return response.choices[0].message.content;
      } else {
        throw new Error('No response generated');
      }
    } catch (error) {
      console.error('Generate response error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
let aiServiceInstance: AIService | null = null;

export const initializeAIService = (apiKey: string) => {
  aiServiceInstance = new AIService(apiKey);
  return aiServiceInstance;
};

export const getAIService = (): AIService => {
  if (!aiServiceInstance) {
    throw new Error('AI Service not initialized. Call initializeAIService first.');
  }
  return aiServiceInstance;
};
