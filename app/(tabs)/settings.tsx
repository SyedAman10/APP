import { AppleWatchSettings } from '@/components/AppleWatchSettings';
import { CrisisInterventionModal } from '@/components/CrisisInterventionModal';
import { JourneyThemeCard } from '@/components/JourneyThemeCard';
import PasswordResetModal from '@/components/PasswordResetModal';
import { LMN8Button } from '@/components/ui/LMN8Button';
import { VoiceStressSettings } from '@/components/VoiceStressSettings';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useVoiceStress } from '@/contexts/VoiceStressContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { onboardingData, clearOnboardingData } = useOnboarding();
  const { 
    isEnabled, 
    showCrisisModal, 
    currentStressLevel,
    enableMonitoring, 
    disableMonitoring,
    dismissCrisisModal,
    callEmergency,
    startBreathingExercise,
    talkToGuide
  } = useVoiceStress();
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/login');
          }
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Profile',
      'This will clear your profile data and take you through onboarding again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            clearOnboardingData();
            router.replace('/onboarding-selection');
          }
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This feature will be available soon. You\'ll be able to export your journey entries and chat history.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacySettings = () => {
    Alert.alert(
      'Privacy Settings',
      'Privacy controls will be available soon. You\'ll be able to manage data sharing and privacy preferences.',
      [{ text: 'OK' }]
    );
  };

  const handlePasswordReset = () => {
    setShowPasswordResetModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Background with gradient overlay */}
      <LinearGradient
        colors={[
          LMN8Colors.bgDark,
          '#1e1e3f',
          LMN8Colors.bgDark,
          '#2a1a4e',
          LMN8Colors.bgDark
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating background elements */}
      <View style={styles.floatingElement1} />
      <View style={styles.floatingElement2} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.sectionCard}>
            <View style={styles.profileInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.profileDetails}>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <Text style={styles.profileStatus}>Profile Complete</Text>
              </View>
            </View>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={handlePasswordReset}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Reset Password</Text>
                <Text style={styles.settingDescription}>Change your account password</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Stress Monitoring Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mental Health Support</Text>
          <VoiceStressSettings 
            onToggle={(enabled) => enabled ? enableMonitoring() : disableMonitoring()}
            isEnabled={isEnabled}
          />
        </View>

        {/* Apple Watch Integration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Tracking</Text>
          <AppleWatchSettings />
        </View>

        {/* Journey Themes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Customization</Text>
          <JourneyThemeCard />
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Get reminders and updates</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: LMN8Colors.text60, true: LMN8Colors.accentPrimary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Always use dark theme</Text>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: LMN8Colors.text60, true: LMN8Colors.accentPrimary }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy Settings</Text>
                <Text style={styles.settingDescription}>Manage data sharing</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.sectionCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Export Data</Text>
                <Text style={styles.settingDescription}>Download your journey data</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={handleResetOnboarding}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Reset Profile</Text>
                <Text style={styles.settingDescription}>Start over with onboarding</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionCard}>
            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <Text style={styles.settingTitle}>Build</Text>
              <Text style={styles.settingValue}>2024.1</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <LMN8Button
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
            size="large"
            fullWidth
          />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>LMN8</Text>
          <Text style={styles.appDescription}>
            Your AI companion for personal growth and therapeutic support
          </Text>
        </View>
      </ScrollView>

      {/* Password Reset Modal */}
      <PasswordResetModal
        visible={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        userEmail={user?.email || ''}
      />

      {/* Crisis Intervention Modal */}
      <CrisisInterventionModal
        visible={showCrisisModal}
        stressLevel={currentStressLevel}
        onClose={dismissCrisisModal}
        onCallEmergency={callEmergency}
        onStartBreathing={startBreathingExercise}
        onTalkToGuide={talkToGuide}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },

  floatingElement1: {
    position: 'absolute',
    top: height * 0.1,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${LMN8Colors.accentPrimary}06`,
    opacity: 0.4,
  },

  floatingElement2: {
    position: 'absolute',
    bottom: height * 0.2,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${LMN8Colors.accentPrimary}04`,
    opacity: 0.3,
  },

  header: {
    padding: LMN8Spacing.xl,
    paddingTop: 50, // Account for status bar
    alignItems: 'center',
  },

  title: {
    ...LMN8Typography.h1,
    fontSize: 32,
    fontWeight: '800',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.sm,
  },

  subtitle: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    fontSize: 16,
    textAlign: 'center',
  },

  section: {
    marginBottom: LMN8Spacing.xl,
    paddingHorizontal: LMN8Spacing.lg,
  },

  sectionTitle: {
    ...LMN8Typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.md,
  },

  sectionCard: {
    backgroundColor: `${LMN8Colors.container}98`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    overflow: 'hidden',
  },

  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LMN8Spacing.lg,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: LMN8Colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: LMN8Spacing.md,
  },

  avatarText: {
    ...LMN8Typography.h2,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },

  profileDetails: {
    flex: 1,
  },

  profileEmail: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: 4,
  },

  profileStatus: {
    ...LMN8Typography.caption,
    color: LMN8Colors.accentPrimary,
    fontSize: 12,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LMN8Spacing.lg,
    paddingVertical: LMN8Spacing.md,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '500',
    color: LMN8Colors.text100,
    marginBottom: 2,
  },

  settingDescription: {
    ...LMN8Typography.caption,
    color: LMN8Colors.text60,
    fontSize: 12,
  },

  settingValue: {
    ...LMN8Typography.caption,
    color: LMN8Colors.text60,
    fontSize: 14,
  },

  settingArrow: {
    ...LMN8Typography.h2,
    fontSize: 20,
    color: LMN8Colors.text60,
    marginLeft: LMN8Spacing.sm,
  },

  settingDivider: {
    height: 1,
    backgroundColor: `${LMN8Colors.accentPrimary}10`,
    marginLeft: LMN8Spacing.lg,
  },

  dangerText: {
    color: '#ff6b6b',
  },

  logoutSection: {
    paddingHorizontal: LMN8Spacing.lg,
    marginBottom: LMN8Spacing.xl,
  },

  appInfo: {
    alignItems: 'center',
    paddingHorizontal: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.xl,
  },

  appName: {
    ...LMN8Typography.h2,
    fontSize: 24,
    fontWeight: '700',
    color: LMN8Colors.accentPrimary,
    marginBottom: LMN8Spacing.sm,
  },

  appDescription: {
    ...LMN8Typography.body,
    color: LMN8Colors.text60,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
