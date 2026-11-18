// Kaizen Design System — Theme Engine & Palettes
// Designed for instant theme switching and custom palette adaptation.

export interface ThemeConfig {
  background: string;       // App background
  surface: string;          // Cards and sheets
  surfaceElevated?: string;  // Elevated cards, modals, inputs
  border: string;           // Borders and dividers
  borderSubtle?: string;     // Subtle / secondary borders
  textPrimary: string;      // Primary text
  textSecondary: string;    // Secondary text
  textMuted?: string;        // Tertiary / hint text
  primary: string;          // Primary buttons, active tabs
  primaryText: string;      // Text on primary buttons
  accentLavender?: string;  // Explicit pale lavender accent
  accentSilver?: string;    // Explicit platinum silver accent
  accentMocha?: string;     // Explicit mocha brown accent
  success?: string;
  danger?: string;
  warning?: string;
  info?: string;
}

export function createTheme(config: ThemeConfig) {
  const surfaceElevated = config.surfaceElevated || config.surface;
  const borderSubtle = config.borderSubtle || config.border;
  const textMuted = config.textMuted || config.textSecondary;
  const accentLavender = config.accentLavender || config.primary;
  const accentSilver = config.accentSilver || config.textPrimary;
  const accentMocha = config.accentMocha || config.border;

  return {
    // ── Semantic Design Tokens ─────────────────────────────────────────
    background: config.background,
    backgroundSecondary: config.background,
    surface: config.surface,
    surfaceElevated,
    surfaceHover: config.surface,
    surfaceSelected: surfaceElevated,

    border: config.border,
    borderSubtle,
    borderActive: config.primary,
    borderFocus: config.primary,

    textPrimary: config.textPrimary,
    textSecondary: config.textSecondary,
    textMuted,
    textInverse: config.background,
    textAccent: config.primary,

    primary: config.primary,
    primaryText: config.primaryText,
    primarySurface: config.surface,
    primaryBorder: config.border,
    buttonText: config.primaryText,

    tabActive: config.primary,
    tabInactive: textMuted,
    tabIndicator: config.primary,

    // Status
    success: config.success || '#8EAA90',
    successSubtle: 'rgba(142, 170, 144, 0.12)',
    danger: config.danger || '#D95C5C',
    dangerSubtle: 'rgba(217, 92, 92, 0.12)',
    warning: config.warning || '#E5A955',
    warningSubtle: 'rgba(229, 169, 85, 0.12)',
    info: config.info || '#8CAAD9',
    infoSubtle: 'rgba(140, 170, 217, 0.12)',

    // ── Compatibility Aliases ──────────────────────────────────────────
    mocha: accentMocha,
    mochaDark: config.background,
    mochaLight: accentMocha,
    mochaMuted: config.surface,
    mochaSurface: surfaceElevated,
    mochaBorder: config.border,

    silver: accentSilver,
    platinum: accentSilver,
    silverLight: config.textPrimary,
    silverMuted: config.textSecondary,
    silverDark: textMuted,

    lavender: accentLavender,
    lavenderText: accentLavender,
    lavenderLight: accentLavender,
    lavenderMuted: config.textSecondary,
    lavenderDark: config.border,
    lavenderSubtle: 'rgba(230, 224, 240, 0.14)',
    lavenderBorder: config.border,
  };
}

// ── AVAILABLE THEME PRESETS ────────────────────────────────────────────
export const themes = {
  /**
   * Mocha Lavender & Silver (ACTIVE - from Reference Palette)
   * Mocha Brown:     #6F4E37 (rich mocha borders & card highlights)
   * Platinum Silver: #E5E4E2 (crisp platinum typography & metallic sheen)
   * Pale Lavender:   #E6E0F0 (ethereal lavender buttons, tabs & accents)
   * App Background:  #251914 (deep espresso foundation)
   * Surface Cards:   #38261F (warm mocha cocoa sheets)
   */
  mochaLavenderSilver: createTheme({
    background: '#251914',
    surface: '#38261F',
    surfaceElevated: '#4A332A',
    border: '#6F4E37',        // Exact swatch: #6F4E37
    borderSubtle: '#4A332A',
    textPrimary: '#E5E4E2',     // Exact swatch: #E5E4E2
    textSecondary: '#C5C1BA',
    textMuted: '#8F8780',
    primary: '#E6E0F0',         // Exact swatch: #E6E0F0
    primaryText: '#251914',     // High-contrast deep mocha on lavender
    accentLavender: '#E6E0F0',
    accentSilver: '#E5E4E2',
    accentMocha: '#6F4E37',
  }),

  /**
   * Strawberry Espresso
   * App background:       Espresso         #211613
   * Cards and sheets:     Warm cocoa       #30201D
   * Borders and dividers: Dark mocha       #513731
   * Primary text:         Warm cream       #FFF1E8
   * Secondary text:       Rose taupe       #C7AAA0
   * Primary buttons:      Strawberry pink  #FF8CB2
   * Text on pink buttons: Espresso         #211613
   */
  strawberryEspresso: createTheme({
    background: '#211613',
    surface: '#30201D',
    surfaceElevated: '#3D2A26',
    border: '#513731',
    borderSubtle: '#432E28',
    textPrimary: '#FFF1E8',
    textSecondary: '#C7AAA0',
    textMuted: '#9E837A',
    primary: '#FF8CB2',
    primaryText: '#211613',
  }),
};

// ── ACTIVE THEME SELECTION ─────────────────────────────────────────────
// Switch between 'mochaLavenderSilver' and 'strawberryEspresso' with one edit:
export const ACTIVE_THEME: keyof typeof themes = 'mochaLavenderSilver';

export const colors = themes[ACTIVE_THEME];

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
  themes,
  ACTIVE_THEME,
};

export default theme;
