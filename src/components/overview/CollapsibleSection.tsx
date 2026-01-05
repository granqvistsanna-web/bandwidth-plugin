import { useState, useRef, useEffect, ReactNode } from 'react'
import { spacing, typography, framerColors } from '../../styles/designTokens'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  defaultCollapsed?: boolean
}

export function CollapsibleSection({
  title,
  children,
  defaultCollapsed = false
}: CollapsibleSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')
  const contentRef = useRef<HTMLDivElement>(null)

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [children])

  return (
    <div>
      {/* Header - Clickable */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          width: '100%',
          padding: `${spacing.md} ${spacing.lg}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'transparent',
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
        <span
          style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.textSecondary
          }}
        >
          {title}
        </span>

        <svg
          width="10"
          height="10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            color: framerColors.textTertiary,
            transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content - Animated collapse/expand */}
      <div
        style={{
          overflow: 'hidden',
          transition: 'height 0.2s ease, opacity 0.2s ease',
          height: isCollapsed ? 0 : contentHeight,
          opacity: isCollapsed ? 0 : 1
        }}
      >
        <div ref={contentRef} style={{ padding: `0 ${spacing.lg} ${spacing.lg}` }}>
          {children}
        </div>
      </div>
    </div>
  )
}
