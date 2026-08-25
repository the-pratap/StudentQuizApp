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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../../services/adminService';
import { StudentListItem } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';

export default function AdminStudentsScreen() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setError(null);
      const data = await adminService.getStudents();
      setStudents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student directory.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, []);

  const handleToggleBlock = (student: StudentListItem) => {
    const isBlocked = student.status === 'blocked';
    const actionText = isBlocked ? 'Unblock' : 'Block';

    Alert.alert(
      `${actionText} Student`,
      `Are you sure you want to ${actionText.toLowerCase()} ${student.name}? ${
        isBlocked
          ? 'They will regain access to examinations.'
          : 'They will be immediately blocked from accessing all protected exam features.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionText,
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (isBlocked) {
                await adminService.unblockStudent(student.id);
              } else {
                await adminService.blockStudent(student.id);
              }
              fetchStudents();
            } catch (err: any) {
              Alert.alert('Error', err.message || `Failed to ${actionText.toLowerCase()} student.`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteStudent = (student: StudentListItem) => {
    Alert.alert(
      'Delete Student Account',
      `Are you sure you want to delete ${student.name}'s account and all their exam attempts permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteStudent(student.id);
              fetchStudents();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete student.');
            }
          },
        },
      ]
    );
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Student Directory</Text>
        <Text style={styles.screenSubtitle}>Manage access controls, block/unblock, and attempt logs</Text>

        <GlassInput
          placeholder="Search by student name or email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchBox}
        />
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
          <LoadingState message="Fetching registered students..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchStudents} />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No Students Found"
            message={
              searchQuery
                ? `No students matching "${searchQuery}".`
                : 'No students have registered yet.'
            }
            icon="people-outline"
          />
        ) : (
          filteredStudents.map((std) => {
            const isBlocked = std.status === 'blocked';
            return (
              <GlassCard
                key={std.id}
                variant={isBlocked ? 'danger' : 'default'}
                style={styles.studentCard}
              >
                <View style={styles.cardMain}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{std.name.charAt(0).toUpperCase()}</Text>
                  </View>

                  <View style={styles.studentDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.studentName} numberOfLines={1}>
                        {std.name}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isBlocked ? styles.badgeBlocked : styles.badgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isBlocked ? { color: colors.danger } : { color: colors.success },
                          ]}
                        >
                          {std.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.studentEmail} numberOfLines={1}>
                      {std.email}
                    </Text>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        <Ionicons name="document-text-outline" size={11} color={colors.primary} />{' '}
                        {std.totalAttempts} Attempts
                      </Text>
                      <Text style={styles.metaDivider}>•</Text>
                      <Text style={styles.metaText}>
                        Joined {new Date(std.registeredDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Actions Footer */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => handleToggleBlock(std)}
                    style={[
                      styles.actionPill,
                      isBlocked ? styles.unblockPill : styles.blockPill,
                    ]}
                  >
                    <Ionicons
                      name={isBlocked ? 'shield-checkmark-outline' : 'ban-outline'}
                      size={14}
                      color={isBlocked ? colors.success : colors.warning}
                    />
                    <Text
                      style={[
                        styles.actionPillText,
                        { color: isBlocked ? colors.success : colors.warning },
                      ]}
                    >
                      {isBlocked ? 'Unblock Access' : 'Block Student'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteStudent(std)}
                    style={[styles.actionPill, styles.deletePill]}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[styles.actionPillText, { color: colors.danger }]}>Delete</Text>
                  </TouchableOpacity>
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
    paddingBottom: 6,
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
    marginBottom: 12,
  },
  searchBox: {
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  studentCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  studentDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  studentName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  studentEmail: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
  },
  badgeBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  metaDivider: {
    color: colors.textMuted,
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  blockPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  unblockPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  deletePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
