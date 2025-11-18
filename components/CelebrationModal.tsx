import { LMN8Button } from '@/components/ui/LMN8Button';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

interface CelebrationModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: string[];
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  title,
  message,
  icon,
  color,
  gradient,
  onClose,
}) => {
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti elements */}
        <View style={styles.confettiContainer}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: i % 3 === 0 ? color : i % 3 === 1 ? LMN8Colors.accentPrimary : LMN8Colors.accentSecondary,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                },
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[`${LMN8Colors.container}98`, `${LMN8Colors.container}95`]}
            style={styles.modalContent}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Badge */}
            <LinearGradient
              colors={gradient as any}
              style={styles.badgeContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={icon as any} size={64} color="#fff" />
            </LinearGradient>

            {/* Sparkle effect */}
            <View style={styles.sparkleContainer}>
              <Ionicons name="sparkles" size={32} color={color} style={styles.sparkle1} />
              <Ionicons name="sparkles" size={24} color={LMN8Colors.accentSecondary} style={styles.sparkle2} />
              <Ionicons name="sparkles" size={28} color={LMN8Colors.accentPrimary} style={styles.sparkle3} />
            </View>

            {/* Content */}
            <View style={styles.textContainer}>
              <Text style={styles.celebrationEmoji}>🎉</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
            </View>

            {/* Close button */}
            <LMN8Button
              title="Continue Journey"
              onPress={onClose}
              size="large"
              fullWidth
            />
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: LMN8Spacing.xl,
  },

  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },

  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },

  modalContent: {
    borderRadius: 24,
    padding: LMN8Spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}30`,
  },

  badgeContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.xl,
    shadowColor: LMN8Colors.accentPrimary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },

  sparkle1: {
    position: 'absolute',
    top: 60,
    right: 40,
    opacity: 0.8,
  },

  sparkle2: {
    position: 'absolute',
    top: 40,
    left: 50,
    opacity: 0.6,
  },

  sparkle3: {
    position: 'absolute',
    bottom: 180,
    right: 60,
    opacity: 0.7,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: LMN8Spacing.xl,
  },

  celebrationEmoji: {
    fontSize: 48,
    marginBottom: LMN8Spacing.md,
  },

  title: {
    ...LMN8Typography.h2,
    fontSize: 28,
    fontWeight: '700',
    color: LMN8Colors.text100,
    textAlign: 'center',
    marginBottom: LMN8Spacing.sm,
  },

  message: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '300',
    color: LMN8Colors.text85,
    textAlign: 'center',
    lineHeight: 24,
  },
});

