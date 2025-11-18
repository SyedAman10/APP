import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type JourneyTheme = 'relief' | 'self-exploration' | 'anxiety-release' | 'mindfulness' | 'gratitude' | 'processing';

interface ThemeInfo {
  id: JourneyTheme;
  name: string;
  icon: string;
  color: string;
  gradient: string[];
}

const THEMES: Record<JourneyTheme, ThemeInfo> = {
  'relief': {
    id: 'relief',
    name: 'Relief',
    icon: 'leaf-outline',
    color: '#10b981',
    gradient: ['#10b981', '#059669'],
  },
  'self-exploration': {
    id: 'self-exploration',
    name: 'Self-Exploration',
    icon: 'compass-outline',
    color: '#8b5cf6',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  'anxiety-release': {
    id: 'anxiety-release',
    name: 'Anxiety Release',
    icon: 'flash-off-outline',
    color: '#f59e0b',
    gradient: ['#f59e0b', '#d97706'],
  },
  'mindfulness': {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: 'infinite-outline',
    color: '#06b6d4',
    gradient: ['#06b6d4', '#0891b2'],
  },
  'gratitude': {
    id: 'gratitude',
    name: 'Gratitude',
    icon: 'heart-outline',
    color: '#ec4899',
    gradient: ['#ec4899', '#db2777'],
  },
  'processing': {
    id: 'processing',
    name: 'Processing',
    icon: 'construct-outline',
    color: '#6366f1',
    gradient: ['#6366f1', '#4f46e5'],
  },
};

export const JourneyThemeCard: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<JourneyTheme>('relief');
  const [hasMusicEnabled, setHasMusicEnabled] = useState(false);
  const [hasScheduling, setHasScheduling] = useState(false);

  useEffect(() => {
    // TODO: Load saved preferences from AsyncStorage or API
    // For now using defaults
    setCurrentTheme('relief');
    setHasMusicEnabled(false);
    setHasScheduling(false);
  }, []);

  const handlePress = () => {
    router.push('/(main)/journey-themes');
  };

  const themeInfo = THEMES[currentTheme];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[`${LMN8Colors.container}98`, `${LMN8Colors.container}95`]}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.iconContainer, { backgroundColor: `${themeInfo.color}20` }]}>
              <Ionicons name="color-palette-outline" size={24} color={themeInfo.color} />
            </View>
            <View style={styles.cardTitleContent}>
              <Text style={styles.cardTitle}>Journey Theme</Text>
              <Text style={styles.cardSubtitle}>Customize your experience</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={LMN8Colors.text60} />
        </View>

        {/* Current Theme Display */}
        <View style={styles.divider} />
        
        <View style={styles.currentThemeSection}>
          <Text style={styles.currentThemeLabel}>Active Theme</Text>
          <View style={styles.currentThemeRow}>
            <LinearGradient
              colors={themeInfo.gradient as any}
              style={styles.currentThemeIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={themeInfo.icon as any} size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.currentThemeName}>{themeInfo.name}</Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons 
              name={hasMusicEnabled ? "musical-notes" : "musical-notes-outline"} 
              size={16} 
              color={hasMusicEnabled ? LMN8Colors.accentSecondary : LMN8Colors.text60} 
            />
            <Text style={[styles.statText, hasMusicEnabled && styles.statTextActive]}>
              Music {hasMusicEnabled ? 'On' : 'Off'}
            </Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons 
              name={hasScheduling ? "time" : "time-outline"} 
              size={16} 
              color={hasScheduling ? LMN8Colors.accentSecondary : LMN8Colors.text60} 
            />
            <Text style={[styles.statText, hasScheduling && styles.statTextActive]}>
              Schedule {hasScheduling ? 'On' : 'Off'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: LMN8Spacing.md,
  },

  cardGradient: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: LMN8Spacing.lg,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.md,
    flex: 1,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitleContent: {
    flex: 1,
  },

  cardTitle: {
    ...LMN8Typography.body,
    fontSize: 16,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: 2,
  },

  cardSubtitle: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
  },

  divider: {
    height: 1,
    backgroundColor: `${LMN8Colors.accentPrimary}10`,
    marginHorizontal: LMN8Spacing.lg,
  },

  currentThemeSection: {
    padding: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.md,
  },

  currentThemeLabel: {
    ...LMN8Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: LMN8Colors.text60,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: LMN8Spacing.sm,
  },

  currentThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.sm,
  },

  currentThemeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  currentThemeName: {
    ...LMN8Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.lg,
    gap: LMN8Spacing.md,
  },

  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: LMN8Spacing.xs,
    paddingHorizontal: LMN8Spacing.sm,
    backgroundColor: `${LMN8Colors.bgLight}40`,
    borderRadius: 8,
    justifyContent: 'center',
  },

  statText: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
    fontWeight: '500',
  },

  statTextActive: {
    color: LMN8Colors.accentSecondary,
  },

  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: `${LMN8Colors.accentPrimary}15`,
  },
});

