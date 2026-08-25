import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Intro animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing pulse for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        if (user.role === 'admin') {
          router.replace('/(admin)/(tabs)' as any);
        } else {
          router.replace('/(student)/(tabs)' as any);
        }
      } else {
        router.replace('/(auth)/login' as any);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, user]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070B14', '#0E1526', '#151F38']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Glowing background circles for Glassmorphism depth */}
      <View style={styles.glowCircleTop} />
      <View style={styles.glowCircleBottom} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Brand Logo */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <Ionicons name="school-outline" size={54} color="#FFFFFF" />
          </LinearGradient>
        </Animated.View>

        <Text style={styles.brandTitle}>QUIZSPHERE</Text>
        <Text style={styles.brandSubtitle}>Online Examination & Assessment Portal</Text>

        <View style={styles.featurePillsRow}>
          <View style={styles.featurePill}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.secondary} />
            <Text style={styles.featurePillText}>Secure OTP</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="timer-outline" size={12} color={colors.primary} />
            <Text style={styles.featurePillText}>Live 10m Timer</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="trophy-outline" size={12} color={colors.accent} />
            <Text style={styles.featurePillText}>Leaderboard</Text>
          </View>
        </View>
      </Animated.View>

      {/* Loading indicator */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Initializing secure session...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircleTop: {
    position: 'absolute',
    top: '15%',
    left: '10%',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    filter: 'blur(40px)',
  },
  glowCircleBottom: {
    position: 'absolute',
    bottom: '20%',
    right: '5%',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    filter: 'blur(40px)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 14,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  brandSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  featurePillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  featurePillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
  },
});
