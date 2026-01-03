# Premium Minimal Design System

## Overview

A complete design system for the Framer plugin focusing on sleekness, intentionality, and premium-minimal aesthetics. This system uses **grayscale-only colors**, **consistent 4px spacing**, and **compact typography** to create a focused, calm interface.

## ✅ Completed

### 1. Design Tokens (`src/styles/designTokens.ts`)

**Grayscale Palette:**
- Pure surfaces: `#FFFFFF` (white), `#000000` (black)
- 8 gray steps (50-900) for all UI elements
- Light and dark mode color semantics
- Consistent borders, shadows, and elevation

**Spacing Scale (4px base):**
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- xxl: 32px

**Typography:**
- Font: System sans-serif (Inter-like)
- Sizes: 10px (xs), 12px (sm), 14px (md), 16px (lg)
- Weights: 300, 400, 500, 600
- Line heights: tight (1.2), normal (1.5), relaxed (1.6)

**Components Presets:**
- Button: 8px/16px padding, 36px min-height
- Card: 12px padding, 8px border-radius
- Input: 8px/12px padding, 32px height

### 2. Premium Button Component (`src/components/primitives/Button.tsx`)

**Features:**
- Three variants: primary (black), secondary (white), ghost (transparent)
- Two sizes: sm (32px), md (36px)
- Full-width option
- Icon support
- Smooth hover transitions
- Disabled states with opacity
- No text overflow - flexible width

**Usage:**
```tsx
<Button variant="primary" fullWidth icon={<ArrowIcon />}>
  View Recommendations
</Button>
```

### 3. Premium Card Component (`src/components/primitives/Card.tsx`)

**Features:**
- Subtle borders (#E5E5E5)
- Soft rounded corners (8px)
- Light shadow (0 1px 2px rgba(0,0,0,0.04))
- Hover states
- Flexible padding
- Click handler support

**Usage:**
```tsx
<Card padding="md" hover onClick={handleClick}>
  {children}
</Card>
```

### 4. Redesigned HeroCard (`src/components/overview/HeroCard.tsx`)

**New Design:**
- Pure grayscale (no green gradient)
- Grid-based metrics layout
- Compact typography (10px/12px)
- Subtle gray savings badge
- Full-width button
- Clean dividers and borders
- Consistent spacing (4px scale)

**Before vs After:**
- Before: Colorful gradient, large text, visual noise
- After: Calm grayscale, compact text, intentional spacing

## 🔄 Remaining Work

### Priority 1: Core Components

**QuickStatsBar** - Update to use:
- Grayscale backgrounds
- New spacing (16px between items)
- Typography tokens
- Subtle dividers

**AssetsTable** - Redesign to:
- Subtle card rows with thin borders
- 16px row spacing, 12px internal padding
- 8px thumbnail-to-text gap
- Grayscale badges and labels
- No heavy shadows

**AssetFilters** - Update to:
- Grayscale filter pills
- New spacing scale
- Compact labels (10px)
- Clean dropdown styles

### Priority 2: Modals & Forms

**Modal Spacing** - Apply:
- 24px top padding
- 16px section spacing
- 12px option row padding
- 24px bottom padding before buttons

**Form Inputs** - Standardize:
- 8px/12px padding
- 32px height
- Clean borders
- Focus states

### Priority 3: Details

**Icons** - Consistency:
- Mid-gray (#A3A3A3) in light mode
- Light-gray (#D4D4D4) in dark mode
- Never full black unless active

**Badges & Pills** - Redesign:
- Grayscale backgrounds
- Compact text (10px)
- Subtle borders
- Consistent padding

**Tooltips** - Implement:
- Top-right info icons
- Instant hover display
- Clean, compact design
- Rounded rectangle style

### Priority 4: Dark Mode

**Theme Support** - Add:
- Dark mode color mapping
- Glow effects instead of shadows
- Consistent gray values
- Mode toggle (optional)

## Design Principles in Action

### ✅ **Grayscale Only**
All components use pure black, pure white, and 8 gray steps. No colors.

### ✅ **4px Spacing**
All padding, margins, and gaps use 4, 8, 12, 16, 24, or 32px.

### ✅ **Compact Typography**
Most text is 10-12px. Headers are 14px max. Values are 16px.

### ✅ **Subtle Elevation**
Light shadows (1-4px blur) in light mode. Subtle glows in dark mode.

### ✅ **Soft Corners**
4-8px border radius. Never pill-shaped, never sharp.

### ✅ **Thin Borders**
Always 1px. Mid-gray (#E5E5E5) in light, darker-gray (#404040) in dark.

### ✅ **Clean Buttons**
Centered text, flexible width, no overflow, comfortable tap target.

### ✅ **Focus & Clarity**
Every design decision prioritizes helping creators make decisions quickly.

## Migration Guide

### For Each Component:

1. **Import design tokens:**
   ```tsx
   import { spacing, typography, borders, colors } from '../../styles/designTokens'
   ```

2. **Replace inline colors with tokens:**
   ```tsx
   // Before
   color: '#333333'
   // After
   color: colors.gray[600]
   ```

3. **Use spacing scale:**
   ```tsx
   // Before
   padding: '10px 15px'
   // After
   padding: `${spacing.sm} ${spacing.lg}` // 8px 16px
   ```

4. **Apply typography:**
   ```tsx
   // Before
   fontSize: '13px', fontWeight: 500
   // After
   fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium
   ```

5. **Use primitives:**
   ```tsx
   // Before
   <button className="..." style={{...}}>...</button>
   // After
   <Button variant="primary">...</Button>
   ```

## Testing Checklist

- [ ] All text fits within containers (no overflow)
- [ ] Buttons have comfortable tap targets (36px+ height)
- [ ] Spacing follows 4px scale consistently
- [ ] Only grayscale colors used (no tints)
- [ ] Typography is compact but readable
- [ ] Borders are thin and consistent
- [ ] Shadows/glows are subtle
- [ ] Interface feels calm and premium
- [ ] Dark mode matches light mode structure
- [ ] No visual noise or heavy effects

## File Structure

```
src/
├── styles/
│   └── designTokens.ts          # ✅ Complete
├── components/
│   ├── primitives/
│   │   ├── Button.tsx            # ✅ Complete
│   │   ├── Card.tsx              # ✅ Complete
│   │   ├── Input.tsx             # TODO
│   │   ├── Badge.tsx             # TODO
│   │   └── Tooltip.tsx           # TODO
│   ├── overview/
│   │   ├── HeroCard.tsx          # ✅ Redesigned
│   │   ├── QuickStatsBar.tsx     # TODO
│   │   ├── BreakdownChart.tsx    # TODO
│   │   └── ...
│   └── assets/
│       ├── AssetsTable.tsx       # TODO
│       ├── AssetFilters.tsx      # TODO
│       └── ...
```

## Next Steps

1. **Complete primitive components** (Input, Badge, Tooltip)
2. **Update Overview tab components** (QuickStatsBar, BreakdownChart, etc.)
3. **Redesign Assets tab** (Table, Filters, Row components)
4. **Update Recommendations tab** (Cards, actions)
5. **Implement dark mode support**
6. **Add responsive breakpoints** (if needed)
7. **Final polish and testing**

The foundation is solid. The design system is comprehensive and ready to scale across the entire application. Each component update should follow the same pattern: import tokens, replace colors/spacing/typography, use primitives where possible.
