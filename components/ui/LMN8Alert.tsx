import { LMN8Button } from '@/components/ui/LMN8Button';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LMN8AlertProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
  type?: 'error' | 'success' | 'warning' | 'info';
}

export function LMN8Alert({
  visible,
  title,
  message,
  confirmText = 'OK',
  onConfirm,
  onDismiss,
  type = 'error',
}: LMN8AlertProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleConfirm = () => {
    onConfirm?.();
    onDismiss?.();
  };

  const handleBackdropPress = () => {
    onDismiss?.();
  };

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          color: '#4CAF50',
          bgColor: `${LMN8Colors.accentPrimary}10`,
        };
      case 'warning':
        return {
          icon: '⚠️',
          color: '#FF9800',
          bgColor: '#FF980010',
        };
      case 'info':
        return {
          icon: 'ℹ️',
          color: '#2196F3',
          bgColor: '#2196F310',
        };
      default: // error
        return {
          icon: '❌',
          color: '#F44336',
          bgColor: '#F4433610',
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.alertCard}>
                {/* Background with gradient */}
                <LinearGradient
                  colors={[
                    LMN8Colors.container,
                    `${LMN8Colors.container}95`,
                    LMN8Colors.container,
                  ]}
                  style={StyleSheet.absoluteFill}
                />
                
                {/* Blur effect */}
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                
                {/* Content */}
                <View style={styles.content}>
                  {/* Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
                    <Text style={styles.icon}>{typeConfig.icon}</Text>
                  </View>

                  {/* Title */}
                  <Text style={styles.title}>{title}</Text>

                  {/* Message */}
                  <Text style={styles.message}>{message}</Text>

                  {/* Button */}
                  <View style={styles.buttonContainer}>
                    <LMN8Button
                      title={confirmText}
                      onPress={handleConfirm}
                      size="medium"
                      fullWidth
                      style={[
                        styles.confirmButton,
                        { borderColor: typeConfig.color }
                      ]}
                    />
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LMN8Spacing.lg,
  },

  container: {
    width: '100%',
    maxWidth: 400,
  },

  alertCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },

  content: {
    padding: LMN8Spacing.xl,
    alignItems: 'center',
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.lg,
    borderWidth: 2,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  icon: {
    fontSize: 40,
  },

  title: {
    ...LMN8Typography.h2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.md,
    letterSpacing: -0.5,
  },

  message: {
    ...LMN8Typography.body,
    fontSize: 16,
    textAlign: 'center',
    color: LMN8Colors.text85,
    lineHeight: 24,
    marginBottom: LMN8Spacing.xl,
  },

  buttonContainer: {
    width: '100%',
  },

  confirmButton: {
    borderRadius: 16,
    borderWidth: 2,
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
