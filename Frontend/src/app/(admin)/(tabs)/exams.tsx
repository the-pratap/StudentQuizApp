import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../../services/examService';
import { Exam } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';

export default function AdminExamsScreen() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setError(null);
      const { exams: fetchedExams } = await examService.getAllExams();
      setExams(fetchedExams);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch examination directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExams();
  }, []);

  const handleDeleteExam = (exam: Exam) => {
    Alert.alert(
      'Delete Examination',
      `Are you sure you want to delete "${exam.title}"? This will permanently erase all 50 questions, student submissions, and OTP records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await examService.deleteExam(exam.id);
              fetchExams();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete exam.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.headerArea}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.screenTitle}>Exam Management</Text>
            <Text style={styles.screenSubtitle}>Configure schedules, 50 MCQs & OTPs</Text>
          </View>
          <GlassButton
            title="Create"
            variant="primary"
            size="small"
            onPress={() => router.push('/(admin)/create-exam' as any)}
            icon={<Ionicons name="add" size={16} color="#FFF" />}
          />
        </View>
      </View>

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
        {loading && !refreshing ? (
          <LoadingState message="Loading administrative exams list..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExams} />
        ) : exams.length === 0 ? (
          <EmptyState
            title="No Examinations Created"
            message="Create your first 50-MCQ examination to begin testing students."
            icon="layers-outline"
            actionTitle="Create Examination"
            onAction={() => router.push('/(admin)/create-exam' as any)}
          />
        ) : (
          exams.map((exam) => (
            <GlassCard key={exam.id} style={styles.examAdminCard}>
              {/* Card Top: Subject & Status */}
              <View style={styles.cardHeader}>
                <View style={styles.subjectPill}>
                  <Text style={styles.subjectText}>{exam.subject}</Text>
                </View>
                <View style={styles.badgeGroup}>
                  {exam.resultReleased ? (
                    <View style={styles.releasedBadge}>
                      <Ionicons name="trophy" size={10} color={colors.success} />
                      <Text style={styles.releasedBadgeText}>Released</Text>
                    </View>
                  ) : (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="time-outline" size={10} color={colors.warning} />
                      <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                  )}
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{exam.status}</Text>
                  </View>
                </View>
              </View>

              {/* Title & Schedule */}
              <Text style={styles.examTitle}>{exam.title}</Text>
              <Text style={styles.scheduleText}>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} /> {exam.examDate} at {exam.startTime} • {exam.durationMinutes || 10} Mins • {exam.totalQuestions || 50} MCQs
              </Text>

              {/* OTP Pill if available */}
              {exam.activeOtp && (
                <View style={styles.otpBanner}>
                  <Text style={styles.otpBannerLabel}>Active Exam OTP:</Text>
                  <View style={styles.otpBannerPill}>
                    <Text style={styles.otpBannerCode}>{exam.activeOtp}</Text>
                  </View>
                </View>
              )}

              {/* Admin Actions Bar */}
              <View style={styles.actionsBar}>
                <TouchableOpacity
                  onPress={() => {
                    const targetId = exam.id || (exam as any)._id;
                    router.push(`/(admin)/manage-questions/${targetId}` as any);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="list-outline" size={15} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Questions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const targetId = exam.id || (exam as any)._id;
                    router.push(`/(admin)/manage-otp/${targetId}` as any);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="key-outline" size={15} color={colors.secondary} />
                  <Text style={[styles.actionBtnText, { color: colors.secondary }]}>OTP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const targetId = exam.id || (exam as any)._id;
                    router.push(`/(admin)/exam-attempts/${targetId}` as any);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="people-outline" size={15} color={colors.success} />
                  <Text style={[styles.actionBtnText, { color: colors.success }]}>Attempts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    const targetId = exam.id || (exam as any)._id;
                    router.push(`/(admin)/edit-exam/${targetId}` as any);
                  }}
                  style={styles.iconOnlyBtn}
                >
                  <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteExam(exam)}
                  style={styles.iconOnlyBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
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
  headerArea: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  examAdminCard: {
    marginBottom: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  releasedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  releasedBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  examTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  scheduleText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 12,
  },
  otpBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  otpBannerLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  otpBannerPill: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  otpBannerCode: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconOnlyBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
