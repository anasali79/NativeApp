/**
 * Empty state component per DESIGN.md:
 * - No tasks: "Nothing here yet. Add your first task below."
 * - Filtered: "No tasks match these filters." + "Clear filters" button
 * - Network error: "Can't reach the server. Pull down to try again."
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  type: 'empty' | 'filtered' | 'error';
  message?: string;
  onClearFilters?: () => void;
}

export function EmptyState({ type, message, onClearFilters }: EmptyStateProps) {
  const colors = useTheme();

  const defaultMessages = {
    empty: 'Nothing here yet. Add your first task below.',
    filtered: 'No tasks match these filters.',
    error: "Can't reach the server. Pull down to try again.",
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.body, { color: colors.slate, textAlign: 'center' }]}>
        {message || defaultMessages[type]}
      </Text>
      {type === 'filtered' && onClearFilters && (
        <Button
          title="Clear filters"
          variant="text"
          onPress={onClearFilters}
          textColor={colors.signal}
          style={{ marginTop: spacing.md }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: 60,
  },
});
