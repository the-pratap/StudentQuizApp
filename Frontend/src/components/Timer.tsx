import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface TimerProps {
  initialSeconds: number; // e.g. 600 for 10 minutes
  onExpire: () => void;
  isPaused?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  onExpire,
  isPaused = false,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    setSecondsRemaining(initialSeconds);
    hasExpiredRef.current = false;
  }, [initialSeconds]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onExpire]);

  // Pulse animation when time is low (< 2 minutes = 120s)
  useEffect(() => {
    if (secondsRemaining <= 120 && secondsRemaining > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [secondsRemaining <= 120]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = secondsRemaining <= 120;
  const progressRatio = Math.max(0, Math.min(1, secondsRemaining / (initialSeconds || 1)));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pillContainer,
          isLowTime && styles.lowTimePill,
          { transform: [{ scale: isLowTime ? pulseAnim : 1 }] },
        ]}
      >
        <Ionicons
          name="alarm-outline"
          size={18}
          color={isLowTime ? colors.danger : colors.secondary}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.timerLabel, isLowTime && styles.lowTimeText]}>
            TIME REMAINING
          </Text>
          <Text style={[styles.timerValue, isLowTime && styles.lowTimeValue]}>
            {formattedTime}
          </Text>
        </View>
      </Animated.View>

      {/* Progress Track */}
      <View style={styles.progressBarBg}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressRatio * 100}%`,
              backgroundColor: isLowTime ? colors.danger : colors.secondary,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.35)',
    borderWidth: 1.5,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  lowTimePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: colors.danger,
    shadowColor: colors.danger,
    shadowOpacity: 0.4,
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  timerLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  lowTimeText: {
    color: colors.danger,
  },
  timerValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  lowTimeValue: {
    color: colors.danger,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
