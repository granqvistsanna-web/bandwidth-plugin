import { ButtonHTMLAttributes, ReactNode } from 'react'
import { spacing, typography, borders, colors } from '../../styles/designTokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    borderRadius: borders.radius.md,
    border: `${borders.width.thin} solid`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.4 : 1,
    padding: size === 'sm'
      ? `6px ${spacing.md}`
      : `${spacing.sm} ${spacing.lg}`,
    minHeight: size === 'sm' ? '32px' : '36px',
  }

  const variantStyles = {
    primary: {
      backgroundColor: colors.black,
      borderColor: colors.black,
      color: colors.white,
    },
    secondary: {
      backgroundColor: colors.white,
      borderColor: colors.gray[300],
      color: colors.black,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: colors.gray[600],
    }
  }

  const hoverStyles = {
    primary: {
      backgroundColor: colors.gray[800],
      borderColor: colors.gray[800],
    },
    secondary: {
      backgroundColor: colors.gray[50],
      borderColor: colors.gray[400],
    },
    ghost: {
      backgroundColor: colors.gray[100],
      color: colors.black,
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const styles = hoverStyles[variant]
    Object.assign(e.currentTarget.style, styles)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return
    const styles = variantStyles[variant]
    Object.assign(e.currentTarget.style, styles)
  }

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
