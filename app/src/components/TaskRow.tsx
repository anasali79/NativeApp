/**
 * TaskRow component with modern Glassmorphic Card design:
 * - Floating glass card with soft shadow and subtle frosted rim
 * - Ample spacing between cards so tasks never stick together
 * - Left priority pill accent + status checkbox
 * - Title and notes with clean typography
 * - Meta badges for deadlines, priority, and tags
 * - Integrated signature Drain Bar
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { priorityColor } from '../theme/colors';
import { typography } from '../theme/typography';
import { Task } from '../domain/types';
import { formatDeadlineLabel, priorityLabel } from '../domain/dates';
import { isOverdue } from '../domain/rank';
import { DrainBar } from './DrainBar';

interface TaskRowProps {
  task: Task;
  now: Date;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskRow = React.memo(function TaskRow({
  task,
  now,
  onToggle,
  onDelete,
  onEdit,
}: TaskRowProps) {
  const colors = useTheme();
  const isDark = colors.chalk === '#121A2C';

  const stripeColor = task.completed
    ? colors.hairline
    : priorityColor(task.priority, colors);

  const deadlineLabel = formatDeadlineLabel(task.deadline, now);
  const pLabel = priorityLabel(task.priority);
  const overdue = isOverdue(task, now);

  const handleDelete = () => {
    Alert.alert('Delete task?', task.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete(task._id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onEdit(task)}
      style={[
        styles.card,
        {
          backgroundColor: isDark
            ? 'rgba(27, 37, 64, 0.75)'
            : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark
            ? 'rgba(124, 145, 255, 0.15)'
            : 'rgba(255, 255, 255, 0.95)',
          shadowColor: colors.ink,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        {/* Left priority accent indicator */}
        <View style={[styles.priorityPill, { backgroundColor: stripeColor }]} />

        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => onToggle(task)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={
            task.completed
              ? `Mark ${task.title} as not done`
              : `Mark ${task.title} as done`
          }
          accessibilityRole="button"
        >
          <View
            style={[
              styles.checkbox,
              task.completed
                ? { backgroundColor: colors.signal, borderColor: colors.signal }
                : {
                    borderColor: isDark
                      ? 'rgba(154, 165, 188, 0.45)'
                      : colors.slate,
                    backgroundColor: isDark
                      ? 'rgba(18, 26, 44, 0.4)'
                      : 'rgba(238, 241, 246, 0.6)',
                  },
            ]}
          >
            {task.completed && <Text style={styles.tick}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Title and description */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              typography.rowTitle,
              {
                color: task.completed ? colors.slate : colors.ink,
                textDecorationLine: task.completed ? 'line-through' : 'none',
                fontWeight: task.completed ? '400' : '600',
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.description ? (
            <Text
              style={[
                typography.secondary,
                { color: colors.slate, marginTop: 2 },
              ]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}
        </View>

        {/* Delete action button */}
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.deleteBtn}
          accessibilityLabel={`Delete ${task.title}`}
          accessibilityRole="button"
        >
          <Text style={[typography.meta, { color: colors.slate }]}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Meta tags & due badges */}
      <View style={styles.metaContainer}>
        {(!task.completed && (deadlineLabel || pLabel)) || (task.tags && task.tags.length > 0) ? (
          <View style={styles.badgesRow}>
            {deadlineLabel ? (
              <View
                style={[
                  styles.metaBadge,
                  {
                    backgroundColor: overdue
                      ? 'rgba(229, 72, 77, 0.12)'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(17, 26, 46, 0.05)',
                  },
                ]}
              >
                <Text
                  style={[
                    typography.meta,
                    {
                      color: overdue ? colors.priorityHigh : colors.slate,
                      fontWeight: overdue ? '600' : '400',
                      fontSize: 12,
                    },
                  ]}
                >
                  {deadlineLabel}
                </Text>
              </View>
            ) : null}

            {pLabel && !task.completed ? (
              <View
                style={[
                  styles.metaBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(17, 26, 46, 0.05)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColor(task.priority, colors) },
                  ]}
                />
                <Text style={[typography.meta, { color: colors.slate, fontSize: 12 }]}>
                  {pLabel}
                </Text>
              </View>
            ) : null}

            {task.tags &&
              task.tags.map((tag) => (
                <View
                  key={tag}
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(124, 145, 255, 0.12)'
                        : 'rgba(47, 75, 255, 0.07)',
                      borderColor: isDark
                        ? 'rgba(124, 145, 255, 0.25)'
                        : 'rgba(47, 75, 255, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.meta,
                      { color: colors.signal, fontSize: 11 },
                    ]}
                  >
                    #{tag}
                  </Text>
                </View>
              ))}
          </View>
        ) : null}

        {/* Signature Drain Bar inside the glass card */}
        <DrainBar task={task} now={now} />
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  priorityPill: {
    width: 3.5,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  tick: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: -1,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  metaContainer: {
    paddingLeft: 35, // aligns below title
    marginTop: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  tagBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
});
