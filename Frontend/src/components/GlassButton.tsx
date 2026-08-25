import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'glass';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getGradientColors = (): [string, string, ...string[]] => {
    if (disabled) return ['#334155', '#1E293B'];
    switch (variant) {
      case 'primary':
        return [colors.primaryGradientStart, colors.primaryGradientEnd];
      case 'secondary':
        return [colors.secondaryGradientStart, colors.secondaryGradientEnd];
      case 'accent':
        return ['#EC4899', '#8B5CF6'];
      case 'danger':
        return ['#EF4444', '#DC2626'];
      default:
        return ['transparent', 'transparent'];
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 12 },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'large':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 18 },
          text: { fontSize: 17, fontWeight: '700' },
        };
      default:
        return {
          container: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 16 },
          text: { fontSize: 15, fontWeight: '600' },
        };
    }
  };

  const isOutline = variant === 'outline';
  const isGlass = variant === 'glass';
  const sizeStyle = getSizeStyles();

  if (isOutline || isGlass) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.75}
        style={[
          styles.base,
          sizeStyle.container,
          isOutline && styles.outline,
          isGlass && styles.glass,
          disabled && styles.disabled,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <View style={styles.contentRow}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.text, sizeStyle.text, textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.baseWrapper, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.base, sizeStyle.container]}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <View style={styles.contentRow}>
            {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
            <Text style={[styles.text, sizeStyle.text, textStyle]}>{title}</Text>
            {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  text: {
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.glassBorderActive,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  glass: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  disabled: {
    opacity: 0.5,
  },
});
