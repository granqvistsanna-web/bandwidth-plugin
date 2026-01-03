import { useState, ReactNode } from 'react'
import { spacing, typography, borders, colors } from '../../styles/designTokens'

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
        backgroundColor: '#FAF9F8',
        border: `1px solid var(--framer-color-divider)`,
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
          backgroundColor: isCollapsed ? '#FAF9F8' : '#F5F4F3',
          borderBottom: isCollapsed ? 'none' : `1px solid var(--framer-color-divider)`,
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
          onMouseEnter={(e) => {
            if (isCollapsed) {
              e.currentTarget.style.backgroundColor = '#F5F4F3'
            }
          }}
        onMouseLeave={(e) => {
          if (isCollapsed) {
            e.currentTarget.style.backgroundColor = '#FAF9F8'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <h3
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)',
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
          style={{ color: 'var(--framer-color-text-tertiary)' }}
          strokeWidth="2.5"
          style={{
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
