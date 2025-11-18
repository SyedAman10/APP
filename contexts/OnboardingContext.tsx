import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface OnboardingData {
  idol: string;
  personality: string;
  goals: string;
  challenges: string;
  communicationStyle: string;
  interests: string;
  values: string;
  supportNeeds: string;
}

interface OnboardingContextType {
  onboardingData: OnboardingData | null;
  setOnboardingData: (data: OnboardingData) => void;
  clearOnboardingData: () => void;
  isOnboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [onboardingData, setOnboardingDataState] = useState<OnboardingData | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const setOnboardingData = (data: OnboardingData) => {
    setOnboardingDataState(data);
    setIsOnboardingComplete(true);
  };

  const clearOnboardingData = () => {
    setOnboardingDataState(null);
    setIsOnboardingComplete(false);
  };

  const setOnboardingComplete = (complete: boolean) => {
    setIsOnboardingComplete(complete);
  };

  const value: OnboardingContextType = {
    onboardingData,
    setOnboardingData,
    clearOnboardingData,
    isOnboardingComplete,
    setOnboardingComplete,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
