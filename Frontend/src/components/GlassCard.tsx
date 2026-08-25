import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'glow' | 'accent' | 'success' | 'danger';
  onPress?: () => void;
  activeOpacity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  onPress,
  activeOpacity = 0.8,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'glow':
        return {
          borderColor: colors.glassBorderActive,
          backgroundColor: 'rgba(25, 33, 58, 0.75)',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 8,
        };
      case 'accent':
        return {
          borderColor: colors.glassBorderCyan,
          backgroundColor: 'rgba(14, 30, 55, 0.75)',
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 14,
          elevation: 6,
        };
      case 'success':
        return {
          borderColor: colors.successBorder,
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
        };
      case 'danger':
        return {
          borderColor: colors.dangerBorder,
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
        };
      default:
        return {
          borderColor: colors.glassBorder,
          backgroundColor: colors.glassBackground,
        };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        style={[styles.base, getVariantStyle(), style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.base, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
});
