/**
 * Reusable button per DESIGN.md:
 * - Primary: signal fill, white text, radius 14, height 52
 * - Text button: ink or slate text, no fill
 * - Loading state: spinner, text hidden
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { radius } from '../theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'text';
  loading?: boolean;
  disabled?: boolean;
  textColor?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  textColor,
  style,
}: ButtonProps) {
  const colors = useTheme();

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.6}
      style={[
        isPrimary && [
          styles.primary,
          { backgroundColor: disabled ? colors.hairline : colors.ink },
        ],
        styles.base,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : colors.ink} />
      ) : (
        <Text
          style={[
            typography.button,
            {
              color: textColor
                ? textColor
                : isPrimary
                ? '#FFFFFF'
                : colors.ink,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48, // Accessibility tap target
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    height: 52,
    borderRadius: radius.button,
    paddingHorizontal: 24,
  },
});
