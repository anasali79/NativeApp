/**
 * Color tokens strictly per DESIGN.md Section 3:
 * Light mode & Dark mode palettes with WCAG-compliant contrast.
 */

export interface ThemeColors {
  chalk: string;
  paper: string;
  ink: string;
  slate: string;
  hairline: string;
  signal: string;
  scrim: string;
  priorityHigh: string;
  priorityMedium: string;
  priorityLow: string;
  priority: {
    high: string;
    medium: string;
    low: string;
  };
}

export const lightColors: ThemeColors = {
  chalk: '#EEF1F6',
  paper: '#FFFFFF',
  ink: '#111A2E',
  slate: '#5B6578',
  hairline: '#D5DBE6',
  signal: '#2F4BFF',
  scrim: 'rgba(17, 26, 46, 0.45)',
  priorityHigh: '#E5484D',
  priorityMedium: '#E9A23B',
  priorityLow: '#3E9B7A',
  priority: {
    high: '#E5484D',
    medium: '#E9A23B',
    low: '#3E9B7A',
  },
};

export const darkColors: ThemeColors = {
  chalk: '#121A2C',
  paper: '#1B2540',
  ink: '#E8ECF5',
  slate: '#9AA5BC',
  hairline: '#2A3553',
  signal: '#7C91FF',
  scrim: 'rgba(0, 0, 0, 0.65)',
  priorityHigh: '#F0656A',
  priorityMedium: '#F2B359',
  priorityLow: '#4FB894',
  priority: {
    high: '#F0656A',
    medium: '#F2B359',
    low: '#4FB894',
  },
};

/**
 * Returns color associated with task priority.
 * 3 = High, 2 = Medium, 1 = Low
 */
export function priorityColor(priority: number, colors: ThemeColors): string {
  switch (priority) {
    case 3:
      return colors.priorityHigh;
    case 2:
      return colors.priorityMedium;
    case 1:
      return colors.priorityLow;
    default:
      return colors.slate;
  }
}
