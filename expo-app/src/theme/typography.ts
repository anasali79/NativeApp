/**
 * Typography scale strictly per DESIGN.md Section 4:
 * Left-aligned, proportional line heights, no fixed height constraints.
 */
import { TextStyle } from 'react-native';

export const typography = {
  titleL: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -1,
  },
  titleM: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.4,
  },
  section: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  rowTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  secondary: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0,
  },
};
