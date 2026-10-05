/**
 * Chip component per DESIGN.md:
 * - Pill shape, radius 18, padding 14x8, 1px hairline border
 * - Selected: ink fill + white text
 * - Priority chips: selected has ink fill + white text + small priority-color dot
 */
import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { radius } from '../theme/spacing';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  dotColor?: string; // optional priority color dot
}

export function Chip({ label, selected = false, onPress, dotColor }: ChipProps) {
  const colors = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          borderColor: selected ? colors.ink : colors.hairline,
        },
      ]}
    >
      {selected && dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      <Text
        style={[
          typography.secondary,
          { color: selected ? '#FFFFFF' : colors.ink },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.chip,
    borderWidth: 1,
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
