# Functional Acceptance Criteria

## 1. Recommendation Generation Stability
**Requirement:** Recommendations generate without failure for projects containing at least 25 assets and 5 or more pages.

**Validation:**
- [ ] Test with project containing exactly 25 assets across 5 pages
- [ ] Test with project containing 100+ assets across 10+ pages
- [ ] Verify no crashes, errors, or infinite loops
- [ ] Verify recommendations array is always returned (even if empty)
- [ ] Verify performance is acceptable (< 5 seconds for large projects)

**Implementation Status:**
- ✅ Basic error handling in place
- ✅ Validation for invalid estimatedBytes
- ⚠️ Need to test with large projects (25+ assets, 5+ pages)

---

## 2. Precise Actionable Recommendations
**Requirement:** Each recommendation includes a precise action that can be executed in Framer, such as resize, format conversion, lazy loading, or removal from above the fold.

**Validation:**
- [ ] Every recommendation has a non-empty `actionable` field
- [ ] All actions are Framer-executable (resize, format conversion, etc.)
- [ ] Actions include specific dimensions/values where applicable
- [ ] No generic/vague actions like "optimize" without specifics

**Implementation Status:**
- ✅ Actions include specific dimensions (e.g., "Resize to 1600x900px")
- ✅ Actions specify format conversions (e.g., "Replace with AVIF/WebP")
- ⚠️ Missing: lazy loading recommendations
- ⚠️ Missing: "remove from above the fold" recommendations

**Current Actions:**
- ✅ "Resize to {width}x{height}px (2x rendered size) and compress to WebP/JPEG"
- ✅ "Resize to max {width}px width and compress to WebP format"
- ✅ "Replace with AVIF/WebP format (max 1600px width) for 60% smaller file"
- ✅ "Use TinyPNG, ImageOptim, or Squoosh to compress"
- ✅ "Run SVGs through SVGO or similar tool"

---

## 3. Valid estimatedBytesSaved (potentialSavings)
**Requirement:** Every recommendation contains a valid estimatedBytesSaved value that is a positive integer and calculated for 100% of recommendations.

**Validation:**
- [ ] Every recommendation has `potentialSavings` field (mapped to estimatedBytesSaved)
- [ ] All `potentialSavings` values are positive numbers (> 0)
- [ ] All `potentialSavings` values are integers (or rounded to nearest integer)
- [ ] No NaN, undefined, or Infinity values
- [ ] Calculation verified for all recommendation types

**Implementation Status:**
- ✅ All recommendations include `potentialSavings`
- ⚠️ Need to ensure all values are positive integers
- ⚠️ Need to add validation/rounding to ensure integers
- ⚠️ Need to verify no edge cases produce invalid values

**Current Calculations:**
- Oversized images: `estimatedBytes - targetBytes` (can be negative if target > current)
- Format conversion: `estimatedBytes * 0.6` or `* 0.3` (percentage-based)
- Compression: `estimatedBytes * 0.25` or `* 0.3` (percentage-based)
- SVG optimization: `totalSvgBytes * 0.2` (percentage-based)

**Issues Found:**
- Potential savings for oversized images could theoretically be negative (if targetBytes > estimatedBytes)
- Need to ensure all values are rounded to integers
- Need to add validation to ensure positive values

---

## 4. Priority Assignment
**Requirement:** Priorities are assigned correctly according to the defined rule thresholds: high, medium, or low.

**Validation:**
- [ ] High priority: Images > 500KB OR format issues with > 100KB savings
- [ ] Medium priority: Images 200-500KB OR format issues with < 100KB savings OR compression opportunities
- [ ] Low priority: Format suggestions for large JPEGs OR SVG optimization
- [ ] Verify priority logic matches defined thresholds

**Implementation Status:**
- ✅ High: Images > 500KB (oversized)
- ✅ High: PNG format issues with > 100KB savings
- ✅ Medium: Images 200-500KB (oversized)
- ✅ Medium: PNG format issues with < 100KB savings
- ✅ Medium: Compression opportunities (150-200KB)
- ✅ Low: Large JPEG format suggestions
- ✅ Low: SVG optimization

**Current Priority Rules:**
```typescript
// High Priority:
- estimatedBytes > 500 * 1024 (oversized)
- format === 'png' && potentialSavings > 100 * 1024

// Medium Priority:
- estimatedBytes > 200 * 1024 && <= 500 * 1024 (oversized)
- format === 'png' && potentialSavings <= 100 * 1024
- estimatedBytes > 150 * 1024 && <= 200 * 1024 (compression)
- SVG group optimization with > 100KB savings

// Low Priority:
- format === 'jpeg' || 'jpg' && estimatedBytes > 200 * 1024
- SVG optimization (individual)
- SVG group optimization with <= 100KB savings
```

---

## 5. Select in Canvas Accuracy
**Requirement:** Clicking "select in canvas" highlights the correct node id in at least 95% of cases, with a stable fallback state for the remaining 5%.

**Validation:**
- [ ] Test with 100+ node selections
- [ ] Verify 95%+ success rate
- [ ] Verify error handling for invalid nodeIds
- [ ] Verify fallback notification is shown
- [ ] Verify no crashes on invalid selections

**Implementation Status:**
- ✅ Basic error handling with try/catch
- ✅ Success notification on selection
- ✅ Error notification on failure
- ⚠️ Need to add nodeId validation before attempting selection
- ⚠️ Need to verify node exists before selection
- ⚠️ Need to test actual success rate

**Current Implementation:**
```typescript
try {
  await framer.setSelection([nodeId])
  framer.notify('Node selected in canvas', { variant: 'success' })
} catch {
  framer.notify('Could not select node', { variant: 'error' })
}
```

**Improvements Needed:**
- Validate nodeId is not empty
- Attempt to get node first to verify it exists
- Better error messages for different failure scenarios

---

## 6. Top 3 Quick Wins Display
**Requirement:** "Top 3 Quick Wins" always displays when 3 or more high priority recommendations exist, sorted by highest estimatedBytesSaved.

**Validation:**
- [ ] Section displays when 3+ high priority recommendations exist
- [ ] Section does NOT display when < 3 high priority recommendations
- [ ] Top 3 are sorted by highest potentialSavings (descending)
- [ ] Only high priority recommendations are included
- [ ] Savings total is calculated correctly

**Implementation Status:**
- ❌ Currently shows top 3 by savings regardless of priority
- ❌ Should only show when 3+ HIGH priority recommendations exist
- ❌ Should only include HIGH priority recommendations
- ✅ Currently sorted by highest potentialSavings

**Current Implementation (INCORRECT):**
```typescript
const top3QuickWins = [...recommendations]
  .sort((a, b) => b.potentialSavings - a.potentialSavings)
  .slice(0, 3)
```

**Required Implementation:**
```typescript
const highPriorityRecs = recommendations.filter(r => r.priority === 'high')
const top3QuickWins = highPriorityRecs.length >= 3
  ? [...highPriorityRecs]
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
      .slice(0, 3)
  : []
```

---

## Test Cases

### Test Case 1: Large Project (25+ assets, 5+ pages)
1. Create/open project with 25+ assets across 5+ pages
2. Run analysis
3. Verify recommendations generate without errors
4. Verify all recommendations have valid potentialSavings
5. Verify priorities are assigned correctly

### Test Case 2: Top 3 Quick Wins
1. Create project with 5+ high priority recommendations
2. Run analysis
3. Verify "Top 3 Quick Wins" section displays
4. Verify only high priority recommendations shown
5. Verify sorted by highest potentialSavings
6. Test with < 3 high priority recommendations - section should not display

### Test Case 3: Select in Canvas
1. Generate 100+ recommendations
2. Click "Select in Canvas" for each
3. Verify 95%+ success rate
4. Verify error handling for invalid nodes
5. Verify fallback notifications work

### Test Case 4: Potential Savings Validation
1. Generate recommendations
2. Verify all potentialSavings are positive integers
3. Verify no NaN/undefined/Infinity values
4. Verify calculations are correct for each type

---

## Action Items

1. ✅ Fix Top 3 Quick Wins to only show high priority recommendations
2. ✅ Ensure all potentialSavings are positive integers
3. ✅ Add validation for nodeId before selection
4. ✅ Improve error handling for select in canvas
5. ⏳ Test with large projects (25+ assets, 5+ pages)
6. ⏳ Add lazy loading recommendations (future)
7. ⏳ Add "above the fold" detection (future)



