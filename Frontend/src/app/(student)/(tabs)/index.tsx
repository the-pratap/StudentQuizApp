import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { examService } from '../../../services/examService';
import { studentService } from '../../../services/studentService';
import { Exam } from '../../../types';
import { colors } from '../../../theme/colors';
import { ExamCard } from '../../../components/ExamCard';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorState } from '../../../components/ErrorState';
import { EmptyState } from '../../../components/EmptyState';

export default function StudentHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [{ exams: fetchedExams }, profileData] = await Promise.all([
        examService.getAllExams(),
        studentService.getProfile().catch(() => ({ stats: null })),
      ]);

      setExams(fetchedExams);
      setStats(profileData?.stats || null);
    } catch (err: any) {
      console.error('[Student Home Fetch Error]:', err);
      setError(err.message || 'Failed to load examination schedule.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const activeExams = exams.filter((e) => e.status === 'ACTIVE' && !e.studentAttempt);
  const upcomingExams = exams.filter((e) => e.status === 'UPCOMING');
  const completedExams = exams.filter((e) => e.studentAttempt || e.status === 'COMPLETED');
  const releasedResults = exams.filter((e) => e.resultReleased && e.studentAttempt);

  const handleExamPress = (exam: Exam) => {
    const targetId = exam.id || (exam as any)._id;
    if (exam.studentAttempt && exam.resultReleased) {
      router.push({
        pathname: '/(student)/exam/result' as any,
        params: { examId: targetId },
      });
    } else {
      router.push(`/(student)/exam/${targetId}` as any);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading your examination portal..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary, colors.secondary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              Hello, {user?.name ? user.name.split(' ')[0] : 'Student'} 👋
            </Text>
            <Text style={styles.taglineText}>Ready for your next exam?</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(student)/(tabs)/profile' as any)}
            style={styles.avatarButton}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarLetter}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="flash-outline" size={18} color={colors.success} />
            <Text style={styles.statNumber}>{activeExams.length}</Text>
            <Text style={styles.statLabel}>Active Now</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={18} color={colors.info} />
            <Text style={styles.statNumber}>{upcomingExams.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.statNumber}>{stats?.completedAttempts || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trophy-outline" size={18} color={colors.accent} />
            <Text style={styles.statNumber}>{stats?.averagePercentage ? `${stats.averagePercentage}%` : 'N/A'}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {error ? (
          <ErrorState message={error} onRetry={fetchDashboardData} />
        ) : null}

        {/* Section: ACTIVE EXAMS */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.activeDot} />
            <Text style={styles.sectionTitle}>Active Examinations</Text>
          </View>
          <Text style={styles.sectionCount}>{activeExams.length} Available</Text>
        </View>

        {activeExams.length > 0 ? (
          activeExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPress={() => handleExamPress(exam)}
            />
          ))
        ) : (
          <View style={styles.noActiveCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text style={styles.noActiveText}>
              No active exams right now. Check upcoming schedule below!
            </Text>
          </View>
        )}

        {/* Section: UPCOMING EXAMS */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar" size={18} color={colors.info} />
            <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Upcoming Exams</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/exams' as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {upcomingExams.length > 0 ? (
          upcomingExams.slice(0, 3).map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPress={() => handleExamPress(exam)}
            />
          ))
        ) : (
          <EmptyState
            title="No Upcoming Exams"
            message="Your professors have not scheduled upcoming tests yet."
            icon="calendar-outline"
          />
        )}

        {/* Section: RECENT COMPLETED & RESULTS */}
        {completedExams.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="ribbon-outline" size={18} color={colors.accent} />
                <Text style={[styles.sectionTitle, { marginLeft: 8 }]}>Past Submissions & Results</Text>
              </View>
            </View>

            {completedExams.slice(0, 3).map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onPress={() => handleExamPress(exam)}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  taglineText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  avatarButton: {
    marginLeft: 12,
  },
  avatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLetter: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: 8,
    shadowColor: colors.success,
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  noActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  noActiveText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
});
