import { useState } from 'react'
import { spacing, typography, borders } from '../../styles/designTokens'

interface InfoTooltipProps {
  text: string
  /** Tooltip alignment relative to icon. Use 'left' when near right edge to prevent clipping */
  position?: 'left' | 'center' | 'right'
}

export function InfoTooltip({ text, position = 'center' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Calculate positioning based on alignment
  const getTooltipStyle = () => {
    const base = {
      position: 'absolute' as const,
      bottom: '100%',
      marginBottom: spacing.xs,
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: 'var(--tooltip-bg)',
      color: 'var(--tooltip-text)',
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.relaxed,
      borderRadius: borders.radius.md,
      whiteSpace: 'normal' as const,
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
      width: '200px',
      textAlign: 'center' as const
    }

    switch (position) {
      case 'left':
        return { ...base, right: '0', left: 'auto' }
      case 'right':
        return { ...base, left: '0', right: 'auto' }
      case 'center':
      default:
        return { ...base, left: '50%', transform: 'translateX(-50%)' }
    }
  }

  // Calculate arrow position
  const getArrowStyle = () => {
    const base = {
      position: 'absolute' as const,
      top: '100%',
      width: 0,
      height: 0,
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: '6px solid var(--tooltip-bg)'
    }

    switch (position) {
      case 'left':
        return { ...base, right: '8px', left: 'auto' }
      case 'right':
        return { ...base, left: '8px', right: 'auto' }
      case 'center':
      default:
        return { ...base, left: '50%', transform: 'translateX(-50%)' }
    }
  }

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
        <div style={getTooltipStyle()}>
          {text}
          <div style={getArrowStyle()} />
        </div>
      )}
    </div>
  )
}
