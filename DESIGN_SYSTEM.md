# Design System

## Overview

A minimal design system for the Framer plugin focusing on clarity, warmth, and intentionality. Uses warm gray surfaces with strategic yellow accents.

## Core Principles

1. **Warm Minimal**: Warm gray cards create approachable, premium feel
2. **Consistent Spacing**: 4px base scale (4, 8, 12, 16, 24, 32px)
3. **Clear Typography**: Compact but readable text hierarchy
4. **Strategic Color**: Yellow accent for primary actions only

## Design Tokens

Location: `src/styles/designTokens.ts`

### Colors

**Surfaces:**
- White: `#FFFFFF` - Primary backgrounds
- Warm Gray 100: `#F4F2F0` - Card backgrounds, filter buttons
- Warm Gray 200: `#F4F2F0` - Menu backgrounds
- Warm Gray 300: `#E5E3E1` - Borders, dividers

**Text:**
- Almost Black: `#1A1919` - Primary text, buttons
- Gray 600: `#525252` - Body text
- Gray 400: `#A3A3A3` - Secondary text
- Warm Gray 500: `#787572` - Tertiary text

**Accent:**
- Yellow: `#E4F222` - Primary CTAs and interactive elements

**Grayscale:**
- 50-900 scale for borders, dividers, and subtle UI elements

### Typography

**Font Family:**
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
             Roboto, "Helvetica Neue", Arial, sans-serif
```

**Sizes:**
- xs: 11px - Labels, metadata
- sm: 13px - Body text, buttons
- md: 15px - Section headings
- lg: 18px - Page headings
- xl: 24px - Large headings, metrics

**Weights:**
- regular: 400
- medium: 500
- semibold: 600
- bold: 700

**Line Heights:**
- tight: 1.2 - Metrics, large numbers
- normal: 1.5 - Body text
- relaxed: 1.7 - Descriptions

### Spacing

**Scale (4px base):**
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- xxl: 32px

### Borders & Radii

**Widths:**
- thin: 1px
- default: 1px

**Radii:**
- sm: 8px - Small elements, buttons
- md: 12px - Inputs, small cards
- lg: 20px - Large cards, panels
- full: 9999px - Pills

## Component Patterns

### Standard Card

```tsx
backgroundColor: colors.warmGray[100]
borderRadius: borders.radius.lg
padding: spacing.md
```

### Primary Button

```tsx
backgroundColor: colors.almostBlack
color: colors.white
padding: `${spacing.xs} ${spacing.md}`
borderRadius: borders.radius.sm
fontSize: typography.fontSize.xs
fontWeight: typography.fontWeight.medium
```

### Secondary Button

```tsx
backgroundColor: colors.white
border: `1px solid ${colors.warmGray[200]}`
color: colors.almostBlack
padding: `${spacing.xs} ${spacing.sm}`
borderRadius: borders.radius.sm
```

### Page Layout

```tsx
padding: spacing.lg // 16px
backgroundColor: var(--framer-color-bg) // Adapts to theme
gap: spacing.md // 12px between sections
```

## Primitive Components

### Badge (`src/components/primitives/Badge.tsx`)

**Variants:**
- default - Gray background
- subtle - Light gray with border
- outline - Transparent with border
- image - Green (for image type)
- svg - Purple (for SVG type)
- high - Red (high priority)
- medium - Yellow (medium priority)
- low - Green (low priority)

### Button (`src/components/primitives/Button.tsx`)

**Variants:**
- primary - Black background, white text
- secondary - White background, border
- ghost - Transparent background

**Sizes:**
- sm: 32px height
- md: 36px height

### Card (`src/components/primitives/Card.tsx`)

**Features:**
- Subtle borders
- Soft rounded corners (8px)
- Optional hover states
- Flexible padding

## Usage Guidelines

### Do's
- Use warm gray (#F4F2F0) for all card backgrounds
- Use yellow accent (#E4F222) for primary CTAs only
- Follow 4px spacing scale consistently
- Keep borders thin (1px) and subtle
- Use design tokens instead of hardcoded values

### Don'ts
- Don't use yellow for backgrounds or decorative elements
- Don't use heavy borders or shadows
- Don't deviate from the spacing scale
- Don't use colors outside the defined palette
- Don't use inline color values

## Migration Guide

**Step 1: Import tokens**
```tsx
import { spacing, typography, borders, colors } from '../../styles/designTokens'
```

**Step 2: Replace colors**
```tsx
// Before
backgroundColor: '#F4F2F0'

// After
backgroundColor: colors.warmGray[100]
```

**Step 3: Use spacing scale**
```tsx
// Before
padding: '12px'

// After
padding: spacing.md
```

**Step 4: Apply typography**
```tsx
// Before
fontSize: '13px'
fontWeight: 500

// After
fontSize: typography.fontSize.sm
fontWeight: typography.fontWeight.medium
```

## Component Checklist

Before marking a component as complete:

- [ ] Uses design tokens (no hardcoded values)
- [ ] Spacing follows 4px scale
- [ ] Typography uses token sizes/weights
- [ ] Cards use warmGray[100] background
- [ ] Borders are 1px and subtle
- [ ] Border radius follows token values
- [ ] Yellow accent used only for primary CTAs
- [ ] Hover states have smooth transitions (0.15s)
- [ ] Component adapts to Framer's theme variables where appropriate

## File Structure

```
src/
├── styles/
│   └── designTokens.ts          # Design tokens
├── components/
│   ├── primitives/
│   │   ├── Badge.tsx            # Badge component
│   │   ├── Button.tsx           # Button component
│   │   └── Card.tsx             # Card component
│   ├── overview/
│   ├── assets/
│   ├── recommendations/
│   ├── bandwidth/
│   └── settings/
```

## Theme Support

The design system respects Framer's theme variables:

```tsx
// Use Framer theme variables for adaptability
backgroundColor: 'var(--framer-color-bg)'
color: 'var(--framer-color-text)'
borderColor: 'var(--framer-color-divider)'

// Use design tokens for custom surfaces
backgroundColor: colors.warmGray[100] // Warm gray cards
```

## Success Criteria

A well-implemented component should:
- Feel **warm and approachable** (not cold or clinical)
- Be **immediately scannable** (clear hierarchy)
- Have **intentional spacing** (follows 4px scale)
- Use **minimal color** (warm gray + yellow accent only)
- Be **consistently styled** (matches other components)
