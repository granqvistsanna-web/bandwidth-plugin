# Bandwidth Inspector - Product Roadmap

**Working Name:** Bandwidth Inspector
**Tagline:** "Know your page weight before you publish."

---

## MVP (Phase 1): Ship This First

### Goal
Give creators immediate visibility into page weight and actionable recommendations they can implement in Framer right now.

### Core User Stories
1. ✅ As a creator, I can select a page and see estimated page weight
2. ✅ I can see the top 10 heaviest assets and where they are used
3. ✅ I can get specific recommendations I can act on immediately

### 🚨 Critical Features (Must-Have Before Launch)

These three features are essential for a complete and reliable MVP:

#### 1. ✅ CMS Assets Collection (IN PROGRESS)
**Status:** Partially implemented, needs refinement for reliability

**Goal:** Ensure the plugin can successfully read and collect CMS assets from the Framer project so CMS images and files are included in the bandwidth estimate.

**Current Implementation:**
- ✅ CMS collection detection using `framer.getCollections()`
- ✅ CMS item asset extraction using `collection.getItems()` and `isImageAsset()`
- ✅ Component controls detection (heuristic)
- ✅ Published site CMS asset extraction
- ✅ Manual CMS estimate support
- ⚠️ **Issue:** CMS assets may not always be detected reliably

**Required Improvements:**
- [ ] **Robust CMS Detection:** Ensure all CMS collections are discovered, including nested or dynamically loaded collections
- [ ] **Complete Asset Extraction:** Verify all image/file fields are scanned across all CMS items
- [ ] **Reliable Published Site Detection:** Improve accuracy when extracting CMS assets from published/staging sites
- [ ] **Fallback Mechanisms:** Clear user guidance when CMS assets cannot be automatically detected
- [ ] **Testing:** Validate on projects with various CMS structures (blog posts, product catalogs, team pages, etc.)

**Success Criteria:**
- ✅ CMS assets appear in asset list with "CMS" badge
- ✅ CMS assets included in total bandwidth calculations
- ✅ Manual estimates work as fallback when auto-detection fails
- [ ] 95%+ of CMS assets detected automatically on typical projects
- [ ] Clear messaging when CMS assets are missing or estimated

#### 2. ✅ UI/UX Redesign (MOSTLY COMPLETE)
**Status:** Major improvements completed, minor refinements may be needed

**Goal:** Redesign the plugin interface to follow a clean, minimal and well-structured UI with simple UX that is fast to understand and easy to use.

**Completed Improvements:**
- ✅ Standardized button component with consistent sizing, spacing, and variants
- ✅ Clean, minimal design system with warm gray surfaces and blue accent
- ✅ Consistent typography and spacing throughout
- ✅ Fixed text clipping and overflow issues
- ✅ Improved filter section layout and functionality
- ✅ CMS assets card with balanced, properly sized buttons
- ✅ Recommendations page with prominent Ignore button and focused actions
- ✅ Optimization instructions added to explain outcomes
- ✅ Removed redundant search feature from assets page
- ✅ Responsive image variant support with device-weighted calculations

**Remaining Minor Improvements:**
- [ ] Test on various screen sizes for responsive behavior
- [ ] Final accessibility audit (keyboard navigation, screen readers)
- [ ] Performance testing on very large projects

**Success Criteria:**
- ✅ Users can understand the plugin's purpose quickly
- ✅ All information is clearly readable (no clipping)
- ✅ Navigation is intuitive
- ✅ Actions are clear (standardized buttons)
- ✅ UI feels polished and professional

#### 3. 📍 Page Location Display (IN PROGRESS)
**Status:** Partially working, needs refinement

**Goal:** Ensure assets show their page location using the internal page slug or route name (such as "about") so users can quickly understand where assets live on the site and navigate to edit them.

**Current Implementation:**
- ✅ Page name capture during asset collection
- ✅ Page slug extraction from Framer page names
- ✅ CMS item slug support
- ⚠️ **Issue:** Pages showing as "Unknown" - page detection not working reliably

**Required Improvements:**
- [ ] **Reliable Page Detection:**
  - Fix `getPageForNode()` to correctly identify which page each asset belongs to
  - Use page caching for faster lookups
  - Handle edge cases (nested components, shared assets, etc.)

- [ ] **Page Name Display:**
  - Show Framer page name/slug (e.g., "about", "pricing")
  - For CMS assets, show CMS item slug (e.g., "my-blog-post")
  - Display page URL when available (for published sites)
  - Clear fallback when page cannot be determined

- [ ] **Navigation Support:**
  - "Select in Canvas" works across pages
  - Page name is clickable/linkable when URL available
  - Clear indication when navigation is not possible

**Success Criteria:**
- [ ] All assets show their page location (no "Unknown" pages)
- [ ] Page names are accurate (match Framer page names/slugs)
- [ ] CMS assets show CMS item slugs correctly
- [ ] Users can navigate to assets on different pages
- [ ] Page information is clearly visible in both Assets and Recommendations panels

### MVP Features

#### 1. Page and Breakpoint Selector
- [x] Breakpoints: Desktop, Tablet, Mobile
- [x] Page selector: Current page + dropdown for all pages ✅
- [x] Visual breakpoint tabs (375px, 768px, 1440px)

#### 2. Page Weight Estimate
- [x] Total estimated bytes display
- [x] Breakdown by category:
  - [x] Images
  - [x] SVG
  - [x] Fonts
  - [x] HTML/CSS/JS baseline
  - [ ] Video (optional)
- [ ] "Not measured" callout for third-party scripts

#### 3. Asset Table
**Columns:**
- [x] Asset preview (thumbnail) ✅
- [x] Estimated bytes
- [x] Intrinsic dimensions (actual image size) ✅
- [x] Rendered dimensions (canvas size)
- [x] Count of usages (how many nodes use this asset) ✅
- [x] Recommendation badge
- [x] Color-coded file size badges (red/orange/yellow/green) ✅
- [x] SVG preview with node name and dimensions ✅

**Current Status:**
- ✅ Basic list with node names and sizes
- ✅ Sortable by size and name
- ✅ Click to select in canvas
- ✅ Preview thumbnails for images
- ✅ Intrinsic dimensions detection
- ✅ Usage count tracking
- ✅ Improved UI with better spacing and alignment

#### 4. Recommendations Panel
- [x] Prioritized list (High/Medium/Low)
- [x] Filter by priority
- [x] Total potential savings
- [x] **"Top 3 Quick Wins"** section at the top ✅
- [x] Action-oriented phrasing with specific dimensions ✅
  - ✅ "Reduce image size to XXXpx and compress"
  - ✅ "Convert to JPEG or WebP format"
  - ✅ Cross-page navigation support ✅
  - ✅ Image preview thumbnails in recommendations ✅
  - ✅ Node name display for identification ✅
  - ⏳ "Replace with AVIF/W1600px max" (future enhancement)
  - ⏳ "Avoid placing this above the fold" (needs ATF detection)
  - ⏳ "Convert GIF to MP4" (needs video detection)

#### 5. Export
- [x] Copy report to clipboard as Markdown ✅
- [x] JSON export ✅
- [x] Bandwidth calculator with pageview estimator ✅
- [x] Framer plan limit mapping with risk indicators ✅

### MVP Non-Goals
- ❌ Predicting monthly bandwidth automatically (Phase 2)
- ❌ Analytics integrations (Phase 2)
- ❌ Automated replacement/compression inside canvas (Phase 2)
- ❌ Real-time monitoring
- ❌ Historical tracking

### Acceptance Criteria
- [ ] On a typical Framer marketing site, top 5 assets flagged match Chrome DevTools Network tab (needs validation)
- [x] Plugin runs in <3 seconds on mid-sized project (10 pages, 20+ images)
- [x] Recommendations are unambiguous and actionable
- [ ] Byte estimates within 30% of actual build output (needs validation)
- [x] Recommendations generate without failure for projects with 25+ assets and 5+ pages
- [x] Each recommendation includes precise action with specific dimensions
- [x] Every recommendation contains valid `estimatedBytesSaved` (positive integer)
- [x] Priorities assigned correctly (high/medium/low)
- [x] "Select in canvas" works with cross-page navigation
- [x] "Top 3 Quick Wins" displays when 3+ high priority recommendations exist

### Current MVP Status: ~85% Complete

**What Works:**
- ✅ Node traversal and asset discovery
- ✅ Bandwidth estimation with compression ratios
- ✅ Breakpoint analysis (mobile/tablet/desktop)
- ✅ Sortable asset list
- ✅ Recommendation generation
- ✅ Click to select assets in canvas
- ✅ Asset preview thumbnails
- ✅ Intrinsic dimensions detection
- ✅ Usage count per asset
- ✅ "Top 3 Quick Wins" highlight
- ✅ Page selector dropdown
- ✅ Export to Markdown/JSON
- ✅ Cross-page navigation for recommendations
- ✅ Basic CMS asset detection

**What's Missing for MVP (Critical):**
- [ ] **CMS Assets:** Reliable detection and inclusion in all projects
- [ ] **Page Location:** All assets show correct page names (fix "Unknown" issue)
- [ ] Accuracy validation against real builds (final testing needed)

**Recently Completed:**
- ✅ **UI/UX Redesign:** Clean, minimal, well-structured interface with standardized components
- ✅ **Responsive Image Variants:** Device-weighted bandwidth calculations accounting for Framer's responsive image serving

---

## Phase 2: Paid-Grade Accuracy & Automation

### Goal
Provide professional-grade accuracy and time-saving automation worth paying for.

### Features

#### 1. Published URL Audit
**The Major Differentiator**

- Fetch staging/production URL via Framer publish info
- Parse HTML and extract resource URLs
- HEAD request each resource for `Content-Length`
- Get actual transfer sizes (with compression)
- Detect third-party scripts, font downloads, LCP image
- Compare estimate vs. reality

**Benefits:**
- Accurate byte counts instead of estimates
- Detect resources not visible in canvas
- Real CDN compression ratios
- Third-party script impact

#### 2. Monthly Bandwidth Estimator
- ✅ User inputs expected pageviews
- ✅ Calculate: `total bytes × pageviews = GB/month`
- ✅ Map to Framer plan limits:
  - Mini: 10 GB/month
  - Basic: 100 GB/month
  - Pro: 1 TB/month
- ✅ Show "risk of overage" warnings
- ✅ Suggest optimizations to stay within limits
- ✅ Per 1,000 pageviews estimator
- ✅ **Responsive Image Variants Support** ✅ COMPLETE
  - ✅ Device-weighted bandwidth calculations (55% mobile, 15% tablet, 30% desktop)
  - ✅ Separate breakpoint estimates for mobile, tablet, and desktop
  - ✅ UI clearly explains Framer serves different image sizes per device
  - ✅ Breakpoint breakdown section showing estimates per device type
  - ✅ Realistic estimates that don't assume all visitors load highest resolution
  - ✅ Monthly bandwidth estimates account for device distribution
  - ✅ Overview panel shows device-weighted calculations

#### 3. One-Click Fixes
**Like Framer Compr Plugin**

Per-asset actions:
- "Compress" button with presets:
  - Balanced (80% quality)
  - Aggressive (60% quality)
  - LCP-first (optimize above-fold only)
- Auto-convert to WebP/AVIF
- Auto-resize to rendered dimensions + 2x

**Implementation:**
- Use Canvas API to replace image
- Keep original in undo history
- Batch processing for multiple assets

#### 4. Video Analysis
- Detect video nodes
- Estimate video file sizes
- Flag autoplaying videos
- Recommend MP4 → WebM conversion
- Suggest lazy loading for below-fold videos

### Monetization Strategy
**Free Tier:**
- Basic estimates (Phase 1 MVP) ✅
- Unlimited assets ✅
- Manual export (Markdown & JSON) ✅
- Monthly bandwidth calculator ✅ (MVP feature, keeping free)

**Pro Tier ($10-20/month):**
- Published URL audit (accurate measurements)
- One-click compression
- Above-the-fold detection
- LCP candidate detection
- Performance budgets
- Priority support

---

## Phase 3: Advanced Insights

### Goal
Become the essential performance tool for professional Framer developers.

### Features

#### 1. Above-the-Fold Detection
- Estimate viewport height (1080px desktop, 812px mobile)
- Flag assets rendered in first screenful
- Prioritize LCP candidate detection
- Recommend preloading or optimization for ATF assets

#### 2. LCP Candidate Detection
**Largest Contentful Paint**

- Identify largest image/text node above fold
- Highlight in recommendations
- Suggest specific optimizations:
  - Preload hint
  - Priority compression
  - Inline critical CSS

#### 3. CMS Image Auditing
**Common Pain Point**

- Scan CMS collections
- Detect uploaded images used across multiple items
- Flag oversized source images
- Recommend optimal upload dimensions
- Batch optimization for CMS assets

#### 4. Team Workflows
**Audit Report Before Publish**

- Pre-publish checklist
- "Performance budget" warnings
- CI-style checks:
  - ❌ Page weight > 3MB
  - ❌ LCP image > 500KB
  - ❌ Total images > 50
- Share reports with team
- Track improvements over time

#### 5. Performance Budgets
- Set custom thresholds per project
- Get warnings before exceeding
- Track trends over time
- Compare pages within project

---

## Technical Architecture (MVP)

### Modules

#### Scanner (`services/traversal.ts`)
- ✅ Traverses node tree
- ✅ Collects asset references
- ✅ Detects asset usage count
- ✅ Extracts intrinsic dimensions

#### Sizer (`services/bandwidth.ts`)
- ✅ Estimates bytes per asset
- ✅ Applies compression ratios
- ✅ Calculates totals by breakpoint
- [ ] Fetches actual sizes (Phase 2)

#### Aggregator (`services/analyzer.ts`)
- ✅ Computes totals by page
- ✅ Aggregates across breakpoints
- ✅ Groups by asset (deduplication)
- ✅ Tracks usage locations

#### Rules Engine (`services/recommendations.ts`)
- ✅ Produces recommendations
- ✅ Assigns severity (high/medium/low)
- ✅ Prioritizes "Top 3 Quick Wins"
- [ ] Context-aware rules (ATF detection - Phase 3)

#### UI Components
- ✅ Overview panel
- ✅ Assets panel
- ✅ Recommendations panel
- ✅ Export functionality (Markdown & JSON)
- ✅ Page selector dropdown
- ✅ Sidebar navigation (collapsible)
- ✅ Bandwidth calculator
- ✅ Cross-page navigation for recommendations

### Data Model

```typescript
// Asset with all metadata
interface Asset {
  id: string
  type: 'image' | 'svg' | 'video'
  url?: string
  intrinsicWidth: number
  intrinsicHeight: number
  estimatedBytes: number
  usageCount: number
  usages: AssetUsage[]
}

// Where and how asset is used
interface AssetUsage {
  nodeId: string
  nodeName: string
  pageId: string
  pageName: string
  renderedWidth: number
  renderedHeight: number
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  aboveTheFold?: boolean
}

// Final report
interface Report {
  totals: {
    bytes: number
    assetCount: number
    pageCount: number
  }
  breakdown: {
    images: number
    videos: number
    fonts: number
    base: number
  }
  topFindings: Recommendation[]
  assets: Asset[]
}
```

---

## Build Order (Practical Implementation)

### ✅ Completed
1. ✅ Get image discovery working end-to-end
2. ✅ Get byte estimation working
3. ✅ Build ranked list UI
4. ✅ Add recommendation rules
5. ✅ Add breakpoint selection

### ✅ Completed (MVP Features)
6. [x] Add intrinsic dimension detection ✅
7. [x] Add asset usage count ✅
8. [x] Add "Top 3 Quick Wins" section ✅
9. [x] Add page selector dropdown ✅
10. [x] Add export to Markdown ✅
11. [x] Improve recommendation phrasing ✅
12. [x] Add asset preview thumbnails ✅
13. [x] Cross-page navigation for recommendations ✅
14. [x] Improved assets list UI with color-coded sizes ✅
15. [x] SVG preview and identification ✅
16. [x] Monthly bandwidth calculator ✅

### ⏳ Next (Improve Accuracy)
17. [ ] Validate against real Framer builds
18. [ ] Tune compression ratios
19. [ ] Add edge case handling
20. [ ] Performance optimization

### 📦 Phase 2 Prep
17. [ ] Published URL fetching
18. [ ] Actual file size measurement
19. [ ] Monthly bandwidth calculator
20. [ ] Compression tools integration

---

## Immediate Next Steps (This Week)

### 🚨 Priority 1: Critical Features (MUST COMPLETE)

#### 1. Fix CMS Assets Collection
- [ ] Debug and fix CMS asset detection reliability
- [ ] Test on projects with various CMS structures
- [ ] Ensure CMS assets always appear in totals
- [ ] Improve fallback messaging when detection fails
- [ ] Add comprehensive testing

#### 2. UI/UX Redesign
- [ ] Audit current UI for clarity and consistency
- [ ] Redesign information hierarchy
- [ ] Fix all text clipping and overflow issues
- [ ] Implement consistent spacing system
- [ ] Refine component styles (buttons, inputs, cards)
- [ ] Improve empty states and loading states
- [ ] Add helpful tooltips and guidance
- [ ] Test on different plugin sizes

#### 3. Fix Page Location Display
- [ ] Debug why pages show as "Unknown"
- [ ] Fix `getPageForNode()` function
- [ ] Ensure page names are captured correctly
- [ ] Test page detection on various project structures
- [ ] Add page name display to Assets panel
- [ ] Ensure Recommendations show correct page names
- [ ] Test cross-page navigation

### ✅ Priority 2: Core MVP Features (DONE)
- [x] **Asset preview thumbnails** ✅
  - Use Framer image API to get preview URLs
  - Display in Assets table
  - Fallback to placeholder for SVG

- [x] **Intrinsic dimensions** ✅
  - Use `ImageAsset.measure()` to get actual image size
  - Compare to rendered dimensions
  - Flag oversized assets more accurately

- [x] **Usage count and locations** ✅
  - Track all nodes using same asset URL
  - Show "Used in X places" badge
  - List specific pages/nodes

- [x] **"Top 3 Quick Wins" section** ✅
  - Take top 3 recommendations by savings
  - Highlight at top of Recommendations panel
  - Add special styling

### ✅ Priority 2: Export Functionality (DONE)
- [x] **Markdown export** ✅
  - Format report with headings and tables
  - Include breakdown, top assets, recommendations
  - Copy to clipboard button

- [x] **JSON export** ✅
  - Full data export
  - Download as file

- [x] **Bandwidth calculator** ✅
  - Pageview estimator
  - Framer plan limit mapping
  - Risk indicators

### ✅ Priority 3: Page Selector (DONE)
- [x] **Page dropdown** ✅
  - List all pages in project
  - Allow selecting individual page to analyze
  - Default to "All Pages"
  - Per-page analysis working

### Priority 4: Validation & Polish
- [ ] Test on 3-5 real Framer projects
- [ ] Compare estimates to actual build output
- [ ] Tune compression ratios for accuracy
- [ ] Fix any remaining bugs

---

## Success Metrics

### MVP Launch (Phase 1)
- ✅ Plugin loads and runs without errors
- ✅ Analysis completes in <10 seconds
- [ ] 80% of users see actionable recommendations
- [ ] Estimates within 30% of actual build
- [ ] 10+ beta testers provide feedback

### Phase 2 (Paid)
- 100+ active users (free tier)
- 10+ paying customers
- Estimates within 10% of actual (with URL audit)
- 5-star reviews mention "saved money on bandwidth"

### Phase 3 (Professional)
- 1,000+ active users
- 100+ paying customers
- Used by Framer template creators
- Mentioned in Framer community as essential tool

---

## Current Status Summary

**Phase 1 MVP: ~92% Complete**

**Working:**
- Core analysis engine
- UI with 3 tabs (collapsible sidebar navigation)
- Recommendations generation with cross-page navigation
- Breakpoint analysis with responsive image variant support
- Device-weighted bandwidth calculations (55% mobile, 15% tablet, 30% desktop)
- Asset preview thumbnails
- Intrinsic dimensions detection
- Usage count tracking
- "Top 3 Quick Wins" highlighting
- Page selector (per-page analysis)
- Export functionality (Markdown & JSON)
- Improved assets list with color-coded file sizes
- Better recommendation phrasing with specific dimensions
- Standardized button components (consistent sizing, spacing, variants)
- Clean, minimal design system with warm gray surfaces
- Optimization instructions explaining outcomes
- Prominent Ignore button functionality
- Improved CMS assets card with balanced buttons
- Filter section with proper layout and functionality

**Missing:**
- Accuracy validation against real builds
- Performance testing on very large projects (100+ pages)
- Final accessibility audit

**Next Milestone:** Finalize MVP
- Test accuracy against real Framer builds
- Performance optimization if needed
- Final accessibility checks
- Prepare for launch

---

**Last Updated:** 2026-01-03
**Status:** Phase 1 MVP - 92% complete, **2 critical features must be completed before launch:**
1. CMS Assets Collection (reliability improvements needed)
2. Page Location Display (fix "Unknown" pages issue)

**Recent Completions (Latest Session):**
- ✅ UI/UX Redesign - Major improvements completed (button standardization, filter fixes, CMS card improvements)
- ✅ Responsive Image Variants - Device-weighted bandwidth calculations implemented (55% mobile, 15% tablet, 30% desktop)
- ✅ Optimization Instructions - Clear explanations added to recommendations explaining what happens when optimizing
- ✅ Ignore Button - Made prominent and accessible, moved next to primary actions
- ✅ Search Feature - Removed from assets page (not essential, filters provide better functionality)
- ✅ Button Standardization - All buttons now use consistent component with proper sizing, spacing, and variants
- ✅ Filter Improvements - Fixed layout, made icons work properly, improved spacing
- ✅ CMS Assets Card - Balanced buttons, proper sizing, consistent styling
