# Bandwidth Check Plugin - Constraints & Assumptions

## What This Plugin Does (2-sentence explanation)

The Bandwidth Check plugin **estimates** the bytes transferred on first page load by analyzing your Framer canvas assets (images, SVGs, fonts) and applying typical compression ratios. It provides **actionable recommendations** for optimizations you can make directly in Framer, not a precise bandwidth measurement.

## What We Measure vs. Estimate

### ✅ What We Actually Measure
- Number of image/SVG nodes in your Framer project
- Rendered dimensions of each asset (width × height in px)
- Asset types (image vs. SVG)
- Image formats from URLs (JPEG, PNG, WebP, SVG, etc.)

### 🔮 What We Estimate (Not Measure)
- **File sizes**: We estimate using `dimensions × pixel density × compression ratio`
- **Compression ratios**: We assume standard compression (JPEG: 85%, PNG: 60%, WebP: 90%)
- **Base overhead**: We estimate ~110KB for Framer's HTML/CSS/JS runtime
- **Font weight**: We estimate ~60KB per font family
- **Actual transferred bytes**: Real CDN compression, caching, and network conditions vary

### ❌ What We DON'T Do
- Download or measure actual file sizes (would be too slow)
- Account for lazy loading, CDN optimizations, or HTTP/2 multiplexing
- Measure JavaScript bundle size from custom code
- Predict bandwidth usage from video, animations, or interactions
- Track actual user bandwidth consumption over time

## Baseline Assumptions

### Breakpoints
- **Mobile**: 375px wide (iPhone standard), 2× pixel density
- **Tablet**: 768px wide (iPad portrait), 2× pixel density
- **Desktop**: 1440px wide (standard desktop), 1.5× pixel density

### Compression Ratios (Applied to Raw Pixel Data)
- **JPEG**: 15% of raw size (~85% compression at quality 80)
- **PNG**: 40% of raw size (~60% compression)
- **WebP**: 10% of raw size (~90% compression)
- **SVG**: 5% of raw size (text-based, very efficient)
- **Unknown**: 30% of raw size (conservative fallback)

### Base Overhead
- HTML structure: ~10KB
- Framer runtime CSS: ~40KB
- Custom CSS: ~10KB
- Framer runtime JS: ~50KB (assumes 50% cached)
- **Total base**: ~110KB

### Font Weight
- Estimated ~100KB per font family (including variants)
- Assumes WOFF2 format with subsetting (60% efficiency)
- **Typical**: ~60KB per font family after optimization

## Accuracy Expectations

### Target Accuracy
- **Within 30%** of actual build output for medium-sized projects
- Better for image-heavy sites (images are more predictable)
- Less accurate for code-heavy or animation-heavy sites

### Known Sources of Error
1. **Compression variance**: Real compression depends on image content
2. **CDN optimizations**: Cloudflare/Vercel may compress further
3. **Responsive images**: Framer may serve different sizes than we estimate
4. **Caching**: Returning visitors have very different bandwidth profiles
5. **Network conditions**: Actual transfer depends on HTTP version, latency, etc.

## Success Metrics (MVP)

### Performance
- ✅ Analyze medium project (10+ pages) in **<10 seconds**
- ✅ Analyze single page in **<3 seconds**
- ✅ Plugin loads and shows UI in **<2 seconds**

### Utility
- ✅ Identify top 10 heaviest assets
- ✅ Provide 5+ actionable recommendations per typical project
- ✅ Flag images >500KB (high priority issues)

### Accuracy
- ✅ Estimate within 30% of actual build for test projects
- ✅ Relative rankings correct (largest assets correctly identified)
- ✅ Breakdown percentages directionally accurate (images vs. fonts vs. base)

## Non-Goals (Out of Scope for MVP)

- ❌ Historical tracking or trend analysis
- ❌ Integration with build tools or CI/CD
- ❌ Actual file downloads for precise measurement
- ❌ Custom breakpoint configuration
- ❌ Video or animation bandwidth analysis
- ❌ Comparison with other sites or benchmarks
- ❌ Cost estimation without manual input

## Why These Constraints?

**Speed over precision**: Downloading every asset to measure precisely would take minutes and consume bandwidth itself. Estimation is instant.

**Actionable over comprehensive**: We focus on optimizations designers can make in Framer right now (resize images, change formats), not infrastructure changes (CDN setup, lazy loading).

**Directional over exact**: Knowing an image is "very large" is more useful than knowing it's exactly 847KB vs. 850KB.

## Validation Plan

1. ✅ Build compiles without errors
2. ⏳ Test with 3-5 real Framer projects of varying sizes
3. ⏳ Compare estimates to actual build output (`npm run build` + file sizes)
4. ⏳ Verify recommendations are actionable and accurate
5. ⏳ Measure analysis time on medium project (target: <10s)

---

**Last Updated**: 2026-01-03
**Status**: Phase 0 documentation complete, Phase 1 validation pending
