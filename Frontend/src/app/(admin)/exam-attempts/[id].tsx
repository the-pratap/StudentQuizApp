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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../../services/adminService';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';

export default function ExamAttemptsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [examMeta, setExamMeta] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttempts = async () => {
    try {
      setError(null);
      const data = await adminService.getExamAttempts(id!);
      setExamMeta(data.exam);
      setAttempts(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exam attempts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchAttempts();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttempts();
  }, []);

  const handleRelease = () => {
    Alert.alert(
      'Release Official Results?',
      `Are you sure you want to release results for "${examMeta?.title}"? All participating students will immediately see scores and rankings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Now',
          style: 'default',
          onPress: async () => {
            setReleasing(true);
            try {
              await adminService.releaseResult(id!);
              Alert.alert('Success', 'Results have been officially published!');
              fetchAttempts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to release results.');
            } finally {
              setReleasing(false);
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

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>
            Attempt Logs & Evaluation
          </Text>
          <Text style={styles.navSubTitle} numberOfLines={1}>
            {examMeta?.title || 'Exam'}
          </Text>
        </View>
        <View style={{ width: 40 }} />
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
        {/* Release Status Banner */}
        {examMeta && (
          <GlassCard
            variant={examMeta.resultReleased ? 'success' : 'default'}
            style={styles.metaCard}
          >
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaStatusLabel}>
                  {examMeta.resultReleased ? 'Results Published' : 'Results Evaluation Pending'}
                </Text>
                <Text style={styles.metaSub}>
                  {attempts.length} Student Submissions Recorded
                </Text>
              </View>
              {!examMeta.resultReleased && (
                <GlassButton
                  title="Release Results"
                  variant="primary"
                  size="small"
                  onPress={handleRelease}
                  loading={releasing}
                  icon={<Ionicons name="megaphone-outline" size={14} color="#FFF" />}
                />
              )}
            </View>
          </GlassCard>
        )}

        {loading && !refreshing ? (
          <LoadingState message="Loading student submissions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchAttempts} />
        ) : attempts.length === 0 ? (
          <EmptyState
            title="No Submissions Yet"
            message="No students have attempted this examination yet."
            icon="people-outline"
          />
        ) : (
          attempts.map((item, idx) => (
            <GlassCard key={item.id} style={styles.attemptCard}>
              <View style={styles.attemptTop}>
                <View style={styles.rankPill}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{item.studentName}</Text>
                  <Text style={styles.studentEmail}>{item.studentEmail}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreNumber}>
                    {item.score}/{item.totalMarks}
                  </Text>
                  <View style={styles.percentagePill}>
                    <Text style={styles.percentageText}>{item.percentage}%</Text>
                  </View>
                </View>
              </View>

              <View style={styles.attemptBottom}>
                <View style={styles.submissionTypeRow}>
                  <Ionicons
                    name={
                      item.submissionType === 'timeout'
                        ? 'time-outline'
                        : 'checkmark-circle-outline'
                    }
                    size={13}
                    color={
                      item.submissionType === 'timeout'
                        ? colors.warning
                        : colors.success
                    }
                  />
                  <Text style={styles.submissionTypeText}>
                    {item.submissionType === 'timeout' ? 'Auto-Timeout' : 'Manual Submit'}
                  </Text>
                </View>

                <Text style={styles.durationText}>
                  Time Spent: {Math.floor((item.durationSpentSeconds || 0) / 60)}m {(item.durationSpentSeconds || 0) % 60}s
                </Text>
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
  navCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  navTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  navSubTitle: {
    color: colors.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  metaCard: {
    marginBottom: 16,
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaStatusLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  metaSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  attemptCard: {
    marginBottom: 12,
    padding: 16,
  },
  attemptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
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
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  percentagePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  percentageText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  attemptBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  submissionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  submissionTypeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  durationText: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
