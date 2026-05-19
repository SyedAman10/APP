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

  // Generate welcome message
  React.useEffect(() => {
    if (!isHydrated || !activeSessionKey) return;

    const profileData = normalizeProfileData(user?.profile || onboardingData);

    if (profileData && messages.length === 0) {
      const { idol } = profileData;
      const welcomeMessage = idol
        ? `Hello! I'm LMN8, inspired by ${idol}. I'm here to support and guide you on your journey. How can I be with you today?`
        : `Hello! I'm LMN8, your AI companion, ready to help you on your journey. How can I support you today?`;
      const welcomePayload: ChatMessage[] = [{
        role: 'assistant',
        content: welcomeMessage,
      }];
      setMessages(welcomePayload);
      upsertSession(activeSessionKey, welcomePayload, {
        backendSessionId: currentSessionId,
        summary: sessionSummary,
      });

      console.log('Generated welcome message:', welcomeMessage);
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

  // ====== PERSONA AGENT — handled by backend /api/chat ======
  // The backend persona agent in lmn8-backend/app/agents/persona_agent.py:
  //   1. Fetches celebrity profiles from DB
  //   2. Fetches fresh tweets  
  //   3. Generates reply using HuggingFace LLM
  //   4. Saves messages
  // It uses onboarding data (the 14 questions) to determine persona + build user context.
  // ============================================================

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
      // Build onboarding data for the persona agent from available context
      const profileData = normalizeProfileData(user?.profile || onboardingData);
      const onboardingPayload: Record<string, string> = {};
      if (profileData) {
        onboardingPayload.inspirationFigure = profileData.idol;
        onboardingPayload.inspirationQuality = profileData.personality;
        onboardingPayload.actorAuthorStyle = profileData.communicationStyle;
        onboardingPayload.spiritualPractices = profileData.values;
        onboardingPayload.primaryHope = profileData.goals;
        onboardingPayload.copingPattern = profileData.supportNeeds;
        onboardingPayload.lifeLandscape = profileData.challenges;
      }

      // Use session ID — prefer backend session, fall back to local ID
      const chatSessionId = activeSession?.backendSessionId || sessionKey;

      if (aiService && isAIAvailable) {
        const personaResult = await aiService.personaChat(
          chatSessionId,
          trimmedMessage,
          onboardingPayload,
        );

        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: personaResult.response,
        };

        upsertSession(sessionKey, [...messagesWithUser, assistantMessage], {
          backendSessionId: personaResult.sessionId || activeSession?.backendSessionId || currentSessionId,
          summary: activeSession?.summary || sessionSummary,
        });
      } else {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: "I'm LMN8, your AI companion. I'm here to support you, but I need to connect to the server first. Please try again in a moment.",
        };

        upsertSession(sessionKey, [...messagesWithUser, assistantMessage], {
          backendSessionId: activeSession?.backendSessionId || currentSessionId,
          summary: activeSession?.summary || sessionSummary,
        });
      }
    } catch (error) {
      let errorMessage = "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";

      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('AbortError')) {
          errorMessage = "I'm taking a bit longer to respond than usual. This might be due to network issues. Please try again.";
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



