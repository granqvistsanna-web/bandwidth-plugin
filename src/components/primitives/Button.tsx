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
  loading?: boolean
}

// Shared loading spinner component
function LoadingSpinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        style={{ opacity: 0.25 }}
      />
      <path
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        style={{ opacity: 0.75 }}
      />
    </svg>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading
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
    borderRadius: borders.radius.md,
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap' as const,
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? 0.5 : 1,
    padding: config.padding,
    minHeight: config.minHeight,
  }

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: isDisabled ? surfaces.tertiary : colors.accent.primary,
      color: isDisabled ? framerColors.textTertiary : colors.white,
    },
    secondary: {
      backgroundColor: isDisabled ? surfaces.tertiary : surfaces.secondary,
      border: `1px solid ${themeBorders.subtle}`,
      color: isDisabled ? framerColors.textTertiary : framerColors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: isDisabled ? framerColors.textTertiary : framerColors.textSecondary,
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
    if (isDisabled) return
    const styles = hoverStyles[variant]
    Object.assign(e.currentTarget.style, styles)
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return
    const styles = variantStyles[variant]
    Object.assign(e.currentTarget.style, styles)
  }

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      disabled={isDisabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      {...props}
    >
      {loading ? <LoadingSpinner size={size === 'sm' ? 12 : 14} /> : icon}
      {children}
    </button>
  )
}
