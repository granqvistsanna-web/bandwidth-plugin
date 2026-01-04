# Design System

## Overview

A professional, minimal design system for the Framer Bandwidth Check plugin. Emphasizes clarity, scannability, and polish through refined typography, subtle elevation, and smooth micro-interactions.

## Core Principles

1. **Refined Typography**: Letter-spacing and optical adjustments for better readability
2. **Subtle Elevation**: Layered shadows create depth without distraction
3. **Smooth Motion**: Cubic-bezier easing for natural, polished interactions
4. **Warm Minimal**: Warm gray palette (#F4F2F0) creates approachable feel
5. **Consistent Spacing**: 4px base scale (4, 8, 12, 16, 24, 32px)
6. **Blue Accent**: Primary blue (#09F) for CTAs and interactive elements

## Design Tokens

Location: `src/styles/designTokens.ts`

### Colors

**Surfaces (Light Mode):**
- Page Background: `#F5F5F5` - Light gray page for contrast with cards
- Cards/Surfaces: `#FFFFFF` - Pure white for borderless cards with clear contrast
- Nested Surfaces: `#FAFAFA` - Very light gray for elements within cards
- Borders (rare): `#E5E5E5` - Subtle borders only when necessary

**Surfaces (Dark Mode):**
- Page Background: `#0F0F0E` - Very dark background
- Cards Primary: `#1A1A18` - Dark card surfaces
- Cards Secondary: `#2A2A28` - Slightly lighter cards for hierarchy
- Cards Tertiary: `#3A3A38` - Lightest card surfaces for nested elements

**Text:**
- Almost Black: `#1A1919` - Primary text, headings
- Gray 600: `#525252` - Body text
- Warm Gray 500: `#787572` - Secondary text
- Warm Gray 400: `#A3A3A3` - Tertiary text
- Warm Gray 300: `#D4D4D4` - Subtle dividers

**Accent:**
- Primary Blue: `#0099FF` - Primary CTAs, interactive elements
- Hover Blue: `#0088E6` - Hover state for primary actions

**Grayscale:**
- 50-900 scale for borders, dividers, and subtle UI elements

### Typography

**Font Family:**
```css
font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
             Roboto, "Helvetica Neue", Arial, sans-serif
```

**Sizes & Letter-spacing:**
- xs: 11px - Labels, metadata (letter-spacing: 0.02em - 0.03em for uppercase)
- sm: 13px - Body text, buttons (letter-spacing: 0)
- md: 15px - Content, asset names (letter-spacing: -0.01em)
- lg: 18px - Page headings (letter-spacing: -0.02em)
- xl: 24px - Large headings
- 28px: Hero numbers, savings (letter-spacing: -0.02em)

**Weights:**
- regular: 400 - Body text
- medium: 500 - Labels, metadata
- semibold: 600 - Names, important text
- bold: 700 - Numbers, headings

**Line Heights:**
- tight: 1.2 - Metrics, headings
- normal: 1.5 - Body text
- relaxed: 1.7 - Descriptions

**Typography Best Practices:**
- Use **negative letter-spacing (-0.01em to -0.02em)** on headings and large numbers for optical tightness
- Use **positive letter-spacing (0.02em - 0.03em)** on uppercase labels for clarity
- Use **semibold (600)** for content that needs emphasis without being bold
- Use **11px uppercase** with 0.02em spacing for metadata labels

### Spacing

**Scale (4px base):**
- xs: 4px - Tight gaps, small padding
- sm: 8px - Standard gaps, card padding
- md: 12px - Section gaps, medium padding
- lg: 16px - Panel padding, large gaps
- xl: 24px - Page sections, hero spacing
- xxl: 32px - Major sections

### Shadows & Elevation

**Shadow Scale:**
```tsx
// Resting state - subtle depth
boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'

// Hover state - elevated
boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'

// Popover/modal - floating
boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'

// Image thumbnails - subtle inset
boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
```

**Elevation Principles:**
- **Borderless cards by default** - Use color contrast instead of borders
  - Light mode: White cards (#FFFFFF) on light gray page (#F5F5F5)
  - Dark mode: Dark cards (#1A1A18, #2A2A28) on darker page (#0F0F0E)
- Use **subtle shadows (0.04 opacity)** for resting cards in light mode
- Use **glows (rgba(255,255,255,0.05-0.12))** instead of shadows in dark mode
- Use **medium shadows (0.08 opacity)** for hover states
- Use **stronger shadows (0.15 opacity)** for modals/popovers
- Only add **borders** when necessary for visual separation (e.g., thumbnails, critical boundaries)
- Add **subtle transform** on hover for depth

### Borders & Radii

**Widths:**
- thin: 1px - Standard borders
- default: 1.5px - Emphasized borders (thumbnails)

**Radii:**
- sm: 8px - Small buttons, tight corners
- md: 12px - Inputs, cards, standard elements
- lg: 20px - Large cards, panels
- full: 9999px - Pills, badges

### Transitions & Animation

**Easing:**
```tsx
// Standard easing - use for most interactions
transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'

// Quick interactions - buttons, toggles
transition: 'all 0.15s ease'

// No transition - disabled states
transition: 'none'
```

**Transform:**
```tsx
// Hover lift - cards, rows
transform: 'translateY(-1px)'

// Chevron rotation - expandable sections
transform: 'rotate(180deg)'
transition: 'transform 0.15s ease'
```

**Animation Principles:**
- Use **cubic-bezier(0.4, 0, 0.2, 1)** for smooth, professional feel
- Use **0.15s - 0.2s duration** for responsive feel
- Add **transform** on hover for tactile feedback
- Disable transitions on **disabled states** to avoid confusion

## Component Patterns

### Compact Page Header

Used consistently across all pages (Overview, Assets, Recommendations):

```tsx
<div style={{ marginBottom: spacing.xl }}>
  <h1 style={{
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.almostBlack,
    margin: 0,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: '-0.02em'
  }}>
    Page Title
  </h1>
  {lastScanned && (
    <div style={{
      fontSize: typography.fontSize.xs,
      color: colors.warmGray[500]
    }}>
      {loading ? 'Analyzing...' : `Scanned ${formatTimestamp(lastScanned)}`}
    </div>
  )}
</div>
```

### Card (Recommendations, Assets Row)

Polished card with subtle elevation and smooth interactions:

```tsx
<div
  style={{
    backgroundColor: colors.white,
    border: `1px solid ${colors.warmGray[200]}`,
    borderRadius: borders.radius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    cursor: canClick ? 'pointer' : 'default',
    transition: canClick ? 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
  }}
  onMouseEnter={(e) => {
    if (canClick) {
      e.currentTarget.style.backgroundColor = colors.warmGray[50]
      e.currentTarget.style.borderColor = colors.warmGray[300]
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
      e.currentTarget.style.transform = 'translateY(-1px)'
    }
  }}
  onMouseLeave={(e) => {
    if (canClick) {
      e.currentTarget.style.backgroundColor = colors.white
      e.currentTarget.style.borderColor = colors.warmGray[200]
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
      e.currentTarget.style.transform = 'translateY(0)'
    }
  }}
>
```

**Key principles:**
- Only add hover effects if element is clickable
- Disable transitions on disabled/non-interactive states
- Use cubic-bezier easing for professional feel
- Combine shadow + transform for depth

### Primary Button

```tsx
<button
  disabled={isDisabled}
  style={{
    padding: '10px 16px',
    borderRadius: borders.radius.md,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: '-0.01em',
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    ...(isDisabled ? {
      backgroundColor: colors.warmGray[100],
      color: colors.warmGray[500],
      transition: 'none'
    } : {
      backgroundColor: colors.almostBlack,
      color: colors.white,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    })
  }}
  onMouseEnter={(e) => {
    if (!isDisabled) {
      e.currentTarget.style.backgroundColor = '#000000'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
      e.currentTarget.style.transform = 'translateY(-1px)'
    }
  }}
  onMouseLeave={(e) => {
    if (!isDisabled) {
      e.currentTarget.style.backgroundColor = colors.almostBlack
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)'
      e.currentTarget.style.transform = 'translateY(0)'
    }
  }}
>
  Action Label
</button>
```

### Accent Button (Rescan)

```tsx
<button
  disabled={loading}
  style={{
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: loading ? 'var(--framer-color-text-tertiary)' : colors.almostBlack,
    backgroundColor: loading ? colors.warmGray[50] : colors.accent.primary,
    border: 'none',
    borderRadius: borders.radius.sm,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
  }}
  onMouseEnter={(e) => {
    if (!loading) {
      e.currentTarget.style.backgroundColor = '#0088E6'
      e.currentTarget.style.transform = 'translateY(-1px)'
    }
  }}
  onMouseLeave={(e) => {
    if (!loading) {
      e.currentTarget.style.backgroundColor = colors.accent.primary
      e.currentTarget.style.transform = 'translateY(0)'
    }
  }}
>
  Rescan project
</button>
```

### Secondary Button (Text-style)

Used for "Show details", "Ignore" actions:

```tsx
<button
  style={{
    padding: `${spacing.xs} 0`,
    fontSize: '11px',
    color: colors.warmGray[500],
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontWeight: typography.fontWeight.medium,
    transition: 'color 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.color = colors.almostBlack
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.color = colors.warmGray[500]
  }}
>
  Button Label
</button>
```

### Dropdown / Select

Consistent styled dropdown with custom arrow:

```tsx
<select
  style={{
    padding: `${spacing.xs} ${spacing.sm}`,
    paddingRight: spacing.lg,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.almostBlack,
    backgroundColor: colors.white,
    border: `1px solid ${colors.warmGray[200]}`,
    borderRadius: borders.radius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    minWidth: '140px'
  }}
  onFocus={(e) => {
    e.currentTarget.style.borderColor = colors.warmGray[400]
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
  }}
  onBlur={(e) => {
    e.currentTarget.style.borderColor = colors.warmGray[200]
    e.currentTarget.style.boxShadow = 'none'
  }}
>
  <option>Option 1</option>
</select>
```

### Input Field

```tsx
<input
  type="text"
  placeholder="Search..."
  style={{
    padding: `6px ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
    color: colors.almostBlack,
    backgroundColor: colors.white,
    border: `1px solid ${colors.warmGray[200]}`,
    borderRadius: borders.radius.md,
    transition: 'all 0.15s ease',
  }}
  onFocus={(e) => {
    e.currentTarget.style.borderColor = colors.warmGray[400]
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
  }}
  onBlur={(e) => {
    e.currentTarget.style.borderColor = colors.warmGray[200]
    e.currentTarget.style.boxShadow = 'none'
  }}
/>
```

### Thumbnail

Consistent thumbnail styling with shadow:

```tsx
<img
  src={url}
  alt={name}
  style={{
    width: '48px',  // or '56px', '64px' depending on context
    height: '48px',
    borderRadius: borders.radius.md,
    border: `1.5px solid ${colors.warmGray[200]}`,
    objectFit: 'cover',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  }}
/>
```

**Thumbnail sizes:**
- 48px: Assets table rows
- 56px: Small recommendation cards
- 64px: Standard recommendation cards

### Hero Number / Savings Card

Large prominent number for key metrics:

```tsx
<div style={{
  fontSize: '28px',
  fontWeight: typography.fontWeight.bold,
  color: colors.almostBlack,
  lineHeight: 1,
  letterSpacing: '-0.02em'
}}>
  {formatBytes(totalSavings)}
</div>
```

### Badge / Pill

Small inline badge for metadata:

```tsx
<div style={{
  display: 'inline-flex',
  alignItems: 'center',
  padding: `3px ${spacing.sm}`,
  backgroundColor: colors.almostBlack,
  color: colors.white,
  fontSize: '11px',
  fontWeight: typography.fontWeight.bold,
  borderRadius: borders.radius.full,
  letterSpacing: '0.01em'
}}>
  Label
</div>
```

### Metadata Line

Inline metadata with dot separators:

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xs,
  fontSize: '11px',
  color: colors.warmGray[500],
  fontWeight: typography.fontWeight.medium
}}>
  <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>IMAGE</span>
  <span style={{ color: colors.warmGray[300] }}>·</span>
  <span>1920 × 1080</span>
  <span style={{ color: colors.warmGray[300] }}>·</span>
  <span style={{ textTransform: 'uppercase', letterSpacing: '0.02em' }}>WEBP</span>
</div>
```

## Interaction Principles

### Hover States

**DO:**
- Only add hover effects to clickable elements (buttons, links, interactive cards)
- Use subtle color changes (warmGray[50] background)
- Add transform: translateY(-1px) for lift effect
- Enhance shadow on hover (0.04 → 0.08 opacity)
- Use cubic-bezier easing for smooth motion

**DON'T:**
- Add hover to non-clickable containers
- Use transitions on disabled states
- Change cursor unless element is interactive
- Use hover as sole indication of interactivity

### Focus States

All interactive elements should have clear focus states:

```tsx
onFocus={(e) => {
  e.currentTarget.style.borderColor = colors.warmGray[400]
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
}}
onBlur={(e) => {
  e.currentTarget.style.borderColor = colors.warmGray[200]
  e.currentTarget.style.boxShadow = 'none'
}}
```

### Disabled States

Disabled elements should be clearly non-interactive:

```tsx
{
  opacity: 0.6,
  cursor: 'not-allowed',
  transition: 'none',  // No animations on disabled
  backgroundColor: colors.warmGray[100],
  color: colors.warmGray[500]
}
```

## Layout Patterns

### Page Container

```tsx
<div style={{
  padding: spacing.lg,
  backgroundColor: 'var(--framer-color-bg)',
  minHeight: '100vh'
}}>
```

### Section Spacing

```tsx
marginBottom: spacing.xl  // 24px between major sections
marginBottom: spacing.lg  // 16px between cards/groups
marginBottom: spacing.md  // 12px between related items
```

### Two-Column Actions

Secondary actions side-by-side:

```tsx
<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing.md,
  paddingTop: spacing.md,
  borderTop: `1px solid ${colors.warmGray[100]}`
}}>
  <button>Show details</button>
  <button>Ignore</button>
</div>
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

## Usage Guidelines

### Do's
- **Use letter-spacing** for optical balance (-0.02em on headings, 0.02em on uppercase)
- **Use cubic-bezier easing** for professional motion feel
- **Combine shadow + transform** for hover states
- **Disable transitions** on disabled/non-interactive elements
- **Add focus rings** (3px rgba shadow) on all inputs/selects
- **Use warm gray** (#F4F2F0) for card backgrounds
- **Follow 4px spacing scale** consistently
- **Use design tokens** instead of hardcoded values

### Don'ts
- **Don't add hover to non-clickable elements** - misleading
- **Don't use transitions on disabled states** - confusing
- **Don't use heavy borders** - keep 1px, subtle
- **Don't skip focus states** - accessibility critical
- **Don't deviate from spacing scale** - breaks rhythm
- **Don't use inline color values** - use tokens

## Virtual Scrolling Considerations

When using virtualizers (like `@tanstack/react-virtual`):

```tsx
const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72, // CRITICAL: Must match actual row height including margins
  overscan: 5,
})
```

**Key points:**
- `estimateSize` must include padding + content + margins
- Example: 48px thumbnail + 8px top padding + 8px bottom padding + 8px marginBottom = 72px
- Mismatch causes vertical overlap or gaps

## Accessibility

- All interactive elements have **focus states** with visible rings
- Buttons have **disabled states** with cursor: not-allowed
- Color contrast meets **WCAG AA** standards
- **Keyboard navigation** supported through native elements
- Hover is **not sole indicator** of interactivity

## Success Criteria

A well-implemented component should:
- Feel **polished and professional** (refined typography, smooth motion)
- Be **immediately scannable** (clear hierarchy with letter-spacing)
- Have **tactile interactions** (lift on hover, cubic-bezier easing)
- Use **subtle elevation** (shadows create depth without distraction)
- Be **consistently styled** (matches other components)
- Only show **hover on clickable elements** (clear interactivity)

## Migration Guide

**Step 1: Import tokens**
```tsx
import { spacing, typography, borders, colors } from '../../styles/designTokens'
```

**Step 2: Add letter-spacing**
```tsx
// Headings - tighter
letterSpacing: '-0.02em'

// Uppercase labels - wider
textTransform: 'uppercase'
letterSpacing: '0.02em'
```

**Step 3: Use cubic-bezier easing**
```tsx
transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
```

**Step 4: Add elevation**
```tsx
// Resting
boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'

// Hover
boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
transform: 'translateY(-1px)'
```

**Step 5: Only hover on clickable**
```tsx
const canClick = !isDisabled && hasAction

onMouseEnter={(e) => {
  if (canClick) {
    // Apply hover styles
  }
}}
```

## File Structure

```
src/
├── styles/
│   └── designTokens.ts          # Design tokens
├── components/
│   ├── primitives/
│   │   └── Badge.tsx            # Badge component
│   ├── overview/
│   │   ├── OverviewPanel.tsx   # Compact header pattern
│   │   └── BreakdownChart.tsx
│   ├── assets/
│   │   ├── AssetsPanel.tsx     # Compact header, refined dropdowns
│   │   └── AssetsTableRow.tsx  # Card hover pattern, thumbnails
│   ├── recommendations/
│   │   ├── RecommendationsPanel.tsx  # Hero numbers, dropdowns
│   │   └── RecommendationCard.tsx    # Full pattern showcase
│   ├── bandwidth/
│   └── settings/
```

## Reference Implementations

**Best examples of the design system:**
- `RecommendationCard.tsx` - Complete pattern showcase
- `AssetsTableRow.tsx` - Card interactions, thumbnails
- `RecommendationsPanel.tsx` - Compact header, hero numbers, dropdowns
- `AssetsPanel.tsx` - Refined dropdowns, input fields

These components demonstrate all principles in production.
