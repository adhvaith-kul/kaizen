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
  success?: string;
  danger?: string;
  warning?: string;
  info?: string;
}

export function createTheme(config: ThemeConfig) {
  const surfaceElevated = config.surfaceElevated || config.surface;
  const borderSubtle = config.borderSubtle || config.border;
  const textMuted = config.textMuted || config.textSecondary;

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
    // Allows seamless drop-in adaptation across all existing components
    mocha: config.primary,
    mochaDark: config.border,
    mochaLight: config.primary,
    mochaMuted: config.surface,
    mochaSurface: config.surfaceElevated,
    mochaBorder: config.border,

    silver: config.textPrimary,
    platinum: config.primaryText,
    silverLight: config.textPrimary,
    silverMuted: config.textSecondary,
    silverDark: textMuted,

    lavender: config.primary,
    lavenderText: config.primary,
    lavenderLight: config.primary,
    lavenderMuted: config.textSecondary,
    lavenderDark: config.border,
    lavenderSubtle: 'rgba(255, 140, 178, 0.12)',
    lavenderBorder: config.border,
  };
}

// ── AVAILABLE THEME PRESETS ────────────────────────────────────────────
export const themes = {
  /**
   * Strawberry Espresso (ACTIVE)
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

  /**
   * Mocha Lavender (Previous Reference)
   */
  mochaLavender: createTheme({
    background: '#130E0B',
    surface: '#1E1612',
    surfaceElevated: '#281F1A',
    border: '#32261F',
    borderSubtle: '#241B16',
    textPrimary: '#E5E4E2',
    textSecondary: '#C5C1BA',
    textMuted: '#8A827B',
    primary: '#6F4E37',
    primaryText: '#E5E4E2',
  }),
};

// ── ACTIVE THEME SELECTION ─────────────────────────────────────────────
// To switch themes at any time, just change ACTIVE_THEME name below!
export const ACTIVE_THEME: keyof typeof themes = 'strawberryEspresso';

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
