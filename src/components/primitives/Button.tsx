import { ButtonHTMLAttributes, ReactNode } from 'react'
import { spacing, typography, borders, colors, surfaces, themeBorders, framerColors } from '../../styles/designTokens'

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
  // Standardized button dimensions
  const sizeConfig = {
    sm: {
      padding: `6px ${spacing.md}`, // 6px 12px
      minHeight: '32px',
      fontSize: typography.fontSize.xs,
    },
    md: {
      padding: `${spacing.sm} ${spacing.lg}`, // 8px 16px
      minHeight: '36px',
      fontSize: typography.fontSize.sm,
    }
  }

  const config = sizeConfig[size]

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    fontFamily: typography.fontFamily.sans,
    fontSize: config.fontSize,
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.tight,
    borderRadius: borders.radius.md, // 12px - consistent across all buttons
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    padding: config.padding,
    minHeight: config.minHeight,
  }

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: disabled ? surfaces.tertiary : colors.accent.primary,
      color: disabled ? framerColors.textTertiary : colors.white,
    },
    secondary: {
      backgroundColor: disabled ? surfaces.tertiary : surfaces.secondary,
      border: `1px solid ${themeBorders.subtle}`,
      color: disabled ? framerColors.textTertiary : framerColors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? framerColors.textTertiary : framerColors.textSecondary,
    }
  }

  const hoverStyles: Record<ButtonVariant, Partial<React.CSSProperties>> = {
    primary: {
      backgroundColor: '#0088E6', // Darker blue
    },
    secondary: {
      backgroundColor: surfaces.tertiary,
      borderColor: themeBorders.default,
    },
    ghost: {
      backgroundColor: 'var(--framer-color-bg-secondary)',
      color: framerColors.text,
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
