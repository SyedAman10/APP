import { Config } from '@/constants/Config';
import { AIService, ChatMessage } from '@/services/AIService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useOnboarding } from './OnboardingContext';

export interface ChatSessionPreview {
  sessionId: string;
  backendSessionId?: string | null;
  title: string;
  updatedAt: string;
  summary?: string;
  messageCount: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  sessions: ChatSessionPreview[];
  isLoading: boolean;
  isCreatingSession: boolean;
  currentSessionId: string | null;
  activeSessionId: string | null;
  sessionSummary: string | null;
  sendMessage: (message: string) => Promise<void>;
  createNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  clearChat: () => void;
  isAIAvailable: boolean;
}

const CHAT_STORAGE_KEY = 'chat_sessions_v1';

interface StoredChatSession extends ChatSessionPreview {
  messages: ChatMessage[];
}

interface StoredChatPayload {
  sessions: StoredChatSession[];
  activeSessionId: string | null;
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

interface NormalizedProfileData {
  idol: string;
  personality: string;
  goals: string;
  challenges: string;
  communicationStyle: string;
  interests: string;
  values: string;
  supportNeeds: string;
}

const toText = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

const normalizeProfileData = (rawData: any): NormalizedProfileData | null => {
  if (!rawData) return null;

  let profile = rawData;
  // Backend can return nested payloads like { profile: { success, profile: {...} } }
  for (let i = 0; i < 3; i += 1) {
    if (profile?.profile) {
      profile = profile.profile;
    } else {
      break;
    }
  }

  return {
    idol: toText(profile?.idol, 'your role model'),
    personality: toText(profile?.personality, 'thoughtful'),
    goals: toText(profile?.goals, 'personal growth'),
    challenges: toText(profile?.challenges, 'daily stress'),
    communicationStyle: toText(profile?.communicationStyle, 'supportive'),
    interests: toText(profile?.interests, 'wellbeing'),
    values: toText(profile?.values, 'balance'),
    supportNeeds: toText(profile?.supportNeeds, 'encouragement'),
  };
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { onboardingData } = useOnboarding();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSessionPreview[]>([]);
  const [sessionMessages, setSessionMessages] = useState<Record<string, ChatMessage[]>>({});
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [aiService, setAIService] = useState<AIService | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const sessionsRef = React.useRef<ChatSessionPreview[]>([]);
  const sessionMessagesRef = React.useRef<Record<string, ChatMessage[]>>({});

  React.useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  React.useEffect(() => {
    sessionMessagesRef.current = sessionMessages;
  }, [sessionMessages]);

  const createLocalSessionId = React.useCallback(() => {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }, []);

  const buildSessionTitle = React.useCallback((chatMessages: ChatMessage[]): string => {
    const firstUserMessage = chatMessages.find((msg) => msg.role === 'user')?.content?.trim();
    if (!firstUserMessage) {
      return 'New Chat';
    }
    return firstUserMessage.length > 36 ? `${firstUserMessage.slice(0, 36)}...` : firstUserMessage;
  }, []);

  const persistSessions = React.useCallback(async (
    nextSessions: ChatSessionPreview[],
    nextSessionMessages: Record<string, ChatMessage[]>,
    nextActiveSessionId: string | null
  ) => {
    try {
      const payload: StoredChatPayload = {
        sessions: nextSessions.map((session) => ({
          ...session,
          messages: nextSessionMessages[session.sessionId] || [],
        })),
        activeSessionId: nextActiveSessionId,
      };
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist chat sessions:', error);
    }
  }, []);

  const upsertSession = React.useCallback((
    sessionKey: string,
    nextMessages: ChatMessage[],
    options?: {
      backendSessionId?: string | null;
      summary?: string | null;
    }
  ) => {
    const now = new Date().toISOString();
    const currentSessions = sessionsRef.current;
    const currentSessionMessages = sessionMessagesRef.current;
    const existingSession = currentSessions.find((session) => session.sessionId === sessionKey);
    const nextSummary = options?.summary ?? existingSession?.summary ?? null;
    const nextBackendSessionId = options?.backendSessionId ?? existingSession?.backendSessionId ?? null;

    const nextSession: ChatSessionPreview = {
      sessionId: sessionKey,
      backendSessionId: nextBackendSessionId,
      title: buildSessionTitle(nextMessages),
      updatedAt: now,
      summary: nextSummary || undefined,
      messageCount: nextMessages.filter((message) => message.role !== 'system').length,
    };

    const nextSessions = [
      nextSession,
      ...currentSessions.filter((session) => session.sessionId !== sessionKey),
    ];
    const nextSessionMessages = {
      ...currentSessionMessages,
      [sessionKey]: nextMessages,
    };

    sessionsRef.current = nextSessions;
    sessionMessagesRef.current = nextSessionMessages;
    setSessions(nextSessions);
    setSessionMessages(nextSessionMessages);
    setActiveSessionKey(sessionKey);
    setMessages(nextMessages);
    setCurrentSessionId(nextBackendSessionId);
    setSessionSummary(nextSummary || null);
    void persistSessions(nextSessions, nextSessionMessages, sessionKey);
  }, [buildSessionTitle, persistSessions]);

  // Initialize AI service
  React.useEffect(() => {
    try {
      const service = new AIService();
      setAIService(service);
      setIsAIAvailable(true);
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      setIsAIAvailable(false);
    }
  }, []);

  React.useEffect(() => {
    const hydrateChatSessions = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (!rawValue) {
          const initialSessionId = createLocalSessionId();
          const initialSession: ChatSessionPreview = {
            sessionId: initialSessionId,
            backendSessionId: null,
            title: 'New Chat',
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          };
          const initialSessions = [initialSession];
          const initialSessionMessages = { [initialSessionId]: [] as ChatMessage[] };
          setSessions(initialSessions);
          setSessionMessages(initialSessionMessages);
          setActiveSessionKey(initialSessionId);
          setMessages([]);
          setCurrentSessionId(null);
          setSessionSummary(null);
          void persistSessions(initialSessions, initialSessionMessages, initialSessionId);
          return;
        }

        const parsedPayload = JSON.parse(rawValue) as StoredChatPayload;
        const parsedSessions = Array.isArray(parsedPayload?.sessions) ? parsedPayload.sessions : [];

        if (parsedSessions.length === 0) {
          const fallbackSessionId = createLocalSessionId();
          const fallbackSession: ChatSessionPreview = {
            sessionId: fallbackSessionId,
            backendSessionId: null,
            title: 'New Chat',
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          };
          const fallbackSessions = [fallbackSession];
          const fallbackSessionMessages = { [fallbackSessionId]: [] as ChatMessage[] };
          setSessions(fallbackSessions);
          setSessionMessages(fallbackSessionMessages);
          setActiveSessionKey(fallbackSessionId);
          setMessages([]);
          setCurrentSessionId(null);
          setSessionSummary(null);
          void persistSessions(fallbackSessions, fallbackSessionMessages, fallbackSessionId);
          return;
        }

        const restoredSessions = parsedSessions
          .map((session) => ({
            sessionId: session.sessionId,
            backendSessionId: session.backendSessionId ?? null,
            title: session.title || 'New Chat',
            updatedAt: session.updatedAt || new Date().toISOString(),
            summary: session.summary,
            messageCount: session.messageCount ?? (Array.isArray(session.messages) ? session.messages.length : 0),
          }))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        const restoredSessionMessages: Record<string, ChatMessage[]> = {};
        parsedSessions.forEach((session) => {
          restoredSessionMessages[session.sessionId] = Array.isArray(session.messages) ? session.messages : [];
        });

        const preferredActiveId =
          parsedPayload.activeSessionId &&
          restoredSessions.some((session) => session.sessionId === parsedPayload.activeSessionId)
            ? parsedPayload.activeSessionId
            : restoredSessions[0].sessionId;

        const activeSession = restoredSessions.find((session) => session.sessionId === preferredActiveId) || restoredSessions[0];

        setSessions(restoredSessions);
        setSessionMessages(restoredSessionMessages);
        setActiveSessionKey(preferredActiveId);
        setMessages(restoredSessionMessages[preferredActiveId] || []);
        setCurrentSessionId(activeSession.backendSessionId || null);
        setSessionSummary(activeSession.summary || null);
      } catch (error) {
        console.error('Failed to hydrate chat sessions:', error);
      } finally {
        setIsHydrated(true);
      }
    };

    void hydrateChatSessions();
  }, [createLocalSessionId, persistSessions]);

  React.useEffect(() => {
    if (!activeSessionKey) return;
    const activeSession = sessions.find((session) => session.sessionId === activeSessionKey);
    setMessages(sessionMessages[activeSessionKey] || []);
    setCurrentSessionId(activeSession?.backendSessionId || null);
    setSessionSummary(activeSession?.summary || null);
  }, [activeSessionKey, sessionMessages, sessions]);

  // Generate personalized welcome message when profile data is available
  React.useEffect(() => {
    if (!isHydrated || !activeSessionKey) return;

    const profileData = normalizeProfileData(user?.profile || onboardingData);

    if (profileData && messages.length === 0) {
      const { idol, personality, goals, challenges, supportNeeds } = profileData;
      const welcomeMessage = generateIdolWelcomeMessage(idol, personality, goals, challenges, supportNeeds);
      const welcomePayload: ChatMessage[] = [{
        role: 'assistant',
        content: welcomeMessage,
      }];
      setMessages(welcomePayload);
      upsertSession(activeSessionKey, welcomePayload, {
        backendSessionId: currentSessionId,
        summary: sessionSummary,
      });

      console.log('Generated personalized welcome message in idol style:', welcomeMessage);
    } else if (!profileData && messages.length === 0) {
      const fallbackPayload: ChatMessage[] = [{
        role: 'assistant',
        content: `Hello! I'm LMN8, your AI companion, ready to help you on your journey. How can I support you today?`,
      }];
      setMessages(fallbackPayload);
      upsertSession(activeSessionKey, fallbackPayload, {
        backendSessionId: currentSessionId,
        summary: sessionSummary,
      });
    }
  }, [
    activeSessionKey,
    currentSessionId,
    isHydrated,
    messages.length,
    onboardingData,
    sessionSummary,
    upsertSession,
    user?.profile,
  ]);

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

  const sendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const sessionKey = activeSessionKey || createLocalSessionId();
    const activeSession = sessionsRef.current.find((session) => session.sessionId === sessionKey);
    const activeMessages = sessionMessagesRef.current[sessionKey] || [];
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedMessage,
    };
    const messagesWithUser = [...activeMessages, userMessage];

    upsertSession(sessionKey, messagesWithUser, {
      backendSessionId: activeSession?.backendSessionId || currentSessionId,
      summary: activeSession?.summary || sessionSummary,
    });
    setIsLoading(true);

    try {
      if (aiService && isAIAvailable) {
        const conversationHistory = activeMessages.slice(-Config.MAX_CONVERSATION_HISTORY);
        const profileData = normalizeProfileData(user?.profile || onboardingData);
        const aiResponse = await aiService.generateResponse(
          trimmedMessage,
          conversationHistory,
          {
            sessionId: activeSession?.backendSessionId || currentSessionId || undefined,
            userProfile: profileData || undefined,
            temperature: Config.DEFAULT_TEMPERATURE,
            maxTokens: Config.DEFAULT_MAX_TOKENS,
          }
        );

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: aiResponse.content,
        };

        upsertSession(sessionKey, [...messagesWithUser, assistantMessage], {
          backendSessionId: aiResponse.sessionId || activeSession?.backendSessionId || currentSessionId,
          summary: typeof aiResponse.sessionSummary === 'string'
            ? aiResponse.sessionSummary
            : activeSession?.summary || sessionSummary,
        });
      } else {
        const profileData = normalizeProfileData(user?.profile || onboardingData);
        let fallbackResponse = "I understand how you're feeling. Let's work through this together.";

        if (profileData) {
          const { idol, personality, goals, challenges, supportNeeds } = profileData;
          fallbackResponse = generateIdolFallbackResponse(idol, personality, goals, challenges, supportNeeds);
        }

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: fallbackResponse,
        };

        upsertSession(sessionKey, [...messagesWithUser, assistantMessage], {
          backendSessionId: activeSession?.backendSessionId || currentSessionId,
          summary: activeSession?.summary || sessionSummary,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);

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

      upsertSession(sessionKey, [...messagesWithUser, assistantMessage], {
        backendSessionId: activeSession?.backendSessionId || currentSessionId,
        summary: activeSession?.summary || sessionSummary,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (!activeSessionKey) return;
    upsertSession(activeSessionKey, [], {
      backendSessionId: null,
      summary: null,
    });
  };

  const createNewSession = async () => {
    setIsCreatingSession(true);
    try {
      let backendSessionId: string | null = null;
      if (user?.token && aiService && isAIAvailable) {
        backendSessionId = await aiService.createSession();
      }

      const newSessionKey = backendSessionId || createLocalSessionId();
      const now = new Date().toISOString();
      const nextSession: ChatSessionPreview = {
        sessionId: newSessionKey,
        backendSessionId,
        title: 'New Chat',
        updatedAt: now,
        messageCount: 0,
      };
      const nextSessions = [
        nextSession,
        ...sessionsRef.current.filter((session) => session.sessionId !== newSessionKey),
      ];
      const nextSessionMessages = {
        ...sessionMessagesRef.current,
        [newSessionKey]: [],
      };

      sessionsRef.current = nextSessions;
      sessionMessagesRef.current = nextSessionMessages;
      setSessions(nextSessions);
      setSessionMessages(nextSessionMessages);
      setActiveSessionKey(newSessionKey);
      setCurrentSessionId(backendSessionId);
      setSessionSummary(null);
      setMessages([]);
      void persistSessions(nextSessions, nextSessionMessages, newSessionKey);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    const selectedSession = sessionsRef.current.find((session) => session.sessionId === sessionId);
    if (!selectedSession) return;

    const nextMessages = sessionMessagesRef.current[sessionId] || [];
    setActiveSessionKey(sessionId);
    setMessages(nextMessages);
    setCurrentSessionId(selectedSession.backendSessionId || null);
    setSessionSummary(selectedSession.summary || null);
    void persistSessions(sessionsRef.current, sessionMessagesRef.current, sessionId);
  };
  const value: ChatContextType = {
    messages,
    sessions,
    isLoading,
    isCreatingSession,
    currentSessionId,
    activeSessionId: activeSessionKey,
    sessionSummary,
    sendMessage,
    createNewSession,
    loadSession,
    clearChat,
    isAIAvailable,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};



