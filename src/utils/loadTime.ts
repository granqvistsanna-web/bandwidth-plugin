/**
 * Calculate estimated load times based on network speeds
 */

// Network speeds in bytes per second
const NETWORK_SPEEDS = {
  '3g': 1.5 * 1024 * 1024 / 8, // 1.5 Mbps = 196,608 bytes/sec
  '4g': 10 * 1024 * 1024 / 8,  // 10 Mbps = 1,310,720 bytes/sec
} as const

export function calculateLoadTime(bytes: number, network: '3g' | '4g'): number {
  if (!bytes || !isFinite(bytes) || bytes <= 0) {
    return 0
  }
  const speed = NETWORK_SPEEDS[network]
  return bytes / speed
}

export function formatLoadTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds <= 0) {
    return '<1ms'
  }
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`
  }
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`
}

