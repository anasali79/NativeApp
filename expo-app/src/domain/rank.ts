import { Task, TaskSection } from './types';

/**
 * Smart sort algorithm (bonus feature)
 *
 * score = priorityPoints + urgencyPoints + nowBoost
 *
 * priorityPoints: low=10, medium=20, high=30
 * urgencyPoints:  no deadline → 0, overdue → 40, else → 30 * exp(-hoursLeft / 48)
 * nowBoost:       scheduledAt exists and scheduledAt <= now + 2h → +10
 *
 * Tie-break: earlier deadline first, then newer createdAt first
 */

const PRIORITY_POINTS: Record<number, number> = { 1: 10, 2: 20, 3: 30 };

export function score(task: Task, now: Date): number {
  const priorityPoints = PRIORITY_POINTS[task.priority] ?? 20;

  let urgencyPoints = 0;
  if (task.deadline) {
    const deadlineMs = new Date(task.deadline).getTime();
    const hoursLeft = (deadlineMs - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft <= 0) {
      urgencyPoints = 40; // overdue
    } else {
      urgencyPoints = 30 * Math.exp(-hoursLeft / 48);
    }
  }

  let nowBoost = 0;
  if (task.scheduledAt) {
    const scheduledMs = new Date(task.scheduledAt).getTime();
    const twoHoursFromNow = now.getTime() + 2 * 60 * 60 * 1000;
    if (scheduledMs <= twoHoursFromNow) {
      nowBoost = 10;
    }
  }

  return priorityPoints + urgencyPoints + nowBoost;
}

/** Determines if a task is overdue (has deadline in the past and not completed) */
export function isOverdue(task: Task, now: Date): boolean {
  if (!task.deadline || task.completed) return false;
  return new Date(task.deadline).getTime() < now.getTime();
}

/** Determines if a task is "today" (deadline or scheduledAt falls today) */
function isToday(task: Task, now: Date): boolean {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  if (task.deadline) {
    const d = new Date(task.deadline).getTime();
    if (d >= todayStart.getTime() && d <= todayEnd.getTime()) return true;
  }
  if (task.scheduledAt) {
    const s = new Date(task.scheduledAt).getTime();
    if (s >= todayStart.getTime() && s <= todayEnd.getTime()) return true;
  }
  return false;
}

/**
 * Groups tasks into sections: Overdue → Today → Later → Done
 * Each group is sorted by smart score (descending)
 */
export function buildSections(tasks: Task[], now: Date): TaskSection[] {
  const overdue: Task[] = [];
  const today: Task[] = [];
  const later: Task[] = [];
  const done: Task[] = [];

  for (const task of tasks) {
    if (task.completed) {
      done.push(task);
    } else if (isOverdue(task, now)) {
      overdue.push(task);
    } else if (isToday(task, now)) {
      today.push(task);
    } else {
      later.push(task);
    }
  }

  // Sort each open group by score descending, then tie-break
  const sortByScore = (a: Task, b: Task): number => {
    const diff = score(b, now) - score(a, now);
    if (diff !== 0) return diff;

    // Tie-break: earlier deadline first
    if (a.deadline && b.deadline) {
      const dDiff = new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (dDiff !== 0) return dDiff;
    } else if (a.deadline) {
      return -1;
    } else if (b.deadline) {
      return 1;
    }

    // Then newer createdAt first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  overdue.sort(sortByScore);
  today.sort(sortByScore);
  later.sort(sortByScore);
  // Done tasks: most recently completed first
  done.sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  });

  // Only include sections that have data
  const sections: TaskSection[] = [];
  if (overdue.length > 0) sections.push({ title: 'Overdue', data: overdue });
  if (today.length > 0) sections.push({ title: 'Today', data: today });
  if (later.length > 0) sections.push({ title: 'Later', data: later });
  if (done.length > 0) sections.push({ title: 'Done', data: done });

  return sections;
}

/** Sort by deadline ascending (no deadline at the end) */
export function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

/** Sort by newest createdAt first */
export function sortByNewest(tasks: Task[]): Task[] {
  return [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
