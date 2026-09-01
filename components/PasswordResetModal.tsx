import { LMN8Button } from '@/components/ui/LMN8Button';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { passwordResetAPI } from '@/services/APIService';
import { BlurView } from 'expo-blur';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
  View,
  TextInput
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface PasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function PasswordResetModal({ visible, onClose, userEmail }: PasswordResetModalProps) {
  const [step, setStep] = useState<'request' | 'enterOtp' | 'instructions'>('request');
  const [email, setEmail] = useState(userEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async () => {
    const targetEmail = (email || userEmail || '').trim();
    if (!targetEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await passwordResetAPI.requestPasswordReset(targetEmail);
      console.log('forgot-password response:', response);
      if (response.success) {
        setStep('enterOtp');
        Alert.alert('Reset Code Sent', `A 6-digit code was sent to ${targetEmail}. Check your inbox.`);
      } else if (response.status === 404) {
        Alert.alert('Email Not Found', 'No account exists for that email address.');
      } else if (response.status === 408 || (response.error && response.error.toLowerCase().includes('timeout'))) {
        Alert.alert(
          'Request Timed Out',
          'Network timeout while requesting the reset code. Check your connection and try again.',
          [
            { text: 'Retry', onPress: () => handleRequestReset() },
            { text: 'Cancel' }
          ]
        );
      } else {
        const serverMsg = response.error || (response.data && (response.data.message || JSON.stringify(response.data)));
        Alert.alert(
          'Password Reset Requested',
          serverMsg || 'If an account exists with this email address, you will receive a password reset code.'
        );
      }
    } catch (error: any) {
      console.error('Password reset request error:', error);
      const msg = error?.message || '';
      if (msg.toLowerCase().includes('timeout') || msg === 'Request timeout') {
        Alert.alert(
          'Request Timed Out',
          'Network timeout while requesting the reset code. Check your connection and try again.',
          [
            { text: 'Retry', onPress: () => handleRequestReset() },
            { text: 'Cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Password Reset Requested',
          msg || 'If an account exists with this email address, you will receive a password reset code.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const targetEmail = (email || userEmail || '').trim();
      const res = await passwordResetAPI.resetPasswordWithOtp(targetEmail, otp, newPassword);
      if (res.success) {
        Alert.alert('Success', 'Your password has been reset. Please log in with your new password.', [{ text: 'OK', onPress: handleClose }]);
      } else {
        Alert.alert('Error', res.error || 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Reset error:', error);
      Alert.alert('Error', 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>
                {step === 'request' 
                  ? "Enter your email to receive a 6-digit code (OTP) to reset your password."
                  : step === 'enterOtp'
                    ? 'Enter the 6-digit code sent to your email and choose a new password.'
                    : 'Check your email for the 6-digit code sent to you.'
                }
              </Text>
            </View>

            {step === 'request' ? (
               <View style={styles.requestSection}>
                 <View style={styles.emailCard}>
                   <Text style={styles.emailLabel}>Email Address</Text>
                   <View style={styles.emailDisplay}>
                     <TextInput
                       style={[styles.input, { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'transparent' }]}
                       value={email}
                       onChangeText={setEmail}
                       placeholder="you@domain.com"
                      placeholderTextColor="#000"
                       keyboardType="email-address"
                       autoCapitalize="none"
                       autoComplete="email"
                     />
                     <Text style={styles.emailNote}>Enter the email for your account</Text>
                   </View>
                 </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>What happens next?</Text>
                  <Text style={styles.infoText}>
                    • We'll email a 6-digit code (OTP) to the address you provided.{'\n'}
                    • The code expires in 15 minutes for security.{'\n'}
                    • Enter the code here and choose a new password.{'\n'}
                    • The code is single-use and will be invalidated after reset.
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <LMN8Button
                    title="Send Reset Code"
                    onPress={handleRequestReset}
                    loading={isLoading}
                    fullWidth
                    size="large"
                    style={styles.resetButton}
                  />
                  
                  <LMN8Button
                    title="Cancel"
                    onPress={handleClose}
                    variant="secondary"
                    size="medium"
                    fullWidth
                    style={styles.cancelButton}
                  />
                </View>
              </View>
            ) : step === 'enterOtp' ? (
              <View style={styles.enterOtpSection}>
                <View style={styles.emailCard}>
                  <Text style={styles.emailLabel}>Email</Text>
                  <Text style={styles.emailValue}>{email || userEmail}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.emailLabel}>Enter 6-digit code</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="123456"
                    placeholderTextColor="#000"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.emailLabel}>New password</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor="#000"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.emailLabel}>Confirm password</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor="#000"
                  />
                </View>

                <View style={styles.buttonContainer}>
                  <LMN8Button
                    title="Verify & Reset"
                    onPress={handleVerifyAndReset}
                    loading={isLoading}
                    fullWidth
                    size="large"
                    style={styles.resetButton}
                  />

                  <LMN8Button
                    title="Cancel"
                    onPress={handleClose}
                    variant="secondary"
                    size="medium"
                    fullWidth
                    style={styles.cancelButton}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.instructionsSection}>
                <View style={styles.successCard}>
                  <Text style={styles.successIcon}>📧</Text>
                  <Text style={styles.successTitle}>Email Sent!</Text>
                  <Text style={styles.successText}>
                    We've sent password reset OTP to:
                  </Text>
                   <Text style={styles.successEmail}>{email || userEmail}</Text>
                </View>

                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsTitle}>Next Steps:</Text>
                  <Text style={styles.instructionsText}>
                    1. Check your email inbox (and spam folder){'\n'}
                    2. Copy the 6-digit code from the email and enter it above{'\n'}
                    3. Enter your new password{'\n'}
                    4. Log in with your new credentials
                  </Text>
                </View>

              

                <View style={styles.buttonContainer}>
                  <LMN8Button
                    title="Got It"
                    onPress={handleClose}
                    fullWidth
                    size="large"
                    style={styles.doneButton}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },

  content: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    padding: LMN8Spacing.lg,
    paddingTop: 60, // Account for status bar
  },

  header: {
    alignItems: 'center',
    marginBottom: LMN8Spacing.xl,
    position: 'relative',
  },

  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${LMN8Colors.text60}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    fontSize: 18,
    color: LMN8Colors.text85,
    fontWeight: '600',
  },

  title: {
    ...LMN8Typography.h1,
    fontSize: 28,
    fontWeight: '800',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
    textAlign: 'center',
  },

  subtitle: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  requestSection: {
    gap: LMN8Spacing.lg,
  },

  emailCard: {
    backgroundColor: `${LMN8Colors.container}98`,
    borderRadius: 16,
    padding: LMN8Spacing.lg,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  emailLabel: {
    ...LMN8Typography.label,
    color: LMN8Colors.text60,
    fontSize: 14,
    marginBottom: LMN8Spacing.sm,
  },

  emailDisplay: {
    backgroundColor: `${LMN8Colors.text60}10`,
    borderRadius: 12,
    paddingHorizontal: LMN8Spacing.md,
    paddingVertical: LMN8Spacing.md,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    marginTop: LMN8Spacing.sm,
  },

  emailValue: {
    ...LMN8Typography.body,
    color: LMN8Colors.text100,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: LMN8Spacing.xs,
  },

  emailNote: {
    ...LMN8Typography.caption,
    color: LMN8Colors.text60,
    fontSize: 12,
    fontStyle: 'italic',
  },

  infoCard: {
    backgroundColor: `${LMN8Colors.container}60`,
    borderRadius: 12,
    padding: LMN8Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: LMN8Colors.accentPrimary,
  },

  infoTitle: {
    ...LMN8Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
  },

  infoText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    fontSize: 14,
    lineHeight: 20,
  },

  instructionsSection: {
    gap: LMN8Spacing.lg,
  },

  successCard: {
    backgroundColor: `${LMN8Colors.container}98`,
    borderRadius: 16,
    padding: LMN8Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  successIcon: {
    fontSize: 48,
    marginBottom: LMN8Spacing.md,
  },

  successTitle: {
    ...LMN8Typography.h2,
    fontSize: 24,
    fontWeight: '700',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
  },

  successText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: LMN8Spacing.sm,
  },

  successEmail: {
    ...LMN8Typography.body,
    color: LMN8Colors.accentPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  instructionsCard: {
    backgroundColor: `${LMN8Colors.container}60`,
    borderRadius: 12,
    padding: LMN8Spacing.lg,
  },

  instructionsTitle: {
    ...LMN8Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
  },

  instructionsText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    fontSize: 14,
    lineHeight: 20,
  },

  helpCard: {
    backgroundColor: `${LMN8Colors.container}40`,
    borderRadius: 12,
    padding: LMN8Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: '#ffa726',
  },

  helpTitle: {
    ...LMN8Typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffa726',
    marginBottom: LMN8Spacing.sm,
  },

  helpText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    fontSize: 14,
    lineHeight: 20,
  },

  enterOtpSection: {
    gap: LMN8Spacing.lg,
  },

  inputGroup: {
    marginBottom: LMN8Spacing.md,
  },

  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: LMN8Spacing.md,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    color: '#000000',
  },

  buttonContainer: {
    gap: LMN8Spacing.md,
    marginTop: LMN8Spacing.lg,
  },

  resetButton: {
    borderRadius: 16,
    shadowColor: LMN8Colors.accentPrimary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: `${LMN8Colors.text60}40`,
  },

  doneButton: {
    borderRadius: 16,
    shadowColor: LMN8Colors.accentPrimary,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
