import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../../services/examService';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';

export default function EditExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [totalQuestions, setTotalQuestions] = useState('50');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = await examService.getExamById(id!);
        const ex = data.exam;
        setTitle(ex.title);
        setSubject(ex.subject);
        setDescription(ex.description || '');
        setExamDate(ex.examDate);
        setStartTime(ex.startTime);
        setDurationMinutes(String(ex.durationMinutes || 10));
        setTotalQuestions(String(ex.totalQuestions || 50));
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to fetch exam details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchExam();
  }, [id]);

  const handleUpdate = async () => {
    if (!title.trim() || !subject.trim() || !examDate.trim() || !startTime.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      await examService.updateExam(id!, {
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        examDate: examDate.trim(),
        startTime: startTime.trim(),
        durationMinutes: Number(durationMinutes) || 10,
        totalQuestions: Number(totalQuestions) || 50,
      });

      Alert.alert('Success', 'Exam updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update exam.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading exam specifications..." />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Examination</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GlassCard variant="glow" style={styles.formCard}>
          <GlassInput
            label="Exam Title"
            value={title}
            onChangeText={setTitle}
            leftIcon="document-text-outline"
          />

          <GlassInput
            label="Subject / Domain"
            value={subject}
            onChangeText={setSubject}
            leftIcon="book-outline"
          />

          <GlassInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 16 }}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <GlassInput
                label="Exam Date"
                value={examDate}
                onChangeText={setExamDate}
                leftIcon="calendar-outline"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <GlassInput
                label="Start Time"
                value={startTime}
                onChangeText={setStartTime}
                leftIcon="time-outline"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <GlassInput
                label="Duration (Minutes)"
                value={durationMinutes}
                onChangeText={setDurationMinutes}
                keyboardType="numeric"
                leftIcon="stopwatch-outline"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <GlassInput
                label="Total Questions"
                value={totalQuestions}
                onChangeText={setTotalQuestions}
                keyboardType="numeric"
                leftIcon="help-circle-outline"
              />
            </View>
          </View>

          <GlassButton
            title="Save Changes"
            variant="primary"
            size="large"
            onPress={handleUpdate}
            loading={saving}
            icon={<Ionicons name="save-outline" size={20} color="#FFF" />}
          />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
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
  formCard: {
    padding: 20,
  },
  row: {
    flexDirection: 'row',
  },
});
