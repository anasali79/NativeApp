/**
 * Add/Edit task bottom sheet per DESIGN.md:
 * - Bottom sheet (Modal), chalk fill, top radius 22, scrim behind
 * - Header with title and close button
 * - Native Material Date/Time Dialog on Android (DateTimePickerAndroid.open)
 * - Beautiful centered Modal Date/Time Picker on iOS/fallback
 * - Quick chips: Today 6pm, Tomorrow 9am, Pick date and time
 * - Priority segmented chips (Low / Medium / High)
 * - Tags input
 * - Validation: title required, deadline >= scheduledAt
 * - Edit mode: fields prefilled, button "Save changes"
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useTheme } from '../theme/useTheme';
import { priorityColor } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Task, CreateTaskPayload, UpdateTaskPayload } from '../domain/types';
import { formatDateTime } from '../domain/dates';
import { Button } from './Button';
import { Field } from './Field';
import { Chip } from './Chip';

interface AddTaskSheetProps {
  visible: boolean;
  editTask?: Task | null; // null = create mode
  onClose: () => void;
  onAdd: (payload: CreateTaskPayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateTaskPayload) => Promise<void>;
}

type DateField = 'scheduledAt' | 'deadline';
type PickerMode = 'date' | 'time';

export function AddTaskSheet({
  visible,
  editTask,
  onClose,
  onAdd,
  onUpdate,
}: AddTaskSheetProps) {
  const colors = useTheme();
  const isEdit = !!editTask;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [tags, setTags] = useState('');

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [deadlineError, setDeadlineError] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  // iOS/Modal Date picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('date');
  const [activeField, setActiveField] = useState<DateField>('scheduledAt');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Prefill when editing, reset when creating
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setScheduledAt(editTask.scheduledAt ? new Date(editTask.scheduledAt) : null);
      setDeadline(editTask.deadline ? new Date(editTask.deadline) : null);
      setPriority(editTask.priority);
      setTags((editTask.tags || []).join(', '));
    } else {
      resetForm();
    }
  }, [editTask, visible]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setScheduledAt(null);
    setDeadline(null);
    setPriority(2);
    setTags('');
    setTitleError('');
    setDeadlineError('');
    setLoading(false);
    setShowPicker(false);
  };

  // Quick date helpers
  const todayAt = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const tomorrowAt = (hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  /**
   * Opens the date/time picker:
   * - On Android: Uses native Material DatePickerDialog + TimePickerDialog
   *   which displays in the center of the screen above everything.
   * - On iOS/Fallback: Displays a centered, high-contrast modal dialog.
   */
  const openPicker = (field: DateField) => {
    Keyboard.dismiss();
    setActiveField(field);

    const baseDate =
      field === 'scheduledAt' && scheduledAt
        ? scheduledAt
        : field === 'deadline' && deadline
        ? deadline
        : new Date();

    if (Platform.OS === 'android' && DateTimePickerAndroid) {
      DateTimePickerAndroid.open({
        value: baseDate,
        mode: 'date',
        is24Hour: false,
        onValueChange: (_dateEvent: any, selectedDate?: Date) => {
          if (!selectedDate) return;

          // Open time picker immediately after date selection
          const pickedDate = new Date(selectedDate);
          DateTimePickerAndroid.open({
            value: pickedDate,
            mode: 'time',
            is24Hour: false,
            onValueChange: (_timeEvent: any, finalDate?: Date) => {
              if (!finalDate) return;
              if (field === 'scheduledAt') {
                setScheduledAt(finalDate);
              } else {
                setDeadline(finalDate);
              }
            },
          });
        },
      });
    } else {
      // iOS / Web centered popup dialog
      setTempDate(baseDate);
      setPickerMode('date');
      setShowPicker(true);
    }
  };

  const onIOSPickerChange = useCallback(
    (_event: any, selectedDate?: Date) => {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    },
    [],
  );

  const setQuickDate = (field: DateField, date: Date) => {
    Keyboard.dismiss();
    if (field === 'scheduledAt') setScheduledAt(date);
    else setDeadline(date);
  };

  const clearDate = (field: DateField) => {
    if (field === 'scheduledAt') setScheduledAt(null);
    else setDeadline(null);
  };

  const handleSubmit = async () => {
    setTitleError('');
    setDeadlineError('');

    if (!title.trim()) {
      setTitleError('Give the task a title.');
      return;
    }

    if (scheduledAt && deadline && deadline < scheduledAt) {
      setDeadlineError("Deadline can't be before the start time.");
      return;
    }

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 5);

    setLoading(true);

    try {
      if (isEdit && editTask) {
        await onUpdate(editTask._id, {
          title: title.trim(),
          description: description.trim(),
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
          deadline: deadline ? deadline.toISOString() : null,
          priority,
          tags: parsedTags,
        });
      } else {
        await onAdd({
          title: title.trim(),
          description: description.trim(),
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
          deadline: deadline ? deadline.toISOString() : undefined,
          priority,
          tags: parsedTags,
        });
      }
      resetForm();
      onClose();
    } catch {
      // Error is handled in useTasks hook via Alert
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          {/* Tap scrim to close */}
          <TouchableOpacity
            style={styles.scrimTap}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
          />

          <View style={[styles.sheet, { backgroundColor: colors.chalk }]}>
            {/* Grab handle indicator */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.hairline }]} />
            </View>

            {/* Header bar */}
            <View style={styles.sheetHeader}>
              <Text style={[typography.section, { color: colors.ink }]}>
                {isEdit ? 'Edit task' : 'Add a task'}
              </Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={[typography.secondary, { color: colors.slate, fontSize: 16 }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Title field */}
              <TextInput
                style={[
                  typography.titleM,
                  styles.titleInput,
                  { color: colors.ink, backgroundColor: colors.paper },
                ]}
                placeholder="What needs doing?"
                placeholderTextColor={colors.slate}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                multiline={false}
                returnKeyType="next"
              />
              {titleError ? (
                <Text style={[typography.meta, { color: colors.priorityHigh, marginBottom: spacing.sm }]}>
                  {titleError}
                </Text>
              ) : null}

              {/* Notes field */}
              <Field
                placeholder="Notes (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
                maxLength={1000}
              />

              {/* When (scheduledAt) */}
              <Text style={[typography.secondary, { color: colors.slate, marginBottom: spacing.sm }]}>
                When
              </Text>
              <View style={styles.chipsRow}>
                {scheduledAt ? (
                  <Chip
                    label={formatDateTime(scheduledAt.toISOString())}
                    selected
                    onPress={() => clearDate('scheduledAt')}
                  />
                ) : (
                  <>
                    <Chip label="Today, 6 pm" onPress={() => setQuickDate('scheduledAt', todayAt(18))} />
                    <Chip label="Tomorrow, 9 am" onPress={() => setQuickDate('scheduledAt', tomorrowAt(9))} />
                    <Chip label="Pick date and time" onPress={() => openPicker('scheduledAt')} />
                  </>
                )}
              </View>

              {/* Deadline */}
              <Text style={[typography.secondary, { color: colors.slate, marginTop: spacing.base, marginBottom: spacing.sm }]}>
                Deadline
              </Text>
              <View style={styles.chipsRow}>
                {deadline ? (
                  <Chip
                    label={formatDateTime(deadline.toISOString())}
                    selected
                    onPress={() => clearDate('deadline')}
                  />
                ) : (
                  <>
                    <Chip label="Today, 6 pm" onPress={() => setQuickDate('deadline', todayAt(18))} />
                    <Chip label="Tomorrow, 9 am" onPress={() => setQuickDate('deadline', tomorrowAt(9))} />
                    <Chip label="Pick date and time" onPress={() => openPicker('deadline')} />
                  </>
                )}
              </View>
              {deadlineError ? (
                <Text style={[typography.meta, { color: colors.priorityHigh, marginTop: spacing.xs }]}>
                  {deadlineError}
                </Text>
              ) : null}

              {/* Priority */}
              <Text style={[typography.secondary, { color: colors.slate, marginTop: spacing.base, marginBottom: spacing.sm }]}>
                Priority
              </Text>
              <View style={styles.chipsRow}>
                {([1, 2, 3] as const).map((p) => (
                  <Chip
                    key={p}
                    label={p === 1 ? 'Low' : p === 2 ? 'Medium' : 'High'}
                    selected={priority === p}
                    onPress={() => setPriority(p)}
                    dotColor={priority === p ? priorityColor(p, colors) : undefined}
                  />
                ))}
              </View>

              {/* Tags input */}
              <Field
                label="Tags (comma separated, max 5)"
                placeholder="study, urgent, personal"
                value={tags}
                onChangeText={setTags}
                style={{ marginTop: spacing.xs }}
              />

              {/* Submit button */}
              <Button
                title={isEdit ? 'Save changes' : 'Add task'}
                onPress={handleSubmit}
                loading={loading}
                style={{ marginTop: spacing.md }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Centered Modal Picker for iOS / Web fallback */}
      {showPicker && (
        <Modal
          transparent
          animationType="fade"
          visible={showPicker}
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={[styles.pickerCard, { backgroundColor: colors.paper }]}>
              <Text style={[typography.titleM, { color: colors.ink, textAlign: 'center' }]}>
                {pickerMode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <Text
                style={[
                  typography.body,
                  {
                    color: colors.signal,
                    textAlign: 'center',
                    marginTop: 4,
                    marginBottom: spacing.xs,
                    fontWeight: '600',
                  },
                ]}
              >
                {formatDateTime(tempDate.toISOString())}
              </Text>

              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={tempDate}
                  mode={pickerMode}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  themeVariant={colors.chalk === '#121A2C' ? 'dark' : 'light'}
                  textColor={colors.ink}
                  style={styles.datePickerStyle}
                  onValueChange={onIOSPickerChange}
                  onChange={onIOSPickerChange}
                />
              </View>

              <View style={styles.pickerButtons}>
                <Button
                  title="Cancel"
                  variant="text"
                  onPress={() => setShowPicker(false)}
                  textColor={colors.slate}
                  style={styles.pickerBtn}
                />
                <Button
                  title={pickerMode === 'date' ? 'Next: Time' : 'Confirm'}
                  onPress={() => {
                    if (pickerMode === 'date') {
                      setPickerMode('time');
                    } else {
                      setShowPicker(false);
                      if (activeField === 'scheduledAt') {
                        setScheduledAt(tempDate);
                      } else {
                        setDeadline(tempDate);
                      }
                    }
                  }}
                  style={styles.pickerBtn}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrimTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    maxHeight: '88%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
    paddingTop: 4,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  titleInput: {
    borderRadius: radius.input,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: spacing.base,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  // Centered Modal Picker Styles
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.sheet,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  pickerWrapper: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  datePickerStyle: {
    height: 200,
    width: '100%',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
    gap: 12,
  },
  pickerBtn: {
    minWidth: 100,
  },
});
