import { spacing, typography, borders, colors } from '../styles/designTokens'
import { formatTimestamp } from '../utils/formatTimestamp'

interface HeaderProps {
  onRefresh: () => void
  loading: boolean
  lastScanned: Date | null
}

export function Header({ onRefresh, loading, lastScanned }: HeaderProps) {
  return (
    <div
      style={{
        padding: `${spacing.md} ${spacing.lg}`,
        borderBottom: `${borders.width.thin} solid var(--framer-color-divider)`,
        backgroundColor: 'var(--framer-color-bg)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {/* Title and Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <h1
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)',
              margin: 0,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Bandwidth Check
          </h1>
          
          {/* Status indicator - minimal dot only */}
          {lastScanned && (
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: loading ? '#3b82f6' : '#22c55e',
                  opacity: loading ? 0.8 : 1,
                }}
              />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  color: 'var(--framer-color-text-secondary)',
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {loading ? 'analyzing' : formatTimestamp(lastScanned)}
              </span>
            </div>
          )}
        </div>

        {/* Rescan Button - improved styling */}
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: spacing.xs,
            padding: `${spacing.sm} ${spacing.md}`,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: loading ? 'var(--framer-color-text-tertiary)' : colors.white,
            backgroundColor: loading ? colors.warmGray[50] : colors.accent.primary,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: borders.radius.sm,
            transition: 'all 0.15s ease',
            alignSelf: 'flex-start',
            width: 'auto',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#0088E6' // Darker blue on hover
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = colors.accent.primary
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
          title={loading ? 'Analyzing project...' : 'Rescan project for changes'}
        >
          {loading ? (
            <>
              <RefreshCw 
                size={14}
                style={{ 
                  animation: 'spin 1s linear infinite',
                  flexShrink: 0
                }}
              />
              <span>analyzing...</span>
            </>
          ) : (
            <>
              <RefreshCw size={14} style={{ flexShrink: 0 }} />
              <span>Rescan project</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
