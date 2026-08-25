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
import { adminService } from '../../../services/adminService';
import { colors } from '../../../theme/colors';
import { AdminStatCard } from '../../../components/AdminStatCard';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorState } from '../../../components/ErrorState';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const data = await adminService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch administration metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const metrics = dashboardData?.metrics;
  const recentAttempts = dashboardData?.recentAttempts || [];
  const recentStudents = dashboardData?.recentStudents || [];

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
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Admin Console ⚡</Text>
            <Text style={styles.subGreeting}>System Overview & Exam Operations</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.adminBadgeText}>Superadmin</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <LoadingState message="Aggregating examination statistics..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchDashboard} />
        ) : (
          <>
            {/* 6 Key Stat Cards Grid */}
            <View style={styles.statsGrid}>
              <AdminStatCard
                title="Total Students"
                value={metrics?.totalStudents || 0}
                icon="people"
                color={colors.secondary}
                subtitle={`${metrics?.blockedStudents || 0} blocked`}
                onPress={() => router.push('/(admin)/(tabs)/students' as any)}
              />

              <AdminStatCard
                title="Total Exams"
                value={metrics?.totalExams || 0}
                icon="layers"
                color={colors.primary}
                subtitle={`${metrics?.totalQuestions || 0} questions`}
                onPress={() => router.push('/(admin)/(tabs)/exams' as any)}
              />

              <AdminStatCard
                title="Active Exams"
                value={metrics?.activeExams || 0}
                icon="radio"
                color={colors.success}
                subtitle="Live examination hall"
                onPress={() => router.push('/(admin)/(tabs)/exams' as any)}
              />

              <AdminStatCard
                title="Total Attempts"
                value={metrics?.totalAttempts || 0}
                icon="checkmark-done-circle"
                color={colors.info}
                subtitle="Completed submissions"
              />

              <AdminStatCard
                title="Results Pending"
                value={metrics?.resultsPending || 0}
                icon="hourglass"
                color={colors.warning}
                subtitle="Awaiting admin release"
                onPress={() => router.push('/(admin)/(tabs)/results' as any)}
              />

              <AdminStatCard
                title="Completed"
                value={metrics?.completedExams || 0}
                icon="trophy"
                color={colors.accent}
                subtitle="Concluded exams"
                onPress={() => router.push('/(admin)/(tabs)/exams' as any)}
              />
            </View>

            {/* Quick Action Shortcuts */}
            <Text style={styles.sectionTitle}>Quick Management Actions</Text>
            <View style={styles.actionsRow}>
              <GlassButton
                title="Create Exam"
                variant="primary"
                size="medium"
                onPress={() => router.push('/(admin)/create-exam' as any)}
                icon={<Ionicons name="add-circle-outline" size={18} color="#FFF" />}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Manage Results"
                variant="secondary"
                size="medium"
                onPress={() => router.push('/(admin)/(tabs)/results' as any)}
                icon={<Ionicons name="ribbon-outline" size={18} color="#FFF" />}
                style={{ flex: 1 }}
              />
            </View>

            {/* Recent Submissions Feed */}
            <View style={styles.feedHeader}>
              <Text style={styles.sectionTitle}>Recent Student Attempts</Text>
              <TouchableOpacity onPress={() => router.push('/(admin)/(tabs)/results' as any)}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentAttempts.length > 0 ? (
              recentAttempts.map((att: any) => (
                <GlassCard key={att.id} style={styles.attemptFeedCard}>
                  <View style={styles.feedTop}>
                    <View style={styles.feedStudentInfo}>
                      <Text style={styles.feedStudentName}>{att.studentName}</Text>
                      <Text style={styles.feedExamTitle}>{att.examTitle}</Text>
                    </View>
                    <View style={styles.feedScoreBadge}>
                      <Text style={styles.feedScoreText}>
                        {att.score}/{att.totalMarks} ({att.percentage}%)
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              ))
            ) : (
              <GlassCard style={styles.emptyFeedCard}>
                <Ionicons name="hourglass-outline" size={20} color={colors.textMuted} />
                <Text style={styles.emptyFeedText}>No recent student submissions.</Text>
              </GlassCard>
            )}

            {/* Recent Registered Students */}
            <View style={[styles.feedHeader, { marginTop: 20 }]}>
              <Text style={styles.sectionTitle}>Recent Students</Text>
              <TouchableOpacity onPress={() => router.push('/(admin)/(tabs)/students' as any)}>
                <Text style={styles.viewAllText}>Directory</Text>
              </TouchableOpacity>
            </View>

            {recentStudents.slice(0, 3).map((std: any) => (
              <GlassCard key={std._id} style={styles.studentFeedCard}>
                <View style={styles.studentFeedLeft}>
                  <View style={styles.studentAvatarMini}>
                    <Text style={styles.studentAvatarMiniText}>
                      {std.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentFeedName}>{std.name}</Text>
                    <Text style={styles.studentFeedEmail}>{std.email}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusChipMini,
                    std.status === 'blocked' ? styles.chipBlocked : styles.chipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipMiniText,
                      std.status === 'blocked' ? { color: colors.danger } : { color: colors.success },
                    ]}
                  >
                    {std.status.toUpperCase()}
                  </Text>
                </View>
              </GlassCard>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  subGreeting: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  adminBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  attemptFeedCard: {
    marginBottom: 10,
    padding: 14,
  },
  feedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedStudentInfo: {
    flex: 1,
  },
  feedStudentName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  feedExamTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  feedScoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  feedScoreText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyFeedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    marginBottom: 10,
  },
  emptyFeedText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  studentFeedCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  studentFeedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentAvatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentAvatarMiniText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  studentFeedName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  studentFeedEmail: {
    color: colors.textMuted,
    fontSize: 11,
  },
  statusChipMini: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  chipBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  statusChipMiniText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
