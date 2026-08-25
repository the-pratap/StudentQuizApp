import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../services/examService';
import { colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';

export default function CreateExamScreen() {
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00 AM');
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [totalQuestions, setTotalQuestions] = useState('50');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Exam title is required';
    if (!subject.trim()) errs.subject = 'Subject name is required';
    if (!examDate.trim()) errs.examDate = 'Exam date is required (YYYY-MM-DD)';
    if (!startTime.trim()) errs.startTime = 'Start time is required (e.g. 10:00 AM)';
    if (!durationMinutes || Number(durationMinutes) <= 0) {
      errs.durationMinutes = 'Duration must be greater than 0 minutes';
    }
    if (!totalQuestions || Number(totalQuestions) <= 0) {
      errs.totalQuestions = 'Total questions must be at least 1 (default 50)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateExam = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await examService.createExam({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim(),
        examDate: examDate.trim(),
        startTime: startTime.trim(),
        durationMinutes: Number(durationMinutes) || 10,
        totalQuestions: Number(totalQuestions) || 50,
      });

      Alert.alert(
        'Exam Created!',
        `Exam "${response.exam.title}" created successfully!\n\nActive OTP: ${response.otp}\nDuration: ${response.exam.durationMinutes} Mins\nQuestions: ${response.exam.totalQuestions}`,
        [
          {
            text: 'Manage Questions',
            onPress: () => {
              const targetId = response.exam.id || (response.exam as any)._id;
              router.replace(`/(admin)/manage-questions/${targetId}` as any);
            },
          },
          {
            text: 'View Exams',
            onPress: () => router.replace('/(admin)/(tabs)/exams' as any),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create exam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Create New Examination</Text>
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
            placeholder="e.g. React Native Fundamentals"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              setErrors((prev) => ({ ...prev, title: '' }));
            }}
            leftIcon="document-text-outline"
            error={errors.title}
          />

          <GlassInput
            label="Subject / Domain"
            placeholder="e.g. Mobile Engineering"
            value={subject}
            onChangeText={(t) => {
              setSubject(t);
              setErrors((prev) => ({ ...prev, subject: '' }));
            }}
            leftIcon="book-outline"
            error={errors.subject}
          />

          <GlassInput
            label="Description"
            placeholder="Brief overview or topics covered..."
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
                placeholder="YYYY-MM-DD"
                value={examDate}
                onChangeText={(t) => {
                  setExamDate(t);
                  setErrors((prev) => ({ ...prev, examDate: '' }));
                }}
                leftIcon="calendar-outline"
                error={errors.examDate}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <GlassInput
                label="Start Time"
                placeholder="10:00 AM"
                value={startTime}
                onChangeText={(t) => {
                  setStartTime(t);
                  setErrors((prev) => ({ ...prev, startTime: '' }));
                }}
                leftIcon="time-outline"
                error={errors.startTime}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <GlassInput
                label="Duration (Minutes)"
                placeholder="10"
                value={durationMinutes}
                onChangeText={(t) => {
                  setDurationMinutes(t);
                  setErrors((prev) => ({ ...prev, durationMinutes: '' }));
                }}
                keyboardType="numeric"
                leftIcon="stopwatch-outline"
                error={errors.durationMinutes}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <GlassInput
                label="Total Questions"
                placeholder="50"
                value={totalQuestions}
                onChangeText={(t) => {
                  setTotalQuestions(t);
                  setErrors((prev) => ({ ...prev, totalQuestions: '' }));
                }}
                keyboardType="numeric"
                leftIcon="help-circle-outline"
                error={errors.totalQuestions}
              />
            </View>
          </View>

          <View style={styles.otpNotice}>
            <Ionicons name="key" size={16} color={colors.secondary} />
            <Text style={styles.otpNoticeText}>
              A secure 6-digit access OTP will be automatically generated and linked to this examination upon creation.
            </Text>
          </View>

          <GlassButton
            title="Create Examination & Generate OTP"
            variant="primary"
            size="large"
            onPress={handleCreateExam}
            loading={loading}
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />}
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
  otpNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  otpNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
});
