# MVP TODO List - Week 1

**Goal:** Ship Phase 1 MVP in 1 week
**Status:** 95% complete

---

## ✅ Completed

### Core Engine
- [x] Node traversal working
- [x] Image/SVG discovery
- [x] Bandwidth estimation with compression ratios
- [x] Breakpoint analysis (mobile/tablet/desktop)
- [x] Recommendation generation
- [x] Basic error handling

### UI Components
- [x] Header with title and refresh button
- [x] Tab navigation (Overview, Assets, Recommendations)
- [x] Overview panel with breakpoint tabs
- [x] Breakdown chart
- [x] Assets panel with sortable list
- [x] Recommendations panel with priority filtering
- [x] Loading and error states
- [x] Click to select assets in canvas

### Infrastructure
- [x] TypeScript types
- [x] Build pipeline
- [x] Linting passing
- [x] Git repository
- [x] Documentation (CONSTRAINTS, TESTING, ROADMAP)

---

## 🚧 In Progress (This Week)

### Priority 1: Essential MVP Features

#### Asset Metadata Improvements
- [x] **Get intrinsic dimensions**
  - [x] Use `ImageAsset.measure()` API
  - [x] Store actualWidth and actualHeight
  - [x] Display in Assets table
  - [x] Use for better oversized detection

- [x] **Track asset usage count**
  - [x] Deduplicate assets by URL
  - [x] Count nodes using each asset
  - [x] Track which pages use each asset
  - [x] Display "Used in X places" badge

- [x] **Add asset preview thumbnails**
  - [x] Get image URLs from Framer API
  - [x] Display small preview in Assets table
  - [x] Fallback icon for SVG
  - [x] Handle missing/broken images

#### Recommendations Improvements
- [x] **"Top 3 Quick Wins" section**
  - [x] Extract top 3 by potential savings
  - [x] Add highlighted section at top of panel
  - [x] Special styling (border, icon, emphasis)
  - [x] Show combined savings total

- [x] **Better recommendation phrasing**
  - [x] Include specific pixel dimensions in actions
  - [ ] "Replace with AVIF/W1600px max" (future enhancement)
  - [ ] "Avoid placing this above the fold" (needs ATF detection)
  - [ ] "Convert GIF to MP4" (needs video detection)

#### Page Selection
- [x] **Page selector dropdown**
  - [x] List all pages from project
  - [x] Allow selecting individual page
  - [x] "All Pages" option (current behavior)
  - [x] Update analysis when page changes
  - [x] Show current page name in UI

#### Export Feature
- [x] **Markdown export**
  - [x] Format report with headings
  - [x] Include summary stats
  - [x] List top 10 assets in table
  - [x] List all recommendations
  - [x] Copy to clipboard button
  - [x] Success notification

- [x] **JSON export (optional)**
  - [x] Full data export
  - [x] Download as file
  - [x] Useful for automation

### Priority 2: Accuracy & Validation

#### Testing
- [ ] **Test on real projects**
  - [ ] Small project (1-2 pages, 5-10 images)
  - [ ] Medium project (5-10 pages, 20-50 images)
  - [ ] Large project (15+ pages, 100+ images)
  - [ ] Document test results

- [ ] **Compare to actual builds**
  - [ ] Run `npm run build` on test project
  - [ ] Measure actual file sizes in dist/
  - [ ] Compare to plugin estimates
  - [ ] Calculate accuracy percentage
  - [ ] Tune compression ratios if needed

#### Bug Fixes
- [x] Fix any console errors
- [x] Handle edge cases (no images, huge projects)
- [x] Fix NaN/undefined values in reports
- [x] Fix CSS dimension parsing
- [x] Fix SVG recommendation over-reporting
- [ ] Improve performance if needed (test on large projects)
- [x] Add more descriptive error messages

### Priority 3: Polish & UX

#### UI Improvements
- [x] Better breakpoint tab spacing
- [x] Balanced header layout
- [x] Improve empty states
- [x] Add tooltips for unclear terms
- [x] Better loading indicators
- [x] Standardized button components (consistent sizing, spacing, variants)
- [x] Fixed filter section layout and functionality
- [x] Improved CMS assets card with balanced buttons
- [x] Removed non-essential search feature from assets page
- [x] Added optimization instructions to recommendations
- [x] Made Ignore button prominent and accessible
- [x] Responsive image variant support with device-weighted calculations
- [ ] Improve responsive layout (optional)

#### Documentation
- [x] Update README with:
  - [x] What the plugin does
  - [x] How to install
  - [x] How to use
  - [ ] Screenshots (needs actual screenshots)
  - [x] Known limitations
- [x] Add inline help/tooltips in UI
- [ ] Create demo video (optional)

---

## 📋 Detailed Task Breakdown

### Task 1: Intrinsic Dimensions ✅ COMPLETE

**Files modified:**
- ✅ `src/services/traversal.ts` - Extract intrinsic size using `ImageAsset.measure()`
- ✅ `src/types/analysis.ts` - `actualDimensions` field already in AssetInfo type
- ✅ `src/components/assets/AssetsTableRow.tsx` - Display "intrinsic → rendered" format

**Implementation:**
1. ✅ Research Framer ImageAsset API for `measure()` - Using `image.measure()` API
2. ✅ Call `measure()` in both `extractAssetInfo()` and `collectAllAssetsEfficient()`
3. ✅ Store `actualDimensions: { width, height }` in AssetInfo
4. ✅ Display in Assets table: "1920×1080 → 960×540" format when available
5. ✅ Use actualDimensions in oversized detection (already implemented in recommendations.ts)

**Acceptance:**
- ✅ Assets table shows "Intrinsic → Rendered" dimensions when available
- ✅ Oversized detection uses actualDimensions for more accurate recommendations
- ✅ No performance degradation (measure() calls are async and non-blocking)

---

### Task 2: Usage Count

**Files to modify:**
- `src/services/analyzer.ts` - Track usage locations
- `src/services/traversal.ts` - Deduplicate by URL
- `src/types/analysis.ts` - Add AssetUsage type
- `src/components/assets/AssetsPanel.tsx` - Display count

**Steps:**
1. Create `AssetUsage` type with node, page, dimensions
2. In traversal, group assets by URL
3. Track all nodes using each asset
4. Count usages per asset
5. Display badge: "Used in 3 places"

**Acceptance:**
- Each asset shows usage count
- Can see which pages/nodes use each asset
- Count is accurate

---

### Task 3: Asset Previews

**Files to modify:**
- `src/components/assets/AssetsPanel.tsx` - Add preview column
- `src/services/traversal.ts` - Extract image URLs

**Steps:**
1. Get image URL from node
2. Display thumbnail (40×40px or similar)
3. Handle SVG (show icon instead)
4. Handle missing images (placeholder)

**Acceptance:**
- Images show thumbnail preview
- SVGs show icon
- No broken images
- Performance is acceptable

---

### Task 4: "Top 3 Quick Wins"

**Files to modify:**
- `src/components/recommendations/RecommendationsPanel.tsx`

**Steps:**
1. Extract top 3 recommendations by savings
2. Add highlighted section above filter buttons
3. Style with border, background, icon
4. Show "Total potential savings: XXX"
5. Click recommendation to jump to full list

**Acceptance:**
- Top 3 most impactful items are highlighted
- Clear visual hierarchy
- Total savings displayed
- Actionable and scannable

---

### Task 5: Page Selector

**Files to modify:**
- `src/components/overview/OverviewPanel.tsx` - Add dropdown
- `src/hooks/useAnalysis.ts` - Add selectedPage state
- `src/services/analyzer.ts` - Filter by page

**Steps:**
1. Add page dropdown component
2. List all pages from project
3. Add "All Pages" option
4. Filter analysis results by selected page
5. Update UI when selection changes

**Acceptance:**
- Can select individual pages
- Analysis updates for selected page
- "All Pages" shows aggregate
- Current page is clearly indicated

---

### Task 6: Markdown Export

**Files to modify:**
- `src/components/overview/OverviewPanel.tsx` - Add export button
- `src/utils/exportReport.ts` - New file

**Steps:**
1. Create `exportReport.ts` utility
2. Format analysis as Markdown:
   ```markdown
   # Bandwidth Report

   ## Summary
   - Total: 2.3 MB
   - Assets: 47
   - Pages: 8

   ## Breakdown
   - Images: 1.8 MB (78%)
   - Fonts: 300 KB (13%)
   ...

   ## Top 10 Assets
   | Asset | Size | Dimensions |
   |-------|------|------------|
   ...

   ## Recommendations
   1. [HIGH] Reduce hero-image.jpg...
   ...
   ```
3. Add "Export Report" button
4. Copy to clipboard
5. Show success message

**Acceptance:**
- Markdown is well-formatted
- Includes all relevant data
- Copies to clipboard successfully
- User gets confirmation

---

## 🎯 Week 1 Goals

### Monday-Tuesday
- [ ] Intrinsic dimensions
- [ ] Usage count tracking
- [ ] Asset previews

### Wednesday-Thursday
- [ ] "Top 3 Quick Wins"
- [ ] Page selector
- [ ] Markdown export

### Friday
- [ ] Test on 3 real projects
- [ ] Fix bugs
- [ ] Polish UI
- [ ] Update documentation

### Weekend (Optional)
- [ ] Demo video
- [ ] Screenshot for README
- [ ] Prepare for beta launch

---

## 📊 Progress Tracking

**Overall MVP Progress: 95%**

- Core Engine: 100% ✅ (architecture refined, breakpoint calculations fixed)
- UI Components: 100% ✅ (standardized buttons, improved layout, settings toggle fixed)
- Asset Metadata: 100% ✅
- Recommendations: 100% ✅ (instructions added, Ignore button improved)
- Export: 100% ✅
- Page Selection: 100% ✅
- Responsive Images: 100% ✅ (device-weighted calculations implemented)
- Architecture: 100% ✅ (clean separation, correct data model, no critical bugs)
- Testing: 30% ⏳ (needs real project validation)
- Documentation: 90% ✅ (architecture docs added)

---

## 🐛 Known Issues

1. ~~Plugin crashes with "pages not iterable"~~ ✅ Fixed
2. ~~UI styling looks wonky~~ ✅ Fixed
3. ~~Asset list doesn't show intrinsic dimensions~~ ✅ Fixed
4. ~~No way to select individual pages~~ ✅ Fixed
5. ~~Can't export report~~ ✅ Fixed
6. ~~Recommendations could be more specific~~ ✅ Improved
7. ~~Buttons inconsistent across pages~~ ✅ Fixed (standardized)
8. ~~Filter section layout issues~~ ✅ Fixed
9. ~~Bandwidth estimates don't account for responsive images~~ ✅ Fixed (device-weighted)
10. ~~Breakpoint calculations using wrong assets~~ ✅ Fixed (breakpoint-specific assets)
11. ~~Data model mixing canvas/CMS/manual assets~~ ✅ Fixed (clear separation)
12. ~~Settings toggle not working~~ ✅ Fixed (pointer events issue)
13. ~~Undefined variable in error fallback~~ ✅ Fixed
14. Need to test accuracy against real builds
15. Performance on very large projects (100+ pages) untested

---

## 💡 Future Enhancements (Post-MVP)

These are good ideas but NOT blocking for MVP:

- [x] ~~Monthly bandwidth calculator~~ ✅ Complete
- [x] ~~Responsive image variant support~~ ✅ Complete (device-weighted calculations)
- [ ] Video analysis
- [ ] Published URL audit
- [ ] One-click compression
- [ ] Above-the-fold detection
- [ ] CMS image auditing
- [ ] Performance budgets
- [ ] Historical tracking
- [ ] Team sharing

**Keep focused on MVP first!**

---

**Last Updated:** 2026-01-XX
**Next Review:** Ready for final testing and launch prep
