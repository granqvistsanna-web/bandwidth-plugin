import { useState, ReactNode } from 'react'
import { spacing, typography, borders, colors, surfaces, framerColors } from '../../styles/designTokens'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultCollapsed?: boolean
  icon?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false,
  icon
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  return (
    <div
      style={{
        backgroundColor: surfaces.tertiary,
        borderRadius: borders.radius.lg,
        overflow: 'hidden' as const,
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
          backgroundColor: isCollapsed ? surfaces.tertiary : framerColors.bgSecondary,
          borderBottom: isCollapsed ? 'none' : `${borders.width.thin} solid var(--framer-color-divider)`,
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
          onMouseEnter={(e) => {
            if (isCollapsed) {
              e.currentTarget.style.backgroundColor = framerColors.bgSecondary
            }
          }}
        onMouseLeave={(e) => {
          if (isCollapsed) {
            e.currentTarget.style.backgroundColor = surfaces.tertiary
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <h3
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: framerColors.text,
            }}
          >
            {title}
          </h3>
        </div>

        <svg
          width="14"
          height="14"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            color: framerColors.textTertiary,
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content - Expandable */}
      {!isCollapsed && (
        <div style={{ padding: spacing.md }}>
          {children}
        </div>
      )}
    </div>
  )
}
