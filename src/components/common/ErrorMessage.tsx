import { framerColors, spacing, typography, borders } from '../../styles/designTokens'
import { Button } from '../primitives/Button'

interface ErrorMessageProps {
  error: Error
  onRetry: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '256px',
      padding: spacing.lg
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.md,
        maxWidth: '384px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: typography.fontSize['3xl'],
          color: 'var(--status-error-solid)' 
        }}>⚠</div>
        <h3 style={{ 
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.lg,
          color: framerColors.text,
          margin: 0
        }}>Analysis Failed</h3>
        <p style={{ 
          fontSize: typography.fontSize.sm,
          color: framerColors.textSecondary,
          margin: 0
        }}>{error.message}</p>
        <Button
          onClick={onRetry}
          variant="primary"
          size="sm"
          style={{ marginTop: spacing.xs }}
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}
