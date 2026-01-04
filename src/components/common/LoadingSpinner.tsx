import { framerColors, backgrounds, spacing, typography } from '../../styles/designTokens'

export function LoadingSpinner() {
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
          margin: 0
        }}>Analyzing bandwidth...</p>
      </div>
    </div>
  )
}
