import { formatTimestamp } from '../../utils/formatTimestamp'
import { spacing, typography, framerColors } from '../../styles/designTokens'

interface StatusIndicatorProps {
  lastScanned?: Date | null
  loading?: boolean
  error?: string | null
}

function getStatusColor(lastScanned: Date | null, error?: string | null): string {
  if (error) return 'var(--status-error-solid)' // Red for errors
  if (!lastScanned) return 'var(--text-tertiary)' // Gray if no scan

  const now = new Date()
  const diffMs = now.getTime() - lastScanned.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)

  if (diffMins < 1) return 'var(--status-success-solid)' // Green: just now
  if (diffMins < 30) return 'var(--status-info-solid)' // Blue: < 30 mins
  if (diffHours < 3) return 'var(--status-warning-solid)' // Yellow: < 3 hours
  return 'var(--status-warning-solid)' // Orange: > 3 hours (use warning for both)
}

export function StatusIndicator({ lastScanned, loading, error }: StatusIndicatorProps) {
  const statusColor = getStatusColor(lastScanned ?? null, error)

  let statusText = ''
  if (error) {
    statusText = 'Scan failed'
  } else if (loading) {
    statusText = 'Analyzing...'
  } else if (lastScanned) {
    statusText = `Scanned ${formatTimestamp(lastScanned)}`
  }

  if (!statusText) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.xs
    }}>
      {/* Pulsing dot */}
      <div style={{
        position: 'relative',
        width: '8px',
        height: '8px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          animation: error || loading ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
        }} />
        <style>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.4;
            }
          }
        `}</style>
      </div>

      {/* Status text */}
      <div style={{
        fontSize: typography.fontSize.xs,
        color: error ? statusColor : framerColors.textSecondary,
        fontWeight: error ? typography.fontWeight.medium : typography.fontWeight.regular
      }}>
        {statusText}
      </div>
    </div>
  )
}
