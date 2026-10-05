/** Date formatting utilities for the UI */

/** Formats a date string for display: "Today, 6:00 pm", "Fri 9 Oct, 6:30 pm", etc. */
export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();

  const isToday = isSameDay(date, now);
  const isTomorrow = isSameDay(date, addDays(now, 1));

  const timeStr = formatTime(date);

  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${dayName} ${day} ${month}, ${timeStr}`;
}

/** Formats a relative deadline label: "Was due 4 Oct", "Due today", "Due tomorrow", etc. */
export function formatDeadlineLabel(dateStr: string | null, now: Date): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  if (date.getTime() < now.getTime()) {
    // Overdue
    if (isSameDay(date, now)) return 'Due today';
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `Was due ${day} ${month}`;
  }

  if (isSameDay(date, now)) return 'Due today';
  if (isSameDay(date, addDays(now, 1))) return 'Due tomorrow';

  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `Due ${day} ${month}`;
}

/** Priority label text */
export function priorityLabel(priority: number): string {
  switch (priority) {
    case 3: return 'High priority';
    case 2: return 'Medium priority';
    case 1: return 'Low priority';
    default: return '';
  }
}

// --- Helpers ---

function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  const minuteStr = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`;
  return `${hours}${minuteStr} ${ampm}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
