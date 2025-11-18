import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useDatabase } from '@/contexts/DatabaseContext';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

interface TherapeuticDashboardProps {
  onNavigateToSessions: () => void;
  onNavigateToGoals: () => void;
  onNavigateToProfile: () => void;
  onDebugDatabase?: () => void;
  onLogout?: () => void; // Add logout function
}

export const TherapeuticDashboard: React.FC<TherapeuticDashboardProps> = ({
  onNavigateToSessions,
  onNavigateToGoals,
  onNavigateToProfile,
  onLogout,
}) => {
  const { currentPatient, sessions, goals, isInitialized } = useDatabase();

  if (!isInitialized) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Initializing your sacred space...</ThemedText>
      </ThemedView>
    );
  }

  if (!currentPatient) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>No patient data found. Please restart the app.</ThemedText>
      </ThemedView>
    );
  }

  const recentSessions = sessions.slice(0, 3);
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMoodEmoji = (rating: number) => {
    if (rating >= 8) return '😊';
    if (rating >= 6) return '🙂';
    if (rating >= 4) return '😐';
    if (rating >= 2) return '😔';
    return '😢';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Logout */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText type="title" style={styles.greeting}>
              Welcome back, {currentPatient?.name || 'Patient'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Your therapeutic journey continues here
            </ThemedText>
          </View>
          {onLogout && (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <ThemedText style={styles.logoutButtonText}>Logout</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Stats */}
      <ThemedView style={styles.statsContainer}>
        <View style={styles.statCard}>
          <ThemedText type="title" style={styles.statNumber}>
            {sessions.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Total Sessions</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText type="title" style={styles.statNumber}>
            {activeGoals.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Active Goals</ThemedText>
        </View>
        <View style={styles.statCard}>
          <ThemedText type="title" style={styles.statNumber}>
            {completedGoals.length}
          </ThemedText>
          <ThemedText style={styles.statLabel}>Completed</ThemedText>
        </View>
      </ThemedView>

      {/* Recent Sessions */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Recent Sessions
          </ThemedText>
          <TouchableOpacity onPress={onNavigateToSessions}>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableOpacity>
        </View>
        
        {recentSessions.length > 0 ? (
          recentSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <ThemedText style={styles.sessionType}>
                  {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)} Session
                </ThemedText>
                <ThemedText style={styles.sessionDate}>
                  {formatDate(session.sessionDate)}
                </ThemedText>
              </View>
              {session.moodRating && (
                <View style={styles.moodContainer}>
                  <ThemedText style={styles.moodEmoji}>
                    {getMoodEmoji(session.moodRating)}
                  </ThemedText>
                  <ThemedText style={styles.moodText}>
                    Mood: {session.moodRating}/10
                  </ThemedText>
                </View>
              )}
              {session.notes && (
                <ThemedText style={styles.sessionNotes} numberOfLines={2}>
                  {session.notes}
                </ThemedText>
              )}
            </View>
          ))
        ) : (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No sessions yet. Start your therapeutic journey today!
            </ThemedText>
            <TouchableOpacity style={styles.startButton} onPress={onNavigateToSessions}>
              <ThemedText style={styles.startButtonText}>Start First Session</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      {/* Active Goals */}
      <ThemedView style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Active Goals
          </ThemedText>
          <TouchableOpacity onPress={onNavigateToGoals}>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </TouchableOpacity>
        </View>
        
        {activeGoals.length > 0 ? (
          activeGoals.slice(0, 2).map((goal) => (
            <View key={goal.id} style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <ThemedText style={styles.goalTitle}>{goal.title}</ThemedText>
                <ThemedText style={styles.goalProgress}>
                  {goal.progress || 0}%
                </ThemedText>
              </View>
              {goal.description && (
                <ThemedText style={styles.goalDescription} numberOfLines={2}>
                  {goal.description}
                </ThemedText>
              )}
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${goal.progress || 0}%` }
                  ]} 
                />
              </View>
            </View>
          ))
        ) : (
          <ThemedView style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No active goals yet. Set your first therapeutic goal!
            </ThemedText>
            <TouchableOpacity style={styles.startButton} onPress={onNavigateToGoals}>
              <ThemedText style={styles.startButtonText}>Set First Goal</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Quick Actions
        </ThemedText>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToSessions}>
            <ThemedText style={styles.actionButtonText}>New Session</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onNavigateToGoals}>
            <ThemedText style={styles.actionButtonText}>New Goal</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Debug Section - Only show in development */}
        {__DEV__ && onDebugDatabase && (
          <View style={styles.debugSection}>
            <TouchableOpacity style={styles.debugButton} onPress={onDebugDatabase}>
              <ThemedText style={styles.debugButtonText}>🔍 Debug Database</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#1c2541',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  seeAllText: {
    color: '#3498db',
    fontWeight: '500',
  },
  sessionCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionType: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  sessionDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  moodText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  sessionNotes: {
    fontSize: 14,
    color: '#34495e',
    fontStyle: 'italic',
  },
  goalCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  goalDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27ae60',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginBottom: 15,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    flex: 0.45,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  debugSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  debugButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});
