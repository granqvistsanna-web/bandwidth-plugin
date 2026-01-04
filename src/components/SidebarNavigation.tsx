import { useState } from 'react'
import { spacing, typography, borders, colors, surfaces, themeBorders, overlays, hoverStates, framerColors } from '../styles/designTokens'
import { Button } from './primitives/Button'
import { 
  Squares2X2Icon, 
  PhotoIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  BugAntIcon,
  ArrowPathIcon
} from '@heroicons/react/24/solid'

type Tab = 'overview' | 'assets' | 'recommendations' | 'bandwidth' | 'settings' | 'debug'

interface SidebarNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  onRefresh?: () => void
  loading?: boolean
  lastScanned?: Date | null
}

export function SidebarNavigation({ activeTab, onTabChange, onRefresh, loading }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  
  // Show expanded sidebar when hovered (if collapsed) or when explicitly expanded
  const isExpanded = !isCollapsed || isHovered

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Squares2X2Icon style={{ width: '20px', height: '20px' }} />
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: <PhotoIcon style={{ width: '20px', height: '20px' }} />
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <SparklesIcon style={{ width: '20px', height: '20px' }} />
    },
    {
      id: 'bandwidth',
      label: 'Usage Estimate',
      icon: <ChartBarIcon style={{ width: '20px', height: '20px' }} />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Cog6ToothIcon style={{ width: '20px', height: '20px' }} />
    }
  ]

  // Only show debug tab in development
  if (import.meta.env.DEV) {
    tabs.push({
      id: 'debug',
      label: 'Debug',
      icon: <BugAntIcon style={{ width: '20px', height: '20px' }} />
    })
  }

  return (
    <>
      {/* Backdrop overlay only when explicitly expanded (not on hover) */}
      {!isCollapsed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 40,
            backgroundColor: overlays.backdrop,
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
          backgroundColor: surfaces.primary,
          borderRight: `${borders.width.thin} solid ${themeBorders.subtle}`,
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
                  gap: spacing.sm,
                  padding: `${spacing.sm} ${spacing.sm}`,
                  borderRadius: borders.radius.sm,
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: '2px',
                  ...(isActive
                    ? {
                        backgroundColor: colors.accent.primary, // Blue accent works in both modes
                        color: colors.white,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                      }
                    : {
                        color: framerColors.textSecondary,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.regular,
                        backgroundColor: 'transparent',
                      })
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = hoverStates.surface
                    e.currentTarget.style.color = framerColors.text
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
                    e.currentTarget.style.color = framerColors.textSecondary
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
                    color: isActive ? colors.white : framerColors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '20px',
                    height: '20px'
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
                      color: isActive ? colors.white : 'inherit',
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
                      backgroundColor: framerColors.text,
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
                        borderRight: `6px solid ${framerColors.text}`
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
            borderTop: `1px solid ${themeBorders.subtle}`,
            marginTop: 'auto'
          }}>
            <Button
              onClick={onRefresh}
              disabled={loading}
              variant="primary"
              size="sm"
              fullWidth
              icon={
                <ArrowPathIcon
                  style={{
                    width: '14px',
                    height: '14px',
                    animation: loading ? 'spin 1s linear infinite' : 'none',
                    flexShrink: 0
                  }}
                />
              }
            >
              {isExpanded && (loading ? 'Analyzing...' : 'Rescan project')}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}

