import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradient: string[];
  achieved: boolean;
  progress?: number; // 0-100
  achievedDate?: string;
}

interface MilestoneCardProps {
  milestone: Milestone;
  size?: 'small' | 'medium' | 'large';
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({ 
  milestone, 
  size = 'medium' 
}) => {
  const cardSize = size === 'small' ? 80 : size === 'medium' ? 100 : 120;
  const iconSize = size === 'small' ? 28 : size === 'medium' ? 36 : 44;

  return (
    <View style={[styles.container, { width: cardSize }]}>
      {milestone.achieved ? (
        <LinearGradient
          colors={milestone.gradient as any}
          style={[styles.achievedBadge, { width: cardSize, height: cardSize }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={milestone.icon as any} size={iconSize} color="#fff" />
          {milestone.achievedDate && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          )}
        </LinearGradient>
      ) : (
        <View style={[styles.lockedBadge, { width: cardSize, height: cardSize }]}>
          <Ionicons 
            name={milestone.icon as any} 
            size={iconSize} 
            color={LMN8Colors.text60} 
          />
          {milestone.progress !== undefined && (
            <View style={styles.progressRing}>
              <Text style={styles.progressText}>{milestone.progress}%</Text>
            </View>
          )}
        </View>
      )}
      <Text 
        style={[
          styles.title, 
          milestone.achieved && styles.achievedTitle,
          size === 'small' && styles.smallTitle
        ]}
        numberOfLines={2}
      >
        {milestone.title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: LMN8Spacing.md,
  },

  achievedBadge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: LMN8Colors.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  lockedBadge: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${LMN8Colors.container}80`,
    borderWidth: 2,
    borderColor: `${LMN8Colors.text60}30`,
    borderStyle: 'dashed',
    position: 'relative',
  },

  checkmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: LMN8Colors.bgDark,
    borderRadius: 12,
  },

  progressRing: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: LMN8Colors.accentPrimary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },

  progressText: {
    ...LMN8Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  title: {
    ...LMN8Typography.caption,
    fontSize: 11,
    fontWeight: '500',
    color: LMN8Colors.text60,
    textAlign: 'center',
    marginTop: LMN8Spacing.sm,
    lineHeight: 14,
  },

  achievedTitle: {
    color: LMN8Colors.text100,
    fontWeight: '600',
  },

  smallTitle: {
    fontSize: 9,
  },
});

