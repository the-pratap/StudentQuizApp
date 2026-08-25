import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { GlassCard } from './GlassCard';

interface AdminStatCardProps {
  title: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  title,
  value,
  icon,
  color = colors.primary,
  subtitle,
  onPress,
}) => {
  return (
    <GlassCard onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20`, borderColor: `${color}60` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    marginBottom: 14,
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
