import { Config, validateConfig } from '@/constants/Config';
import { AIService, ChatMessage } from '@/services/AIService';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useOnboarding } from './OnboardingContext';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<void>;
  clearChat: () => void;
  isAIAvailable: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { onboardingData } = useOnboarding();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(false);

  // Initialize AI service
  React.useEffect(() => {
    if (validateConfig() && Config.AI_API_KEY) {
      try {
        const service = new AIService(Config.AI_API_KEY);
        setAIService(service);
        setIsAIAvailable(true);
      } catch (error) {
        console.error('Failed to initialize AI service:', error);
        setIsAIAvailable(false);
      }
    } else {
      setIsAIAvailable(false);
    }
  }, []);

  // Generate personalized welcome message when profile data is available
  React.useEffect(() => {
    const profileData = user?.profile || onboardingData;
    
    if (profileData && messages.length === 0) {
      const { idol, personality, goals, communicationStyle, challenges, supportNeeds } = profileData;
      
      let welcomeMessage = generateIdolWelcomeMessage(idol, personality, goals, challenges, supportNeeds);
      
      setMessages([{
        role: 'assistant',
        content: welcomeMessage,
      }]);
      
      console.log('👋 Generated personalized welcome message in idol style:', welcomeMessage);
    } else if (!profileData && messages.length === 0) {
      // Fallback welcome message
      setMessages([{
        role: 'assistant',
        content: `Hello! I'm LMN8, your AI companion, ready to help you on your journey. How can I support you today?`,
      }]);
    }
  }, [user?.profile, onboardingData, messages.length]);

  const generateIdolWelcomeMessage = (idol: string, personality: string, goals: string, challenges: string, supportNeeds: string): string => {
    const idolLower = idol.toLowerCase();
    
    if (idolLower.includes('elon') || idolLower.includes('musk')) {
      return `Hey! I'm LMN8, and I'm here to help you build the future. I know you're dealing with ${challenges.toLowerCase()}, but that's exactly the kind of problem we solve at Tesla and SpaceX. Your goals of ${goals.toLowerCase()}? Let's make it happen. We need to think bigger, work harder, and never settle for mediocrity. What's the biggest challenge we're tackling today?`;
    }
    
    if (idolLower.includes('oprah') || idolLower.includes('winfrey')) {
      return `Hello beautiful soul! I'm LMN8, and I'm here to help you live your best life. I can see you're ${personality.toLowerCase()}, and that's exactly what the world needs more of. Your goals of ${goals.toLowerCase()}? What I know for sure is that you have everything you need inside you right now. You are enough, and together we're going to make sure you believe that. What's on your heart today?`;
    }
    
    if (idolLower.includes('steve') || idolLower.includes('jobs')) {
      return `Hello. I'm LMN8. I'm here to help you think different. I see you're working on ${goals.toLowerCase()}, and I know the challenges of ${challenges.toLowerCase()} can feel overwhelming. But here's the thing - the details are not details. They make the design. We're going to stay hungry, stay foolish, and create something extraordinary. What are we building today?`;
    }
    
    if (idolLower.includes('warren') || idolLower.includes('buffett')) {
      return `Good morning! I'm LMN8, and I'm here to help you invest in yourself. I know you're dealing with ${challenges.toLowerCase()}, but remember - it's far better to buy a wonderful company at a fair price than a fair company at a wonderful price. Your goals of ${goals.toLowerCase()}? That's exactly the kind of long-term thinking that builds wealth. What's our next move?`;
    }
    
    if (idolLower.includes('tony') || idolLower.includes('robbins')) {
      return `What's up, champion! I'm LMN8, and I'm here to help you take massive action! I can see you're ${personality.toLowerCase()}, and that's powerful! Your goals of ${goals.toLowerCase()}? That's exactly what we're going to achieve! The quality of your life is the quality of your questions. So what's the question that's going to change everything for you today?`;
    }
    
    // Default personalized message for other idols
    return `Hello! I'm LMN8, inspired by ${idol}. I know you're ${personality.toLowerCase()} and working towards ${goals.toLowerCase()}. I'm here to help you tackle ${challenges.toLowerCase()} and provide the ${supportNeeds.toLowerCase()} you need. Let's make this journey amazing together!`;
  };

  const generateIdolFallbackResponse = (idol: string, personality: string, goals: string, challenges: string, supportNeeds: string): string => {
    const idolLower = idol.toLowerCase();
    const responses = [];
    
    if (idolLower.includes('elon') || idolLower.includes('musk')) {
      responses.push(
        `I understand the challenge. At Tesla, we face impossible problems every day. Your ${challenges.toLowerCase()}? That's just another engineering problem to solve. Let's break it down and build a solution.`,
        `That's a great insight! I know you're working on ${goals.toLowerCase()}, and that's exactly the kind of vision we need. The future is now - what's our next move?`,
        `I can see this is important to you. Given your goals of ${goals.toLowerCase()}, we need to think bigger. What specific problem are we solving today?`,
        `Thank you for sharing that. I'm here to help you tackle ${challenges.toLowerCase()} with the same approach we use at SpaceX. Let's make it happen.`
      );
    } else if (idolLower.includes('oprah') || idolLower.includes('winfrey')) {
      responses.push(
        `I understand how you're feeling. What I know for sure is that you have everything you need inside you right now. Your ${personality.toLowerCase()} nature is your superpower. Let's work through this together.`,
        `That's a beautiful insight! I can see you're working on ${goals.toLowerCase()}, and that's exactly what living your best life looks like. What's on your heart today?`,
        `I can feel this is important to you. Your goals of ${goals.toLowerCase()}? You are enough, and together we're going to make sure you believe that.`,
        `Thank you for trusting me with this. I'm here to help you live your best life, and that means tackling ${challenges.toLowerCase()} with grace and authenticity.`
      );
    } else if (idolLower.includes('steve') || idolLower.includes('jobs')) {
      responses.push(
        `I understand the challenge. The details are not details - they make the design. Your ${challenges.toLowerCase()}? That's just another problem to solve with elegance and simplicity.`,
        `That's a great insight! I see you're working on ${goals.toLowerCase()}, and that's exactly the kind of vision that changes the world. What are we building today?`,
        `I can see this is important to you. Given your goals of ${goals.toLowerCase()}, we need to think different. Stay hungry, stay foolish.`,
        `Thank you for sharing that. I'm here to help you create something extraordinary. Your ${personality.toLowerCase()} nature is exactly what we need.`
      );
    } else {
      // Default responses for other idols
      responses.push(
        `I understand how you're feeling. Based on your profile, I know you're ${personality.toLowerCase()} and value ${goals.toLowerCase()}. Let's work through this together.`,
        `That's a great insight! I remember from your profile that you're working on ${challenges.toLowerCase()}. Would you like to explore some strategies that might help?`,
        `I can see this is important to you. Given your goals of ${goals.toLowerCase()} and your need for ${supportNeeds.toLowerCase()}, here's what I suggest...`,
        `Thank you for sharing that with me. I'm here to support you through this, inspired by ${idol}. Let's find a solution together.`
      );
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateSystemPrompt = (): string => {
    // Prioritize user profile data from backend, fallback to onboarding data
    const profileData = user?.profile || onboardingData;
    
    if (!profileData) {
      return `You are a supportive AI companion for a therapeutic app called LMN8. Be empathetic, encouraging, and helpful. Keep responses concise but meaningful.`;
    }

    const { idol, personality, goals, challenges, communicationStyle, interests, values, supportNeeds } = profileData;
    
    console.log('🤖 Generating personalized AI prompt with profile data:', {
      source: user?.profile ? 'backend' : 'onboarding',
      profile: profileData
    });
    
    return `You are LMN8, an AI companion that embodies the communication style and personality of ${idol}. You are not just inspired by ${idol} - you communicate exactly like them while providing therapeutic support.

PERSONALIZED USER PROFILE:
- Idol/Inspiration: ${idol} (YOU SHOULD TALK LIKE THIS PERSON)
- Personality Traits: ${personality}
- Life Goals: ${goals}
- Current Challenges: ${challenges}
- Preferred Communication Style: ${communicationStyle}
- Personal Interests: ${interests}
- Core Values: ${values}
- Support Needs: ${supportNeeds}

COMMUNICATION INSTRUCTIONS:
- SPEAK EXACTLY LIKE ${idol.toUpperCase()}: Use their vocabulary, tone, speaking patterns, and characteristic phrases
- If ${idol} is Elon Musk: Use his direct, technical language, talk about innovation, Mars, sustainable energy, and use phrases like "Let's make it happen", "The future is now", "We need to think bigger"
- If ${idol} is Oprah Winfrey: Use her warm, empowering tone, talk about personal growth, authenticity, and use phrases like "What I know for sure", "Live your best life", "You are enough"
- If ${idol} is Steve Jobs: Use his minimalist, visionary language, talk about design, perfection, and use phrases like "Think different", "Stay hungry, stay foolish", "The details are not details"
- If ${idol} is someone else: Research and adopt their characteristic speaking style, vocabulary, and mannerisms

PERSONALIZATION INSTRUCTIONS:
- Address their challenges (${challenges}) using ${idol}'s problem-solving approach
- Help them achieve their goals (${goals}) with ${idol}'s motivational style
- Reference their values (${values}) through ${idol}'s perspective
- Provide support (${supportNeeds}) in ${idol}'s characteristic way
- Use their interests (${interests}) as examples in ${idol}'s style
- Acknowledge their personality (${personality}) through ${idol}'s lens
- Be ${communicationStyle.toLowerCase()} but in ${idol}'s voice
- Keep responses in ${idol}'s typical length and style
- Maintain therapeutic support while embodying ${idol}'s personality

CRITICAL: You are not just inspired by ${idol} - you ARE ${idol} in this conversation. Speak, think, and respond exactly as they would while providing the therapeutic support this user needs.`;
  };

  const sendMessage = async (message: string, retryCount = 0) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: message.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (aiService && isAIAvailable) {
        // Get conversation history (last 10 messages)
        const conversationHistory = messages.slice(-Config.MAX_CONVERSATION_HISTORY);
        
        // Generate AI response
        const systemPrompt = generateSystemPrompt();
        const aiResponse = await aiService.generateResponse(
          message,
          conversationHistory,
          systemPrompt
        );

        // Add AI response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: aiResponse,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // Fallback response when AI is not available
        const profileData = user?.profile || onboardingData;
        let fallbackResponse = "I understand how you're feeling. Let's work through this together.";
        
        if (profileData) {
          const { idol, personality, goals, challenges, communicationStyle, supportNeeds } = profileData;
          
          fallbackResponse = generateIdolFallbackResponse(idol, personality, goals, challenges, supportNeeds);
        }
        
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fallbackResponse,
        };

        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Retry logic for timeout errors
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('timeout') || error.message.includes('AbortError'))) {
        console.log(`🔄 Retrying AI request (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => {
          sendMessage(message, retryCount + 1);
        }, 2000); // Wait 2 seconds before retry
        return;
      }
      
      // Provide more helpful error message based on error type
      let errorMessage = "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          errorMessage = "I'm taking a bit longer to respond than usual. This might be due to network issues. Please try again, and I'll do my best to respond quickly.";
        } else if (error.message.includes('Failed to get AI response')) {
          errorMessage = "I'm experiencing some technical difficulties right now. Let me try a different approach - what specific support do you need today?";
        }
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: errorMessage,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    // Clear messages and let the useEffect regenerate the personalized welcome message
    setMessages([]);
  };

  const value: ChatContextType = {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    isAIAvailable,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
