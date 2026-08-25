import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../../services/examService';
import { studentService } from '../../../services/studentService';
import { Exam, LeaderboardEntry } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';

export default function LeaderboardScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [examMeta, setExamMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isResultPending, setIsResultPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExams = async () => {
    try {
      const { exams: fetchedExams } = await examService.getAllExams();
      setExams(fetchedExams);
      if (fetchedExams.length > 0 && !selectedExamId) {
        // Prefer an exam that has resultReleased === true
        const released = fetchedExams.find((e) => e.resultReleased);
        const defaultId = released ? released.id : fetchedExams[0].id;
        setSelectedExamId(defaultId);
      }
    } catch (err: any) {
      console.error('[Leaderboard fetch exams error]:', err);
    }
  };

  const fetchLeaderboard = async (examId: string) => {
    setLoading(true);
    setError(null);
    setIsResultPending(false);
    try {
      const data = await studentService.getLeaderboard(examId);
      setLeaderboard(data.data || []);
      setExamMeta(data.exam || null);
    } catch (err: any) {
      if (err.code === 'RESULT_NOT_RELEASED' || err.status === 403) {
        setIsResultPending(true);
      } else {
        setError(err.message || 'Failed to load leaderboard rankings.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchLeaderboard(selectedExamId);
    }
  }, [selectedExamId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExams();
    if (selectedExamId) {
      fetchLeaderboard(selectedExamId);
    } else {
      setRefreshing(false);
    }
  }, [selectedExamId]);

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];
  const remainingRankers = leaderboard.slice(3);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.headerArea}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="trophy" size={26} color={colors.accent} />
          <Text style={styles.screenTitle}>Leaderboard</Text>
        </View>
        <Text style={styles.screenSubtitle}>Official merit list & performance rankings</Text>

        {/* Horizontal Exam Picker Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.examPickerContainer}
        >
          {exams.map((exam) => {
            const isSelected = exam.id === selectedExamId;
            return (
              <TouchableOpacity
                key={exam.id}
                onPress={() => setSelectedExamId(exam.id)}
                style={[
                  styles.examChip,
                  isSelected && styles.examChipActive,
                  exam.resultReleased && styles.examChipReleased,
                ]}
              >
                <Text
                  style={[
                    styles.examChipText,
                    isSelected && styles.examChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {exam.title}
                </Text>
                {exam.resultReleased && (
                  <View style={styles.releasedDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
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
          <LoadingState message="Loading leaderboard rankings..." />
        ) : isResultPending ? (
          <GlassCard style={styles.pendingCard}>
            <View style={styles.pendingIconCircle}>
              <Ionicons name="lock-closed-outline" size={32} color={colors.warning} />
            </View>
            <Text style={styles.pendingTitle}>Results Pending Release</Text>
            <Text style={styles.pendingDesc}>
              The exam has been conducted, but official scores and rankings are being evaluated by the administrator.
            </Text>
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={14} color={colors.warning} />
              <Text style={styles.pendingBadgeText}>Check back soon</Text>
            </View>
          </GlassCard>
        ) : error ? (
          <ErrorState message={error} onRetry={() => selectedExamId && fetchLeaderboard(selectedExamId)} />
        ) : leaderboard.length === 0 ? (
          <EmptyState
            title="No Submissions Yet"
            message="No students have submitted attempts for this examination yet."
            icon="people-outline"
          />
        ) : (
          <>
            {/* Podium (Top 3) */}
            <View style={styles.podiumContainer}>
              {/* Rank 2 - Silver */}
              {top2 && (
                <View style={[styles.podiumItem, styles.podiumRank2]}>
                  <View style={[styles.avatarCircle, styles.silverBorder]}>
                    <Text style={styles.avatarInitial}>
                      {top2.studentName.charAt(0).toUpperCase()}
                    </Text>
                    <View style={[styles.rankBadge, styles.silverBadge]}>
                      <Text style={styles.rankBadgeText}>2</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top2.studentName.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumScore}>{top2.score}/{top2.totalMarks}</Text>
                  <Text style={styles.podiumPct}>{top2.percentage}%</Text>
                </View>
              )}

              {/* Rank 1 - Gold (Center, elevated) */}
              {top1 && (
                <View style={[styles.podiumItem, styles.podiumRank1]}>
                  <Ionicons name="sparkles" size={18} color="#FBBF24" style={styles.crownIcon} />
                  <View style={[styles.avatarCircle, styles.goldBorder]}>
                    <Text style={styles.avatarInitial}>
                      {top1.studentName.charAt(0).toUpperCase()}
                    </Text>
                    <View style={[styles.rankBadge, styles.goldBadge]}>
                      <Ionicons name="trophy" size={10} color="#000" />
                    </View>
                  </View>
                  <Text style={[styles.podiumName, styles.goldName]} numberOfLines={1}>
                    {top1.studentName.split(' ')[0]}
                  </Text>
                  <Text style={[styles.podiumScore, styles.goldScore]}>{top1.score}/{top1.totalMarks}</Text>
                  <Text style={styles.podiumPct}>{top1.percentage}%</Text>
                </View>
              )}

              {/* Rank 3 - Bronze */}
              {top3 && (
                <View style={[styles.podiumItem, styles.podiumRank3]}>
                  <View style={[styles.avatarCircle, styles.bronzeBorder]}>
                    <Text style={styles.avatarInitial}>
                      {top3.studentName.charAt(0).toUpperCase()}
                    </Text>
                    <View style={[styles.rankBadge, styles.bronzeBadge]}>
                      <Text style={styles.rankBadgeText}>3</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {top3.studentName.split(' ')[0]}
                  </Text>
                  <Text style={styles.podiumScore}>{top3.score}/{top3.totalMarks}</Text>
                  <Text style={styles.podiumPct}>{top3.percentage}%</Text>
                </View>
              )}
            </View>

            {/* Complete Ranking List */}
            <Text style={styles.rankingListHeader}>Complete Rankings</Text>
            {leaderboard.map((item) => (
              <GlassCard
                key={item.rank}
                variant={item.isCurrentUser ? 'glow' : 'default'}
                style={[
                  styles.rankRow,
                  item.isCurrentUser ? styles.currentUserRow : undefined,
                ].filter(Boolean) as any}
              >
                <View style={styles.rankLeft}>
                  <View
                    style={[
                      styles.rankNumberPill,
                      item.rank === 1
                        ? styles.goldPill
                        : item.rank === 2
                        ? styles.silverPill
                        : item.rank === 3
                        ? styles.bronzePill
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rankNumberText,
                        item.rank <= 3 && { color: '#000', fontWeight: '900' },
                      ]}
                    >
                      #{item.rank}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {item.studentName} {item.isCurrentUser ? '(You)' : ''}
                    </Text>
                    <Text style={styles.studentEmail} numberOfLines={1}>
                      {item.studentEmail}
                    </Text>
                  </View>
                </View>

                <View style={styles.rankRight}>
                  <Text style={styles.scoreText}>
                    {item.score}/{item.totalMarks}
                  </Text>
                  <View style={styles.percentagePill}>
                    <Text style={styles.percentageText}>{item.percentage}%</Text>
                  </View>
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
  headerArea: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginTop: 4,
    marginBottom: 14,
  },
  examPickerContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  examChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 200,
    gap: 6,
  },
  examChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  examChipReleased: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  examChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  examChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  releasedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  podiumContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  podiumRank1: {
    paddingVertical: 20,
    backgroundColor: 'rgba(25, 33, 58, 0.85)',
    borderColor: 'rgba(251, 191, 36, 0.5)',
    transform: [{ translateY: -10 }],
    shadowColor: '#FBBF24',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  podiumRank2: {
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  podiumRank3: {
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  crownIcon: {
    marginBottom: 4,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  goldBorder: {
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  silverBorder: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  bronzeBorder: {
    borderWidth: 2,
    borderColor: '#D97706',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadge: {
    backgroundColor: '#FBBF24',
  },
  silverBadge: {
    backgroundColor: '#CBD5E1',
  },
  bronzeBadge: {
    backgroundColor: '#D97706',
  },
  rankBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  podiumName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  goldName: {
    fontSize: 14,
    color: '#FDE68A',
  },
  podiumScore: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  goldScore: {
    fontSize: 15,
    color: '#FBBF24',
  },
  podiumPct: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  rankingListHeader: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 14,
  },
  currentUserRow: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumberPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goldPill: {
    backgroundColor: '#FBBF24',
  },
  silverPill: {
    backgroundColor: '#CBD5E1',
  },
  bronzePill: {
    backgroundColor: '#D97706',
  },
  rankNumberText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  studentEmail: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  rankRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  scoreText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  percentagePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  percentageText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  pendingCard: {
    alignItems: 'center',
    padding: 26,
    marginVertical: 24,
  },
  pendingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pendingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  pendingDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  pendingBadgeText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
});
