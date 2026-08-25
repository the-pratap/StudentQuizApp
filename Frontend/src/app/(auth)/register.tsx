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

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    setErrorMessage('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register(name.trim(), email.trim(), password, confirmPassword, role);
      if (user.role === 'admin') {
        router.replace('/(admin)/(tabs)' as any);
      } else {
        router.replace('/(student)/(tabs)' as any);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your details.');
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.secondary, colors.primary]}
            style={styles.logoBadge}
          >
            <Ionicons name="person-add" size={30} color="#FFF" />
          </LinearGradient>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register to participate in online quizzes & exams</Text>
        </View>

        {/* Role Selector Toggle */}
        <View style={styles.roleToggleContainer}>
          <TouchableOpacity
            onPress={() => setRole('student')}
            style={[styles.roleOption, role === 'student' && styles.roleOptionActive]}
          >
            <Ionicons
              name="school-outline"
              size={16}
              color={role === 'student' ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.roleOptionText,
                role === 'student' && styles.roleOptionTextActive,
              ]}
            >
              Student Portal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setRole('admin')}
            style={[styles.roleOption, role === 'admin' && styles.roleOptionActiveAdmin]}
          >
            <Ionicons
              name="shield-outline"
              size={16}
              color={role === 'admin' ? '#FFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.roleOptionText,
                role === 'admin' && styles.roleOptionTextActive,
              ]}
            >
              Admin Portal
            </Text>
          </TouchableOpacity>
        </View>

        {/* Registration Card */}
        <GlassCard variant="glow" style={styles.formCard}>
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <GlassInput
            label="Full Name"
            placeholder="Rahul Sharma"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            leftIcon="person-outline"
            error={errors.name}
          />

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
            placeholder="Min. 6 characters"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            isPassword={true}
            leftIcon="lock-closed-outline"
            error={errors.password}
          />

          <GlassInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
              setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            isPassword={true}
            leftIcon="lock-closed-outline"
            error={errors.confirmPassword}
          />

          <GlassButton
            title={`Register as ${role === 'admin' ? 'Administrator' : 'Student'}`}
            variant={role === 'admin' ? 'accent' : 'primary'}
            size="large"
            onPress={handleRegister}
            loading={loading}
            icon={<Ionicons name="arrow-forward-outline" size={20} color="#FFF" />}
            style={styles.submitBtn}
          />
        </GlassCard>

        {/* Login Link */}
        <View style={styles.footerLinkRow}>
          <Text style={styles.footerText}>Already registered? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginText}>Sign In</Text>
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
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  roleOptionActive: {
    backgroundColor: colors.primary,
  },
  roleOptionActiveAdmin: {
    backgroundColor: colors.accent,
  },
  roleOptionText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  roleOptionTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  formCard: {
    marginBottom: 18,
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
    marginTop: 6,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
