import { LMN8Alert } from '@/components/ui/LMN8Alert';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';

interface VoiceStressSettingsProps {
  onToggle: (enabled: boolean) => void;
  isEnabled: boolean;
}

export const VoiceStressSettings: React.FC<VoiceStressSettingsProps> = ({
  onToggle,
  isEnabled,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const handleToggle = async (value: boolean) => {
    if (value) {
      // Show privacy explanation before enabling
      setShowAlert(true);
    } else {
      onToggle(false);
    }
  };

  const handleConfirmEnable = () => {
    setShowAlert(false);
    setIsProcessing(true);
    onToggle(true);
    setTimeout(() => setIsProcessing(false), 1000);
  };

  const handleDismiss = () => {
    setShowAlert(false);
  };

  return (
    <>
      <View style={styles.sectionCard}>
        <View style={styles.header}>
          <Ionicons name="mic" size={24} color={LMN8Colors.accentPrimary} />
          <Text style={styles.title}>Voice Stress Monitoring</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Get immediate support when you're feeling stressed or overwhelmed.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={18} color="#4ade80" />
              <Text style={styles.featureText}>
                Completely private - analysis happens on your device
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="heart" size={18} color="#f87171" />
              <Text style={styles.featureText}>
                Detects stress, shouting, and emotional distress
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={18} color="#fbbf24" />
              <Text style={styles.featureText}>
                Immediate support notifications when needed
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="medical" size={18} color={LMN8Colors.accentSecondary} />
              <Text style={styles.featureText}>
                Crisis intervention and emergency support
              </Text>
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={LMN8Colors.text60} />
            <Text style={styles.privacyText}>
              Your voice data is never stored or transmitted. All analysis is done locally on your device.
            </Text>
          </View>
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.toggleContainer}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Enable Voice Monitoring</Text>
            <Text style={styles.toggleDescription}>
              {isEnabled ? 'Monitoring active' : 'Monitoring disabled'}
            </Text>
          </View>
          
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            disabled={isProcessing}
            trackColor={{ false: LMN8Colors.text60, true: LMN8Colors.accentPrimary }}
            thumbColor="#ffffff"
          />
        </View>

        {isEnabled && (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
            <Text style={styles.statusText}>
              Voice monitoring is active and protecting your mental health
            </Text>
          </View>
        )}
      </View>
      
      <LMN8Alert
        visible={showAlert}
        title="Voice Stress Monitoring"
        message={`This feature analyzes your voice in real-time to detect stress and provide support when you need it.

🔒 Privacy: All analysis happens on your device - your voice never leaves your phone.

🎯 Purpose: To help you during difficult moments by offering immediate support.

Would you like to enable this feature?`}
        confirmText="Enable"
        onConfirm={handleConfirmEnable}
        onDismiss={handleDismiss}
        type="info"
      />
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: `${LMN8Colors.container}98`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.md,
  },
  title: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginLeft: LMN8Spacing.sm,
  },
  content: {
    paddingHorizontal: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.md,
  },
  description: {
    ...LMN8Typography.caption,
    fontSize: 14,
    color: LMN8Colors.text85,
    lineHeight: 20,
    marginBottom: LMN8Spacing.md,
  },
  featuresList: {
    marginBottom: LMN8Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: LMN8Spacing.sm,
  },
  featureText: {
    ...LMN8Typography.caption,
    fontSize: 13,
    color: LMN8Colors.text85,
    marginLeft: LMN8Spacing.sm,
    flex: 1,
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${LMN8Colors.accentPrimary}08`,
    padding: LMN8Spacing.md,
    borderRadius: 8,
  },
  privacyText: {
    ...LMN8Typography.caption,
    fontSize: 11,
    color: LMN8Colors.text60,
    marginLeft: LMN8Spacing.sm,
    flex: 1,
    lineHeight: 15,
  },
  settingDivider: {
    height: 1,
    backgroundColor: `${LMN8Colors.accentPrimary}10`,
    marginLeft: LMN8Spacing.lg,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LMN8Spacing.lg,
    paddingVertical: LMN8Spacing.md,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '500',
    color: LMN8Colors.text100,
  },
  toggleDescription: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    padding: LMN8Spacing.md,
    marginHorizontal: LMN8Spacing.lg,
    marginBottom: LMN8Spacing.md,
    borderRadius: 8,
  },
  statusText: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: '#4ade80',
    marginLeft: LMN8Spacing.sm,
    flex: 1,
  },
});
