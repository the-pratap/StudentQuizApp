import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exam } from '../types';
import { colors } from '../theme/colors';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';

interface ExamCardProps {
  exam: Exam;
  onPress: () => void;
  isAdmin?: boolean;
  style?: ViewStyle;
}

export const ExamCard: React.FC<ExamCardProps> = ({
  exam,
  onPress,
  isAdmin = false,
  style,
}) => {
  const getStatusBadge = () => {
    if (exam.resultReleased) {
      return {
        label: 'Result Released',
        bg: colors.successGlass,
        border: colors.successBorder,
        text: colors.success,
        icon: 'trophy' as const,
      };
    }

    switch (exam.status) {
      case 'ACTIVE':
        return {
          label: 'Active Now',
          bg: 'rgba(16, 185, 129, 0.2)',
          border: colors.success,
          text: colors.success,
          icon: 'radio' as const,
        };
      case 'UPCOMING':
        return {
          label: 'Upcoming',
          bg: 'rgba(59, 130, 246, 0.2)',
          border: colors.info,
          text: colors.info,
          icon: 'calendar-outline' as const,
        };
      case 'COMPLETED':
        return {
          label: exam.resultReleased ? 'Completed' : 'Result Pending',
          bg: 'rgba(245, 158, 11, 0.2)',
          border: colors.warning,
          text: colors.warning,
          icon: 'time-outline' as const,
        };
      default:
        return {
          label: exam.status,
          bg: colors.glassBackgroundLight,
          border: colors.glassBorder,
          text: colors.textSecondary,
          icon: 'help-circle-outline' as const,
        };
    }
  };

  const badge = getStatusBadge();
  const hasAttempted = !!exam.studentAttempt;

  const getButtonConfig = () => {
    if (isAdmin) {
      return {
        title: 'Manage Exam',
        variant: 'primary' as const,
        icon: <Ionicons name="settings-outline" size={16} color="#FFF" />,
      };
    }

    if (hasAttempted) {
      if (exam.resultReleased) {
        return {
          title: `View Result (${exam.studentAttempt?.score || 0}/${exam.totalQuestions || 50})`,
          variant: 'accent' as const,
          icon: <Ionicons name="trophy-outline" size={16} color="#FFF" />,
        };
      }
      return {
        title: 'Exam Submitted',
        variant: 'outline' as const,
        icon: <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />,
      };
    }

    if (exam.status === 'ACTIVE') {
      return {
        title: 'Start Exam',
        variant: 'primary' as const,
        icon: <Ionicons name="play-outline" size={16} color="#FFF" />,
      };
    }

    if (exam.status === 'UPCOMING') {
      return {
        title: `Starts at ${exam.startTime}`,
        variant: 'outline' as const,
        icon: <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />,
      };
    }

    return {
      title: 'View Details',
      variant: 'outline' as const,
      icon: <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />,
    };
  };

  const btnConfig = getButtonConfig();

  return (
    <GlassCard
      variant={exam.status === 'ACTIVE' && !hasAttempted ? 'glow' : 'default'}
      style={style ? [styles.card, style] : styles.card}
    >
      {/* Header with Subject & Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.subjectPill}>
          <Ionicons name="book-outline" size={13} color={colors.secondary} />
          <Text style={styles.subjectText}>{exam.subject}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Ionicons name={badge.icon} size={12} color={badge.text} style={styles.badgeIcon} />
          <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>
        {exam.title}
      </Text>

      {/* Description if available */}
      {exam.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {exam.description}
        </Text>
      ) : null}

      {/* Meta Specs Grid */}
      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <Ionicons name="help-circle-outline" size={15} color={colors.primary} />
          <Text style={styles.specText}>{exam.totalQuestions || 50} MCQs</Text>
        </View>
        <View style={styles.specDivider} />
        <View style={styles.specItem}>
          <Ionicons name="stopwatch-outline" size={15} color={colors.secondary} />
          <Text style={styles.specText}>{exam.durationMinutes || 10} Mins</Text>
        </View>
        <View style={styles.specDivider} />
        <View style={styles.specItem}>
          <Ionicons name="calendar-outline" size={15} color={colors.warning} />
          <Text style={styles.specText}>{exam.examDate}</Text>
        </View>
      </View>

      {/* Bottom Action Section */}
      <View style={styles.actionContainer}>
        {isAdmin && exam.activeOtp ? (
          <View style={styles.adminOtpRow}>
            <Text style={styles.otpLabel}>Active OTP:</Text>
            <View style={styles.otpPill}>
              <Text style={styles.otpCode}>{exam.activeOtp}</Text>
            </View>
          </View>
        ) : null}
        <GlassButton
          title={btnConfig.title}
          variant={btnConfig.variant}
          icon={btnConfig.icon}
          size="medium"
          onPress={onPress}
          style={styles.actionButton}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  subjectText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  specDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  actionContainer: {
    marginTop: 4,
  },
  adminOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  otpLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  otpPill: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  otpCode: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  actionButton: {
    width: '100%',
  },
});
