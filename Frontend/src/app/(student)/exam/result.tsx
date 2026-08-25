import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { studentService } from '../../../services/studentService';
import { attemptService } from '../../../services/attemptService';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorState } from '../../../components/ErrorState';

export default function ExamResultScreen() {
  const router = useRouter();
  const { examId, attemptId } = useLocalSearchParams<{
    examId?: string;
    attemptId?: string;
  }>();

  const [attemptData, setAttemptData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResult = async () => {
    try {
      setError(null);
      if (attemptId) {
        const data = await attemptService.getAttemptDetails(attemptId);
        setAttemptData(data);
      } else if (examId) {
        const attempts = await studentService.getAttempts();
        const found = attempts.find((a) => a.exam && a.exam.id === examId);
        if (found) {
          const detail = await attemptService.getAttemptDetails(found.id);
          setAttemptData(detail);
        } else {
          setError('No attempt found for this examination.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exam evaluation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [examId, attemptId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading your official examination scorecard..." />
      </View>
    );
  }

  if (error || !attemptData) {
    return (
      <View style={styles.container}>
        <ErrorState message={error || 'Result data unavailable'} onRetry={fetchResult} />
      </View>
    );
  }

  const exam = attemptData.exam;
  const isReleased = exam ? exam.resultReleased : false;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Examination Scorecard
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Scorecard Card */}
        <GlassCard variant="glow" style={styles.scoreCard}>
          <View style={styles.examBadgeRow}>
            <View style={styles.subjectBadge}>
              <Ionicons name="book-outline" size={13} color={colors.secondary} />
              <Text style={styles.subjectText}>{exam?.subject || 'Assessment'}</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={styles.verifiedText}>Official Result</Text>
            </View>
          </View>

          <Text style={styles.examTitle}>{exam?.title}</Text>

          {/* Circular Score Highlight */}
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.scoreRing}
          >
            <View style={styles.scoreInner}>
              <Text style={styles.scoreNumber}>{attemptData.score ?? 0}</Text>
              <Text style={styles.totalMarksText}>out of {attemptData.totalMarks ?? 50}</Text>
            </View>
          </LinearGradient>

          <Text style={styles.percentageBadge}>
            Score: {attemptData.percentage ?? 0}%
          </Text>

          {/* 3 Metric Grid: Correct / Wrong / Unanswered */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: colors.success }]} />
              <Text style={styles.metricVal}>{attemptData.correctCount ?? 0}</Text>
              <Text style={styles.metricLabel}>Correct</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.metricVal}>{attemptData.wrongCount ?? 0}</Text>
              <Text style={styles.metricLabel}>Incorrect</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: colors.textMuted }]} />
              <Text style={styles.metricVal}>{attemptData.unansweredCount ?? 0}</Text>
              <Text style={styles.metricLabel}>Skipped</Text>
            </View>
          </View>

          <GlassButton
            title="View Leaderboard & Rankings"
            variant="accent"
            size="medium"
            onPress={() => router.push('/(student)/(tabs)/leaderboard' as any)}
            icon={<Ionicons name="trophy-outline" size={18} color="#FFF" />}
            style={styles.leaderboardBtn}
          />
        </GlassCard>

        {/* Detailed Question Review Section */}
        {attemptData.breakdown && attemptData.breakdown.length > 0 && (
          <>
            <Text style={styles.breakdownHeading}>Detailed Answer Review</Text>
            {attemptData.breakdown.map((item: any, idx: number) => {
              const isCorrect = item.isCorrect;
              const isUnanswered = !item.selectedOption;

              return (
                <GlassCard
                  key={idx}
                  variant={isCorrect ? 'success' : isUnanswered ? 'default' : 'danger'}
                  style={styles.questionReviewCard}
                >
                  <View style={styles.qReviewHeader}>
                    <View
                      style={[
                        styles.qBadge,
                        isCorrect
                          ? styles.qBadgeCorrect
                          : isUnanswered
                          ? styles.qBadgeSkipped
                          : styles.qBadgeWrong,
                      ]}
                    >
                      <Text style={styles.qBadgeText}>Question {idx + 1}</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name={
                          isCorrect
                            ? 'checkmark-circle'
                            : isUnanswered
                            ? 'remove-circle-outline'
                            : 'close-circle'
                        }
                        size={16}
                        color={
                          isCorrect
                            ? colors.success
                            : isUnanswered
                            ? colors.textMuted
                            : colors.danger
                        }
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color: isCorrect
                              ? colors.success
                              : isUnanswered
                              ? colors.textMuted
                              : colors.danger,
                          },
                        ]}
                      >
                        {isCorrect ? '+1 Mark' : isUnanswered ? 'Skipped (0)' : '0 Marks'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.qReviewText}>{item.questionText}</Text>

                  {/* Options with Highlight */}
                  <View style={styles.qOptionsContainer}>
                    {item.options &&
                      item.options.map((opt: string, optIndex: number) => {
                        const letter = String.fromCharCode(65 + optIndex);
                        const isStudentChoice = item.selectedOption === letter;
                        const isCorrectAnswer = item.correctAnswer === letter;

                        let optCardStyle = styles.reviewOption;
                        let optTextStyle = styles.reviewOptionText;

                        if (isCorrectAnswer) {
                          optCardStyle = styles.reviewOptionCorrect;
                          optTextStyle = styles.reviewOptionTextCorrect;
                        } else if (isStudentChoice && !isCorrect) {
                          optCardStyle = styles.reviewOptionWrong;
                          optTextStyle = styles.reviewOptionTextWrong;
                        }

                        return (
                          <View key={optIndex} style={[styles.reviewOptionBase, optCardStyle]}>
                            <Text style={styles.reviewOptionLetter}>{letter}.</Text>
                            <Text style={[styles.reviewOptionTextBase, optTextStyle]}>
                              {opt}
                            </Text>
                            {isCorrectAnswer && (
                              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                            )}
                            {isStudentChoice && !isCorrect && (
                              <Ionicons name="close-circle" size={16} color={colors.danger} />
                            )}
                          </View>
                        );
                      })}
                  </View>

                  {item.explanation ? (
                    <View style={styles.explanationBox}>
                      <Ionicons name="information-circle-outline" size={16} color={colors.secondary} />
                      <Text style={styles.explanationText}>
                        <Text style={{ fontWeight: '700', color: colors.text }}>Explanation: </Text>
                        {item.explanation}
                      </Text>
                    </View>
                  ) : null}
                </GlassCard>
              );
            })}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  scoreCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  examBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  subjectText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  examTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  scoreInner: {
    width: '100%',
    height: '100%',
    borderRadius: 65,
    backgroundColor: '#0E1526',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreNumber: {
    color: '#FFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  totalMarksText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  percentageBadge: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  metricVal: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaderboardBtn: {
    width: '100%',
  },
  breakdownHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 14,
  },
  questionReviewCard: {
    marginBottom: 14,
    padding: 16,
  },
  qReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qBadgeCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  qBadgeWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  qBadgeSkipped: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  qBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  qReviewText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 14,
  },
  qOptionsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  reviewOptionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  reviewOption: {},
  reviewOptionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  reviewOptionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  reviewOptionLetter: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  reviewOptionTextBase: {
    flex: 1,
    fontSize: 13,
  },
  reviewOptionText: {
    color: colors.textSecondary,
  },
  reviewOptionTextCorrect: {
    color: '#FFF',
    fontWeight: '700',
  },
  reviewOptionTextWrong: {
    color: colors.danger,
    fontWeight: '600',
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  explanationText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});
