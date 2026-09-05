/**
 * Consolidated Bjet Theme Exports
 */
export * from './colors';
export * from './spacing';
export * from './typography';

import { colors } from './colors';
import { spacing, radii } from './spacing';
import { typography, fontSizes, fontWeights } from './typography';

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  fontSizes,
  fontWeights,
} as const;

export type Theme = typeof theme;
export default theme;
