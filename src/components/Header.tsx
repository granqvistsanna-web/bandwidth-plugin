import { spacing, typography, borders, colors } from '../styles/designTokens'

interface HeaderProps {
  onRefresh: () => void
  loading: boolean
  lastScanned: Date | null
}

function formatTimestamp(date: Date): string {
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
            color: loading ? 'var(--framer-color-text-tertiary)' : colors.almostBlack,
            backgroundColor: loading ? colors.warmGray[50] : '#E4F222',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            borderRadius: borders.radius.sm,
            transition: 'all 0.15s ease',
            alignSelf: 'flex-start',
            width: 'auto',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#D9E01F'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#E4F222'
              e.currentTarget.style.transform = 'translateY(0)'
            }
          }}
          title={loading ? 'Analyzing project...' : 'Rescan project for changes'}
        >
          {loading ? (
            <>
              <svg 
                className="animate-spin" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ flexShrink: 0 }}
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>analyzing...</span>
            </>
          ) : (
            <>
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
              <span>Rescan project</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
