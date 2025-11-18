import { useOnboarding } from '@/contexts/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'onboarding_complete',
  ONBOARDING_DATA: 'onboarding_data',
};

export const useOnboardingSync = () => {
  const { setOnboardingData, setOnboardingComplete } = useOnboarding();

  useEffect(() => {
    // Load onboarding state from storage when the hook is used
    const loadOnboardingState = async () => {
      try {
        const [storedOnboardingComplete, storedOnboardingData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
          AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA),
        ]);

        if (storedOnboardingComplete === 'true') {
          setOnboardingComplete(true);
          
          if (storedOnboardingData) {
            const onboardingData = JSON.parse(storedOnboardingData);
            setOnboardingData(onboardingData);
          }
        }
      } catch (error) {
        console.error('❌ Error loading onboarding state:', error);
      }
    };

    loadOnboardingState();
  }, [setOnboardingData, setOnboardingComplete]);

  const saveOnboardingCompletion = async (onboardingData: any) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(onboardingData)),
      ]);
      
      setOnboardingData(onboardingData);
      setOnboardingComplete(true);
    } catch (error) {
      console.error('❌ Error saving onboarding completion:', error);
    }
  };

  return {
    saveOnboardingCompletion,
  };
};
