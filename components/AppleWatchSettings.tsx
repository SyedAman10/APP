import { LMN8Alert } from '@/components/ui/LMN8Alert';
import { LMN8Button } from '@/components/ui/LMN8Button';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { useHealthKit } from '@/contexts/HealthKitContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

export const AppleWatchSettings: React.FC = () => {
  const {
    isEnabled,
    isLoading,
    healthSummary,
    lastSyncTime,
    enableHealthKit,
    disableHealthKit,
    syncNow,
    deleteAllData,
  } = useHealthKit();

  const [showEnableAlert, setShowEnableAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get platform-specific titles
  const getTitle = () => {
    if (Platform.OS === 'ios') return 'Apple Watch Integration';
    if (Platform.OS === 'android') return 'Health Connect Integration';
    return 'Health Tracking';
  };

  const getIcon = () => {
    if (Platform.OS === 'ios') return 'watch' as const;
    return 'fitness' as const;
  };

  const getSource = () => {
    if (Platform.OS === 'ios') return 'Apple Watch and iPhone';
    return 'Android Watch and Phone';
  };

  const handleToggle = async (value: boolean) => {
    if (value) {
      setShowEnableAlert(true);
    } else {
      await disableHealthKit();
    }
  };

  const handleConfirmEnable = async () => {
    setShowEnableAlert(false);
    const success = await enableHealthKit();
    if (!success) {
      // Show user-friendly error message
      alert(
        Platform.OS === 'ios' 
          ? 'Unable to connect to Apple Health. Please make sure you have granted all permissions.' 
          : 'Unable to connect to Health Connect. Please make sure Health Connect is installed and you have granted permissions.\n\nNote: Health Connect requires Android 14+ or the Health Connect app from Play Store.'
      );
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    await syncNow();
    setIsSyncing(false);
  };

  const handleDeleteData = async () => {
    setShowDeleteAlert(false);
    await deleteAllData();
  };

  const formatLastSync = (): string => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <>
       <View style={styles.sectionCard}>
        <View style={styles.header}>
          <Ionicons name={getIcon()} size={24} color={LMN8Colors.accentPrimary} />
          <Text style={styles.title}>{getTitle()}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            Connect your {Platform.OS === 'ios' ? 'Apple Watch' : 'Android watch'} to track health metrics that help understand your mental wellness.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={18} color="#ef4444" />
              <Text style={styles.featureText}>
                Heart rate & Heart Rate Variability (HRV) monitoring
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="footsteps" size={18} color="#8b5cf6" />
              <Text style={styles.featureText}>
                Activity & steps tracking for wellness insights
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="moon" size={18} color="#3b82f6" />
              <Text style={styles.featureText}>
                Sleep quality analysis
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="fitness" size={18} color="#10b981" />
              <Text style={styles.featureText}>
                Mindful minutes & stress indicators
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={18} color="#f59e0b" />
              <Text style={styles.featureText}>
                AI-powered trends & therapeutic insights
              </Text>
            </View>
          </View>

          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed" size={16} color={LMN8Colors.text60} />
            <Text style={styles.privacyText}>
              Your health data is encrypted and only shared with your care team. You can delete it anytime.
            </Text>
          </View>
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.toggleContainer}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Enable Apple Health Sync</Text>
            <Text style={styles.toggleDescription}>
              {isEnabled ? 'Syncing active' : 'Sync disabled'}
            </Text>
          </View>
          
          <Switch
            value={isEnabled}
            onValueChange={handleToggle}
            disabled={isLoading}
            trackColor={{ false: LMN8Colors.text60, true: LMN8Colors.accentPrimary }}
            thumbColor="#ffffff"
          />
        </View>

        {isEnabled && (
          <>
             {/* Status Section */}
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" />
              <Text style={styles.statusText}>
                {Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} connected successfully
              </Text>
            </View>

            {/* Health Summary */}
            {healthSummary && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Recent Health Insights</Text>
                
                <View style={styles.summaryGrid}>
                  {healthSummary.heartRate && (
                    <View style={styles.summaryCard}>
                      <Ionicons name="heart" size={20} color="#ef4444" />
                      <Text style={styles.summaryValue}>
                        {Math.round(healthSummary.heartRate.average)} bpm
                      </Text>
                      <Text style={styles.summaryLabel}>Avg Heart Rate</Text>
                    </View>
                  )}

                  {healthSummary.hrv && (
                    <View style={styles.summaryCard}>
                      <Ionicons name="pulse" size={20} color="#8b5cf6" />
                      <Text style={styles.summaryValue}>
                        {Math.round(healthSummary.hrv.average)} ms
                      </Text>
                      <Text style={styles.summaryLabel}>Avg HRV</Text>
                    </View>
                  )}

                  {healthSummary.steps && (
                    <View style={styles.summaryCard}>
                      <Ionicons name="footsteps" size={20} color="#10b981" />
                      <Text style={styles.summaryValue}>
                        {Math.round(healthSummary.steps.average).toLocaleString()}
                      </Text>
                      <Text style={styles.summaryLabel}>Avg Steps</Text>
                    </View>
                  )}

                  {healthSummary.sleep && (
                    <View style={styles.summaryCard}>
                      <Ionicons name="moon" size={20} color="#3b82f6" />
                      <Text style={styles.summaryValue}>
                        {healthSummary.sleep.average.toFixed(1)}h
                      </Text>
                      <Text style={styles.summaryLabel}>Avg Sleep</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Sync Controls */}
            <View style={styles.controlsContainer}>
              <View style={styles.syncInfo}>
                <Text style={styles.syncLabel}>Last synced: {formatLastSync()}</Text>
                <Text style={styles.syncDescription}>
                  Auto-syncs every 30 minutes
                </Text>
              </View>
              
              <LMN8Button
                title={isSyncing ? "Syncing..." : "Sync Now"}
                onPress={handleSyncNow}
                disabled={isSyncing || isLoading}
                variant="secondary"
                size="small"
                icon={isSyncing ? undefined : "refresh"}
              />
            </View>

            <View style={styles.settingDivider} />

            {/* Delete Data Option */}
            <View style={styles.dangerZone}>
              <View style={styles.dangerInfo}>
                <Text style={styles.dangerLabel}>Delete Health Data</Text>
                <Text style={styles.dangerDescription}>
                  Remove all synced health data from our servers
                </Text>
              </View>
              
              <LMN8Button
                title="Delete"
                onPress={() => setShowDeleteAlert(true)}
                disabled={isLoading}
                variant="secondary"
                size="small"
              />
            </View>
          </>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={LMN8Colors.accentPrimary} />
          </View>
        )}
      </View>

      {/* Enable Confirmation Alert */}
      <LMN8Alert
        visible={showEnableAlert}
        title={Platform.OS === 'ios' ? "Connect Apple Watch?" : "Connect Health Connect?"}
        message={`This will allow the app to read health data from your ${getSource()}.

📊 Data Collected:
• Heart rate & HRV
• Steps & activity
• Sleep patterns
${Platform.OS === 'ios' ? '• Mindful minutes' : '• Exercise sessions'}

🔒 Privacy: Your health data is encrypted and used only to provide better therapeutic insights. You maintain full control and can disconnect anytime.

🏥 Purpose: Help your care team understand your wellness patterns and provide more personalized support.`}
        confirmText="Connect"
        onConfirm={handleConfirmEnable}
        onDismiss={() => setShowEnableAlert(false)}
        type="info"
      />

      {/* Delete Confirmation Alert */}
      <LMN8Alert
        visible={showDeleteAlert}
        title="Delete Health Data?"
        message={`This will permanently delete all health data synced from your ${Platform.OS === 'ios' ? 'Apple Watch' : 'Android device'}. Your data in ${Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect'} will not be affected.

This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteData}
        onDismiss={() => setShowDeleteAlert(false)}
        type="error"
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
    position: 'relative',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: LMN8Spacing.md,
    marginHorizontal: LMN8Spacing.lg,
    marginTop: LMN8Spacing.sm,
    borderRadius: 8,
  },
  statusText: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: '#10b981',
    marginLeft: LMN8Spacing.sm,
    flex: 1,
  },
  summaryContainer: {
    padding: LMN8Spacing.lg,
    paddingTop: LMN8Spacing.md,
  },
  summaryTitle: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: `${LMN8Colors.accentPrimary}08`,
    borderRadius: 12,
    padding: LMN8Spacing.md,
    margin: '1%',
    alignItems: 'center',
  },
  summaryValue: {
    ...LMN8Typography.h3,
    fontSize: 20,
    fontWeight: '700',
    color: LMN8Colors.text100,
    marginTop: LMN8Spacing.xs,
  },
  summaryLabel: {
    ...LMN8Typography.caption,
    fontSize: 11,
    color: LMN8Colors.text60,
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LMN8Spacing.lg,
    paddingVertical: LMN8Spacing.md,
  },
  syncInfo: {
    flex: 1,
  },
  syncLabel: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '500',
    color: LMN8Colors.text85,
  },
  syncDescription: {
    ...LMN8Typography.caption,
    fontSize: 11,
    color: LMN8Colors.text60,
    marginTop: 2,
  },
  dangerZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LMN8Spacing.lg,
    paddingVertical: LMN8Spacing.md,
  },
  dangerInfo: {
    flex: 1,
  },
  dangerLabel: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '500',
    color: '#ef4444',
  },
  dangerDescription: {
    ...LMN8Typography.caption,
    fontSize: 11,
    color: LMN8Colors.text60,
    marginTop: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});

