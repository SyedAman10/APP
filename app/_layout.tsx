import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { LMN8SplashScreen } from '@/components/ui/LMN8SplashScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { DatabaseProvider } from '@/contexts/DatabaseContext';
import { HealthKitProvider } from '@/contexts/HealthKitContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { VoiceStressProvider } from '@/contexts/VoiceStressContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // Using system fonts for now - no additional font loading needed
  });

  if (!loaded) {
    return <LMN8SplashScreen />;
  }

  return (
    <DatabaseProvider>
      <AuthProvider>
        <OnboardingProvider>
          <HealthKitProvider>
            <VoiceStressProvider>
              <ChatProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                  <Stack>
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="login" options={{ headerShown: false }} />
                    <Stack.Screen name="signup" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding-selection" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding-full" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding-fast" options={{ headerShown: false }} />
                    <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                    <Stack.Screen name="(main)" options={{ headerShown: false }} />
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="+not-found" />
                  </Stack>
                  <StatusBar style="auto" />
                </ThemeProvider>
              </ChatProvider>
            </VoiceStressProvider>
          </HealthKitProvider>
        </OnboardingProvider>
      </AuthProvider>
    </DatabaseProvider>
  );
}
