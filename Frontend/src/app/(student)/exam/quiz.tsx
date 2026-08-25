import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  BackHandler,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { attemptService } from '../../../services/attemptService';
import { Question } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { Timer } from '../../../components/Timer';
import { QuestionPalette } from '../../../components/QuestionPalette';

export default function ExamQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    attemptId: string;
    examTitle: string;
    durationMinutes: string;
    totalQuestions: string;
    startedAt: string;
    questionsData: string;
  }>();

  const attemptId = params.attemptId;
  const examTitle = params.examTitle || 'Examination';
  const durationMinutes = Number(params.durationMinutes) || 10;
  const initialSeconds = durationMinutes * 60; // 10 minutes = 600 seconds

  // Parse questions passed from startExam response
  const questions: Question[] = useMemo(() => {
    try {
      return params.questionsData ? JSON.parse(params.questionsData) : [];
    } catch {
      return [];
    }
  }, [params.questionsData]);

  const [currentIndex, setCurrentIndex] = useState(0);
  // Map of questionId -> selectedOption ("A", "B", "C", "D")
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [paletteVisible, setPaletteVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittedRef = useRef(false);

  // Prevent accidental hardware back button on Android
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        'Exit Exam?',
        'If you leave now, your exam will remain in progress until time expires. Use the Submit button to finalize.',
        [
          { text: 'Stay', style: 'cancel' },
          {
            text: 'Submit & Exit',
            onPress: () => handleFinalSubmit(false),
          },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [selectedAnswers]);

  const currentQuestion = questions[currentIndex];
  const totalCount = questions.length || Number(params.totalQuestions) || 50;

  // Track set of answered question indices for palette
  const answeredIndices = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q, idx) => {
      if (selectedAnswers[q.id]) {
        set.add(idx);
      }
    });
    return set;
  }, [questions, selectedAnswers]);

  const handleSelectOption = (optionLetter: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionLetter,
    }));
  };

  const handleNext = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = async (isTimeout: boolean = false) => {
    if (isSubmittedRef.current || isSubmitting) return;
    isSubmittedRef.current = true;
    setIsSubmitting(true);

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] || '',
      }));

      const res = await attemptService.submitExam(attemptId!, answersPayload, isTimeout);

      setSubmitModalVisible(false);
      router.replace({
        pathname: '/(student)/exam/submitted' as any,
        params: {
          examTitle,
          submissionType: res.submissionType,
          resultReleased: String(res.resultReleased),
        },
      });
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit exam.');
      isSubmittedRef.current = false;
      setIsSubmitting(false);
    }
  };

  const answeredCount = answeredIndices.size;
  const unansweredCount = totalCount - answeredCount;
  const currentSelected = currentQuestion ? selectedAnswers[currentQuestion.id] : null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Header with Exam Title & 10-Minute Timer */}
      <View style={styles.topHeader}>
        <View style={styles.headerInfo}>
          <Text style={styles.examTitleText} numberOfLines={1}>
            {examTitle}
          </Text>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1} of {totalCount}
          </Text>
        </View>

        <Timer
          initialSeconds={initialSeconds}
          onExpire={() => handleFinalSubmit(true)}
          isPaused={isSubmitting}
        />
      </View>

      {/* Overall Progress Bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${((currentIndex + 1) / totalCount) * 100}%` },
          ]}
        />
      </View>

      {/* Main Question Body */}
      <ScrollView
        contentContainerStyle={styles.questionScroll}
        showsVerticalScrollIndicator={false}
      >
        {currentQuestion ? (
          <>
            {/* Question Text Card */}
            <GlassCard variant="glow" style={styles.questionCard}>
              <View style={styles.qNumberBadge}>
                <Text style={styles.qNumberText}>Q{currentIndex + 1}</Text>
                <Text style={styles.qMarksText}>{currentQuestion.marks || 1} Mark</Text>
              </View>
              <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
            </GlassCard>

            {/* 4 Options Grid */}
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((optionText, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx); // 'A', 'B', 'C', 'D'
                const isSelected = currentSelected === letter;

                return (
                  <TouchableOpacity
                    key={optIdx}
                    onPress={() => handleSelectOption(letter)}
                    activeOpacity={0.8}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.optionLetterBadge,
                        isSelected && styles.optionLetterSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLetterText,
                          isSelected && styles.optionLetterTextSelected,
                        ]}
                      >
                        {letter}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {optionText}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.noQText}>No question available.</Text>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={currentIndex === 0}
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentIndex === 0 ? colors.textMuted : colors.text}
          />
          <Text
            style={[
              styles.navBtnText,
              currentIndex === 0 && { color: colors.textMuted },
            ]}
          >
            Prev
          </Text>
        </TouchableOpacity>

        {/* Question Palette Trigger */}
        <TouchableOpacity
          onPress={() => setPaletteVisible(true)}
          style={styles.paletteTrigger}
        >
          <Ionicons name="grid-outline" size={18} color={colors.secondary} />
          <Text style={styles.paletteTriggerText}>
            {answeredCount}/{totalCount}
          </Text>
        </TouchableOpacity>

        {currentIndex === totalCount - 1 ? (
          <TouchableOpacity
            onPress={() => setSubmitModalVisible(true)}
            style={styles.submitTriggerBtn}
          >
            <Text style={styles.submitTriggerText}>Submit</Text>
            <Ionicons name="checkmark-done" size={18} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Question Palette 1-to-50 Modal */}
      <QuestionPalette
        visible={paletteVisible}
        onClose={() => setPaletteVisible(false)}
        totalQuestions={totalCount}
        currentIndex={currentIndex}
        answeredIndices={answeredIndices}
        onSelectQuestion={(idx) => setCurrentIndex(idx)}
      />

      {/* Manual Submit Confirmation Modal */}
      <Modal
        visible={submitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSubmitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="help-circle-outline" size={32} color={colors.primary} />
            </View>

            <Text style={styles.confirmTitle}>Submit Examination?</Text>
            <Text style={styles.confirmDesc}>
              You have completed <Text style={{ color: colors.success, fontWeight: '800' }}>{answeredCount}</Text> of{' '}
              <Text style={{ color: colors.text, fontWeight: '800' }}>{totalCount}</Text> questions.
            </Text>

            {unansweredCount > 0 && (
              <View style={styles.warningNotice}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                <Text style={styles.warningNoticeText}>
                  You still have {unansweredCount} unanswered questions.
                </Text>
              </View>
            )}

            <View style={styles.confirmBtnRow}>
              <GlassButton
                title="Review Answers"
                variant="outline"
                size="medium"
                onPress={() => setSubmitModalVisible(false)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Submit Now"
                variant="primary"
                size="medium"
                onPress={() => handleFinalSubmit(false)}
                loading={isSubmitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topHeader: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  examTitleText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  questionCounter: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  questionScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  questionCard: {
    marginBottom: 16,
    padding: 18,
  },
  qNumberBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qNumberText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  qMarksText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  questionText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
  },
  optionLetterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionLetterSelected: {
    backgroundColor: colors.primary,
  },
  optionLetterText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionLetterTextSelected: {
    color: '#FFF',
    fontWeight: '800',
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 21,
  },
  optionTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  checkIcon: {
    marginLeft: 8,
  },
  noQText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0E1526',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  paletteTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  paletteTriggerText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 4,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  submitTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 6,
  },
  submitTriggerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#0E1526',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.glassBorderActive,
    padding: 24,
    alignItems: 'center',
  },
  confirmIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  confirmDesc: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    gap: 8,
  },
  warningNoticeText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});
