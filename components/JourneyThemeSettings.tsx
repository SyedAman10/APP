import { LMN8Alert } from '@/components/ui/LMN8Alert';
import { LMN8Button } from '@/components/ui/LMN8Button';
import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export type JourneyTheme = 'relief' | 'self-exploration' | 'anxiety-release' | 'mindfulness' | 'gratitude' | 'processing';

interface ThemeOption {
  id: JourneyTheme;
  name: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: string[];
}

interface MusicPreference {
  name: string;
  uri: string;
  type: 'file' | 'spotify' | 'youtube' | 'apple-music';
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'relief',
    name: 'Relief',
    description: 'Calming sessions for stress relief and relaxation',
    icon: 'leaf-outline',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
  },
  {
    id: 'self-exploration',
    name: 'Self-Exploration',
    description: 'Discover and understand yourself better',
    icon: 'compass-outline',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 'anxiety-release',
    name: 'Anxiety Release',
    description: 'Techniques to manage and reduce anxiety',
    icon: 'flash-off-outline',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    description: 'Present moment awareness and meditation',
    icon: 'infinite-outline',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    description: 'Focus on positive aspects and appreciation',
    icon: 'heart-outline',
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
  },
  {
    id: 'processing',
    name: 'Processing',
    description: 'Work through difficult emotions and experiences',
    icon: 'construct-outline',
    color: '#6366f1',
    gradient: ['#6366f1', '#4f46e5'],
  },
];

const SCHEDULE_TIMES = [
  { id: 'morning', label: 'Morning', time: '8:00 AM', icon: 'sunny-outline' },
  { id: 'afternoon', label: 'Afternoon', time: '2:00 PM', icon: 'partly-sunny-outline' },
  { id: 'evening', label: 'Evening', time: '7:00 PM', icon: 'moon-outline' },
  { id: 'night', label: 'Night', time: '10:00 PM', icon: 'moon-outline' },
];

export const JourneyThemeSettings: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<JourneyTheme>('relief');
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('morning');
  const [musicPreferences, setMusicPreferences] = useState<MusicPreference[]>([]);
  const [showMusicOptions, setShowMusicOptions] = useState(false);
  const [enableBackgroundMusic, setEnableBackgroundMusic] = useState(false);
  const [showThemeInfo, setShowThemeInfo] = useState(false);

  const handleThemeSelect = (themeId: JourneyTheme) => {
    setSelectedTheme(themeId);
    // TODO: Save to backend
    console.log('Theme selected:', themeId);
  };

  const handleMusicUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newMusic: MusicPreference = {
          name: asset.name,
          uri: asset.uri,
          type: 'file',
        };
        setMusicPreferences([...musicPreferences, newMusic]);
        console.log('Music added:', newMusic);
      }
    } catch (error) {
      console.error('Error picking music:', error);
    }
  };

  const handleRemoveMusic = (index: number) => {
    const updated = musicPreferences.filter((_, i) => i !== index);
    setMusicPreferences(updated);
  };

  const handleSavePreferences = () => {
    // TODO: Save all preferences to backend
    const preferences = {
      theme: selectedTheme,
      enableScheduling,
      scheduledTime,
      musicPreferences,
      enableBackgroundMusic,
    };
    console.log('Saving preferences:', preferences);
    alert('Journey preferences saved!');
  };

  const selectedThemeData = THEME_OPTIONS.find(t => t.id === selectedTheme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <LinearGradient
            colors={selectedThemeData?.gradient as any || [LMN8Colors.accentPrimary, LMN8Colors.accentPrimary]}
            style={styles.headerIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="color-palette-outline" size={32} color="#fff" />
          </LinearGradient>
        </View>
        <Text style={styles.headerTitle}>Journey Themes</Text>
        <Text style={styles.headerSubtitle}>
          Customize your therapeutic experience with themes, music, and scheduling
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={LMN8Colors.accentPrimary} />
          <Text style={styles.infoText}>
            Journey themes help tailor your sessions to your current needs. Choose a theme that resonates with your goals.
          </Text>
        </View>

        {/* Theme Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Your Theme</Text>
            <TouchableOpacity onPress={() => setShowThemeInfo(true)}>
              <Ionicons name="help-circle-outline" size={20} color={LMN8Colors.text60} />
            </TouchableOpacity>
          </View>

          <View style={styles.themesGrid}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  style={styles.themeCard}
                  onPress={() => handleThemeSelect(theme.id)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={isSelected ? theme.gradient as any : [`${theme.color}15`, `${theme.color}08`]}
                    style={[
                      styles.themeGradient,
                      isSelected && styles.themeGradientSelected,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[
                      styles.themeIconContainer,
                      { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${theme.color}20` }
                    ]}>
                      <Ionicons
                        name={theme.icon as any}
                        size={28}
                        color={isSelected ? '#fff' : theme.color}
                      />
                    </View>
                    <Text style={[
                      styles.themeLabel,
                      isSelected && styles.themeLabelSelected,
                    ]}>
                      {theme.name}
                    </Text>
                    <Text style={[
                      styles.themeDescription,
                      isSelected && styles.themeDescriptionSelected,
                    ]}>
                      {theme.description}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Music & Environment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music & Environment</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingTitleRow}>
                  <Ionicons name="musical-notes" size={20} color={LMN8Colors.accentSecondary} />
                  <Text style={styles.settingTitle}>Background Music</Text>
                </View>
                <Text style={styles.settingDescription}>
                  Play calming music during your sessions
                </Text>
              </View>
              <Switch
                value={enableBackgroundMusic}
                onValueChange={setEnableBackgroundMusic}
                trackColor={{ false: LMN8Colors.text60, true: LMN8Colors.accentPrimary }}
                thumbColor="#ffffff"
              />
            </View>

            {enableBackgroundMusic && (
              <>
                <View style={styles.divider} />
                
                <View style={styles.musicSection}>
                  <Text style={styles.musicSectionTitle}>Your Playlists</Text>
                  
                  {musicPreferences.length === 0 ? (
                    <View style={styles.emptyMusic}>
                      <Ionicons name="musical-note-outline" size={48} color={LMN8Colors.text60} />
                      <Text style={styles.emptyMusicText}>No music added yet</Text>
                      <Text style={styles.emptyMusicSubtext}>
                        Add your favorite calming music or playlists
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.musicList}>
                      {musicPreferences.map((music, index) => (
                        <View key={index} style={styles.musicItem}>
                          <Ionicons name="musical-note" size={20} color={LMN8Colors.accentSecondary} />
                          <Text style={styles.musicName}>{music.name}</Text>
                          <TouchableOpacity onPress={() => handleRemoveMusic(index)}>
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.musicActions}>
                    <TouchableOpacity style={styles.musicButton} onPress={handleMusicUpload}>
                      <Ionicons name="cloud-upload-outline" size={20} color={LMN8Colors.text100} />
                      <Text style={styles.musicButtonText}>Upload Music</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.musicButton} onPress={() => setShowMusicOptions(true)}>
                      <Ionicons name="link-outline" size={20} color={LMN8Colors.text100} />
                      <Text style={styles.musicButtonText}>Link Service</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Scheduling */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Scheduling</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingTitleRow}>
                  <Ionicons name="time-outline" size={20} color="#f59e0b" />
                  <Text style={styles.settingTitle}>Auto-Schedule Theme</Text>
                </View>
                <Text style={styles.settingDescription}>
                  Automatically switch themes at different times of day
                </Text>
              </View>
              <Switch
                value={enableScheduling}
                onValueChange={setEnableScheduling}
                trackColor={{ false: LMN8Colors.text60, true: LMN8Colors.accentPrimary }}
                thumbColor="#ffffff"
              />
            </View>

            {enableScheduling && (
              <>
                <View style={styles.divider} />
                
                <View style={styles.scheduleGrid}>
                  {SCHEDULE_TIMES.map((time) => {
                    const isSelected = scheduledTime === time.id;
                    return (
                      <TouchableOpacity
                        key={time.id}
                        style={[
                          styles.scheduleCard,
                          isSelected && styles.scheduleCardSelected,
                        ]}
                        onPress={() => setScheduledTime(time.id)}
                      >
                        <Ionicons
                          name={time.icon as any}
                          size={24}
                          color={isSelected ? LMN8Colors.accentPrimary : LMN8Colors.text85}
                        />
                        <Text style={[
                          styles.scheduleLabel,
                          isSelected && styles.scheduleLabelSelected,
                        ]}>
                          {time.label}
                        </Text>
                        <Text style={styles.scheduleTime}>{time.time}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <LMN8Button
            title="Save Preferences"
            onPress={handleSavePreferences}
            size="large"
            fullWidth
          />
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Theme Info Alert */}
      <LMN8Alert
        visible={showThemeInfo}
        title="About Journey Themes"
        message={`Journey themes help personalize your therapeutic experience:

🍃 Relief: Focus on stress reduction and relaxation
🧭 Self-Exploration: Discover insights about yourself
⚡ Anxiety Release: Manage anxious thoughts and feelings
♾️ Mindfulness: Practice present-moment awareness
💖 Gratitude: Cultivate appreciation and positivity
🔧 Processing: Work through difficult emotions

Your clinician can also set recommended themes for your journey.`}
        confirmText="Got it"
        onConfirm={() => setShowThemeInfo(false)}
        type="info"
      />

      {/* Music Options Alert */}
      <LMN8Alert
        visible={showMusicOptions}
        title="Link Music Service"
        message="Link your favorite music service to access your playlists:

• Spotify
• Apple Music
• YouTube Music

This feature requires additional setup. Contact support to enable music service integration."
        confirmText="OK"
        onConfirm={() => setShowMusicOptions(false)}
        type="info"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: LMN8Spacing.lg,
    paddingTop: LMN8Spacing.xl,
    paddingBottom: LMN8Spacing.lg,
  },

  headerIconContainer: {
    marginBottom: LMN8Spacing.md,
  },

  headerIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    ...LMN8Typography.h2,
    fontSize: 24,
    fontWeight: '700',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.xs,
  },

  headerSubtitle: {
    ...LMN8Typography.body,
    fontSize: 14,
    color: LMN8Colors.text60,
    textAlign: 'center',
    lineHeight: 20,
  },

  scrollView: {
    flex: 1,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: LMN8Spacing.lg,
    marginHorizontal: LMN8Spacing.lg,
    marginBottom: LMN8Spacing.lg,
    backgroundColor: `${LMN8Colors.accentPrimary}08`,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: LMN8Colors.accentPrimary,
    gap: LMN8Spacing.md,
  },

  infoText: {
    ...LMN8Typography.caption,
    fontSize: 13,
    color: LMN8Colors.text85,
    lineHeight: 18,
    flex: 1,
  },

  section: {
    marginBottom: LMN8Spacing.xl,
    paddingHorizontal: LMN8Spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: LMN8Spacing.md,
  },

  sectionTitle: {
    ...LMN8Typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LMN8Spacing.md,
  },

  themeCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },

  themeGradient: {
    padding: LMN8Spacing.lg,
    alignItems: 'center',
    minHeight: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: `${LMN8Colors.accentPrimary}10`,
    position: 'relative',
  },

  themeGradientSelected: {
    borderColor: 'transparent',
  },

  themeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: LMN8Spacing.sm,
  },

  themeLabel: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: LMN8Colors.text100,
    textAlign: 'center',
    marginBottom: 4,
  },

  themeLabelSelected: {
    color: '#fff',
  },

  themeDescription: {
    ...LMN8Typography.caption,
    fontSize: 11,
    color: LMN8Colors.text60,
    textAlign: 'center',
    lineHeight: 14,
  },

  themeDescriptionSelected: {
    color: 'rgba(255,255,255,0.9)',
  },

  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  settingCard: {
    backgroundColor: `${LMN8Colors.container}95`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    overflow: 'hidden',
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LMN8Spacing.lg,
  },

  settingInfo: {
    flex: 1,
    marginRight: LMN8Spacing.md,
  },

  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.xs,
    marginBottom: 4,
  },

  settingTitle: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  settingDescription: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
    lineHeight: 16,
  },

  divider: {
    height: 1,
    backgroundColor: `${LMN8Colors.accentPrimary}10`,
    marginHorizontal: LMN8Spacing.lg,
  },

  musicSection: {
    padding: LMN8Spacing.lg,
  },

  musicSectionTitle: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: LMN8Colors.text85,
    marginBottom: LMN8Spacing.md,
  },

  emptyMusic: {
    alignItems: 'center',
    paddingVertical: LMN8Spacing.xl,
  },

  emptyMusicText: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '500',
    color: LMN8Colors.text85,
    marginTop: LMN8Spacing.sm,
  },

  emptyMusicSubtext: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
    marginTop: 4,
  },

  musicList: {
    gap: LMN8Spacing.sm,
    marginBottom: LMN8Spacing.md,
  },

  musicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.bgLight}40`,
    borderRadius: 8,
    gap: LMN8Spacing.sm,
  },

  musicName: {
    ...LMN8Typography.body,
    fontSize: 13,
    color: LMN8Colors.text100,
    flex: 1,
  },

  musicActions: {
    flexDirection: 'row',
    gap: LMN8Spacing.md,
  },

  musicButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LMN8Spacing.xs,
    padding: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.accentSecondary}20`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentSecondary}40`,
  },

  musicButtonText: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: LMN8Spacing.md,
    padding: LMN8Spacing.lg,
  },

  scheduleCard: {
    width: '48%',
    alignItems: 'center',
    padding: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.container}80`,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: `${LMN8Colors.accentPrimary}10`,
  },

  scheduleCardSelected: {
    borderColor: LMN8Colors.accentPrimary,
    backgroundColor: `${LMN8Colors.accentPrimary}10`,
  },

  scheduleLabel: {
    ...LMN8Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: LMN8Colors.text85,
    marginTop: LMN8Spacing.xs,
  },

  scheduleLabelSelected: {
    color: LMN8Colors.accentPrimary,
  },

  scheduleTime: {
    ...LMN8Typography.caption,
    fontSize: 11,
    color: LMN8Colors.text60,
    marginTop: 2,
  },

  saveSection: {
    paddingHorizontal: LMN8Spacing.lg,
    marginTop: LMN8Spacing.lg,
  },

  bottomPadding: {
    height: 40,
  },
});

