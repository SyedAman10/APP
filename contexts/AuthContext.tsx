import { Config } from '@/constants/Config';
import { api, profileAPI } from '@/services/APIService';
import { databaseService } from '@/services/DatabaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useDatabase } from './DatabaseContext';

export interface User {
  id: string;
  email: string;
  fullName: string;
  dateOfBirth?: string;
  therapeuticGoals?: string;
  diagnosis?: string;
  createdAt: string;
  profile?: any;
  token?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<{ isOnboardingComplete: boolean }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
}

interface SignupData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth?: string;
  therapeuticGoals?: string;
}

interface LoginData {
  email: string;
  password: string;
}

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  ONBOARDING_DATA: 'onboarding_data',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const { isInitialized: isDatabaseInitialized } = useDatabase();

  useEffect(() => {
    // Only check auth status after database is initialized
    if (isDatabaseInitialized) {
      checkAuthStatus();
    }
  }, [isDatabaseInitialized]);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      // Load stored user data and token
      const [storedToken, storedUserData, storedOnboardingComplete, storedOnboardingData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA),
      ]);

      if (storedToken && storedUserData) {
        console.log('✅ Found stored authentication data');
        
        const userData = JSON.parse(storedUserData);
        const user: User = {
          ...userData,
          token: storedToken,
        };
        
        // Set the auth token in the API service for authenticated requests
        api.setAuthToken(storedToken);
        console.log('🔑 Auth token restored in API service');
        
        setUser(user);
        
        // Set onboarding state
        const onboardingComplete = storedOnboardingComplete === 'true';
        setIsOnboardingComplete(onboardingComplete);
        
        // Check if profile exists and onboarding is complete
        try {
          console.log('📖 Checking user profile in checkAuthStatus...');
          const profileResponse = await profileAPI.getProfile();
          
          if (profileResponse.success && profileResponse.data) {
            console.log('✅ Profile found in checkAuthStatus:', profileResponse.data);
            
            // Check if onboarding is completed based on profile data
            // Profile exists and has onboarding fields means onboarding is complete
            const profile = profileResponse.data.profile;
            const hasOnboardingData = profile && (
              profile.goals || 
              profile.challenges || 
              profile.interests || 
              profile.personality ||
              profile.values ||
              profile.communicationStyle ||
              profile.supportNeeds
            );
            
            if (hasOnboardingData) {
              console.log('✅ Onboarding already completed in checkAuthStatus');
              setIsOnboardingComplete(true);
              setUser(prevUser => prevUser ? { 
                ...prevUser, 
                profile: profileResponse.data 
              } : null);
              await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
            } else if (!onboardingComplete) {
              // Only set false if local storage also says incomplete
              console.log('ℹ️ Onboarding not completed yet in checkAuthStatus');
              setIsOnboardingComplete(false);
            }
          } else if (!onboardingComplete) {
            console.log('ℹ️ No profile found in checkAuthStatus - onboarding required');
            setIsOnboardingComplete(false);
          }
        } catch (profileError) {
          console.error('❌ Error checking profile in checkAuthStatus:', profileError);
          // Continue without profile data
        }
      } else {
        console.log('ℹ️ No stored authentication data found');
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error('❌ Failed to check auth status:', error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    try {
      // Create a new patient record
      const newPatient = await databaseService.createPatient({
        name: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        therapeuticGoals: data.therapeuticGoals,
      });

      // Set the user as authenticated
      const newUser: User = {
        id: newPatient.id,
        email: data.email,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        therapeuticGoals: data.therapeuticGoals,
        createdAt: newPatient.createdAt,
        };
      setUser(newUser);
    } catch (error) {
      console.error('Signup failed:', error);
      throw new Error('Failed to create account');
    }
  };

  const login = async (data: LoginData): Promise<{ isOnboardingComplete: boolean }> => {
    try {
      // Log the API configuration for debugging
      console.log('🔗 API Configuration:');
      console.log('Base URL:', Config.API_BASE_URL);
      console.log('Full Login URL:', `${Config.API_BASE_URL}/api/patient-auth/login`);
      console.log('Environment Variable:', process.env.EXPO_PUBLIC_API_BASE_URL || 'Not set (using default)');
      console.log('Login Data:', { username: data.email, password: '***' });
      
      // Call the API endpoint using centralized API service
      const response = await api.post('/api/patient-auth/login', {
        username: data.email,  // Using email as username
        password: data.password
      });

      if (!response.success) {
        // Always show user-friendly error message for authentication failures
        throw new Error('Invalid email and password');
      }

      const apiData = response.data;
      
      // Check if token exists in the response
      if (!apiData.token) {
        console.error('❌ No token in API response:', apiData);
        throw new Error('Invalid server response: missing token');
      }
      
      console.log('✅ Token received from API');
      
      // Create user object from API response based on your new structure
      const user: User = {
        id: apiData.patient?.id || apiData.user?.id || Date.now().toString(),
        email: apiData.patient?.email || data.email,
        fullName: apiData.patient?.name || 'User',
        dateOfBirth: apiData.patient?.dateOfBirth,
        therapeuticGoals: apiData.patient?.therapeuticGoals,
        diagnosis: apiData.patient?.diagnosis,
        createdAt: apiData.patient?.createdAt || new Date().toISOString(),
        token: apiData.token,
        username: apiData.user?.username,
      };

      console.log('💾 Saving token to AsyncStorage...');
      
      // Save user data and token to storage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, apiData.token),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          dateOfBirth: user.dateOfBirth,
          therapeuticGoals: user.therapeuticGoals,
          diagnosis: user.diagnosis,
          createdAt: user.createdAt,
          username: user.username,
        })),
      ]);
      
      console.log('✅ Token saved successfully');
      
      // Set the auth token in the API service for authenticated requests
      api.setAuthToken(apiData.token);
      console.log('🔑 Auth token set in API service');

      setUser(user);
      
      // Check if we already have onboarding stored locally
      const storedOnboarding = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      const locallyComplete = storedOnboarding === 'true';

      // Load user profile data and check onboarding status
      try {
        console.log('📖 Loading user profile...');
        const profileResponse = await profileAPI.getProfile();
        
        if (profileResponse.success && profileResponse.data) {
          console.log('✅ Profile loaded successfully:', profileResponse.data);
          
          const profile = profileResponse.data.profile;
          const hasOnboardingData = profile && (
            profile.goals || 
            profile.challenges || 
            profile.interests || 
            profile.personality ||
            profile.values ||
            profile.communicationStyle ||
            profile.supportNeeds
          );
          
          if (hasOnboardingData) {
            console.log('✅ Onboarding already completed');
            setIsOnboardingComplete(true);
            setUser(prevUser => prevUser ? { 
              ...prevUser, 
              profile: profileResponse.data 
            } : null);
            await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
            return { isOnboardingComplete: true };
          }
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
      }

      // Fallback: trust local storage if backend check failed
      if (locallyComplete) {
        console.log('ℹ️ Using locally stored onboarding completion');
        setIsOnboardingComplete(true);
        return { isOnboardingComplete: true };
      }

      console.log('ℹ️ Onboarding not completed yet');
      setIsOnboardingComplete(false);
      return { isOnboardingComplete: false };
    } catch (error) {
      console.error('Login failed:', error);
      // Always show user-friendly error message for security
      throw new Error('Invalid email and password');
    }
  };

  const logout = async () => {
    try {
      // Clear all stored data
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_DATA),
      ]);
      
      // Clear auth token from API service
      api.clearAuthToken();
      console.log('🔑 Auth token cleared from API service');
      
      // Clear state
      setUser(null);
      setIsOnboardingComplete(false);
      
      console.log('✅ Logout successful - all data cleared');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Still clear state and API token even if storage clear fails
      api.clearAuthToken();
      setUser(null);
      setIsOnboardingComplete(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      // In a real app, you'd send a password reset email
      // For now, we'll just show an alert
      Alert.alert(
        'Password Reset',
        `A password reset link would be sent to ${email} in a real application.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw new Error('Failed to process password reset');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || !isDatabaseInitialized, // Show loading until database is ready
    isOnboardingComplete,
    signup,
    login,
    logout,
    forgotPassword,
  };

  // Debug log for state changes
  console.log('🔍 AuthContext state:', {
    isAuthenticated: !!user,
    isOnboardingComplete,
    isLoading,
    hasUser: !!user
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
