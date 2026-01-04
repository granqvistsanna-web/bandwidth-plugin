import { ReactNode } from 'react'
import { spacing, typography, borders, surfaces, themeBorders, framerColors } from '../../styles/designTokens'

type BadgeVariant = 'default' | 'subtle' | 'outline' | 'image' | 'svg' | 'high' | 'medium' | 'low'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantStyles = {
    default: {
      backgroundColor: surfaces.tertiary,
      border: 'none',
      color: framerColors.text,
    },
    subtle: {
      backgroundColor: surfaces.secondary,
      border: `${borders.width.thin} solid ${themeBorders.subtle}`,
      color: framerColors.textSecondary,
    },
    outline: {
      backgroundColor: 'transparent',
      border: `${borders.width.thin} solid ${themeBorders.default}`,
      color: framerColors.textSecondary,
    },
    image: {
      backgroundColor: 'var(--status-success-bg)',
      border: 'none',
      color: 'var(--status-success-text)',
    },
    svg: {
      backgroundColor: 'var(--status-purple-bg)',
      border: 'none',
      color: 'var(--status-purple-text)',
    },
    high: {
      backgroundColor: 'var(--status-error-bg)',
      border: 'none',
      color: 'var(--status-error-text)',
    },
    medium: {
      backgroundColor: 'var(--status-warning-bg)',
      border: 'none',
      color: 'var(--status-warning-text)',
    },
    low: {
      backgroundColor: 'var(--status-success-bg)',
      border: 'none',
      color: 'var(--status-success-text)',
    }
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        padding: `2px ${spacing.sm}`,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.tight,
        borderRadius: borders.radius.sm,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.02em',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  )
}
