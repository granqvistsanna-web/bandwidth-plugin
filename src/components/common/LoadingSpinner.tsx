import { framerColors } from '../../styles/designTokens'

export function LoadingSpinner() {
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
        gap: '12px'
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
          fontSize: '13px',
          color: framerColors.textSecondary 
        }}>Analyzing bandwidth...</p>
      </div>
    </div>
  )
}
