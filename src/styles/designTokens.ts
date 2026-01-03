/**
 * Premium Minimal Design System
 * Grayscale-only palette with consistent spacing and typography
 */

// ============================================================================
// COLOR PALETTE - Grayscale Only
// ============================================================================

export const colors = {
  // Pure surfaces
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale (8 steps) - works in both light and dark mode
  gray: {
    50: '#FAFAFA',   // Lightest - subtle backgrounds in light mode
    100: '#F5F5F5',  // Very light - secondary backgrounds
    200: '#E5E5E5',  // Light - borders in light mode
    300: '#D4D4D4',  // Mid-light - disabled states
    400: '#A3A3A3',  // Mid - secondary text, icons
    500: '#737373',  // Mid-dark - body text secondary
    600: '#525252',  // Dark - body text primary in light mode
    700: '#404040',  // Darker - headings, emphasis
    800: '#262626',  // Very dark - almost black
    900: '#171717',  // Darkest - borders in dark mode
  },
  // Warm gray for card backgrounds - adds subtle warmth and contrast
  warmGray: {
    50: '#FAF9F8',   // Warm lightest - card backgrounds
    100: '#F5F4F3',  // Warm very light - secondary card backgrounds
  }
} as const

// Light mode color semantics
export const lightMode = {
  // Surfaces
  surface: {
    primary: colors.white,
    secondary: colors.gray[50],
    tertiary: colors.gray[100],
  },

  // Text
  text: {
    primary: colors.black,
    secondary: colors.gray[600],
    tertiary: colors.gray[400],
    inverse: colors.white,
  },

  // Borders & Dividers
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

  // Shadows
  shadow: {
    subtle: 'rgba(0, 0, 0, 0.04)',
    default: 'rgba(0, 0, 0, 0.08)',
    strong: 'rgba(0, 0, 0, 0.12)',
  }
} as const

// Dark mode color semantics
export const darkMode = {
  // Surfaces
  surface: {
    primary: colors.black,
    secondary: colors.gray[900],
    tertiary: colors.gray[800],
  },

  // Text
  text: {
    primary: colors.white,
    secondary: colors.gray[400],
    tertiary: colors.gray[500],
    inverse: colors.black,
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
    subtle: 'rgba(255, 255, 255, 0.03)',
    default: 'rgba(255, 255, 255, 0.06)',
    strong: 'rgba(255, 255, 255, 0.09)',
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
    sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
  },

  fontSize: {
    xs: '10px',    // Very small - labels, badges
    sm: '12px',    // Small - body text, most UI
    md: '14px',    // Medium-small - headers in modals, emphasis
    lg: '16px',    // Values, important numbers
  },

  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  }
} as const

// ============================================================================
// BORDERS & RADII
// ============================================================================

export const borders = {
  width: {
    thin: '1px',
    default: '1px',
  },

  radius: {
    sm: '4px',   // Small - badges, pills
    md: '6px',   // Medium - buttons, inputs
    lg: '8px',   // Large - cards, modals
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
