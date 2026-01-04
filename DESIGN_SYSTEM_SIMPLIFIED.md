# Simplified Design System

## Core Principles
- **Consistency**: All pages use the same spacing, colors, and typography
- **Simplicity**: Minimal color palette, clear hierarchy
- **Warm Gray Cards**: All cards use `colors.warmGray[100]` with `borders.radius.lg` and `padding: spacing.md`

## Standard Patterns

### Page Layout
- **Padding**: `spacing.lg` (16px) for all panels
- **Background**: `var(--framer-color-bg)` (adapts to theme)
- **Gap between sections**: `spacing.md` (12px)

### Cards
- **Background**: `colors.warmGray[100]` (#F4F2F0)
- **Border Radius**: `borders.radius.lg` (8px)
- **Padding**: `spacing.md` (12px)
- **No borders** (filled cards)

### Typography
- **Labels**: `fontSize.xs` (11px), `fontWeight.medium`
- **Body**: `fontSize.sm` (13px), `fontWeight.regular`
- **Headings**: `fontSize.md` (15px) or `fontSize.lg` (18px), `fontWeight.semibold`
- **Large Numbers**: `fontSize.xl` (24px) or custom, `fontWeight.bold`

### Buttons
- **Primary**: Yellow accent `#E4F222` with `almostBlack` text
- **Secondary**: White/light background with border
- **Padding**: `spacing.sm` vertical, `spacing.md` horizontal
- **Border Radius**: `borders.radius.md` (6px)

### Colors
- **Card Background**: `colors.warmGray[100]` (#F4F2F0)
- **Filter Buttons**: `colors.warmGray[50]` (same as 100 for consistency)
- **Text Primary**: `colors.almostBlack` (#1A1919)
- **Text Secondary**: `var(--framer-color-text-secondary)`
- **Accent**: `colors.accent.light` (#E4F222)

