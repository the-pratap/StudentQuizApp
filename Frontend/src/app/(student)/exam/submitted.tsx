import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';

export default function ExamSubmittedScreen() {
  const router = useRouter();
  const { examTitle, submissionType, resultReleased } = useLocalSearchParams<{
    examTitle: string;
    submissionType: string;
    resultReleased: string;
  }>();

  const isTimeout = submissionType === 'timeout';
  const isReleased = resultReleased === 'true';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <GlassCard variant="glow" style={styles.card}>
          {/* Animated Success Circle */}
          <LinearGradient
            colors={isTimeout ? [colors.warning, '#D97706'] : [colors.success, '#059669']}
            style={styles.iconCircle}
          >
            <Ionicons
              name={isTimeout ? 'time-outline' : 'checkmark'}
              size={48}
              color="#FFFFFF"
            />
          </LinearGradient>

          <Text style={styles.title}>
            {isTimeout ? 'Time Expired' : 'Exam Submitted!'}
          </Text>

          <Text style={styles.examName} numberOfLines={2}>
            {examTitle || 'React Native & Full-Stack Fundamentals'}
          </Text>

          <View style={styles.noticeCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondary} />
            <Text style={styles.noticeText}>
              {isTimeout
                ? 'Your time limit reached 00:00. All recorded responses were automatically submitted to the secure examination server.'
                : 'Your answers have been securely evaluated and recorded in the database.'}
            </Text>
          </View>

          {/* Confidentiality Notice */}
          <View style={styles.confidentialCard}>
            <Ionicons name="lock-closed" size={16} color={colors.primary} />
            <Text style={styles.confidentialText}>
              {isReleased
                ? 'Official results have been announced! You can view your score and rank.'
                : 'Official results and leaderboard rankings will be published once the examination administrator evaluates all student submissions.'}
            </Text>
          </View>

          <View style={styles.buttonStack}>
            <GlassButton
              title="Return to Student Portal"
              variant="primary"
              size="large"
              onPress={() => router.replace('/(student)/(tabs)' as any)}
              icon={<Ionicons name="home-outline" size={18} color="#FFF" />}
              style={styles.homeBtn}
            />
          </View>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  content: {
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  examName: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  confidentialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 10,
  },
  confidentialText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  buttonStack: {
    width: '100%',
  },
  homeBtn: {
    width: '100%',
  },
});
