import { useState } from 'react'
import { spacing, typography, borders, colors } from '../styles/designTokens'
import { formatTimestamp } from '../utils/formatTimestamp'

type Tab = 'overview' | 'assets' | 'recommendations' | 'bandwidth' | 'settings' | 'debug'

interface SidebarNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onRefresh?: () => void
  loading?: boolean
  lastScanned?: Date | null
}

export function SidebarNavigation({ activeTab, onTabChange, onRefresh, loading, lastScanned }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  
  // Show expanded sidebar when hovered (if collapsed) or when explicitly expanded
  const isExpanded = !isCollapsed || isHovered

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    },
    {
      id: 'bandwidth',
      label: 'Usage Estimate',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  ]

  return (
    <>
      {/* Backdrop overlay only when explicitly expanded (not on hover) */}
      {!isCollapsed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            transition: 'opacity 0.3s ease',
          }}
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          width: isExpanded ? '256px' : '64px',
          transition: 'width 0.2s ease-out',
          willChange: 'width',
          zIndex: 50,
          backgroundColor: colors.white,
          borderRight: `${borders.width.thin} solid ${colors.gray[200]}`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >


        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          padding: `${spacing.md} 0`,
          overflowY: 'auto',
          paddingLeft: spacing.sm,
          paddingRight: spacing.sm
        }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  // Auto-collapse on mobile/narrow screens after selection
                  if (window.innerWidth < 640) {
                    setIsCollapsed(true)
                    setIsHovered(false)
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: borders.radius.md,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  ...(isActive
                    ? {
                        backgroundColor: colors.white,
                        color: colors.almostBlack,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                      }
                    : {
                        color: colors.gray[600],
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.regular,
                        backgroundColor: 'transparent',
                      })
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.white
                    e.currentTarget.style.color = colors.almostBlack
                  }
                  // Show tooltip when collapsed
                  if (!isExpanded) {
                    const tooltip = document.getElementById(`tooltip-${tab.id}`)
                    if (tooltip) {
                      tooltip.style.opacity = '1'
                    }
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = colors.gray[600]
                  }
                  // Hide tooltip when collapsed
                  if (!isExpanded) {
                    const tooltip = document.getElementById(`tooltip-${tab.id}`)
                    if (tooltip) {
                      tooltip.style.opacity = '0'
                    }
                  }
                }}
                title={isCollapsed ? tab.label : undefined}
              >
                <span
                  style={{
                    flexShrink: 0,
                    color: isActive ? colors.almostBlack : colors.gray[500],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px'
                  }}
                >
                  {tab.icon}
                </span>
                
                {isExpanded && (
                  <span 
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      flex: 1,
                      lineHeight: typography.lineHeight.tight,
                      fontWeight: isActive ? typography.fontWeight.medium : typography.fontWeight.regular,
                      color: isActive ? colors.almostBlack : 'inherit',
                    }}
                  >
                    {tab.label}
                  </span>
                )}

                {/* Tooltip when collapsed - shown on button hover */}
                {!isExpanded && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      marginLeft: spacing.md,
                      padding: `${spacing.sm} ${spacing.md}`,
                      borderRadius: borders.radius.lg,
                      whiteSpace: 'nowrap',
                      opacity: 0,
                      pointerEvents: 'none',
                      transition: 'opacity 0.2s ease',
                      zIndex: 50,
                      backgroundColor: colors.almostBlack,
                      color: colors.white,
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                    id={`tooltip-${tab.id}`}
                  >
                    {tab.label}
                    <div
                      style={{
                        position: 'absolute',
                        right: '100%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: `6px solid ${colors.almostBlack}`
                      }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </nav>

        {/* Rescan Button at Bottom */}
        {onRefresh && (
          <div style={{
            padding: spacing.md,
            borderTop: `1px solid ${colors.gray[200]}`,
            marginTop: 'auto'
          }}>
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isExpanded ? spacing.xs : 0,
                padding: spacing.sm,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                  color: loading ? 'var(--framer-color-text-tertiary)' : colors.white,
                  backgroundColor: loading ? colors.warmGray[50] : colors.accent.primary,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                borderRadius: borders.radius.sm,
                transition: 'all 0.2s ease',
                width: '100%',
                justifyContent: isExpanded ? 'center' : 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#0088E6' // Darker blue on hover
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                    e.currentTarget.style.backgroundColor = colors.accent.primary
                }
              }}
              title={loading ? 'Analyzing project...' : 'Rescan project for changes'}
            >
              {/* Icon - always visible */}
              <span style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                transition: 'opacity 0.2s ease'
              }}>
                {loading ? (
                  <svg 
                    style={{ 
                      width: '20px',
                      height: '20px',
                      animation: 'spin 1s linear infinite'
                    }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                )}
              </span>
              
              {/* Text - fades in/out smoothly */}
              {isExpanded && (
                <span style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  opacity: isExpanded ? 1 : 0,
                  maxWidth: isExpanded ? '200px' : '0px',
                  transition: 'opacity 0.2s ease, max-width 0.2s ease',
                  marginLeft: spacing.xs
                }}>
                  {loading ? 'analyzing...' : 'Rescan project'}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

