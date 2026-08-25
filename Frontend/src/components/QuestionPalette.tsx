import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { GlassButton } from './GlassButton';

interface QuestionPaletteProps {
  visible: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentIndex: number;
  answeredIndices: Set<number>;
  onSelectQuestion: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  visible,
  onClose,
  totalQuestions,
  currentIndex,
  answeredIndices,
  onSelectQuestion,
}) => {
  const answeredCount = answeredIndices.size;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Question Palette</Text>
              <Text style={styles.subtitle}>Select any question to jump directly</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Stats Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Answered ({answeredCount})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
              <Text style={styles.legendText}>Unanswered ({unansweredCount})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendText}>Current</Text>
            </View>
          </View>

          {/* 1 to 50 Grid */}
          <ScrollView
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: totalQuestions }, (_, i) => {
              const isCurrent = i === currentIndex;
              const isAnswered = answeredIndices.has(i);

              let itemStyle: any = styles.paletteItemUnanswered;
              let textStyle: any = styles.paletteTextUnanswered;

              if (isAnswered) {
                itemStyle = styles.paletteItemAnswered;
                textStyle = styles.paletteTextAnswered;
              }

              if (isCurrent) {
                itemStyle = styles.paletteItemCurrent;
                textStyle = styles.paletteTextCurrent;
              }

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    onSelectQuestion(i);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  style={[styles.paletteItem, itemStyle]}
                >
                  <Text style={[styles.paletteText, textStyle]}>{i + 1}</Text>
                  {isAnswered && !isCurrent && (
                    <Ionicons
                      name="checkmark"
                      size={10}
                      color={colors.success}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <GlassButton
              title="Return to Question"
              variant="secondary"
              onPress={onClose}
              size="medium"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  paletteItem: {
    width: '17%',
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  paletteItemUnanswered: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  paletteTextUnanswered: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  paletteItemAnswered: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  paletteTextAnswered: {
    color: colors.success,
    fontWeight: '700',
  },
  paletteItemCurrent: {
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  paletteTextCurrent: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  paletteText: {
    fontSize: 14,
  },
  checkIcon: {
    position: 'absolute',
    top: 3,
    right: 4,
  },
  footer: {
    marginTop: 14,
  },
});
