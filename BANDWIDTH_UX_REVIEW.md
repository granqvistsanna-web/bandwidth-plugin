# Bandwidth Usage Page - UX Review & Recommendations

## Current State Analysis

### Strengths
- Comprehensive calculation logic with realistic defaults
- Helpful tooltips and contextual information
- Clear risk indicators for plan limits

### Critical Issues

#### 1. **Visual Hierarchy Problems**
- **Issue**: The "Per 1,000 Pageviews" metric is given prominence, but users care about monthly totals
- **Impact**: Users must scan multiple cards to find the key number
- **Fix**: Make monthly bandwidth the hero metric, demote per-1K to secondary

#### 2. **Information Overload**
- **Issue**: Too many separate cards and sections (6+ distinct areas)
- **Impact**: Cognitive load is high, hard to scan quickly
- **Fix**: Group related metrics, reduce visual separation

#### 3. **Text Clarity Issues**
- **Issue**: Description paragraph is redundant, labels are verbose
- **Impact**: Users skip reading, miss important context
- **Fix**: Remove redundant text, use concise labels with tooltips

#### 4. **Layout Inconsistency**
- **Issue**: Mix of Tailwind classes and inline styles, inconsistent spacing
- **Impact**: Feels unpolished, breaks design system
- **Fix**: Use consistent design tokens throughout

#### 5. **Unprofessional Elements**
- **Issue**: Emojis in risk messages (⚠️, ⚡, ✓)
- **Impact**: Feels casual, not premium
- **Fix**: Use icons or text-only indicators

#### 6. **Input Grouping**
- **Issue**: Controls are scattered, no clear flow
- **Impact**: Unclear what to adjust first
- **Fix**: Group inputs logically, show clear progression

## Recommended Structure

### Hero Section (Top)
```
┌─────────────────────────────────────────┐
│ Estimated Monthly Bandwidth             │
│ 12.5 GB                                 │
│ For 25,000 pageviews                    │
└─────────────────────────────────────────┘
```

### Input Controls (Grouped)
```
┌─────────────────────────────────────────┐
│ Traffic Estimate                        │
│ [Monthly Pageviews: 25,000]            │
│ [Avg Pages/Visit: 2.0] [presets]      │
└─────────────────────────────────────────┘
```

### Plan Comparison (Compact)
```
┌─────────────────────────────────────────┐
│ Your Plan: [Basic] 50 GB/month          │
│ Usage: 25% ████████░░░░░░░░░░           │
│ Status: Within limits                   │
└─────────────────────────────────────────┘
```

### Secondary Metrics (Collapsible)
```
┌─────────────────────────────────────────┐
│ Details ▼                                │
│ Per visit: 512 KB                       │
│ Per 1,000 views: 0.5 GB                 │
└─────────────────────────────────────────┘
```

## Specific Improvements

### 1. Remove Redundant Description
- Delete the paragraph: "Calculate your expected monthly bandwidth..."
- The page title "Usage Estimate" is self-explanatory

### 2. Reorganize Hero Metric
- **Current**: "Per 1,000 Pageviews" is prominent
- **New**: Monthly bandwidth as large, bold number at top
- Show: "X.XX GB/month" with context below

### 3. Simplify Input Section
- Group both inputs in one card
- Label: "Traffic Estimate" (not separate sections)
- Show presets inline with input
- Add helper text only when needed

### 4. Consolidate Plan Display
- Single card showing: plan name, limit, usage %, progress bar
- Remove separate "Bandwidth per Visit" card
- Move to secondary/collapsible section

### 5. Improve Risk Messaging
- Remove emojis
- Use text-only status: "Within limits" / "Approaching limit" / "Exceeds limit"
- Make action items clear and actionable

### 6. Better Visual Hierarchy
- **Level 1**: Monthly bandwidth (largest, bold)
- **Level 2**: Input controls (medium, grouped)
- **Level 3**: Plan status (compact card)
- **Level 4**: Secondary metrics (small, collapsible)

### 7. Consistent Spacing
- Use design tokens: `spacing.md` for card padding
- `spacing.lg` between major sections
- `spacing.sm` within grouped controls

### 8. Mobile Responsiveness
- Stack inputs vertically on small screens
- Make presets wrap naturally
- Ensure progress bars are readable

### 9. Honest Estimates
- Add disclaimer: "Estimate based on current page weights"
- Show confidence indicators if data is incomplete
- Link to Recommendations page for optimization

### 10. Quick Wins
- Show "Potential savings" if recommendations exist
- Link directly to optimization opportunities
- Make it actionable, not just informational

## Implementation Priority

### Phase 1: Critical (Do First)
1. Reorganize hero metric (monthly bandwidth first)
2. Remove redundant description
3. Group inputs in single section
4. Remove emojis from risk messages

### Phase 2: Important (Do Next)
5. Consolidate plan display
6. Improve visual hierarchy
7. Consistent spacing with design tokens
8. Make secondary metrics collapsible

### Phase 3: Polish (Nice to Have)
9. Add confidence indicators
10. Link to recommendations
11. Mobile optimization
12. Animation/transitions

## Text Improvements

### Current → Improved
- "Calculate your expected monthly bandwidth..." → *Remove*
- "Per 1,000 Pageviews" → "Per 1,000 views" (in details)
- "Average Pages per Visit" → "Pages per visit"
- "Expected Monthly Pageviews" → "Monthly pageviews"
- "Your Framer Plan" → "Plan"
- "⚠️ Risk of Overage" → "Exceeds plan limit"
- "⚡ Approaching Limit" → "Approaching limit"
- "✓ Within Plan Limits" → "Within limits"

## Layout Structure

```
┌─────────────────────────────────────┐
│ Usage Estimate          [badge]    │
├─────────────────────────────────────┤
│                                     │
│  12.5 GB                            │
│  Estimated monthly bandwidth        │
│  For 25,000 pageviews               │
│                                     │
├─────────────────────────────────────┤
│ Traffic Estimate                    │
│                                     │
│  Monthly pageviews                  │
│  [25,000]                           │
│                                     │
│  Pages per visit                    │
│  [2.0] [Light] [Typical] [Deep]    │
│                                     │
├─────────────────────────────────────┤
│ Plan: Basic • 50 GB/month           │
│ Usage: 25% ████████░░░░░░░░░░       │
│ Status: Within limits               │
│                                     │
│ [Recommendation if needed]          │
│                                     │
├─────────────────────────────────────┤
│ Details ▼                           │
│ Per visit: 512 KB                   │
│ Per 1,000 views: 0.5 GB             │
└─────────────────────────────────────┘
```

## Key Principles Applied

1. **Scannability**: Hero metric visible immediately
2. **Progressive Disclosure**: Details in collapsible section
3. **Grouping**: Related controls together
4. **Honesty**: Clear that it's an estimate
5. **Actionability**: Links to optimization opportunities
6. **Consistency**: Matches design system throughout
7. **Minimalism**: Remove unnecessary elements
8. **Clarity**: Concise labels, helpful tooltips

