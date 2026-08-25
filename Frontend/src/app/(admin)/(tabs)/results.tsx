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
import { adminService } from '../../../services/adminService';
import { Exam } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';

export default function AdminResultsScreen() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      setError(null);
      const { exams: fetchedExams } = await examService.getAllExams();
      setExams(fetchedExams);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch examination results list.');
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

  const handleReleaseResult = (exam: Exam) => {
    Alert.alert(
      'Release Official Results?',
      `Are you sure you want to release results for "${exam.title}"? Once released, all students will immediately see their scores, percentage, question review, and the full leaderboard.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release to Students',
          style: 'default',
          onPress: async () => {
            setReleasingId(exam.id);
            try {
              await adminService.releaseResult(exam.id);
              Alert.alert('Success', `Results for "${exam.title}" have been officially published!`);
              fetchExams();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to release results.');
            } finally {
              setReleasingId(null);
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
        <Text style={styles.screenTitle}>Result Evaluations</Text>
        <Text style={styles.screenSubtitle}>Review attempt submissions and publish official scores</Text>
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
          <LoadingState message="Loading evaluation queue..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExams} />
        ) : exams.length === 0 ? (
          <EmptyState
            title="No Examinations to Evaluate"
            message="No exams have been created yet."
            icon="ribbon-outline"
          />
        ) : (
          exams.map((exam) => {
            const isReleased = exam.resultReleased;
            const isReleasing = releasingId === exam.id;

            return (
              <GlassCard
                key={exam.id}
                variant={isReleased ? 'success' : 'default'}
                style={styles.resultCard}
              >
                <View style={styles.cardTop}>
                  <View style={styles.subjectPill}>
                    <Text style={styles.subjectText}>{exam.subject}</Text>
                  </View>
                  <View
                    style={[
                      styles.releaseStatusBadge,
                      isReleased ? styles.badgeReleased : styles.badgePending,
                    ]}
                  >
                    <Ionicons
                      name={isReleased ? 'checkmark-circle' : 'hourglass-outline'}
                      size={13}
                      color={isReleased ? colors.success : colors.warning}
                    />
                    <Text
                      style={[
                        styles.releaseStatusText,
                        isReleased ? { color: colors.success } : { color: colors.warning },
                      ]}
                    >
                      {isReleased ? 'RESULTS RELEASED' : 'RESULT PENDING'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.examTitle}>{exam.title}</Text>
                <Text style={styles.examMeta}>
                  Conducted on {exam.examDate} • {exam.totalQuestions || 50} MCQs
                </Text>

                {/* Buttons Row */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    onPress={() => {
                      const targetId = exam.id || (exam as any)._id;
                      router.push(`/(admin)/exam-attempts/${targetId}` as any);
                    }}
                    style={styles.viewSubmissionsBtn}
                  >
                    <Ionicons name="people-outline" size={16} color={colors.secondary} />
                    <Text style={styles.viewSubmissionsText}>View Submissions</Text>
                  </TouchableOpacity>

                  {!isReleased ? (
                    <GlassButton
                      title="Release Result"
                      variant="primary"
                      size="small"
                      onPress={() => handleReleaseResult(exam)}
                      loading={isReleasing}
                      icon={<Ionicons name="megaphone-outline" size={15} color="#FFF" />}
                      style={styles.releaseBtn}
                    />
                  ) : (
                    <View style={styles.publishedIndicator}>
                      <Ionicons name="checkmark-done" size={16} color={colors.success} />
                      <Text style={styles.publishedIndicatorText}>Published</Text>
                    </View>
                  )}
                </View>
              </GlassCard>
            );
          })
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
    paddingBottom: 12,
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
    paddingTop: 10,
    paddingBottom: 40,
  },
  resultCard: {
    marginBottom: 14,
    padding: 18,
  },
  cardTop: {
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
  releaseStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  badgeReleased: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: colors.warning,
  },
  releaseStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  examTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  examMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  viewSubmissionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  viewSubmissionsText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  releaseBtn: {
    flex: 1,
  },
  publishedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
  },
  publishedIndicatorText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
});
