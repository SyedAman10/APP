import { AIVoiceStressDetectionService, StressLevel } from '@/services/AIVoiceStressDetectionService';
import React, { createContext, ReactNode, useContext, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';

interface VoiceStressContextType {
  isMonitoring: boolean;
  isEnabled: boolean;
  currentStressLevel: StressLevel | null;
  showCrisisModal: boolean;
  enableMonitoring: () => Promise<void>;
  disableMonitoring: () => void;
  dismissCrisisModal: () => void;
  callEmergency: () => void;
  startBreathingExercise: () => void;
  talkToGuide: () => void;
}

const VoiceStressContext = createContext<VoiceStressContextType | undefined>(undefined);

export const useVoiceStress = () => {
  const context = useContext(VoiceStressContext);
  if (context === undefined) {
    throw new Error('useVoiceStress must be used within a VoiceStressProvider');
  }
  return context;
};

interface VoiceStressProviderProps {
  children: ReactNode;
}

export const VoiceStressProvider: React.FC<VoiceStressProviderProps> = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentStressLevel, setCurrentStressLevel] = useState<StressLevel | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  
  const voiceServiceRef = useRef<AIVoiceStressDetectionService | null>(null);

  const handleStressDetected = (stressLevel: StressLevel) => {
    console.log('🚨 Stress detected:', stressLevel);
    setCurrentStressLevel(stressLevel);
    
    // Show intervention modal for moderate stress and above
    if (stressLevel.level !== 'calm' && stressLevel.level !== 'mild') {
      setShowCrisisModal(true);
    }
    
    // For crisis level, show immediate alert
    if (stressLevel.level === 'crisis') {
      Alert.alert(
        'Crisis Support Available',
        'I\'m here to help you right now. You\'re not alone.',
        [
          {
            text: 'Get Help Now',
            onPress: () => setShowCrisisModal(true),
            style: 'default',
          },
          {
            text: 'I\'m Okay',
            onPress: () => setShowCrisisModal(false),
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleError = (error: string) => {
    console.error('Voice stress detection error:', error);
    Alert.alert('Voice Monitoring Error', error);
  };

  const enableMonitoring = async () => {
    try {
      if (!voiceServiceRef.current) {
        voiceServiceRef.current = new AIVoiceStressDetectionService(
          handleStressDetected,
          handleError
        );
      }

      const success = await voiceServiceRef.current.startMonitoring();
      if (success) {
        setIsMonitoring(true);
        setIsEnabled(true);
        console.log('✅ Voice stress monitoring enabled');
      } else {
        throw new Error('Failed to start voice monitoring');
      }
    } catch (error) {
      console.error('Error enabling voice monitoring:', error);
      Alert.alert(
        'Setup Error',
        'Unable to start voice monitoring. Please check your microphone permissions and try again.'
      );
    }
  };

  const disableMonitoring = async () => {
    try {
      if (voiceServiceRef.current) {
        await voiceServiceRef.current.stopMonitoring();
        voiceServiceRef.current = null;
      }
      
      setIsMonitoring(false);
      setIsEnabled(false);
      setCurrentStressLevel(null);
      setShowCrisisModal(false);
      
      console.log('❌ Voice stress monitoring disabled');
    } catch (error) {
      console.error('Error disabling voice monitoring:', error);
    }
  };

  const dismissCrisisModal = () => {
    setShowCrisisModal(false);
    setCurrentStressLevel(null);
  };

  const callEmergency = () => {
    Alert.alert(
      'Emergency Support',
      'Would you like to call emergency services or a crisis helpline?',
      [
        {
          text: 'Call 911',
          onPress: () => Linking.openURL('tel:911'),
          style: 'destructive',
        },
        {
          text: 'Crisis Text Line',
          onPress: () => Linking.openURL('sms:741741'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const startBreathingExercise = () => {
    // Navigate to breathing exercise screen
    // This would typically use navigation
    Alert.alert(
      'Breathing Exercise',
      'Let\'s start a calming breathing exercise together.',
      [
        {
          text: 'Start Now',
          onPress: () => {
            setShowCrisisModal(false);
            // Navigate to breathing exercise
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const talkToGuide = () => {
    // Navigate to chat screen
    Alert.alert(
      'Talk with Your Guide',
      'Your AI guide is ready to help you through this moment.',
      [
        {
          text: 'Start Chat',
          onPress: () => {
            setShowCrisisModal(false);
            // Navigate to chat screen
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const value: VoiceStressContextType = {
    isMonitoring,
    isEnabled,
    currentStressLevel,
    showCrisisModal,
    enableMonitoring,
    disableMonitoring,
    dismissCrisisModal,
    callEmergency,
    startBreathingExercise,
    talkToGuide,
  };

  return (
    <VoiceStressContext.Provider value={value}>
      {children}
    </VoiceStressContext.Provider>
  );
};
