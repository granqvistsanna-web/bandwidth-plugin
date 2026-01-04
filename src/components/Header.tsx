import { spacing, typography, borders, colors } from '../styles/designTokens'
import { Button } from './primitives/Button'
import { formatTimestamp } from '../utils/formatTimestamp'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

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
        backgroundColor: backgrounds.page,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {/* Title and Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <h1
            style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
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
                  backgroundColor: loading ? 'var(--status-info-solid)' : 'var(--status-success-solid)',
                  opacity: loading ? 0.8 : 1,
                }}
              />
              <span
                style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  fontFamily: typography.fontFamily.sans,
                }}
              >
                {loading ? 'analyzing' : formatTimestamp(lastScanned)}
              </span>
            </div>
          )}
        </div>

        {/* Rescan Button - standardized */}
        <Button
          onClick={onRefresh}
          disabled={loading}
          variant="primary"
          size="sm"
          icon={
            <ArrowPathIcon 
              style={{ 
                width: '14px',
                height: '14px',
                animation: loading ? 'spin 1s linear infinite' : 'none',
                flexShrink: 0
              }}
            />
          }
          style={{ alignSelf: 'flex-start' }}
        >
          {loading ? 'analyzing...' : 'Rescan project'}
        </Button>
      </div>
    </div>
  )
}
