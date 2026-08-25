import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { GlassButton } from './GlassButton';

interface OTPModalProps {
  visible: boolean;
  examTitle: string;
  onClose: () => void;
  onSubmit: (otp: string) => Promise<void>;
  loading?: boolean;
}

export const OTPModal: React.FC<OTPModalProps> = ({
  visible,
  examTitle,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState<string>('');
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    setError('');
    // Handle paste of full 6 digits
    if (text.length > 1) {
      const cleanText = text.replace(/[^0-9]/g, '').slice(0, 6);
      const newOtp = [...otp];
      cleanText.split('').forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(cleanText.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const cleanChar = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanChar;
    setOtp(newOtp);

    // Auto-focus next input if digit entered
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      setError('');
      await onSubmit(fullOtp);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please check and try again.');
    }
  };

  const handleResetAndClose = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleResetAndClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Lock Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>Enter Exam OTP</Text>
          <Text style={styles.subtitle}>
            Please enter the 6-digit security code issued by your exam administrator for:
          </Text>
          <Text style={styles.examTitleText} numberOfLines={1}>
            {examTitle}
          </Text>

          {/* 6 Digit Input Row */}
          <View style={styles.pinRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(ref) => (inputRefs.current[idx] = ref)}
                value={digit}
                onChangeText={(text) => handleChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={idx === 0 ? 6 : 1}
                style={[
                  styles.pinBox,
                  digit ? styles.pinBoxFilled : null,
                  error ? styles.pinBoxError : null,
                ]}
                placeholderTextColor={colors.textMuted}
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <GlassButton
              title="Verify & Start Exam"
              variant="primary"
              size="large"
              onPress={handleVerify}
              loading={loading}
              icon={<Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />}
              style={styles.verifyBtn}
            />
            <GlassButton
              title="Cancel"
              variant="outline"
              size="medium"
              onPress={handleResetAndClose}
              disabled={loading}
              style={styles.cancelBtn}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0E1526',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.glassBorderActive,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
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
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  examTitleText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 22,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  pinBox: {
    width: '14.5%',
    aspectRatio: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  pinBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  pinBoxError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 14,
  },
  actionButtons: {
    width: '100%',
    marginTop: 8,
  },
  verifyBtn: {
    marginBottom: 10,
  },
  cancelBtn: {
    width: '100%',
  },
});
