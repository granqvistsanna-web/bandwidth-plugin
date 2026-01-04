# Architecture Improvements Summary

## Overview
This document summarizes the systematic architectural improvements made to the Framer plugin codebase to improve maintainability, correctness, and clarity.

## Critical Fixes

### 1. Breakpoint-Specific Asset Calculation (FIXED)
**Problem**: All breakpoints (desktop, tablet, mobile) were using the same merged asset list, causing incorrect bandwidth estimates.

**Solution**: 
- Created `assetCollector.ts that collects assets separately for each breakpoint
- Modified `analyzer.ts` to calculate bandwidth using breakpoint-specific assets
- Each breakpoint now correctly uses its own canvas assets + CMS + manual estimates

**Impact**: Bandwidth estimates are now accurate for each device type, reflecting Framer's responsive image behavior.

### 2. Data Model Separation (FIXED)
**Problem**: Canvas assets, CMS assets, and manual estimates were mixed together without clear separation.

**Solution**:
- Created `AssetCollectionResult` interface with clear separation:
  - `canvas`: Breakpoint-specific canvas assets
  - `cms`: Auto-detected CMS assets (same across breakpoints)
  - `manual`: Manual CMS estimates (same across breakpoints)
  - `allUnique`: Deduplicated view for overall totals

**Impact**: Clear data model prevents confusion about asset sources and ensures correct calculations.

## Architectural Improvements

### 3. Service Separation
**Created**: `src/services/assetCollector.ts`
- Centralized asset collection logic
- Separates concerns: collection vs analysis vs calculation
- Reusable functions for page-level and project-level collection

**Benefits**:
- Single responsibility principle
- Easier to test
- Clearer code organization

### 4. Type Safety Improvements
- Created `ManualCMSEstimate` interface in `assetCollector.ts`
- Re-exported from `useAnalysis.ts` for backward compatibility
- Reduced reliance on inline type definitions

**Remaining Work**: Still some `any` types in CMS and traversal code (acceptable for Framer API compatibility).

## Code Quality Improvements

### 5. Removed Duplication
- Consolidated CMS asset collection into single function
- Unified breakpoint calculation logic
- Removed redundant asset merging code

### 6. Clearer Function Names
- `collectAllAssets()` - Main entry point
- `collectCMSAssetsWithDeduplication()` - CMS-specific logic
- `collectPageAssetsForBreakpoint()` - Page-level collection

## Remaining Limitations & Assumptions

### 1. CMS Asset Detection
- **Assumption**: CMS assets are the same across all breakpoints (reasonable - CMS serves same images)
- **Limitation**: Cannot detect CMS assets from unpublished sites (requires published site analysis)

### 2. Page Detection
- **Limitation**: Some deeply nested nodes may still show "Unknown" page
- **Mitigation**: Multiple fallback strategies implemented, but edge cases remain

### 3. Breakpoint Calculations
- **Assumption**: Uses pixel density multipliers (1x mobile, 1.5x tablet, 2x desktop)
- **Note**: Actual Framer behavior may vary, but estimates are realistic

### 4. Type Safety
- **Limitation**: Some `any` types remain in CMS and traversal code due to Framer API limitations
- **Acceptable**: These are isolated to API interaction layers

## Testing Recommendations

1. **Breakpoint Accuracy**: Verify that desktop, tablet, and mobile show different bandwidth estimates
2. **CMS Deduplication**: Ensure manual estimates don't duplicate auto-detected CMS assets
3. **Page Analysis**: Test that page-level analysis uses correct breakpoint-specific assets
4. **Performance**: Verify analysis still completes in <10 seconds for typical projects

## Next Steps (Future Improvements)

1. **Further Service Separation**: Split `analyzer.ts` into smaller modules:
   - `pageAnalyzer.ts` - Page-level analysis
   - `recommendationEngine.ts` - Recommendation generation
   - `bandwidthCalculator.ts` - Bandwidth calculations

2. **Error Handling Standardization**: Create consistent error handling patterns across all services

3. **Type Safety**: Gradually replace `any` types with proper interfaces where Framer API allows

4. **Caching Strategy**: Implement smarter caching for page children and asset lookups

## Files Changed

- **Created**: `src/services/assetCollector.ts` - New centralized asset collection service
- **Modified**: `src/services/analyzer.ts` - Refactored to use new asset collector
- **Modified**: `src/hooks/useAnalysis.ts` - Updated to use new type exports

## Breaking Changes

None - all changes are backward compatible. The public API remains the same.

