/**
 * ORMO brand palette: blue #008AFF, navy #111827, gray #D9D9D9, ice #F3F6FF.
 * The manager app has a single light theme (no dark mode).
 */

import '@/global.css';

export const Colors = {
  background: '#F3F6FF',
  backgroundElevated: '#E8EEFB',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#DCE5F7',
  border: '#D9D9D9',

  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',

  accent: '#008AFF',
  accentStrong: '#0070D6',
  accentText: '#FFFFFF',
  white: '#FFFFFF',

  danger: '#E5484D',
  dangerBg: '#FDECEC',
  success: '#15803D',
  successBg: '#E3F6EA',
  warning: '#B45309',

  overlay: 'rgba(17, 24, 39, 0.5)',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = {
  sans: 'system-ui',
  serif: 'ui-serif',
  mono: 'ui-monospace',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

export const SidebarWidth = 232;
