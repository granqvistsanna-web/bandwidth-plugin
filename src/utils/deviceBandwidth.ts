import type { BreakpointData } from '../types/analysis'

/**
 * Device distribution assumptions for realistic bandwidth estimates.
 * Based on typical web traffic patterns.
 */
export const DEVICE_DISTRIBUTION = {
  mobile: 0.55,   // 55% of traffic is mobile
  tablet: 0.15,   // 15% of traffic is tablet
  desktop: 0.30   // 30% of traffic is desktop
} as const

/**
 * Calculate device-weighted bandwidth estimate.
 * 
 * Framer serves responsive image variants - smaller images on mobile,
 * larger on desktop. This function calculates a realistic estimate
 * by weighting each breakpoint's data by typical device distribution.
 * 
 * @param breakpoints - Breakpoint data for mobile, tablet, and desktop
 * @returns Weighted average bandwidth estimate in bytes
 */
export function calculateDeviceWeightedBandwidth(breakpoints: {
  mobile: BreakpointData
  tablet: BreakpointData
  desktop: BreakpointData
}): number {
  const mobileWeight = breakpoints.mobile.totalBytes * DEVICE_DISTRIBUTION.mobile
  const tabletWeight = breakpoints.tablet.totalBytes * DEVICE_DISTRIBUTION.tablet
  const desktopWeight = breakpoints.desktop.totalBytes * DEVICE_DISTRIBUTION.desktop
  
  return mobileWeight + tabletWeight + desktopWeight
}

/**
 * Calculate device-weighted breakdown (images, fonts, etc.)
 */
export function calculateDeviceWeightedBreakdown(breakpoints: {
  mobile: BreakpointData
  tablet: BreakpointData
  desktop: BreakpointData
}) {
  return {
    images: 
      breakpoints.mobile.breakdown.images * DEVICE_DISTRIBUTION.mobile +
      breakpoints.tablet.breakdown.images * DEVICE_DISTRIBUTION.tablet +
      breakpoints.desktop.breakdown.images * DEVICE_DISTRIBUTION.desktop,
    fonts: 
      breakpoints.mobile.breakdown.fonts * DEVICE_DISTRIBUTION.mobile +
      breakpoints.tablet.breakdown.fonts * DEVICE_DISTRIBUTION.tablet +
      breakpoints.desktop.breakdown.fonts * DEVICE_DISTRIBUTION.desktop,
    htmlCss: 
      breakpoints.mobile.breakdown.htmlCss * DEVICE_DISTRIBUTION.mobile +
      breakpoints.tablet.breakdown.htmlCss * DEVICE_DISTRIBUTION.tablet +
      breakpoints.desktop.breakdown.htmlCss * DEVICE_DISTRIBUTION.desktop,
    svg: 
      breakpoints.mobile.breakdown.svg * DEVICE_DISTRIBUTION.mobile +
      breakpoints.tablet.breakdown.svg * DEVICE_DISTRIBUTION.tablet +
      breakpoints.desktop.breakdown.svg * DEVICE_DISTRIBUTION.desktop,
  }
}

/**
 * Get breakpoint-specific information for display
 */
export function getBreakpointInfo(breakpoint: 'mobile' | 'tablet' | 'desktop') {
  const info = {
    mobile: {
      label: 'Mobile',
      width: '375px',
      description: 'Smaller images served to mobile devices',
      distribution: `${(DEVICE_DISTRIBUTION.mobile * 100).toFixed(0)}% of traffic`
    },
    tablet: {
      label: 'Tablet',
      width: '768px',
      description: 'Medium images served to tablets',
      distribution: `${(DEVICE_DISTRIBUTION.tablet * 100).toFixed(0)}% of traffic`
    },
    desktop: {
      label: 'Desktop',
      width: '1440px',
      description: 'Larger images served to desktop',
      distribution: `${(DEVICE_DISTRIBUTION.desktop * 100).toFixed(0)}% of traffic`
    }
  }
  
  return info[breakpoint]
}



