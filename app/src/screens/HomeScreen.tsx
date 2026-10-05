import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { buildSections, sortByDeadline, sortByNewest } from '../domain/rank';
import { Task, TaskSection } from '../domain/types';
import { TaskRow } from '../components/TaskRow';
import { EmptyState } from '../components/EmptyState';
import { AddTaskSheet } from '../components/AddTaskSheet';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type StatusFilter = 'all' | 'open' | 'done';
type SortMode = 'smart' | 'deadline' | 'newest';
type PriorityFilter = 0 | 1 | 2 | 3;

export function HomeScreen() {
  const colors = useTheme();
  const isDark = colors.chalk === '#121A2C';
  const { user, logout } = useAuth();
  const { tasks, loading, error, refresh, add, toggle, update, remove } = useTasks();

  // Sheet state
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>(0);
  const [sortMode, setSortMode] = useState<SortMode>('smart');

  // Current time for drain bar — updates every 60 seconds
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Compute status counts for segmented switcher
  const counts = useMemo(() => {
    let openCount = 0;
    let doneCount = 0;
    tasks.forEach((t) => {
      if (t.completed) doneCount++;
      else openCount++;
    });
    return {
      all: tasks.length,
      open: openCount,
      done: doneCount,
    };
  }, [tasks]);

  // Filter tasks based on status and priority
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter === 'open' && task.completed) return false;
      if (statusFilter === 'done' && !task.completed) return false;

      // Priority filter
      if (priorityFilter > 0 && task.priority !== priorityFilter) return false;

      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Group into sections and sort
  const sections = useMemo((): TaskSection[] => {
    if (sortMode === 'deadline') {
      const sorted = sortByDeadline(filteredTasks);
      return sorted.length > 0 ? [{ title: 'All Tasks', data: sorted }] : [];
    }

    if (sortMode === 'newest') {
      const sorted = sortByNewest(filteredTasks);
      return sorted.length > 0 ? [{ title: 'All Tasks', data: sorted }] : [];
    }

    // Default: Smart sort with sections (Overdue, Today, Later, Done)
    return buildSections(filteredTasks, now);
  }, [filteredTasks, sortMode, now]);

  // Overdue count for header subtitle
  const overdueCount = useMemo(() => {
    return tasks.filter(
      (t) => !t.completed && t.deadline && new Date(t.deadline).getTime() < now.getTime(),
    ).length;
  }, [tasks, now]);

  const openCount = counts.open;

  const todayFormatted = useMemo(() => {
    try {
      return now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).toUpperCase();
    } catch {
      return 'TODAY';
    }
  }, [now]);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const completionPercent = counts.all > 0 ? Math.round((counts.done / counts.all) * 100) : 0;

  // Handlers with LayoutAnimation
  const handleToggle = useCallback(
    (task: Task) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      toggle(task);
    },
    [toggle],
  );

  const handleDelete = useCallback(
    (id: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      remove(id);
    },
    [remove],
  );

  const openAddSheet = () => {
    setEditTask(null);
    setSheetVisible(true);
  };

  const openEditSheet = useCallback((task: Task) => {
    setEditTask(task);
    setSheetVisible(true);
  }, []);

  const closeSheet = () => {
    setSheetVisible(false);
    setEditTask(null);
  };

  const cycleSort = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const modes: SortMode[] = ['smart', 'deadline', 'newest'];
    const nextIndex = (modes.indexOf(sortMode) + 1) % modes.length;
    setSortMode(modes[nextIndex]);
  };

  const clearFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStatusFilter('all');
    setPriorityFilter(0);
    setSortMode('smart');
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter > 0 || sortMode !== 'smart';

  const sortLabels: Record<SortMode, string> = {
    smart: 'Smart',
    deadline: 'Deadline',
    newest: 'Newest',
  };

  const renderSectionHeader = ({ section }: { section: TaskSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: 'transparent' }]}>
      <Text
        style={[
          typography.section,
          {
            color: section.title === 'Overdue' ? colors.priorityHigh : colors.ink,
          },
        ]}
      >
        {section.title}
      </Text>
      <View
        style={[
          styles.sectionBadge,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(17, 26, 46, 0.06)',
          },
        ]}
      >
        <Text
          style={[
            typography.meta,
            { color: colors.slate, fontSize: 11, fontWeight: '700' },
          ]}
        >
          {section.data.length}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Task }) => (
    <TaskRow
      task={item}
      now={now}
      onToggle={handleToggle}
      onDelete={handleDelete}
      onEdit={openEditSheet}
    />
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.chalk }]}>
      <StatusBar barStyle="dark-content" />

      {/* Subtle ambient light blooms for authentic iOS glass refraction */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlowTopRight,
          {
            backgroundColor: isDark
              ? 'rgba(124, 145, 255, 0.16)'
              : 'rgba(47, 75, 255, 0.10)',
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlowTopLeft,
          {
            backgroundColor: isDark
              ? 'rgba(240, 101, 106, 0.12)'
              : 'rgba(229, 72, 77, 0.06)',
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlowCenter,
          {
            backgroundColor: isDark
              ? 'rgba(79, 184, 148, 0.10)'
              : 'rgba(62, 155, 122, 0.06)',
          },
        ]}
      />

      {/* iOS Premium Glass Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerDate, { color: colors.slate }]}>
            {todayFormatted}
          </Text>
          <Text style={[typography.titleL, { color: colors.ink }]}>
            My Tasks
          </Text>
        </View>

        <TouchableOpacity
          onPress={logout}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Log out"
          accessibilityRole="button"
          activeOpacity={0.75}
          style={[
            styles.glassProfilePill,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.16)'
                : 'rgba(255, 255, 255, 0.95)',
              shadowColor: colors.ink,
            },
          ]}
        >
          <View
            style={[
              styles.avatarBadge,
              { backgroundColor: colors.ink },
            ]}
          >
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
          <Text
            style={[
              typography.meta,
              { color: colors.slate, fontWeight: '600' },
            ]}
          >
            Log out
          </Text>
        </TouchableOpacity>
      </View>

      {/* iOS Dynamic Island-style Frosted Filter Hub */}
      <View style={styles.islandWrapper}>
        <View
          style={[
            styles.filterIsland,
            {
              backgroundColor: isDark
                ? 'rgba(26, 36, 60, 0.78)'
                : 'rgba(255, 255, 255, 0.82)',
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.95)',
              shadowColor: colors.ink,
            },
          ]}
        >
          {/* Daily Progress Vitals */}
          <View style={styles.vitalHeaderRow}>
            <View style={styles.vitalLeft}>
              <Text
                style={[
                  styles.vitalTitle,
                  { color: colors.ink },
                ]}
              >
                {counts.all === 0
                  ? 'No tasks yet'
                  : counts.done === counts.all
                    ? 'All tasks completed'
                    : `${counts.done} of ${counts.all} completed`}
              </Text>
            </View>

            {overdueCount > 0 ? (
              <View
                style={[
                  styles.overdueCapsule,
                  {
                    backgroundColor: isDark
                      ? 'rgba(240, 101, 106, 0.2)'
                      : 'rgba(229, 72, 77, 0.12)',
                    borderColor: colors.priorityHigh,
                  },
                ]}
              >
                <View
                  style={[
                    styles.overdueDot,
                    { backgroundColor: colors.priorityHigh },
                  ]}
                />
                <Text
                  style={[
                    styles.overdueText,
                    { color: colors.priorityHigh },
                  ]}
                >
                  {overdueCount} overdue
                </Text>
              </View>
            ) : counts.all > 0 ? (
              <Text style={[styles.vitalPercent, { color: colors.slate }]}>
                {completionPercent}%
              </Text>
            ) : null}
          </View>

          {/* Micro Progress Track */}
          {counts.all > 0 && (
            <View
              style={[
                styles.vitalTrack,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View
                style={[
                  styles.vitalFill,
                  {
                    width: `${completionPercent}%`,
                    backgroundColor:
                      counts.done === counts.all
                        ? colors.priorityLow
                        : colors.signal,
                  },
                ]}
              />
            </View>
          )}

          {/* Row 1: iOS Native Segmented Track (All | To Do | Done) */}
          <View
            style={[
              styles.segmentTrack,
              {
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.35)'
                  : 'rgba(0, 0, 0, 0.045)',
              },
            ]}
          >
            {(
              [
                { key: 'all', label: 'All', count: counts.all },
                { key: 'open', label: 'To Do', count: counts.open },
                { key: 'done', label: 'Done', count: counts.done },
              ] as const
            ).map((tab) => {
              const isSelected = statusFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setStatusFilter(tab.key);
                  }}
                  activeOpacity={0.8}
                  style={[
                    styles.segmentTab,
                    isSelected && [
                      styles.segmentTabActive,
                      {
                        backgroundColor: isDark
                          ? '#283659'
                          : '#FFFFFF',
                        shadowColor: '#000',
                      },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      {
                        color: isSelected
                          ? isDark
                            ? '#FFFFFF'
                            : colors.ink
                          : colors.slate,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  <View
                    style={[
                      styles.countBadge,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(124, 145, 255, 0.25)'
                            : colors.ink
                          : isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(17, 26, 46, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        {
                          color: isSelected
                            ? isDark
                              ? '#FFFFFF'
                              : '#FFFFFF'
                            : colors.slate,
                        },
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Frosted Divider */}
          <View
            style={[
              styles.islandDivider,
              {
                backgroundColor: isDark
                  ? 'rgba(124, 145, 255, 0.1)'
                  : 'rgba(213, 219, 230, 0.5)',
              },
            ]}
          />

          {/* Row 2: Priority Capsules + Sort/Reset Pills */}
          <View style={styles.subControlsRow}>
            {/* Priority Capsules */}
            <View style={styles.priorityGroup}>
              {(
                [
                  { id: 0, label: 'All' },
                  { id: 3, label: 'High', color: colors.priorityHigh },
                  { id: 2, label: 'Med', color: colors.priorityMedium },
                  { id: 1, label: 'Low', color: colors.priorityLow },
                ] as const
              ).map((p) => {
                const isSelected = priorityFilter === p.id;
                const hasColor = 'color' in p;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setPriorityFilter(p.id);
                    }}
                    activeOpacity={0.7}
                    style={[
                      styles.pPill,
                      {
                        backgroundColor: isSelected
                          ? hasColor
                            ? isDark
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(255, 255, 255, 0.95)'
                            : isDark
                              ? '#283659'
                              : colors.ink
                          : isDark
                            ? 'rgba(0, 0, 0, 0.2)'
                            : 'rgba(0, 0, 0, 0.035)',
                        borderColor: isSelected
                          ? hasColor
                            ? p.color
                            : isDark
                              ? '#283659'
                              : colors.ink
                          : 'transparent',
                        shadowColor: isSelected ? colors.ink : 'transparent',
                      },
                      isSelected && styles.pPillSelected,
                    ]}
                  >
                    {hasColor && (
                      <View
                        style={[styles.pDot, { backgroundColor: p.color }]}
                      />
                    )}
                    <Text
                      style={[
                        styles.pPillText,
                        {
                          color: isSelected
                            ? hasColor
                              ? p.color
                              : '#FFFFFF'
                            : colors.slate,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort & Reset Actions */}
            <View style={styles.actionGroup}>
              <TouchableOpacity
                onPress={cycleSort}
                activeOpacity={0.7}
                style={[
                  styles.sortBtn,
                  {
                    backgroundColor:
                      sortMode !== 'smart'
                        ? isDark
                          ? 'rgba(124, 145, 255, 0.22)'
                          : 'rgba(47, 75, 255, 0.12)'
                        : isDark
                          ? 'rgba(0, 0, 0, 0.2)'
                          : 'rgba(0, 0, 0, 0.035)',
                    borderColor:
                      sortMode !== 'smart'
                        ? colors.signal
                        : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sortText,
                    {
                      color:
                        sortMode !== 'smart' ? colors.signal : colors.slate,
                      fontWeight: sortMode !== 'smart' ? '700' : '500',
                    },
                  ]}
                >
                  ⇅ {sortLabels[sortMode]}
                </Text>
              </TouchableOpacity>

              {hasActiveFilters && (
                <TouchableOpacity
                  onPress={clearFilters}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.resetBtn}
                  activeOpacity={0.7}
                  accessibilityLabel="Reset filters"
                >
                  <Text style={styles.resetText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Task list with glassmorphic cards */}
      {error && !loading ? (
        <EmptyState type="error" message={error} />
      ) : sections.length === 0 && !loading ? (
        <EmptyState
          type={hasActiveFilters ? 'filtered' : 'empty'}
          onClearFilters={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: { _id: any; }) => item._id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={colors.signal}
              colors={[colors.signal]}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Dock button (quick add) */}
      <View style={styles.dockContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openAddSheet}
          style={[styles.dock, { backgroundColor: colors.ink }]}
          accessibilityRole="button"
          accessibilityLabel="Add a task"
        >
          <Text style={[typography.button, { color: '#FFFFFF', fontSize: 16 }]}>
            Add a task
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add / Edit bottom sheet */}
      <AddTaskSheet
        visible={sheetVisible}
        editTask={editTask}
        onClose={closeSheet}
        onAdd={add}
        onUpdate={update}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  // Ambient glow lights behind header for genuine glass refraction
  ambientGlowTopRight: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  ambientGlowTopLeft: {
    position: 'absolute',
    top: 50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  ambientGlowCenter: {
    position: 'absolute',
    top: 140,
    right: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  // iOS Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl + 8,
    paddingBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  headerDate: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 2,
  },
  glassProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 18,
    borderWidth: 1.2,
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  // iOS Dynamic Island Filter Hub
  islandWrapper: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },
  filterIsland: {
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  vitalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  vitalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vitalTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  vitalPercent: {
    fontSize: 12,
    fontWeight: '700',
  },
  vitalTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  vitalFill: {
    height: '100%',
    borderRadius: 2,
  },
  overdueCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  overdueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7.5,
    borderRadius: 11,
    gap: 6,
  },
  segmentTabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 13,
  },
  countBadge: {
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  islandDivider: {
    height: 1,
    marginVertical: 7,
    marginHorizontal: 4,
  },
  subControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  priorityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: 1.2,
  },
  pPillSelected: {
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  pDot: {
    width: 5.5,
    height: 5.5,
    borderRadius: 3,
    marginRight: 4,
  },
  pPillText: {
    fontSize: 11,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 11,
    borderWidth: 1.2,
  },
  sortText: {
    fontSize: 11,
  },
  resetBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 72, 77, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    color: '#E5484D',
    fontSize: 11,
    fontWeight: '700',
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  sectionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: 110,
  },
  dockContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  dock: {
    height: 52,
    borderRadius: radius.dock,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
});
