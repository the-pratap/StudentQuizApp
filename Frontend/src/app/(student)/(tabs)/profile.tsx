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
import { useAuth } from '../../../context/AuthContext';
import { studentService } from '../../../services/studentService';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const [profile, fetchedAttempts] = await Promise.all([
        studentService.getProfile(),
        studentService.getAttempts(),
      ]);
      setProfileData(profile);
      setAttempts(fetchedAttempts);
    } catch (err: any) {
      console.error('[Profile Fetch Error]:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  };

  const stats = profileData?.stats;

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
        {/* Profile Header Card */}
        <GlassCard variant="glow" style={styles.profileCard}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.avatarLarge}
          >
            <Text style={styles.avatarLargeText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </LinearGradient>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          <View style={styles.rolePillsRow}>
            <View style={styles.rolePill}>
              <Ionicons name="school-outline" size={13} color={colors.secondary} />
              <Text style={styles.rolePillText}>Student Account</Text>
            </View>
            <View style={[styles.rolePill, styles.statusPill]}>
              <View style={styles.statusDot} />
              <Text style={[styles.rolePillText, { color: colors.success }]}>
                {user?.status ? user.status.toUpperCase() : 'ACTIVE'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Academic Performance Summary */}
        <Text style={styles.sectionHeading}>Performance Metrics</Text>
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statGridItem}>
            <Ionicons name="documents-outline" size={22} color={colors.primary} />
            <Text style={styles.statGridValue}>{stats?.totalAttempts || 0}</Text>
            <Text style={styles.statGridLabel}>Exams Attempted</Text>
          </GlassCard>

          <GlassCard style={styles.statGridItem}>
            <Ionicons name="trophy-outline" size={22} color={colors.accent} />
            <Text style={styles.statGridValue}>
              {stats?.averagePercentage ? `${stats.averagePercentage}%` : 'N/A'}
            </Text>
            <Text style={styles.statGridLabel}>Average Score</Text>
          </GlassCard>

          <GlassCard style={styles.statGridItem}>
            <Ionicons name="ribbon-outline" size={22} color={colors.success} />
            <Text style={styles.statGridValue}>{stats?.releasedResultsCount || 0}</Text>
            <Text style={styles.statGridLabel}>Results Released</Text>
          </GlassCard>

          <GlassCard style={styles.statGridItem}>
            <Ionicons name="star-outline" size={22} color={colors.warning} />
            <Text style={styles.statGridValue}>
              {stats?.totalScoreObtained || 0}/{stats?.totalPossibleMarks || 0}
            </Text>
            <Text style={styles.statGridLabel}>Total Marks</Text>
          </GlassCard>
        </View>

        {/* Exam History */}
        <Text style={[styles.sectionHeading, { marginTop: 18 }]}>Attempt History</Text>
        {attempts.length > 0 ? (
          attempts.map((att) => {
            const exam = att.exam;
            return (
              <GlassCard key={att.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyTitle}>{exam?.title || 'Examination'}</Text>
                    <Text style={styles.historyDate}>
                      {exam?.subject} • {new Date(att.startedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.historyBadge,
                      att.resultReleased ? styles.badgeReleased : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.historyBadgeText,
                        att.resultReleased ? { color: colors.success } : { color: colors.warning },
                      ]}
                    >
                      {att.resultReleased ? `${att.score}/${att.totalMarks}` : 'Pending'}
                    </Text>
                  </View>
                </View>

                {att.resultReleased && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(student)/exam/result' as any,
                        params: { examId: exam?.id },
                      })
                    }
                    style={styles.viewResultLink}
                  >
                    <Text style={styles.viewResultLinkText}>View Detailed Breakdown</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </GlassCard>
            );
          })
        ) : (
          <GlassCard style={styles.noHistoryCard}>
            <Ionicons name="time-outline" size={24} color={colors.textMuted} />
            <Text style={styles.noHistoryText}>No examination attempts recorded yet.</Text>
          </GlassCard>
        )}

        {/* Logout Button */}
        <GlassButton
          title="Sign Out"
          variant="danger"
          size="medium"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={18} color="#FFF" />}
          style={styles.logoutBtn}
        />
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
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  avatarLargeText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  userName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  rolePillsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  rolePillText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  statGridItem: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
  },
  statGridValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 2,
  },
  statGridLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyCard: {
    marginBottom: 12,
    padding: 16,
  },
  historyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMeta: {
    flex: 1,
    marginRight: 10,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeReleased: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  badgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: colors.warning,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  viewResultLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  viewResultLinkText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  noHistoryCard: {
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  noHistoryText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  logoutBtn: {
    marginTop: 24,
  },
});
