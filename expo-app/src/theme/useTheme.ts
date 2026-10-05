/**
 * Hook to access current theme tokens (light or dark mode)
 */
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
