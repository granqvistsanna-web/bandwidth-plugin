# MVP TODO List - Week 1

**Goal:** Ship Phase 1 MVP in 1 week
**Status:** 70% complete

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
- [ ] **Get intrinsic dimensions**
  - [ ] Use `ImageAsset.measure()` API
  - [ ] Store actualWidth and actualHeight
  - [ ] Display in Assets table
  - [ ] Use for better oversized detection

- [ ] **Track asset usage count**
  - [ ] Deduplicate assets by URL
  - [ ] Count nodes using each asset
  - [ ] Track which pages use each asset
  - [ ] Display "Used in X places" badge

- [ ] **Add asset preview thumbnails**
  - [ ] Get image URLs from Framer API
  - [ ] Display small preview in Assets table
  - [ ] Fallback icon for SVG
  - [ ] Handle missing/broken images

#### Recommendations Improvements
- [ ] **"Top 3 Quick Wins" section**
  - [ ] Extract top 3 by potential savings
  - [ ] Add highlighted section at top of panel
  - [ ] Special styling (border, icon, emphasis)
  - [ ] Show combined savings total

- [ ] **Better recommendation phrasing**
  - [ ] "Replace with AVIF/W1600px max"
  - [ ] "Avoid placing this above the fold" (needs ATF detection)
  - [ ] "Convert GIF to MP4" (needs video detection)
  - [ ] Include specific pixel dimensions in actions

#### Page Selection
- [ ] **Page selector dropdown**
  - [ ] List all pages from project
  - [ ] Allow selecting individual page
  - [ ] "All Pages" option (current behavior)
  - [ ] Update analysis when page changes
  - [ ] Show current page name in UI

#### Export Feature
- [ ] **Markdown export**
  - [ ] Format report with headings
  - [ ] Include summary stats
  - [ ] List top 10 assets in table
  - [ ] List all recommendations
  - [ ] Copy to clipboard button
  - [ ] Success notification

- [ ] **JSON export (optional)**
  - [ ] Full data export
  - [ ] Download as file
  - [ ] Useful for automation

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
- [ ] Fix any console errors
- [ ] Handle edge cases (no images, huge projects)
- [ ] Improve performance if needed
- [ ] Add more descriptive error messages

### Priority 3: Polish & UX

#### UI Improvements
- [x] Better breakpoint tab spacing
- [x] Balanced header layout
- [ ] Improve empty states
- [ ] Add tooltips for unclear terms
- [ ] Better loading indicators
- [ ] Improve responsive layout

#### Documentation
- [ ] Update README with:
  - [ ] What the plugin does
  - [ ] How to install
  - [ ] How to use
  - [ ] Screenshots
  - [ ] Known limitations
- [ ] Add inline help/tooltips in UI
- [ ] Create demo video

---

## 📋 Detailed Task Breakdown

### Task 1: Intrinsic Dimensions

**Files to modify:**
- `src/services/traversal.ts` - Extract intrinsic size
- `src/types/analysis.ts` - Update AssetInfo type
- `src/components/assets/AssetsPanel.tsx` - Display dimensions

**Steps:**
1. Research Framer ImageAsset API for `measure()`
2. Call `measure()` in `extractAssetInfo()`
3. Store `actualDimensions: { width, height }`
4. Display in Assets table: "1920×1080 → 960×540"
5. Use ratio to improve oversized detection

**Acceptance:**
- Assets table shows "Intrinsic → Rendered" dimensions
- Oversized detection is more accurate
- No performance degradation

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

**Overall MVP Progress: 70%**

- Core Engine: 95% ✅
- UI Components: 80% ✅
- Asset Metadata: 40% 🚧
- Recommendations: 70% 🚧
- Export: 0% ⏳
- Page Selection: 0% ⏳
- Testing: 20% ⏳
- Documentation: 60% 🚧

---

## 🐛 Known Issues

1. ~~Plugin crashes with "pages not iterable"~~ ✅ Fixed
2. ~~UI styling looks wonky~~ ✅ Fixed
3. Asset list doesn't show intrinsic dimensions
4. No way to select individual pages
5. Can't export report
6. Recommendations could be more specific

---

## 💡 Future Enhancements (Post-MVP)

These are good ideas but NOT blocking for MVP:

- [ ] Video analysis
- [ ] Published URL audit
- [ ] Monthly bandwidth calculator
- [ ] One-click compression
- [ ] Above-the-fold detection
- [ ] CMS image auditing
- [ ] Performance budgets
- [ ] Historical tracking
- [ ] Team sharing

**Keep focused on MVP first!**

---

**Last Updated:** 2026-01-03
**Next Review:** Daily during MVP week
