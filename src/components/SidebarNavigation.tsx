import { useState } from 'react'
import { spacing, typography, borders, colors } from '../styles/designTokens'
import { formatTimestamp } from '../utils/formatTimestamp'
import { LayoutDashboard, Image, Sparkles, BarChart3, Settings, Bug, RefreshCw } from 'lucide-react'

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
      icon: <LayoutDashboard size={24} />
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: <Image size={24} />
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Sparkles size={24} />
    },
    {
      id: 'bandwidth',
      label: 'Usage Estimate',
      icon: <BarChart3 size={24} />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={24} />
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: <Bug size={24} />
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
                  <RefreshCw 
                    size={20}
                    style={{ 
                      animation: 'spin 1s linear infinite',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <RefreshCw size={20} style={{ flexShrink: 0 }} />
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

