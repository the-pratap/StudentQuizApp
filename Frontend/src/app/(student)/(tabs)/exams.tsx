import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../../services/examService';
import { Exam } from '../../../types';
import { colors } from '../../../theme/colors';
import { ExamCard } from '../../../components/ExamCard';
import { GlassInput } from '../../../components/GlassInput';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorState } from '../../../components/ErrorState';

type FilterTab = 'ALL' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED';

export default function StudentExamsScreen() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchExams = async () => {
    try {
      setError(null);
      const { exams: fetchedExams } = await examService.getAllExams();
      setExams(fetchedExams);
    } catch (err: any) {
      setError(err.message || 'Failed to load examinations list.');
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

  // Filter & Search Logic
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'ACTIVE') {
      return exam.status === 'ACTIVE' && !exam.studentAttempt;
    }
    if (selectedFilter === 'UPCOMING') {
      return exam.status === 'UPCOMING';
    }
    if (selectedFilter === 'COMPLETED') {
      return exam.studentAttempt || exam.status === 'COMPLETED';
    }
    return true;
  });

  const handleExamPress = (exam: Exam) => {
    const targetId = exam.id || (exam as any)._id;
    if (exam.studentAttempt && exam.resultReleased) {
      router.push({
        pathname: '/(student)/exam/result' as any,
        params: { examId: targetId },
      });
    } else {
      router.push(`/(student)/exam/${targetId}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Examination Directory</Text>
        <Text style={styles.screenSubtitle}>View scheduled, active, and completed assessments</Text>

        {/* Search Bar */}
        <GlassInput
          placeholder="Search by title or subject..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchContainer}
        />

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['ALL', 'ACTIVE', 'UPCOMING', 'COMPLETED'] as FilterTab[]).map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setSelectedFilter(tab)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {tab === 'ALL' ? 'All Exams' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
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
          <LoadingState message="Fetching examinations..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchExams} />
        ) : filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onPress={() => handleExamPress(exam)}
            />
          ))
        ) : (
          <EmptyState
            title="No Examinations Found"
            message={
              searchQuery
                ? `No exams matching "${searchQuery}" in this category.`
                : 'No exams found in this category.'
            }
            icon="search-outline"
          />
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
    paddingBottom: 10,
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
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
});
