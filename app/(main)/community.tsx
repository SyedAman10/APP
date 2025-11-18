import { LMN8Colors, LMN8Spacing, LMN8Typography } from '@/constants/LMN8DesignSystem';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
    FlatList,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  content: string;
  timestamp: string;
  category: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  milestone?: {
    title: string;
    icon: string;
    color: string;
  };
}

// Mock data - TODO: Load from backend
const MOCK_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: { name: 'Sarah M.', verified: true },
    content: 'Just completed my 7th consecutive day! This community has been such a source of strength. Remember: progress isn\'t always linear, but every step counts. 💪',
    timestamp: '2h ago',
    category: 'Milestone',
    likes: 24,
    comments: 8,
    isLiked: false,
    milestone: {
      title: 'Week Warrior',
      icon: 'flame',
      color: '#ef4444',
    },
  },
  {
    id: '2',
    author: { name: 'Alex K.', verified: false },
    content: 'Had a tough day today, but I chose to journal instead of bottling it up. Small victories matter. 🌱',
    timestamp: '5h ago',
    category: 'Reflection',
    likes: 42,
    comments: 15,
    isLiked: true,
  },
  {
    id: '3',
    author: { name: 'Jordan L.', verified: true },
    content: 'To anyone struggling today: You\'re not alone. This space is proof that healing is possible. Sending love to everyone on their journey. ❤️',
    timestamp: '8h ago',
    category: 'Support',
    likes: 67,
    comments: 23,
    isLiked: false,
  },
  {
    id: '4',
    author: { name: 'Morgan P.', verified: false },
    content: 'My therapist recommended the mindfulness theme and it\'s been life-changing. The AI responses feel so much more aligned with what I need. Thank you for building this! 🙏',
    timestamp: '12h ago',
    category: 'Tip',
    likes: 35,
    comments: 12,
    isLiked: true,
  },
  {
    id: '5',
    author: { name: 'Casey R.', verified: true },
    content: 'Mood improvement: 30%! 📈 It took time, but consistency really does pay off. To anyone just starting: keep going. You\'ve got this!',
    timestamp: '1d ago',
    category: 'Milestone',
    likes: 89,
    comments: 31,
    isLiked: false,
    milestone: {
      title: 'Mood Master',
      icon: 'happy',
      color: '#ec4899',
    },
  },
];

const CATEGORIES = ['All', 'Milestone', 'Support', 'Reflection', 'Tip', 'Question'];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [posts, setPosts] = useState(MOCK_POSTS);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const filteredPosts = selectedCategory === 'All' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={styles.postCard}>
      <LinearGradient
        colors={[`${LMN8Colors.container}98`, `${LMN8Colors.container}95`]}
        style={styles.postGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[LMN8Colors.accentPrimary, LMN8Colors.accentSecondary]}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {item.author.name.charAt(0)}
                </Text>
              </LinearGradient>
              {item.author.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={LMN8Colors.accentPrimary} />
                </View>
              )}
            </View>
            <View style={styles.authorDetails}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>{item.author.name}</Text>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              </View>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={LMN8Colors.text60} />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <Text style={styles.postContent}>{item.content}</Text>

        {/* Milestone Badge */}
        {item.milestone && (
          <View style={styles.milestoneContainer}>
            <LinearGradient
              colors={[`${item.milestone.color}25`, `${item.milestone.color}15`]}
              style={styles.milestoneGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={[styles.milestoneIcon, { backgroundColor: `${item.milestone.color}20` }]}>
                <Ionicons name={item.milestone.icon as any} size={20} color={item.milestone.color} />
              </View>
              <Text style={styles.milestoneText}>
                Unlocked: <Text style={styles.milestoneTitle}>{item.milestone.title}</Text>
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons 
              name={item.isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={item.isLiked ? "#ec4899" : LMN8Colors.text60} 
            />
            <Text style={[styles.actionText, item.isLiked && styles.actionTextActive]}>
              {item.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={LMN8Colors.text60} />
            <Text style={styles.actionText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color={LMN8Colors.text60} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.supportButton]}>
            <Ionicons name="heart-circle-outline" size={20} color={LMN8Colors.accentSecondary} />
            <Text style={styles.supportText}>Support</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'Milestone': return `${LMN8Colors.accentPrimary}20`;
      case 'Support': return `${LMN8Colors.accentSecondary}20`;
      case 'Reflection': return '#8b5cf620';
      case 'Tip': return '#06b6d420';
      case 'Question': return '#f59e0b20';
      default: return `${LMN8Colors.text60}20`;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={LMN8Colors.text100} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Community</Text>
            <Text style={styles.headerSubtitle}>Share your journey</Text>
          </View>
          <TouchableOpacity style={styles.newPostButton}>
            <Ionicons name="add-circle" size={28} color={LMN8Colors.accentPrimary} />
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((category, index) => {
              const isSelected = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    index === 0 && styles.firstChip,
                    index === CATEGORIES.length - 1 && styles.lastChip,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    isSelected && styles.categoryChipTextSelected,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Community Stats */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={LMN8Colors.accentPrimary} />
            <Text style={styles.statText}>1.2k members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color="#ec4899" />
            <Text style={styles.statText}>342 posts today</Text>
          </View>
        </View>

        {/* Posts Feed */}
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.feedContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={LMN8Colors.text60} />
              <Text style={styles.emptyStateTitle}>No posts yet</Text>
              <Text style={styles.emptyStateText}>
                Be the first to share your journey with the community!
              </Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LMN8Colors.bgDark,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.md,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${LMN8Colors.container}95`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}20`,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    ...LMN8Typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: LMN8Colors.text100,
  },

  headerSubtitle: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
  },

  newPostButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoriesWrapper: {
    marginBottom: LMN8Spacing.md,
  },

  categoriesContent: {
    paddingHorizontal: LMN8Spacing.lg,
    paddingVertical: 4,
  },

  categoryChip: {
    paddingHorizontal: LMN8Spacing.md,
    paddingVertical: LMN8Spacing.sm,
    borderRadius: 20,
    backgroundColor: `${LMN8Colors.container}80`,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}15`,
    marginRight: LMN8Spacing.sm,
  },

  firstChip: {
    marginLeft: 0,
  },

  lastChip: {
    marginRight: LMN8Spacing.lg,
  },

  categoryChipSelected: {
    backgroundColor: LMN8Colors.accentPrimary,
    borderColor: LMN8Colors.accentPrimary,
  },

  categoryChipText: {
    ...LMN8Typography.body,
    fontSize: 13,
    fontWeight: '600',
    color: LMN8Colors.text85,
  },

  categoryChipTextSelected: {
    color: '#fff',
  },

  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: LMN8Spacing.sm,
    paddingHorizontal: LMN8Spacing.lg,
    backgroundColor: `${LMN8Colors.container}60`,
    borderBottomWidth: 1,
    borderBottomColor: `${LMN8Colors.accentPrimary}10`,
    marginBottom: LMN8Spacing.md,
    gap: LMN8Spacing.md,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  statText: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text85,
    fontWeight: '500',
  },

  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: `${LMN8Colors.accentPrimary}20`,
  },

  feedContent: {
    paddingHorizontal: LMN8Spacing.lg,
    paddingBottom: LMN8Spacing.xxl,
  },

  postCard: {
    marginBottom: LMN8Spacing.lg,
    borderRadius: 18,
    overflow: 'hidden',
  },

  postGradient: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}15`,
    padding: LMN8Spacing.lg,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: LMN8Spacing.md,
  },

  authorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },

  avatarContainer: {
    position: 'relative',
    marginRight: LMN8Spacing.sm,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    ...LMN8Typography.body,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: LMN8Colors.bgDark,
    borderRadius: 10,
  },

  authorDetails: {
    flex: 1,
  },

  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.sm,
    marginBottom: 2,
  },

  authorName: {
    ...LMN8Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  categoryText: {
    ...LMN8Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: LMN8Colors.text100,
  },

  timestamp: {
    ...LMN8Typography.caption,
    fontSize: 12,
    color: LMN8Colors.text60,
  },

  moreButton: {
    padding: 4,
  },

  postContent: {
    ...LMN8Typography.body,
    fontSize: 15,
    color: LMN8Colors.text100,
    lineHeight: 22,
    marginBottom: LMN8Spacing.md,
  },

  milestoneContainer: {
    marginBottom: LMN8Spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },

  milestoneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: LMN8Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${LMN8Colors.accentPrimary}15`,
    gap: LMN8Spacing.sm,
  },

  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  milestoneText: {
    ...LMN8Typography.caption,
    fontSize: 13,
    color: LMN8Colors.text85,
  },

  milestoneTitle: {
    fontWeight: '700',
    color: LMN8Colors.text100,
  },

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LMN8Spacing.lg,
    paddingTop: LMN8Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${LMN8Colors.accentPrimary}10`,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  actionText: {
    ...LMN8Typography.caption,
    fontSize: 13,
    fontWeight: '600',
    color: LMN8Colors.text60,
  },

  actionTextActive: {
    color: '#ec4899',
  },

  supportButton: {
    marginLeft: 'auto',
    paddingHorizontal: LMN8Spacing.sm,
    paddingVertical: 4,
    backgroundColor: `${LMN8Colors.accentSecondary}15`,
    borderRadius: 12,
  },

  supportText: {
    ...LMN8Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    color: LMN8Colors.accentSecondary,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: LMN8Spacing.xxl * 2,
  },

  emptyStateTitle: {
    ...LMN8Typography.h3,
    fontSize: 20,
    fontWeight: '600',
    color: LMN8Colors.text100,
    marginTop: LMN8Spacing.lg,
    marginBottom: LMN8Spacing.sm,
  },

  emptyStateText: {
    ...LMN8Typography.body,
    fontSize: 14,
    color: LMN8Colors.text60,
    textAlign: 'center',
    paddingHorizontal: LMN8Spacing.xl,
  },
});

