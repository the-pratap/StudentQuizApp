import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../theme/colors';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Admin Sign Out', 'Are you sure you want to exit the administrator console?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as any);
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <GlassCard variant="glow" style={styles.card}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.avatarCircle}
          >
            <Ionicons name="shield-checkmark" size={38} color="#FFF" />
          </LinearGradient>

          <Text style={styles.name}>{user?.name || 'Administrator'}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.adminPill}>
              <Ionicons name="key-outline" size={13} color={colors.primary} />
              <Text style={styles.adminPillText}>System Administrator</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>ONLINE</Text>
            </View>
          </View>
        </GlassCard>

        {/* Security & System Info */}
        <Text style={styles.sectionTitle}>System Security & Configuration</Text>
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Authorization</Text>
            <Text style={styles.infoValue}>Full Superadmin Access</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Cluster</Text>
            <Text style={[styles.infoValue, { color: colors.success }]}>MongoDB Atlas Connected</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Token Security</Text>
            <Text style={styles.infoValue}>JWT RS256 / SHA256</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Server Time</Text>
            <Text style={styles.infoValue}>{new Date().toLocaleDateString()}</Text>
          </View>
        </GlassCard>

        {/* Sign Out Button */}
        <GlassButton
          title="Sign Out of Admin Console"
          variant="danger"
          size="large"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={20} color="#FFF" />}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 40,
  },
  card: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  adminPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusPillText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  infoCard: {
    padding: 18,
    marginBottom: 28,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  logoutBtn: {
    width: '100%',
  },
});
