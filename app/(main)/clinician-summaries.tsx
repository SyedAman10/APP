import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { clinicianSharingAPI, ClinicianSummary, ClinicianSummaryType, journalAPI, JournalEntry } from '@/services/APIService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');
const PAGE_SIZE = 20;

interface JournalDisplayEntry {
  id: string;
  title: string;
  content: string;
  mediaType: string;
  mood?: number;
  transcribedText?: string;
  createdAt: string;
}

export default function ClinicianSummariesScreen() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<ClinicianSummary[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalDisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [summaryType, setSummaryType] = useState<ClinicianSummaryType>('ai_conversation');

  const loadSummaries = async (reset = false, typeOverride?: ClinicianSummaryType) => {
    const currentOffset = reset ? 0 : offset;
    const selectedSummaryType = typeOverride || summaryType;
    try {
      if (reset) setIsLoading(true);
      else setIsLoadingMore(true);

      const response = await clinicianSharingAPI.getSummaries(selectedSummaryType, PAGE_SIZE, currentOffset);
      if (response.success && response.data) {
        const incoming = response.data.data || [];
        setSummaries((prev) => (reset ? incoming : [...prev, ...incoming]));
        setOffset(currentOffset + incoming.length);
        setHasMore(incoming.length === PAGE_SIZE);
      } else {
        if (reset) setSummaries([]);
      }
    } catch {
      if (reset) setSummaries([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadJournalEntries = async (reset = false) => {
    try {
      if (reset) setIsLoading(true);
      else setIsLoadingMore(true);

      const page = reset ? 1 : Math.floor(offset / PAGE_SIZE) + 1;
      const response = await journalAPI.getEntries(page, PAGE_SIZE);
      if (response.success && response.data) {
        const apiEntries = response.data.data || [];
        const mapped: JournalDisplayEntry[] = apiEntries.map((e: JournalEntry) => ({
          id: e.id || '',
          title: e.title,
          content: e.content,
          mediaType: e.mediaType,
          mood: e.mood,
          transcribedText: e.transcribedText,
          createdAt: e.createdAt || e.timestamp || new Date().toISOString(),
        }));
        setJournalEntries((prev) => (reset ? mapped : [...prev, ...mapped]));
        const pagination = response.data.pagination;
        setOffset(reset ? mapped.length : offset + mapped.length);
        setHasMore(pagination ? page < (pagination.totalPages || 1) : mapped.length === PAGE_SIZE);
      } else {
        if (reset) setJournalEntries([]);
      }
    } catch {
      if (reset) setJournalEntries([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (summaryType === 'journal_entry') {
        loadJournalEntries(true);
      } else {
        loadSummaries(true, summaryType);
      }
    }, [summaryType])
  );

  const handleTypeChange = (nextType: ClinicianSummaryType) => {
    if (nextType === summaryType) return;
    setSummaryType(nextType);
    setOffset(0);
    setHasMore(true);
    setSummaries([]);
    setJournalEntries([]);
    if (nextType === 'journal_entry') {
      loadJournalEntries(true);
    } else {
      loadSummaries(true, nextType);
    }
  };

  const getMediaTypeIcon = (mediaType: string): string => {
    switch (mediaType) {
      case 'text': return 'document-text-outline';
      case 'photo': return 'image-outline';
      case 'handwritten': return 'brush-outline';
      case 'voice': return 'mic-outline';
      default: return 'document-outline';
    }
  };

  const getMediaTypeLabel = (mediaType: string) => {
    switch (mediaType) {
      case 'text': return 'Written';
      case 'photo': return 'Visual';
      case 'handwritten': return 'Handwritten';
      case 'voice': return 'Voice Memo';
      default: return 'Entry';
    }
  };

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType) {
      case 'text': return LMN8Colors.accentPrimary;
      case 'photo': return LMN8Colors.accentSecondary;
      case 'handwritten': return LMN8Colors.accentHighlight;
      case 'voice': return '#f472b6';
      default: return LMN8Colors.accentPrimary;
    }
  };

  const getMoodColor = (mood?: number) => {
    if (!mood) return LMN8Colors.text60;
    if (mood >= 8) return '#4ade80';
    if (mood >= 6) return '#60a5fa';
    if (mood >= 4) return '#fbbf24';
    if (mood >= 2) return '#fb923c';
    return '#f87171';
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LMN8Colors.accentPrimary} />
        <Text style={styles.loadingText}>Loading summaries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[LMN8Colors.bgDark, '#1e1e3f', LMN8Colors.bgDark]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.floatingElement} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={LMN8Colors.text85} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>AI Conversation Summaries</Text>
            <Text style={styles.subtitle}>
              These are high-level summaries to help your clinician track your progress.
            </Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              summaryType === 'ai_conversation' && styles.filterChipActive,
            ]}
            onPress={() => handleTypeChange('ai_conversation')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                summaryType === 'ai_conversation' && styles.filterChipTextActive,
              ]}
            >
              AI Conversation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              summaryType === 'journal_entry' && styles.filterChipActive,
            ]}
            onPress={() => handleTypeChange('journal_entry')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                summaryType === 'journal_entry' && styles.filterChipTextActive,
              ]}
            >
              Journal Entry
            </Text>
          </TouchableOpacity>
        </View>

        {summaryType === 'journal_entry' ? (
          <>
            {journalEntries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={28} color={LMN8Colors.text60} />
                <Text style={styles.emptyTitle}>No journal entries yet</Text>
                <Text style={styles.emptyText}>Your journal entries will appear here once you create them.</Text>
              </View>
            ) : (
              journalEntries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <LinearGradient
                    colors={[`${LMN8Colors.container}98`, `${LMN8Colors.container}95`]}
                    style={styles.entryCardGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.entryHeaderLeft}>
                        <View style={[styles.mediaIconContainer, { backgroundColor: `${getMediaTypeColor(entry.mediaType)}15` }]}>
                          <Ionicons name={getMediaTypeIcon(entry.mediaType) as any} size={16} color={getMediaTypeColor(entry.mediaType)} />
                        </View>
                        <Text style={styles.mediaLabel}>{getMediaTypeLabel(entry.mediaType)}</Text>
                      </View>
                      <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                    </View>
                    <Text style={styles.entryTitle}>{entry.title}</Text>
                    {entry.content ? (
                      <Text style={styles.entryContent} numberOfLines={3}>{entry.content}</Text>
                    ) : null}
                    {entry.transcribedText ? (
                      <View style={styles.transcribedBox}>
                        <View style={styles.transcribedHeader}>
                          <Ionicons name="text-outline" size={12} color={LMN8Colors.accentSecondary} />
                          <Text style={styles.transcribedLabel}>Transcribed</Text>
                        </View>
                        <Text style={styles.transcribedText} numberOfLines={2}>{entry.transcribedText}</Text>
                      </View>
                    ) : null}
                    {entry.mood ? (
                      <View style={styles.entryFooter}>
                        <View style={[styles.moodBadge, { backgroundColor: `${getMoodColor(entry.mood)}20` }]}>
                          <Text style={[styles.moodText, { color: getMoodColor(entry.mood) }]}>
                            Mood: {entry.mood}/10
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </LinearGradient>
                </View>
              ))
            )}
            {hasMore && journalEntries.length > 0 && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                disabled={isLoadingMore}
                onPress={() => loadJournalEntries(false)}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={LMN8Colors.text100} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            {summaries.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={28} color={LMN8Colors.text60} />
                <Text style={styles.emptyTitle}>No summaries yet</Text>
                <Text style={styles.emptyText}>When summaries are generated, they will appear here.</Text>
              </View>
            ) : (
              summaries.map((item) => (
                <View key={item.id} style={styles.summaryCard}>
                  <Text style={styles.summaryText}>{item.summaryText}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
                    {item.sourceId ? <Text style={styles.metaText}>Source: {item.sourceId}</Text> : null}
                  </View>
                </View>
              ))
            )}
            {hasMore && summaries.length > 0 && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                disabled={isLoadingMore}
                onPress={() => loadSummaries(false)}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color={LMN8Colors.text100} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LMN8Colors.bgDark,
  },
  loadingText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text85,
    marginTop: LMN8Spacing.md,
  },
  floatingElement: {
    position: 'absolute',
    top: height * 0.14,
    right: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: `${LMN8Colors.accentPrimary}08`,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: LMN8Spacing.xl,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    marginBottom: LMN8Spacing.xl,
    gap: LMN8Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${LMN8Colors.container}90`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTextContainer: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: LMN8Spacing.sm,
    marginBottom: LMN8Spacing.lg,
  },
  filterChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}30`,
    backgroundColor: `${LMN8Colors.container}92`,
    paddingVertical: LMN8Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    borderColor: `${LMN8Colors.accentPrimary}65`,
    backgroundColor: `${LMN8Colors.accentPrimary}22`,
  },
  filterChipText: {
    ...LMN8Typography.metadata,
    color: LMN8Colors.text85,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: LMN8Colors.text100,
  },
  title: {
    ...LMN8Typography.h2,
    fontSize: 24,
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.xs,
  },
  subtitle: {
    ...LMN8Typography.body,
    color: LMN8Colors.text60,
    fontSize: 13,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: `${LMN8Colors.container}96`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
    padding: LMN8Spacing.lg,
    marginBottom: LMN8Spacing.md,
  },
  summaryText: {
    ...LMN8Typography.body,
    color: LMN8Colors.text100,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: LMN8Spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: LMN8Spacing.sm,
  },
  metaText: {
    ...LMN8Typography.metadata,
    color: LMN8Colors.text60,
    fontSize: 11,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: `${LMN8Colors.container}92`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}15`,
    padding: LMN8Spacing.xl,
    gap: LMN8Spacing.sm,
  },
  emptyTitle: {
    ...LMN8Typography.h3,
    fontSize: 18,
    color: LMN8Colors.text100,
  },
  emptyText: {
    ...LMN8Typography.body,
    fontSize: 13,
    color: LMN8Colors.text60,
    textAlign: 'center',
  },
  entryCard: {
    marginBottom: LMN8Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  entryCardGradient: {
    padding: LMN8Spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}15`,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LMN8Spacing.sm,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.sm,
  },
  mediaIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaLabel: {
    ...LMN8Typography.label,
    fontSize: 10,
    color: LMN8Colors.text85,
    letterSpacing: 0.6,
  },
  entryDate: {
    ...LMN8Typography.metadata,
    fontSize: 11,
    color: LMN8Colors.text60,
  },
  entryTitle: {
    ...LMN8Typography.h3,
    fontSize: 17,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginBottom: LMN8Spacing.xs,
  },
  entryContent: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '300',
    color: LMN8Colors.text85,
    lineHeight: 20,
    marginBottom: LMN8Spacing.sm,
  },
  transcribedBox: {
    backgroundColor: `${LMN8Colors.bgLight}60`,
    padding: LMN8Spacing.sm,
    borderRadius: 10,
    marginBottom: LMN8Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: LMN8Colors.accentSecondary,
  },
  transcribedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  transcribedLabel: {
    ...LMN8Typography.label,
    fontSize: 9,
    color: LMN8Colors.accentSecondary,
    letterSpacing: 0.8,
  },
  transcribedText: {
    ...LMN8Typography.body,
    fontSize: 12,
    fontWeight: '300',
    color: LMN8Colors.text85,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: LMN8Spacing.xs,
  },
  moodBadge: {
    paddingHorizontal: LMN8Spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  moodText: {
    ...LMN8Typography.metadata,
    fontSize: 11,
    fontWeight: '600',
  },
  loadMoreButton: {
    marginTop: LMN8Spacing.md,
    backgroundColor: `${LMN8Colors.accentPrimary}30`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}50`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: LMN8Spacing.md,
  },
  loadMoreText: {
    ...LMN8Typography.button,
    color: LMN8Colors.text100,
  },
});
