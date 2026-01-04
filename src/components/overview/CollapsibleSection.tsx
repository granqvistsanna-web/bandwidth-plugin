import { useState, ReactNode } from 'react'
import { spacing, typography, borders, framerColors } from '../../styles/designTokens'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultCollapsed?: boolean
  icon?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div
      style={{
        borderRadius: borders.radius.md,
        overflow: 'hidden' as const,
        marginBottom: spacing.md
      }}
    >
      {/* Header - Clickable */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          width: '100%',
          padding: spacing.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
          borderBottom: isCollapsed ? 'none' : `1px solid var(--framer-color-divider)`,
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.15s ease',
          opacity: 1
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <h3
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
              margin: 0
            }}
          >
            {title}
          </h3>
        </div>

        <svg
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: framerColors.textSecondary,
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content - Expandable */}
      {!isCollapsed && (
        <div style={{ padding: `${spacing.sm} ${spacing.md} ${spacing.md} ${spacing.md}` }}>
          {children}
        </div>
      )}
    </div>
  )
}
