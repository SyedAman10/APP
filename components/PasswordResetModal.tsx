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
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface PasswordResetModalProps {
  visible: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function PasswordResetModal({ visible, onClose, userEmail }: PasswordResetModalProps) {
  const [step, setStep] = useState<'request' | 'instructions'>('request');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'No email address found. Please contact support.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await passwordResetAPI.requestPasswordReset(userEmail);
      
      if (response.success) {
        setStep('instructions');
      } else {
        Alert.alert(
          'Password Reset Requested',
          'If an account exists with this email address, you will receive password reset instructions shortly.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      Alert.alert(
        'Password Reset Requested',
        'If an account exists with this email address, you will receive password reset instructions shortly.',
        [{ text: 'OK', onPress: onClose }]
      );
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
                  ? 'We\'ll send you a secure link to reset your password'
                  : 'Check your email for reset instructions'
                }
              </Text>
            </View>

             {step === 'request' ? (
               <View style={styles.requestSection}>
                 <View style={styles.emailCard}>
                   <Text style={styles.emailLabel}>Email Address</Text>
                   <View style={styles.emailDisplay}>
                     <Text style={styles.emailValue}>{userEmail}</Text>
                     <Text style={styles.emailNote}>This is your registered email address</Text>
                   </View>
                 </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoTitle}>What happens next?</Text>
                  <Text style={styles.infoText}>
                    • You'll receive an email with a secure reset link{'\n'}
                    • The link expires in 1 hour for security{'\n'}
                    • Click the link to set a new password{'\n'}
                    • You can then log in with your new password
                  </Text>
                </View>

                <View style={styles.buttonContainer}>
                  <LMN8Button
                    title="Send Reset Email"
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
            ) : (
              <View style={styles.instructionsSection}>
                <View style={styles.successCard}>
                  <Text style={styles.successIcon}>📧</Text>
                  <Text style={styles.successTitle}>Email Sent!</Text>
                  <Text style={styles.successText}>
                    We've sent password reset instructions to:
                  </Text>
                   <Text style={styles.successEmail}>{userEmail}</Text>
                </View>

                <View style={styles.instructionsCard}>
                  <Text style={styles.instructionsTitle}>Next Steps:</Text>
                  <Text style={styles.instructionsText}>
                    1. Check your email inbox (and spam folder){'\n'}
                    2. Click the "Reset Password" button in the email{'\n'}
                    3. Enter your new password{'\n'}
                    4. Log in with your new credentials
                  </Text>
                </View>

                <View style={styles.helpCard}>
                  <Text style={styles.helpTitle}>Need Help?</Text>
                  <Text style={styles.helpText}>
                    • Check your spam/junk folder{'\n'}
                    • The link expires in 1 hour{'\n'}
                    • Contact support if you don't receive the email
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
