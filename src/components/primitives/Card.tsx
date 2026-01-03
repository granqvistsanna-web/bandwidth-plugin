import { ReactNode, HTMLAttributes } from 'react'
import { spacing, borders, colors } from '../../styles/designTokens'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: keyof typeof spacing
  hover?: boolean
  onClick?: () => void
}

export function Card({
  children,
  padding = 'md',
  hover = false,
  onClick,
  style,
  ...props
}: CardProps) {
  const baseStyles = {
    backgroundColor: colors.white,
    border: `${borders.width.thin} solid ${colors.gray[200]}`,
    borderRadius: borders.radius.lg,
    padding: spacing[padding],
    transition: 'all 0.15s ease',
    cursor: onClick ? 'pointer' : 'default',
  }

  const shadowStyle = {
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
  }

  const hoverStyles = hover ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = colors.gray[300]
      e.currentTarget.style.backgroundColor = colors.gray[50]
      if (onClick) {
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)'
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = colors.gray[200]
      e.currentTarget.style.backgroundColor = colors.white
      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.04)'
    }
  } : {}

  return (
    <div
      style={{ ...baseStyles, ...shadowStyle, ...style }}
      onClick={onClick}
      {...hoverStyles}
      {...props}
    >
      {children}
    </div>
  )
}
