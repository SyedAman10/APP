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

export class AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatCompletion(
    messages: ChatMessage[],
    options?: Partial<ChatCompletionRequest>
  ): Promise<ChatCompletionResponse> {
    const requestBody: ChatCompletionRequest = {
      model: Config.AI_MODEL,
      messages,
      temperature: Config.DEFAULT_TEMPERATURE,
      top_p: 0.9,
      max_tokens: Config.DEFAULT_MAX_TOKENS,
      ...options,
    };

    try {
      console.log('🤖 Sending AI request with timeout:', 45000);
      const response = await aiAPI.post<ChatCompletionResponse>('/chat/completions', requestBody, {
        'Authorization': `Bearer ${this.apiKey}`,
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

      return response.data!;
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
    systemPrompt?: string
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation history
    messages.push(...conversationHistory);

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await this.chatCompletion(messages);
      
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
