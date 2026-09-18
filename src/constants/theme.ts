/**
 * Coffeul brand palette. The manager app always renders in the same warm dark
 * theme as the customer app — there is no light mode.
 */

import '@/global.css';

export const Colors = {
  background: '#1B120B',
  backgroundElevated: '#241811',
  backgroundElement: '#2A1D14',
  backgroundSelected: '#3A2A1C',
  border: '#3D2C1F',

  text: '#F5ECE1',
  textSecondary: '#B9A691',
  textMuted: '#8A7A6A',

  accent: '#E8A659',
  accentStrong: '#D89142',
  accentText: '#241206',

  danger: '#E1584A',
  dangerBg: '#3A231F',
  success: '#3CB878',
  successBg: '#1E3327',
  warning: '#E8C459',

  kakao: '#FFCD00',
  naver: '#2ECC71',
  overlay: 'rgba(10, 6, 3, 0.6)',
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
  small: 8,
  medium: 12,
  large: 16,
  pill: 999,
} as const;

export const SidebarWidth = 232;
