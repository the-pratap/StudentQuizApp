import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../../services/examService';
import { attemptService } from '../../../services/attemptService';
import { Exam } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { OTPModal } from '../../../components/OTPModal';
import { LoadingState } from '../../../components/LoadingState';
import { ErrorState } from '../../../components/ErrorState';

export default function ExamDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExamDetails = async () => {
    try {
      setError(null);
      const data = await examService.getExamById(id!);
      setExam(data.exam);
      setServerTime(data.serverTime);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchExamDetails();
  }, [id]);

  const handleStartExamPress = () => {
    if (!exam) return;

    if (exam.studentAttempt) {
      Alert.alert(
        'Attempt Recorded',
        'You have already attempted this exam. Each student is permitted only one attempt.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (exam.status === 'UPCOMING') {
      Alert.alert(
        'Exam Not Started',
        `This exam is scheduled to start at ${exam.startTime} on ${exam.examDate}. Please wait until the start time.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Open OTP Modal for secure authentication
    setOtpModalVisible(true);
  };

  const handleVerifyOtpAndStart = async (otp: string) => {
    setVerifyingOtp(true);
    try {
      const response = await attemptService.startExam(exam!.id, otp);
      setOtpModalVisible(false);

      // Navigate to Quiz screen with attempt data
      router.replace({
        pathname: '/(student)/exam/quiz' as any,
        params: {
          attemptId: response.attemptId,
          examTitle: exam!.title,
          durationMinutes: response.durationMinutes,
          totalQuestions: response.totalQuestions,
          startedAt: response.startedAt,
          questionsData: JSON.stringify(response.questions),
        },
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading exam parameters..." />
      </View>
    );
  }

  if (error || !exam) {
    return (
      <View style={styles.container}>
        <ErrorState message={error || 'Exam not found'} onRetry={fetchExamDetails} />
      </View>
    );
  }

  const hasAttempted = !!exam.studentAttempt;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Exam Specifications
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Banner Card */}
        <GlassCard variant="glow" style={styles.mainCard}>
          <View style={styles.subjectPill}>
            <Ionicons name="book-outline" size={13} color={colors.secondary} />
            <Text style={styles.subjectText}>{exam.subject}</Text>
          </View>

          <Text style={styles.examTitle}>{exam.title}</Text>
          {exam.description ? (
            <Text style={styles.examDesc}>{exam.description}</Text>
          ) : null}

          {/* Key Specs Grid */}
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.cellValue}>{exam.totalQuestions || 50}</Text>
              <Text style={styles.cellLabel}>MCQ Questions</Text>
            </View>
            <View style={styles.gridCell}>
              <Ionicons name="stopwatch-outline" size={20} color={colors.secondary} />
              <Text style={styles.cellValue}>{exam.durationMinutes || 10} Mins</Text>
              <Text style={styles.cellLabel}>Exam Duration</Text>
            </View>
            <View style={styles.gridCell}>
              <Ionicons name="calendar-outline" size={20} color={colors.warning} />
              <Text style={styles.cellValue}>{exam.startTime}</Text>
              <Text style={styles.cellLabel}>Start Time</Text>
            </View>
          </View>
        </GlassCard>

        {/* Examination Guidelines */}
        <Text style={styles.sectionHeader}>Instructions & Examination Rules</Text>
        <GlassCard style={styles.rulesCard}>
          <View style={styles.ruleItem}>
            <Ionicons name="key-outline" size={18} color={colors.primary} style={styles.ruleIcon} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Admin OTP Required:</Text> You must enter the 6-digit OTP code provided by your exam proctor to begin.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="shield-outline" size={18} color={colors.secondary} style={styles.ruleIcon} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Single Attempt Rule:</Text> You can attempt this exam only once. Once started, your session cannot be reset.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="alarm-outline" size={18} color={colors.danger} style={styles.ruleIcon} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Auto-Submission:</Text> When the 10-minute timer expires, the exam will automatically submit your saved answers.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.accent} style={styles.ruleIcon} />
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Result Confidentiality:</Text> Your score and leaderboard rankings will be visible after official administrator release.
            </Text>
          </View>
        </GlassCard>

        {/* Start / Attempt State Button */}
        <View style={styles.actionSection}>
          {hasAttempted ? (
            <GlassCard variant="success" style={styles.attemptedNotice}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.attemptedTitle}>Attempt Recorded</Text>
                <Text style={styles.attemptedSub}>
                  {exam.resultReleased
                    ? `Your result is released: ${exam.studentAttempt?.score}/${exam.totalQuestions}`
                    : 'Your answers are submitted. Waiting for admin result release.'}
                </Text>
              </View>
            </GlassCard>
          ) : (
            <GlassButton
              title={exam.status === 'UPCOMING' ? `Starts at ${exam.startTime}` : 'Start Exam Now'}
              variant="primary"
              size="large"
              onPress={handleStartExamPress}
              disabled={exam.status === 'UPCOMING'}
              icon={<Ionicons name="play" size={20} color="#FFF" />}
            />
          )}
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <OTPModal
        visible={otpModalVisible}
        examTitle={exam.title}
        onClose={() => setOtpModalVisible(false)}
        onSubmit={handleVerifyOtpAndStart}
        loading={verifyingOtp}
      />
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
  mainCard: {
    marginBottom: 22,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  subjectText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  examTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 8,
  },
  examDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridCell: {
    alignItems: 'center',
  },
  cellValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 2,
  },
  cellLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeader: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  rulesCard: {
    padding: 18,
    marginBottom: 24,
    gap: 14,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  ruleIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  ruleText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  ruleBold: {
    color: colors.text,
    fontWeight: '700',
  },
  actionSection: {
    marginTop: 8,
  },
  attemptedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  attemptedTitle: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  attemptedSub: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
});
