import { ReactNode, HTMLAttributes } from 'react'
import { spacing, borders, surfaces, themeBorders, themeElevation, hoverStates } from '../../styles/designTokens'

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
    backgroundColor: surfaces.secondary,
    border: `${borders.width.thin} solid ${themeBorders.subtle}`,
    borderRadius: borders.radius.lg,
    padding: spacing[padding],
    transition: 'all 0.15s ease',
    cursor: onClick ? 'pointer' : 'default',
  }

  const shadowStyle = {
    boxShadow: themeElevation.subtle,
  }

  const hoverStyles = hover ? {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = hoverStates.border
      e.currentTarget.style.backgroundColor = hoverStates.surface
      if (onClick) {
        e.currentTarget.style.boxShadow = themeElevation.medium
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.borderColor = themeBorders.subtle
      e.currentTarget.style.backgroundColor = surfaces.secondary
      e.currentTarget.style.boxShadow = themeElevation.subtle
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
