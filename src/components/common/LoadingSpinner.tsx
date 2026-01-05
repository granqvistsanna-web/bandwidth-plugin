import { framerColors, backgrounds, spacing, typography } from '../../styles/designTokens'

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = 'Analyzing bandwidth...' }: LoadingSpinnerProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '256px',
      backgroundColor: backgrounds.page,
      padding: spacing.lg
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: spacing.md
      }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '2px solid transparent',
            borderBottomColor: 'var(--framer-color-tint)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <p style={{
          fontSize: typography.fontSize.sm,
          color: framerColors.textSecondary,
          margin: 0,
          textAlign: 'center',
          transition: 'opacity 0.15s ease'
        }}>{message}</p>
      </div>
    </div>
  )
}
