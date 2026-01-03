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
3. ⏳ I can get specific recommendations I can act on immediately

### MVP Features

#### 1. Page and Breakpoint Selector
- [x] Breakpoints: Desktop, Tablet, Mobile
- [ ] Page selector: Current page + dropdown for all pages
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
- [ ] Asset preview (thumbnail)
- [x] Estimated bytes
- [ ] Intrinsic dimensions (actual image size)
- [x] Rendered dimensions (canvas size)
- [ ] Count of usages (how many nodes use this asset)
- [x] Recommendation badge

**Current Status:**
- ✅ Basic list with node names and sizes
- ✅ Sortable by size and name
- ✅ Click to select in canvas
- ❌ Missing: preview thumbnails, intrinsic dimensions, usage count

#### 4. Recommendations Panel
- [x] Prioritized list (High/Medium/Low)
- [x] Filter by priority
- [x] Total potential savings
- [ ] **"Top 3 Quick Wins"** section at the top
- [x] Action-oriented phrasing
  - ✅ "Reduce image size to XXXpx and compress"
  - ✅ "Convert to JPEG or WebP format"
  - ⏳ "Replace with AVIF/W1600px max"
  - ⏳ "Avoid placing this above the fold"
  - ⏳ "Convert GIF to MP4"

#### 5. Export
- [ ] Copy report to clipboard as Markdown
- [ ] Optional: JSON export

### MVP Non-Goals
- ❌ Predicting monthly bandwidth automatically (Phase 2)
- ❌ Analytics integrations (Phase 2)
- ❌ Automated replacement/compression inside canvas (Phase 2)
- ❌ Real-time monitoring
- ❌ Historical tracking

### Acceptance Criteria
- [ ] On a typical Framer marketing site, top 5 assets flagged match Chrome DevTools Network tab
- [x] Plugin runs in <3 seconds on mid-sized project (10 pages, 20+ images)
- [x] Recommendations are unambiguous and actionable
- [ ] Byte estimates within 30% of actual build output

### Current MVP Status: ~70% Complete

**What Works:**
- ✅ Node traversal and asset discovery
- ✅ Bandwidth estimation with compression ratios
- ✅ Breakpoint analysis (mobile/tablet/desktop)
- ✅ Sortable asset list
- ✅ Recommendation generation
- ✅ Click to select assets in canvas

**What's Missing for MVP:**
- [ ] Asset preview thumbnails
- [ ] Intrinsic dimensions detection
- [ ] Usage count per asset
- [ ] "Top 3 Quick Wins" highlight
- [ ] Page selector dropdown
- [ ] Export to Markdown/JSON
- [ ] Better recommendation phrasing
- [ ] Accuracy validation against real builds

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
- User inputs expected pageviews
- Calculate: `total bytes × pageviews = GB/month`
- Map to Framer plan limits:
  - Mini: 10 GB/month
  - Basic: 100 GB/month
  - Pro: 1 TB/month
- Show "risk of overage" warnings
- Suggest optimizations to stay within limits

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
- Basic estimates (Phase 1 MVP)
- Top 10 assets only
- Manual export

**Pro Tier ($10-20/month):**
- Published URL audit (accurate measurements)
- Unlimited assets
- Monthly bandwidth calculator
- One-click compression
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
- [ ] Detects asset usage count
- [ ] Extracts intrinsic dimensions

#### Sizer (`services/bandwidth.ts`)
- ✅ Estimates bytes per asset
- ✅ Applies compression ratios
- ✅ Calculates totals by breakpoint
- [ ] Fetches actual sizes (Phase 2)

#### Aggregator (`services/analyzer.ts`)
- ✅ Computes totals by page
- ✅ Aggregates across breakpoints
- [ ] Groups by asset (deduplication)
- [ ] Tracks usage locations

#### Rules Engine (`services/recommendations.ts`)
- ✅ Produces recommendations
- ✅ Assigns severity (high/medium/low)
- [ ] Prioritizes "Top 3 Quick Wins"
- [ ] Context-aware rules (ATF detection)

#### UI Components
- ✅ Overview panel
- ✅ Assets panel
- ✅ Recommendations panel
- [ ] Export panel
- [ ] Page selector dropdown

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

### 🚧 In Progress (Complete MVP)
6. [ ] Add intrinsic dimension detection
7. [ ] Add asset usage count
8. [ ] Add "Top 3 Quick Wins" section
9. [ ] Add page selector dropdown
10. [ ] Add export to Markdown
11. [ ] Improve recommendation phrasing
12. [ ] Add asset preview thumbnails

### ⏳ Next (Improve Accuracy)
13. [ ] Validate against real Framer builds
14. [ ] Tune compression ratios
15. [ ] Add edge case handling
16. [ ] Performance optimization

### 📦 Phase 2 Prep
17. [ ] Published URL fetching
18. [ ] Actual file size measurement
19. [ ] Monthly bandwidth calculator
20. [ ] Compression tools integration

---

## Immediate Next Steps (This Week)

### Priority 1: Complete Core MVP Features
- [ ] **Asset preview thumbnails**
  - Use Framer image API to get preview URLs
  - Display in Assets table
  - Fallback to placeholder for SVG

- [ ] **Intrinsic dimensions**
  - Use `ImageAsset.measure()` to get actual image size
  - Compare to rendered dimensions
  - Flag oversized assets more accurately

- [ ] **Usage count and locations**
  - Track all nodes using same asset URL
  - Show "Used in X places" badge
  - List specific pages/nodes

- [ ] **"Top 3 Quick Wins" section**
  - Take top 3 recommendations by savings
  - Highlight at top of Recommendations panel
  - Add special styling

### Priority 2: Export Functionality
- [ ] **Markdown export**
  - Format report with headings and tables
  - Include breakdown, top assets, recommendations
  - Copy to clipboard button

### Priority 3: Page Selector
- [ ] **Page dropdown**
  - List all pages in project
  - Allow selecting individual page to analyze
  - Default to "All Pages"

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

**Phase 1 MVP: ~70% Complete**

**Working:**
- Core analysis engine
- UI with 3 tabs
- Recommendations generation
- Breakpoint analysis

**Missing:**
- Asset previews and intrinsic dimensions
- Usage count tracking
- "Top 3 Quick Wins" highlighting
- Page selector
- Export functionality

**Next Milestone:** Ship MVP in 1 week
- Complete remaining MVP features
- Test with real projects
- Fix bugs and tune accuracy
- Prepare for launch

---

**Last Updated:** 2026-01-03
**Status:** Phase 1 MVP - 70% complete, targeting launch in 1 week
