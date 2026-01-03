# Plan: Fully Implement Compress and Resize Feature

## Current Issues

Based on testing and error messages, the following problems exist:

1. **Permission Errors**: `framer.addImage()` requires permissions that may not be available
2. **Type Validation Errors**: Data format issues with `typia.createAssert()` 
3. **API Limitations**: `setAttributes()` may not support `backgroundImage` property
4. **Workflow Issues**: Creating image nodes on canvas doesn't directly replace background images

## Root Cause Analysis

### Problem 1: Framer API Limitations
- `framer.addImage()` creates a new **Image node** on the canvas, not an **ImageAsset** that can be used as `backgroundImage`
- `setAttributes()` may not support setting `backgroundImage` property
- There's no direct API to upload assets to Framer's asset library
- There's no API to replace an existing `ImageAsset` with a new one

### Problem 2: Data Format Issues
- The conversion from `Uint8Array` to Data URL may not be in the exact format Framer expects
- Large Data URLs may exceed size limits
- MIME type handling may be incorrect

### Problem 3: Workflow Mismatch
- We're trying to create a canvas node when we need an asset reference
- Background images use `ImageAsset` objects, not canvas nodes

## Solution Strategy

Since direct replacement via API may not be possible, we need a **hybrid approach**:

### Phase 1: Working Solution (MVP)
**Download optimized image and guide user to replace manually**

1. Optimize the image (resize + compress) ✅ (This works)
2. Convert to downloadable format (Blob/Data URL)
3. Trigger browser download of optimized image
4. Show clear instructions to user:
   - "Image optimized! Download it and replace in Framer"
   - Provide download button
   - Show before/after comparison
   - Highlight the node in canvas

### Phase 2: Enhanced Solution (If API allows)
**Attempt direct replacement with fallback**

1. Try to use `framer.addImage()` to create asset
2. If that works, try alternative methods to set as backgroundImage:
   - Check if there's a way to get the ImageAsset from the created node
   - Try using the node's image property if it exists
   - Explore if we can access Framer's internal asset management
3. If direct replacement fails, fall back to Phase 1 (download)

### Phase 3: Research Alternative APIs
**Explore undocumented or newer APIs**

1. Check if there's an asset upload API we missed
2. Research if `framer.addImage()` returns an ImageAsset we can use
3. Check if there's a way to replace ImageAsset references directly
4. Look for permission/scope APIs that might enable `addImage`

## Implementation Plan

### Step 1: Fix Image Optimization (Ensure it works)
**File**: `src/services/imageOptimizer.ts`

- ✅ Already working - image optimization is functional
- Ensure error handling is robust
- Add validation for edge cases

### Step 2: Implement Download Fallback
**File**: `src/services/assetReplacer.ts` (new function)

```typescript
/**
 * Download optimized image for manual replacement
 * This is the fallback when direct API replacement isn't possible
 */
export async function downloadOptimizedImage(
  optimizedImage: Uint8Array,
  format: string,
  originalName: string
): Promise<void> {
  // Convert to blob
  const mimeType = format.startsWith('image/') ? format : `image/${format === 'jpeg' ? 'jpeg' : 'webp'}`
  const blob = new Blob([optimizedImage], { type: mimeType })
  
  // Create download link
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${originalName}_optimized.${format === 'image/webp' ? 'webp' : 'jpg'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

### Step 3: Update Replacement Logic
**File**: `src/services/assetReplacer.ts`

**New approach:**
1. Try direct replacement (current approach)
2. If it fails, use download fallback
3. Provide clear user feedback about what happened

### Step 4: Enhanced UI Feedback
**File**: `src/components/recommendations/RecommendationCard.tsx`

**Add:**
- Success state with download option
- Before/after comparison
- Step-by-step instructions
- "Select node" button to highlight where to replace

### Step 5: Research and Test API Alternatives

**Investigate:**
1. Does `framer.addImage()` return an ImageAsset or just a CanvasNode?
2. Can we access the ImageAsset from a created Image node?
3. Is there a way to upload assets to Framer's library?
4. Are there permission scopes we need to request?

**Test scenarios:**
- Small images (< 1MB)
- Large images (> 5MB)
- Different formats (JPEG, PNG, WebP)
- Different node types (Frame, Component, etc.)

## Alternative Approaches to Explore

### Approach A: Canvas Node → ImageAsset Extraction
If `framer.addImage()` creates an Image node, maybe we can:
1. Create the image node
2. Get the node's `image` or `backgroundImage` property
3. Extract the ImageAsset from it
4. Use that ImageAsset to replace the original

### Approach B: Asset Library API
Research if Framer has:
- An asset upload endpoint
- A way to create ImageAssets directly
- An API to replace existing assets

### Approach C: Clipboard Approach
1. Optimize image
2. Copy to clipboard as image
3. User pastes into Framer (Framer might auto-optimize)
4. Guide user to replace

### Approach D: External Service
1. Upload optimized image to temporary hosting
2. Get URL
3. User imports URL in Framer
4. Replace original with new URL

## Recommended Implementation Order

### MVP (Working Solution - Week 1)
1. ✅ Image optimization (already works)
2. ✅ Download optimized image
3. ✅ Clear user instructions
4. ✅ Node selection/highlighting
5. ✅ Before/after comparison

### Enhanced (If API allows - Week 2)
1. Research API alternatives
2. Test direct replacement methods
3. Implement if feasible
4. Fallback to download if not

### Polish (Week 3)
1. Better error messages
2. Progress indicators
3. Batch optimization
4. Undo capability

## Success Criteria

### MVP Success
- ✅ User can optimize image (resize + compress)
- ✅ Optimized image downloads successfully
- ✅ User understands how to replace it manually
- ✅ Node is highlighted/selected for easy replacement
- ✅ Clear before/after metrics shown

### Enhanced Success
- ✅ Direct replacement works via API
- ✅ No manual steps required
- ✅ Works for single and multiple usages
- ✅ Handles errors gracefully

## Testing Checklist

- [ ] Optimize small image (< 500KB)
- [ ] Optimize large image (> 5MB)
- [ ] Optimize PNG with transparency
- [ ] Optimize JPEG photo
- [ ] Optimize WebP image
- [ ] Test with different node types
- [ ] Test "replace single" workflow
- [ ] Test "replace all" workflow
- [ ] Test error handling (CORS, invalid URLs, etc.)
- [ ] Test download functionality
- [ ] Verify file size reduction
- [ ] Verify image quality is acceptable

## Files to Modify

### New Files
- `src/services/imageDownloader.ts` - Handle image download
- `src/components/recommendations/OptimizationResult.tsx` - Show optimization results

### Modified Files
- `src/services/assetReplacer.ts` - Add download fallback, improve error handling
- `src/components/recommendations/RecommendationCard.tsx` - Add download UI, better feedback
- `src/services/imageOptimizer.ts` - Ensure robust error handling

## Risk Assessment

### High Risk
- **API Limitations**: If Framer doesn't support direct replacement, we must use fallback
- **Permission Issues**: May need plugin permissions we don't have

### Medium Risk
- **Large Images**: Data URLs may be too large for some browsers
- **CORS Issues**: External images may not be optimizable

### Low Risk
- **Format Support**: Canvas API supports all needed formats
- **Browser Compatibility**: FileReader and Blob APIs are well-supported

## Next Steps

1. **Immediate**: Implement download fallback (guaranteed to work)
2. **Research**: Test if `framer.addImage()` returns usable ImageAsset
3. **Enhance**: If API allows, implement direct replacement
4. **Polish**: Improve UX and error handling

## Questions to Answer

1. Does `framer.addImage()` return an ImageAsset we can use?
2. Can we access ImageAsset from a created Image node?
3. Is there an asset upload API we're missing?
4. Do we need to request specific permissions?
5. What's the maximum Data URL size Framer accepts?

