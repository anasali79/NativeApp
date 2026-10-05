/**
 * Drain bar — the app's signature feature.
 * A 3px-high progress bar showing how much time is left before the deadline.
 *
 * progress = clamp((deadline - now) / (deadline - start), 0, 1)
 * where start = scheduledAt ?? createdAt
 *
 * Fill color = priority color. Empty = deadline reached.
 * Only shown on open tasks with a deadline.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { priorityColor } from '../theme/colors';
import { radius } from '../theme/spacing';
import { Task } from '../domain/types';

interface DrainBarProps {
  task: Task;
  now: Date;
}

export const DrainBar = React.memo(function DrainBar({ task, now }: DrainBarProps) {
  const colors = useTheme();

  // Only show for open tasks with a deadline
  if (task.completed || !task.deadline) return null;

  const deadlineMs = new Date(task.deadline).getTime();
  const startMs = new Date(task.scheduledAt ?? task.createdAt).getTime();
  const nowMs = now.getTime();

  // Avoid division by zero
  const totalSpan = deadlineMs - startMs;
  if (totalSpan <= 0) return null;

  const remaining = deadlineMs - nowMs;
  const progress = Math.max(0, Math.min(1, remaining / totalSpan));

  const fillColor = priorityColor(task.priority, colors);

  return (
    <View style={[styles.track, { backgroundColor: colors.hairline }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            width: `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: radius.stripe,
    marginTop: 8,
    overflow: 'hidden',
  },
  fill: {
    height: 3,
    borderRadius: radius.stripe,
  },
});
