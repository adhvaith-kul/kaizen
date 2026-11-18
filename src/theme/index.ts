// Kaizen Design System — Mocha Brown, Platinum Silver & Pale Lavender Theme

export const colors = {
  // Brand Anchors (From Reference: Mocha Brown, Platinum Silver, Pale Lavender)
  mocha: '#6F4E37',
  mochaDark: '#4A3324',
  mochaLight: '#8C674B',
  mochaMuted: '#584030',
  mochaSurface: 'rgba(111, 78, 55, 0.15)',
  mochaBorder: 'rgba(111, 78, 55, 0.35)',

  silver: '#E5E4E2',
  platinum: '#E5E4E2',
  silverLight: '#F5F5F3',
  silverMuted: '#A8A6A1',
  silverDark: '#6B6864',

  lavender: '#E6E0F0',
  lavenderText: '#E6E0F0',
  lavenderLight: '#F2EDFA',
  lavenderMuted: '#C2B8D9',
  lavenderDark: '#8F7EA8',
  lavenderSubtle: 'rgba(230, 224, 240, 0.08)',
  lavenderBorder: 'rgba(230, 224, 240, 0.2)',

  // Surfaces & Backgrounds (Rich Espresso & Obsidian)
  background: '#130E0B',
  backgroundSecondary: '#19130F',
  surface: '#1E1612',
  surfaceElevated: '#281F1A',
  surfaceHover: '#322721',
  surfaceSelected: '#3D2F28',

  // Borders
  border: '#32261F',
  borderSubtle: '#241B16',
  borderActive: '#E6E0F0',
  borderFocus: '#8C674B',

  // Text Hierarchy
  textPrimary: '#E5E4E2',
  textSecondary: '#C5C1BA',
  textMuted: '#8A827B',
  textInverse: '#130E0B',
  textAccent: '#E6E0F0',

  // Semantic Status (Sophisticated & Muted)
  success: '#8EAA90',
  successSubtle: 'rgba(142, 170, 144, 0.12)',
  danger: '#BD6D6D',
  dangerSubtle: 'rgba(189, 109, 109, 0.12)',
  warning: '#CCA470',
  warningSubtle: 'rgba(204, 164, 112, 0.12)',
  info: '#9AA7BF',
  infoSubtle: 'rgba(154, 167, 191, 0.12)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  fontFamily: (platform: string) => (platform === 'ios' ? 'System' : 'sans-serif'),
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  typography,
};

export default theme;
