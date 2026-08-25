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
import { otpService } from '../../../services/otpService';
import { examService } from '../../../services/examService';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';

export default function ManageOTPScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [examTitle, setExamTitle] = useState('Exam');
  const [otp, setOtp] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchOTPData = async () => {
    try {
      const [examData, otpData] = await Promise.all([
        examService.getExamById(id!),
        otpService.getCurrentOTP(id!).catch(() => null),
      ]);
      setExamTitle(examData.exam.title);
      if (otpData) {
        setOtp(otpData.otp);
        setExpiresAt(otpData.expiresAt);
      }
    } catch (err: any) {
      console.error('[OTP fetch error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOTPData();
  }, [id]);

  const handleRegenerateOTP = () => {
    Alert.alert(
      'Regenerate OTP?',
      'Generating a new OTP will immediately invalidate any previous code. Only the new OTP can be used by students.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate Now',
          style: 'default',
          onPress: async () => {
            setGenerating(true);
            try {
              const res = await otpService.generateOTP(id!, 24);
              setOtp(res.otp);
              setExpiresAt(res.expiresAt);
              Alert.alert('New OTP Generated', `The active passcode for this exam is now: ${res.otp}`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to generate OTP.');
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading security credentials..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>
          Security & Access OTP
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard variant="glow" style={styles.otpCard}>
          <View style={styles.lockIconCircle}>
            <Ionicons name="key-outline" size={32} color={colors.primary} />
          </View>

          <Text style={styles.cardHeader}>Active Exam Passcode</Text>
          <Text style={styles.examTitleText} numberOfLines={2}>
            {examTitle}
          </Text>

          {/* Large Glowing 6-Digit Display */}
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.25)', 'rgba(6, 182, 212, 0.2)']}
            style={styles.codeBox}
          >
            <Text style={styles.codeText}>{otp || 'NO OTP'}</Text>
          </LinearGradient>

          {expiresAt && (
            <View style={styles.expiryRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.expiryText}>
                Valid until: {new Date(expiresAt).toLocaleString()}
              </Text>
            </View>
          )}

          {/* Regenerate Button */}
          <GlassButton
            title="Generate New OTP"
            variant="primary"
            size="large"
            onPress={handleRegenerateOTP}
            loading={generating}
            icon={<Ionicons name="refresh-outline" size={20} color="#FFF" />}
            style={styles.actionBtn}
          />
        </GlassCard>

        {/* Security Notes */}
        <Text style={styles.sectionTitle}>Administrator Guidelines</Text>
        <GlassCard style={styles.guidelinesCard}>
          <View style={styles.guideItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
            <Text style={styles.guideText}>
              Share this 6-digit OTP with students in the exam hall only when you are ready to begin.
            </Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.guideText}>
              Regenerating an OTP invalidates all previous codes immediately.
            </Text>
          </View>
        </GlassCard>
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
  otpCard: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  lockIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeader: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  examTitleText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  codeBox: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 36,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  codeText: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 8,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  expiryText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  actionBtn: {
    width: '100%',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  guidelinesCard: {
    padding: 18,
    gap: 14,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guideText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
