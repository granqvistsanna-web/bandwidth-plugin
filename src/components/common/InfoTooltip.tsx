import { useState } from 'react'
import { spacing, typography, borders } from '../../styles/designTokens'

interface InfoTooltipProps {
  text: string
}

export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '14px',
          height: '14px',
          cursor: 'help',
          color: 'var(--text-tertiary)',
          transition: 'color 0.15s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'var(--text-tertiary)'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="5" r="0.75" fill="currentColor"/>
        </svg>
      </div>
      {isVisible && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: spacing.xs,
            padding: `${spacing.sm} ${spacing.md}`,
            backgroundColor: 'var(--tooltip-bg)',
            color: 'var(--tooltip-text)',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.normal,
            lineHeight: typography.lineHeight.relaxed,
            borderRadius: borders.radius.md,
            whiteSpace: 'normal',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            width: '200px',
            textAlign: 'center'
          }}
        >
          {text}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid var(--tooltip-bg)'
            }}
          />
        </div>
      )}
    </div>
  )
}
