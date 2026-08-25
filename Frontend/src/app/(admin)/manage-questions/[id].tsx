import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { examService } from '../../../services/examService';
import { adminService } from '../../../services/adminService';
import { Question } from '../../../types';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { GlassButton } from '../../../components/GlassButton';
import { LoadingState } from '../../../components/LoadingState';
import { EmptyState } from '../../../components/EmptyState';

export default function ManageQuestionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState('Exam');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [marks, setMarks] = useState('1');
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchQuestions = async () => {
    try {
      const [examData, qData] = await Promise.all([
        examService.getExamById(id!),
        examService.getExamQuestions(id!),
      ]);
      setExamTitle(examData.exam.title);
      setQuestions(qData);
    } catch (err: any) {
      console.error('[Questions fetch error]:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuestions();
  }, [id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchQuestions();
  }, []);

  const openAddModal = () => {
    setEditingQuestion(null);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('A');
    setMarks('1');
    setExplanation('');
    setModalVisible(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setQText(q.questionText);
    setOptA(q.options[0] || '');
    setOptB(q.options[1] || '');
    setOptC(q.options[2] || '');
    setOptD(q.options[3] || '');
    setCorrectAnswer(q.correctAnswer || 'A');
    setMarks(String(q.marks || 1));
    setExplanation(q.explanation || '');
    setModalVisible(true);
  };

  const handleSaveQuestion = async () => {
    if (!qText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      Alert.alert('Validation Error', 'Please enter the question text and all 4 options.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        questionText: qText.trim(),
        options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
        correctAnswer: correctAnswer.trim(),
        marks: Number(marks) || 1,
        explanation: explanation.trim(),
      };

      if (editingQuestion) {
        await adminService.updateQuestion(editingQuestion.id, payload);
      } else {
        await adminService.addQuestion(id!, payload);
      }

      setModalVisible(false);
      fetchQuestions();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (q: Question) => {
    Alert.alert('Delete Question', `Delete question #${q.questionNumber}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteQuestion(q.id);
            fetchQuestions();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete question.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle} numberOfLines={1}>
            Manage Questions
          </Text>
          <Text style={styles.navSubTitle} numberOfLines={1}>
            {examTitle} ({questions.length}/50)
          </Text>
        </View>
        <TouchableOpacity onPress={openAddModal} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#FFF" />
        </TouchableOpacity>
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
          <LoadingState message="Loading questions repository..." />
        ) : questions.length === 0 ? (
          <EmptyState
            title="No Questions Configured"
            message="Add MCQs manually or use the bulk seeder to populate 50 questions."
            icon="help-circle-outline"
            actionTitle="Add First Question"
            onAction={openAddModal}
          />
        ) : (
          questions.map((q, idx) => (
            <GlassCard key={q.id} style={styles.qCard}>
              <View style={styles.qCardHeader}>
                <View style={styles.qIndexPill}>
                  <Text style={styles.qIndexText}>Q{idx + 1}</Text>
                </View>
                <View style={styles.qHeaderActions}>
                  <View style={styles.answerKeyPill}>
                    <Text style={styles.answerKeyLabel}>Key: </Text>
                    <Text style={styles.answerKeyVal}>{q.correctAnswer || 'A'}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => openEditModal(q)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(q)}
                    style={styles.iconBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.qText}>{q.questionText}</Text>

              <View style={styles.optionsList}>
                {q.options &&
                  q.options.map((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const isCorrect = q.correctAnswer === letter;
                    return (
                      <View
                        key={optIndex}
                        style={[
                          styles.optionItem,
                          isCorrect && styles.optionItemCorrect,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionLetter,
                            isCorrect && { color: colors.success, fontWeight: '800' },
                          ]}
                        >
                          {letter}.
                        </Text>
                        <Text
                          style={[
                            styles.optionContent,
                            isCorrect && { color: '#FFF', fontWeight: '700' },
                          ]}
                        >
                          {opt}
                        </Text>
                        {isCorrect && (
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                        )}
                      </View>
                    );
                  })}
              </View>

              {q.explanation ? (
                <Text style={styles.qExplanation}>
                  <Text style={{ fontWeight: '700', color: colors.textSecondary }}>
                    Explanation:{' '}
                  </Text>
                  {q.explanation}
                </Text>
              ) : null}
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Add / Edit Question Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingQuestion ? 'Edit MCQ Question' : 'Add New MCQ'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalForm}
              showsVerticalScrollIndicator={false}
            >
              <GlassInput
                label="Question Text"
                placeholder="What is..."
                value={qText}
                onChangeText={setQText}
                multiline
                numberOfLines={3}
              />

              <GlassInput
                label="Option A"
                placeholder="Option A text..."
                value={optA}
                onChangeText={setOptA}
              />

              <GlassInput
                label="Option B"
                placeholder="Option B text..."
                value={optB}
                onChangeText={setOptB}
              />

              <GlassInput
                label="Option C"
                placeholder="Option C text..."
                value={optC}
                onChangeText={setOptC}
              />

              <GlassInput
                label="Option D"
                placeholder="Option D text..."
                value={optD}
                onChangeText={setOptD}
              />

              <Text style={styles.label}>Select Correct Answer</Text>
              <View style={styles.correctAnswersRow}>
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const isSelected = correctAnswer === letter;
                  return (
                    <TouchableOpacity
                      key={letter}
                      onPress={() => setCorrectAnswer(letter)}
                      style={[
                        styles.correctAnswerBtn,
                        isSelected && styles.correctAnswerBtnSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.correctAnswerBtnText,
                          isSelected && styles.correctAnswerBtnTextSelected,
                        ]}
                      >
                        Option {letter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <GlassInput
                label="Explanation (Optional)"
                placeholder="Detailed rationale for student review after results release..."
                value={explanation}
                onChangeText={setExplanation}
                multiline
                numberOfLines={2}
                containerStyle={{ marginTop: 12 }}
              />

              <GlassButton
                title={editingQuestion ? 'Update Question' : 'Save Question'}
                variant="primary"
                size="large"
                onPress={handleSaveQuestion}
                loading={saving}
                style={{ marginTop: 12 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  qCard: {
    marginBottom: 14,
    padding: 16,
  },
  qCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  qIndexPill: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  qIndexText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  qHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerKeyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.success,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  answerKeyLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  answerKeyVal: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '900',
  },
  iconBtn: {
    padding: 4,
  },
  qText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 12,
  },
  optionsList: {
    gap: 6,
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  optionItemCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: colors.success,
  },
  optionLetter: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 8,
  },
  optionContent: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  qExplanation: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0E1526',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  modalForm: {
    paddingBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  correctAnswersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  correctAnswerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  correctAnswerBtnSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  correctAnswerBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  correctAnswerBtnTextSelected: {
    color: '#FFF',
    fontWeight: '900',
  },
});
