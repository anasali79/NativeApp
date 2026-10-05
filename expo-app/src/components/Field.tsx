/**
 * Reusable text input field per DESIGN.md:
 * - Paper fill, radius 12, padding 16x14, no border
 * - Focus: 2px signal border
 * - Error text below (priority.high color), no border change on error
 */
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Field({ label, error, style, ...props }: FieldProps) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[typography.secondary, { color: colors.slate, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          typography.body,
          {
            backgroundColor: colors.paper,
            color: colors.ink,
            borderColor: focused ? colors.signal : 'transparent',
            borderWidth: focused ? 2 : 0,
            // Compensate for border to prevent layout shift
            padding: focused ? 14 : 16,
          },
          style,
        ]}
        placeholderTextColor={colors.slate}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error ? (
        <Text style={[typography.meta, { color: colors.priorityHigh, marginTop: spacing.xs }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  input: {
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48, // Tap target minimum
  },
});
