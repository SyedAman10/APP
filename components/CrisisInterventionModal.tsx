import { StressLevel } from '@/services/VoiceStressDetectionService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { LMN8Button } from './ui/LMN8Button';

interface CrisisInterventionModalProps {
  visible: boolean;
  stressLevel: StressLevel | null;
  onClose: () => void;
  onCallEmergency: () => void;
  onStartBreathing: () => void;
  onTalkToGuide: () => void;
}

const { width, height } = Dimensions.get('window');

export const CrisisInterventionModal: React.FC<CrisisInterventionModalProps> = ({
  visible,
  stressLevel,
  onClose,
  onCallEmergency,
  onStartBreathing,
  onTalkToGuide,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    if (visible && stressLevel?.level === 'crisis') {
      // Start pulsing animation for crisis level
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Vibrate for crisis level
      Vibration.vibrate([0, 500, 200, 500]);

      return () => pulse.stop();
    }
  }, [visible, stressLevel?.level]);

  const getStressLevelInfo = () => {
    if (!stressLevel) return { color: '#4CAF50', message: 'You seem calm', icon: 'checkmark-circle' };
    
    switch (stressLevel.level) {
      case 'mild':
        return {
          color: '#FFC107',
          message: 'I notice you might be feeling a bit tense',
          icon: 'warning',
        };
      case 'moderate':
        return {
          color: '#FF9800',
          message: 'I can sense some stress in your voice',
          icon: 'alert-circle',
        };
      case 'high':
        return {
          color: '#F44336',
          message: 'I\'m concerned about your stress levels',
          icon: 'alert',
        };
      case 'crisis':
        return {
          color: '#D32F2F',
          message: 'I\'m here to help you right now',
          icon: 'medical',
        };
      default:
        return { color: '#4CAF50', message: 'You seem calm', icon: 'checkmark-circle' };
    }
  };

  const stressInfo = getStressLevelInfo();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            stressLevel?.level === 'crisis' && {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <Ionicons
                name={stressInfo.icon as any}
                size={40}
                color={stressInfo.color}
              />
              <Text style={styles.title}>I'm Here to Help</Text>
            </View>

            <View style={styles.content}>
              <Text style={styles.message}>{stressInfo.message}</Text>
              
              {stressLevel && stressLevel.indicators.length > 0 && (
                <View style={styles.indicatorsContainer}>
                  <Text style={styles.indicatorsTitle}>What I noticed:</Text>
                  {stressLevel.indicators.map((indicator, index) => (
                    <Text key={index} style={styles.indicator}>
                      • {indicator}
                    </Text>
                  ))}
                </View>
              )}

              <Text style={styles.supportText}>
                {stressLevel?.level === 'crisis'
                  ? 'You\'re not alone. Let me help you find calm right now.'
                  : 'Would you like some support to help you feel better?'}
              </Text>
            </View>

            <View style={styles.actions}>
              {stressLevel?.level === 'crisis' && (
                <TouchableOpacity
                  style={[styles.emergencyButton, { backgroundColor: stressInfo.color }]}
                  onPress={onCallEmergency}
                >
                  <Ionicons name="call" size={20} color="white" />
                  <Text style={styles.emergencyButtonText}>Call Emergency</Text>
                </TouchableOpacity>
              )}

              <LMN8Button
                title="Start Breathing Exercise"
                onPress={onStartBreathing}
                style={styles.actionButton}
                variant="primary"
              />

              <LMN8Button
                title="Talk with Your Guide"
                onPress={onTalkToGuide}
                style={styles.actionButton}
                variant="secondary"
              />

              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onClose}
              >
                <Text style={styles.dismissText}>I'm okay, dismiss</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  gradient: {
    padding: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textAlign: 'center',
  },
  content: {
    marginBottom: 30,
  },
  message: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  indicatorsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  indicatorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  indicator: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  supportText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    gap: 12,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
});
