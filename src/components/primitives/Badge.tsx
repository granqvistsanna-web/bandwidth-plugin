import { ReactNode } from 'react'
import { spacing, typography, borders, colors } from '../../styles/designTokens'

type BadgeVariant = 'default' | 'subtle' | 'outline' | 'image' | 'svg'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantStyles = {
    default: {
      backgroundColor: colors.gray[100],
      border: 'none',
      color: colors.gray[700],
    },
    subtle: {
      backgroundColor: colors.gray[50],
      border: `${borders.width.thin} solid ${colors.gray[200]}`,
      color: colors.gray[600],
    },
    outline: {
      backgroundColor: 'transparent',
      border: `${borders.width.thin} solid ${colors.gray[300]}`,
      color: colors.gray[600],
    },
    image: {
      backgroundColor: '#dcfce7',
      border: 'none',
      color: '#166534',
    },
    svg: {
      backgroundColor: '#f3e8ff',
      border: 'none',
      color: '#7c3aed',
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
