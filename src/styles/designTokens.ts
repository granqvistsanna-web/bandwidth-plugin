/**
 * Premium Minimal Design System
 * Grayscale foundation with neutral surfaces and blue accent
 * Built for focus, clarity, and speed
 */

// ============================================================================
// COLOR PALETTE - Grayscale + Neutral Gray + Blue Accent
// ============================================================================

export const colors = {
  // Pure surfaces
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale - foundation for all surfaces
  gray: {
    50: '#FAFAFA',   // Lightest - subtle backgrounds in light mode
    100: '#F5F5F5',  // Very light - secondary backgrounds
    200: '#E5E5E5',  // Light - borders in light mode
    300: '#D4D4D4',  // Mid-light - disabled states
    400: '#A3A3A3',  // Mid - secondary text
    500: '#737373',  // Mid-dark - body text secondary
    600: '#525252',  // Dark - body text primary in light mode
    700: '#404040',  // Darker - headings, emphasis
    800: '#262626',  // Very dark - almost black
    900: '#171717',  // Darkest - borders in dark mode
  },
  
  // Neutral gray for card backgrounds
  warmGray: {
    50: '#F1F1EF',   // Lightest - card backgrounds, subtle backgrounds
    100: '#F1F1EF',  // Card backgrounds
    200: '#F1F1EF',  // Menu background
    300: '#E0E0DE',  // Borders, dividers
    400: '#A8A8A6',  // Secondary text
    500: '#787876',  // Tertiary text
    800: '#2A2A28',  // Dark mode secondary cards
    900: '#1A1A18',  // Dark mode card backgrounds
  },

  // Almost black - for primary text and buttons
  almostBlack: '#1A1919',

  // Blue accent - for primary actions
  accent: {
    primary: '#0099FF',   // Primary blue accent
    light: '#0099FF',    // Same as primary for consistency
  }
} as const

// Semantic status colors - reference CSS custom properties for theme support
export const status = {
  success: {
    bg: 'var(--status-success-bg)',
    text: 'var(--status-success-text)',
    solid: 'var(--status-success-solid)',
    hover: 'var(--status-success-hover)',
  },
  warning: {
    bg: 'var(--status-warning-bg)',
    text: 'var(--status-warning-text)',
    solid: 'var(--status-warning-solid)',
  },
  error: {
    bg: 'var(--status-error-bg)',
    text: 'var(--status-error-text)',
    solid: 'var(--status-error-solid)',
  },
  info: {
    bg: 'var(--status-info-bg)',
    text: 'var(--status-info-text)',
    solid: 'var(--status-info-solid)',
  },
  purple: {
    bg: 'var(--status-purple-bg)',
    text: 'var(--status-purple-text)',
  },
} as const

// Theme-aware backgrounds - reference CSS custom properties
export const backgrounds = {
  primary: 'var(--bg-primary)',
  page: 'var(--bg-page)',
} as const

// Theme-aware surfaces - reference CSS custom properties
export const surfaces = {
  primary: 'var(--surface-primary)',
  secondary: 'var(--surface-secondary)',
  tertiary: 'var(--surface-tertiary)',
} as const

// Theme-aware borders - reference CSS custom properties
export const themeBorders = {
  subtle: 'var(--border-subtle)',
  default: 'var(--border-default)',
  strong: 'var(--border-strong)',
} as const

// Theme-aware elevation - reference CSS custom properties
export const themeElevation = {
  subtle: 'var(--elevation-subtle)',
  default: 'var(--elevation-default)',
  medium: 'var(--elevation-medium)',
  strong: 'var(--elevation-strong)',
} as const

// Overlays - reference CSS custom properties
export const overlays = {
  modal: 'var(--overlay-modal)',
  backdrop: 'var(--overlay-backdrop)',
} as const

// Hover states - reference CSS custom properties
export const hoverStates = {
  surface: 'var(--hover-surface)',
  border: 'var(--hover-border)',
} as const

// Theme-aware text colors - reference our custom CSS properties that adapt to data-theme
export const framerColors = {
  // Use Framer's background colors (these work correctly)
  bg: 'var(--framer-color-bg)',
  bgSecondary: 'var(--framer-color-bg-secondary)',
  bgTertiary: 'var(--framer-color-bg-tertiary)',

  // Use our custom text colors that adapt to data-theme attribute
  text: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  textReversed: 'var(--framer-color-text-reversed)',

  // Keep Framer's UI colors
  divider: 'var(--framer-color-divider)',
  tint: 'var(--framer-color-tint)',
  tintDark: 'var(--framer-color-tint-dark)',
  tintDimmed: 'var(--framer-color-tint-dimmed)',
} as const

// Light mode color semantics
export const lightMode = {
  // Surfaces - neutral gray for cards
  surface: {
    primary: colors.white,
    secondary: colors.warmGray[50],      // Card backgrounds
    tertiary: colors.warmGray[100],       // Secondary cards
  },

  // Text
  text: {
    primary: colors.black,
    secondary: colors.gray[600],
    tertiary: colors.gray[400],
    inverse: colors.white,
    accent: colors.accent.primary,      // Blue accent for callouts
  },

  // Borders & Dividers - thin and minimal
  border: {
    subtle: colors.gray[200],
    default: colors.gray[300],
    strong: colors.gray[400],
  },

  // Interactive states
  interactive: {
    default: colors.gray[100],
    hover: colors.gray[200],
    active: colors.gray[300],
  },

  // Shadows - minimal
  shadow: {
    subtle: 'rgba(0, 0, 0, 0.02)',
    default: 'rgba(0, 0, 0, 0.04)',
    strong: 'rgba(0, 0, 0, 0.08)',
  }
} as const

// Dark mode color semantics - inverted appropriately
export const darkMode = {
  // Surfaces - warm gray inverted
  surface: {
    primary: colors.black,
    secondary: colors.warmGray[900],     // Card backgrounds
    tertiary: colors.warmGray[800],       // Secondary cards
  },

  // Text
  text: {
    primary: colors.white,
    secondary: colors.gray[400],
    tertiary: colors.gray[500],
    inverse: colors.black,
    accent: colors.accent.primary,       // Blue accent for dark mode
  },

  // Borders & Dividers
  border: {
    subtle: colors.gray[800],
    default: colors.gray[700],
    strong: colors.gray[600],
  },

  // Interactive states
  interactive: {
    default: colors.gray[800],
    hover: colors.gray[700],
    active: colors.gray[600],
  },

  // Glows (instead of shadows in dark mode)
  glow: {
    subtle: 'rgba(255, 255, 255, 0.02)',
    default: 'rgba(255, 255, 255, 0.04)',
    strong: 'rgba(255, 255, 255, 0.06)',
  }
} as const

// ============================================================================
// SPACING SCALE - 4px base
// ============================================================================

export const spacing = {
  xs: '4px',    // 4px
  sm: '8px',    // 8px
  md: '12px',   // 12px
  lg: '16px',   // 16px
  xl: '24px',   // 24px
  xxl: '32px',  // 32px
} as const

// Component-specific spacing
export const componentSpacing = {
  modal: {
    top: spacing.xl,        // 24px
    section: spacing.lg,    // 16px
    option: spacing.md,     // 12px
    bottom: spacing.xl,     // 24px
  },

  assetList: {
    row: spacing.lg,        // 16px between rows
    internal: spacing.md,   // 12px internal padding
    thumbnail: spacing.sm,  // 8px between thumbnail and text
  },

  card: {
    padding: spacing.md,    // 12px
    gap: spacing.sm,        // 8px
  }
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    // Primary sans-serif - Inter
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },

  fontSize: {
    xs: '11px',    // Small labels, metadata
    sm: '13px',    // Body text, buttons
    md: '15px',    // Section headings
    lg: '18px',    // Page headings
    xl: '24px',    // Large headings
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,     // Metrics, large numbers
    normal: 1.5,    // Body text
    relaxed: 1.7,   // Descriptions, long form
  },

  letterSpacing: {
    tight: '-0.02em',   // Large headings
    normal: '0',        // Body text
    wide: '0.02em',     // Labels, uppercase
  }
} as const

// ============================================================================
// BORDERS & RADII
// ============================================================================

export const borders = {
  width: {
    thin: '1px',      // Standard thin borders
    default: '1px',   // Standard borders
  },

  radius: {
    sm: '8px',    // Small - buttons, badges
    md: '12px',   // Medium - inputs, small cards
    lg: '20px',   // Large - cards, panels
    full: '9999px', // Full - pills
  }
} as const

// ============================================================================
// SHADOWS & ELEVATION
// ============================================================================

export const elevation = {
  // Light mode shadows
  light: {
    none: 'none',
    subtle: `0 1px 2px ${lightMode.shadow.subtle}`,
    default: `0 2px 4px ${lightMode.shadow.default}`,
    strong: `0 4px 8px ${lightMode.shadow.strong}`,
  },

  // Dark mode glows
  dark: {
    none: 'none',
    subtle: `0 0 0 1px ${darkMode.glow.subtle}`,
    default: `0 0 0 1px ${darkMode.glow.default}`,
    strong: `0 0 0 1px ${darkMode.glow.strong}`,
  }
} as const

// ============================================================================
// COMPONENT PRESETS
// ============================================================================

export const presets = {
  button: {
    padding: `${spacing.sm} ${spacing.lg}`,  // 8px 16px
    minHeight: '36px',  // Comfortable tap target
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borders.radius.md,
  },

  card: {
    padding: spacing.md,  // 12px
    borderRadius: borders.radius.lg,
    borderWidth: borders.width.thin,
  },

  input: {
    padding: `${spacing.sm} ${spacing.md}`,  // 8px 12px
    fontSize: typography.fontSize.sm,
    borderRadius: borders.radius.md,
    height: '32px',
  }
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color value based on current mode
 */
export function getColorForMode(mode: 'light' | 'dark', lightValue: string, darkValue: string): string {
  return mode === 'light' ? lightValue : darkValue
}

/**
 * Get elevation style based on current mode
 */
export function getElevation(mode: 'light' | 'dark', level: 'none' | 'subtle' | 'default' | 'strong'): string {
  return mode === 'light' ? elevation.light[level] : elevation.dark[level]
}
