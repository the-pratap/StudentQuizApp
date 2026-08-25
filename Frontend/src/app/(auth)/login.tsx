import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    setErrorMessage('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'admin') {
        router.replace('/(admin)/(tabs)' as any);
      } else {
        router.replace('/(student)/(tabs)' as any);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testers
  const fillCredentials = (role: 'student' | 'admin') => {
    setErrorMessage('');
    setErrors({});
    if (role === 'admin') {
      setEmail('admin@exam.com');
      setPassword('Admin@12345');
    } else {
      setEmail('rahul@student.com');
      setPassword('Student@12345');
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.logoBadge}
          >
            <Ionicons name="school" size={32} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your examinations & results</Text>
        </View>

        {/* Quick Fill Demo Badges */}
        <View style={styles.quickFillContainer}>
          <Text style={styles.quickFillLabel}>Quick Test Logins:</Text>
          <View style={styles.quickFillButtons}>
            <TouchableOpacity
              onPress={() => fillCredentials('student')}
              style={styles.quickFillBtn}
            >
              <Ionicons name="person-outline" size={13} color={colors.secondary} />
              <Text style={styles.quickFillText}>Student Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => fillCredentials('admin')}
              style={[styles.quickFillBtn, styles.adminFillBtn]}
            >
              <Ionicons name="shield-outline" size={13} color={colors.primary} />
              <Text style={[styles.quickFillText, { color: colors.primary }]}>Admin Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Form Card */}
        <GlassCard variant="glow" style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <GlassInput
            label="Email Address"
            placeholder="student@example.com"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={errors.email}
          />

          <GlassInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            isPassword={true}
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <GlassButton
            title="Sign In"
            variant="primary"
            size="large"
            onPress={handleLogin}
            loading={loading}
            icon={<Ionicons name="log-in-outline" size={20} color="#FFF" />}
            style={styles.submitBtn}
          />
        </GlassCard>

        {/* Register Link */}
        <View style={styles.footerLinkRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
            <Text style={styles.signupText}>Register as Student</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 50,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  quickFillContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  quickFillLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickFillButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  adminFillBtn: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  quickFillText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    marginTop: 8,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  signupText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
