# Phase 1 Validation Testing

## Goal
Prove the plugin can extract asset data from a real Framer project reliably and meet the 3-second performance target.

## Test Setup

1. **Open Framer project with the plugin:**
   ```bash
   npm run dev
   ```
   - If SSL certificate issues, try: `sudo npm run dev`
   - Or manually install mkcert: `brew install mkcert && mkcert -install`

2. **Load in Framer:**
   - Open any Framer project (ideally with 5-10 pages and various images)
   - Open the plugin from the plugin panel
   - Watch browser console for errors

## Phase 1 Exit Criteria Checklist

### 1. Node Traversal Works ✓/✗
- [ ] Plugin loads without crashing
- [ ] `framer.getCanvasRoot()` returns pages
- [ ] Console shows no errors during traversal
- [ ] All pages are discovered

**How to verify:**
- Open browser DevTools (Cmd+Option+I in Framer)
- Check Console for errors
- Look for log messages from our services

### 2. Image/SVG Discovery ✓/✗
- [ ] Images are detected and listed
- [ ] SVG nodes are detected
- [ ] Background images are captured
- [ ] Node names and IDs are correct

**How to verify:**
- Go to Assets tab
- Check if all images from your project appear
- Click an asset - does it select in canvas?

### 3. Size Estimator Works ✓/✗
- [ ] Assets show estimated sizes (not 0 KB)
- [ ] Sizes are reasonable (images: 50KB-2MB, SVGs: 1-50KB)
- [ ] Sorting by size works correctly

**How to verify:**
- Assets tab shows sizes in KB/MB
- Largest assets appear at top when sorted by size
- Numbers look plausible for image dimensions

### 4. Performance Target: <3 Seconds ✓/✗
- [ ] Initial analysis completes quickly
- [ ] UI is responsive during analysis
- [ ] No "freezing" or long waits

**How to measure:**
- Note time from plugin open to results displayed
- Target: <3 seconds for single page, <10 seconds for full project

### 5. Basic UI Functions ✓/✗
- [ ] Overview tab shows total bandwidth
- [ ] Assets tab shows sortable list
- [ ] Recommendations tab shows suggestions (if any)
- [ ] Tabs switch smoothly
- [ ] Refresh button works

## Known Risks to Test

### Risk 1: Framer API Returns Unexpected Types
**Symptom**: Console errors like "Cannot read property of undefined"
**Check**: Look at actual shape of data returned by `framer.getCanvasRoot()`, `framer.getNode()`

### Risk 2: No Assets Found
**Symptom**: Assets tab is empty
**Check**:
- Are there actually images in the project?
- Is our detection logic too strict?
- Add console.logs in `extractAssetInfo()` to debug

### Risk 3: Performance Too Slow
**Symptom**: Plugin takes >10 seconds to analyze
**Check**:
- How many total nodes in the project?
- Is recursion depth too deep?
- Add timing logs: `console.time('analysis')` / `console.timeEnd('analysis')`

### Risk 4: Size Estimates Wildly Wrong
**Symptom**: All images show as 5MB or 5KB
**Check**:
- Are dimensions being read correctly?
- Are compression ratios applied?
- Test against actual build output sizes

## Debug Commands

Add these to the code temporarily for debugging:

```typescript
// In traversal.ts - getAllPages()
console.log('Canvas root:', root)
console.log('Number of pages:', root?.length)

// In extractAssetInfo()
console.log('Node type:', node.__class, 'Visible:', node.visible)

// In analyzer.ts - analyzeProject()
console.time('Full analysis')
// ... existing code
console.timeEnd('Full analysis')
```

## Success Criteria

**Phase 1 is validated when:**
- ✅ Plugin analyzes a medium Framer project (10 pages, 20+ images)
- ✅ Analysis completes in <10 seconds
- ✅ Top 10 assets are listed with reasonable size estimates
- ✅ No console errors during normal operation
- ✅ Asset selection in canvas works

**If any criteria fail:** Debug and fix before adding more features!

## Test Projects to Try

1. **Small project**: 1-2 pages, 5-10 images
2. **Medium project**: 5-10 pages, 20-50 images (our target)
3. **Large project**: 15+ pages, 100+ images (stress test)

## Next Steps After Validation

- ✅ If tests pass → Document findings, consider Phase 2 features
- ❌ If tests fail → Fix core issues before proceeding
- ⚠️ If performance is slow → Optimize traversal/calculation before adding features

---

**Status**: Ready to test
**Last updated**: 2026-01-03
