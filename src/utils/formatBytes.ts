export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatCost(bytes: number, pageViews: number = 1000): string {
  // Cloudflare pricing estimate: ~$0.01 per GB
  const gb = bytes / (1024 * 1024 * 1024)
  const totalGB = gb * pageViews
  const cost = totalGB * 0.01

  if (cost < 0.01) return '$0.01'
  return `$${cost.toFixed(2)}`
}

export function getBreakpointWidth(breakpoint: 'mobile' | 'tablet' | 'desktop'): number {
  const widths = {
    mobile: 375,
    tablet: 768,
    desktop: 1440
  }
  return widths[breakpoint]
}

export function getPixelDensity(breakpoint: 'mobile' | 'tablet' | 'desktop'): number {
  // Mobile typically uses 2x density (retina), desktop 1.5x
  const densities = {
    mobile: 2,
    tablet: 2,
    desktop: 1.5
  }
  return densities[breakpoint]
}
