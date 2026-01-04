import { framerColors } from '../../styles/designTokens'

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
      height: '256px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        maxWidth: '384px',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '32px',
          color: 'var(--status-error-solid)' 
        }}>⚠</div>
        <h3 style={{ 
          fontWeight: 600,
          color: framerColors.text 
        }}>Analysis Failed</h3>
        <p style={{ 
          fontSize: '13px',
          color: framerColors.textSecondary 
        }}>{error.message}</p>
        <button
          onClick={onRetry}
          style={{
            marginTop: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            backgroundColor: 'var(--framer-color-tint)',
            color: framerColors.textReversed,
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
