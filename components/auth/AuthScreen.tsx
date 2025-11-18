import React, { useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LMN8Colors } from '@/constants/LMN8DesignSystem';
import { LoginScreen } from './LoginScreen';
import { SignupScreen } from './SignupScreen';
import { useAuth } from '@/contexts/AuthContext';

export interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const { signup, login, forgotPassword } = useAuth();

  const handleSignup = async (data: any) => {
    try {
      await signup(data);
      onAuthSuccess();
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (data: any) => {
    try {
      await login(data);
      onAuthSuccess();
    } catch (error) {
      throw error;
    }
  };

  const handleForgotPassword = async (email: string) => {
    await forgotPassword(email);
  };

  const switchToSignup = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <View style={styles.container}>
      {isLogin ? (
        <LoginScreen
          onLogin={handleLogin}
          onNavigateToSignup={switchToSignup}
          onForgotPassword={handleForgotPassword}
        />
      ) : (
        <SignupScreen
          onSignup={handleSignup}
          onNavigateToLogin={switchToLogin}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },
});
