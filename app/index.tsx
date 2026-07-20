import { LMN8Colors, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useDatabase } from '@/contexts/DatabaseContext';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function IndexPage() {
  const { isAuthenticated, isLoading: isAuthLoading, isOnboardingComplete } = useAuth();
  const { isInitialized: isDatabaseInitialized } = useDatabase();
  const hasNavigatedRef = useRef(false);

  // Log every state change
  console.log('🎯 [INDEX PAGE] Current state:', {
    isAuthenticated,
    isAuthLoading,
    isOnboardingComplete,
    isDatabaseInitialized,
    hasNavigated: hasNavigatedRef.current,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log('🔄 [INDEX PAGE] useEffect triggered with:', {
      isAuthenticated,
      isAuthLoading,
      isOnboardingComplete,
      isDatabaseInitialized,
      hasNavigated: hasNavigatedRef.current
    });

    // Only attempt navigation when both auth and database are ready
    // AND we haven't navigated yet (prevent multiple redirects)
    if (!isAuthLoading && isDatabaseInitialized && !hasNavigatedRef.current) {
      console.log('🔍 [INDEX PAGE] ✅ All conditions met for navigation:', {
        isAuthenticated,
        isOnboardingComplete,
        isAuthLoading,
        isDatabaseInitialized,
        hasNavigated: hasNavigatedRef.current
      });
      
      // Mark that we're about to navigate to prevent multiple navigation attempts
      console.log('🔒 [INDEX PAGE] Setting hasNavigated to true');
      hasNavigatedRef.current = true;
      
      if (isAuthenticated) {
        if (isOnboardingComplete) {
          // User is authenticated and onboarding is complete, redirect to main app
          console.log('✅ [INDEX PAGE] User authenticated and onboarding complete - redirecting to tabs');
          console.log('🚀 [INDEX PAGE] Executing router.replace("/(tabs)")');
          router.replace('/(tabs)');
        } else {
          // User is authenticated but onboarding is not complete, redirect to onboarding selection
          console.log('✅ [INDEX PAGE] User authenticated but onboarding not complete - redirecting to onboarding selection');
          console.log('🚀 [INDEX PAGE] Executing router.replace("/onboarding-selection")');
          router.replace('/onboarding-selection');
        }
      } else {
        // User is not authenticated, redirect to login
        console.log('ℹ️ [INDEX PAGE] User not authenticated - redirecting to login');
        console.log('🚀 [INDEX PAGE] Executing router.replace("/login")');
        router.replace('/login');
      }
    } else {
      console.log('⏳ [INDEX PAGE] Waiting for conditions:', {
        isAuthLoading: isAuthLoading ? '❌ Still loading' : '✅ Not loading',
        isDatabaseInitialized: isDatabaseInitialized ? '✅ Initialized' : '❌ Not initialized',
        hasNavigated: hasNavigatedRef.current ? '✅ Already navigated' : '❌ Not navigated yet',
        conclusion: !isAuthLoading && isDatabaseInitialized && !hasNavigatedRef.current ? 'SHOULD NAVIGATE' : 'WAITING'
      });
    }
  }, [isAuthenticated, isAuthLoading, isDatabaseInitialized, isOnboardingComplete]);

  // Show loading while determining authentication status or waiting for database
  if (isAuthLoading || !isDatabaseInitialized) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Initializing METAT8...</Text>
          <Text style={styles.subText}>
            {!isDatabaseInitialized ? 'Setting up database...' : 'Checking authentication...'}
          </Text>
        </View>
      </View>
    );
  }

  // This should never be reached, but just in case
  return (
    <View style={styles.container}>
      <View style={styles.loadingContent}>
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    ...LMN8Typography.h2,
    color: LMN8Colors.accentPrimary,
    marginBottom: 10,
  },
  subText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text60,
    textAlign: 'center',
  },
});
