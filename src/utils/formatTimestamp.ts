/**
 * Format a timestamp as a relative time string
 * @param date - The date to format
 * @returns A human-readable relative time string (e.g., "just now", "5m ago", "2h ago")
 */
export function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
