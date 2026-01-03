import { useState } from 'react'

type Tab = 'overview' | 'assets' | 'recommendations' | 'debug'

interface SidebarNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function SidebarNavigation({ activeTab, onTabChange }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  
  // Show expanded sidebar when hovered (if collapsed) or when explicitly expanded
  const isExpanded = !isCollapsed || isHovered

  const tabs: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    {
      id: 'assets',
      label: 'Assets',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed left-0 top-0 bottom-0 flex flex-col transition-all duration-300 ease-out shadow-[4px_0_24px_rgba(0,0,0,0.08)] z-50 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        style={{
          background: `linear-gradient(to bottom, var(--framer-color-bg), var(--framer-color-bg-secondary))`,
          borderRight: `1px solid var(--framer-color-divider)`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header */}
        <div 
          className="px-4 py-4 border-b flex items-center justify-between min-h-[68px] backdrop-blur-sm"
          style={{
            borderColor: 'var(--framer-color-divider)',
            backgroundColor: 'var(--framer-color-bg)'
          }}
        >
          {isExpanded && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ring-2" style={{ 
                background: 'linear-gradient(to bottom right, var(--framer-color-tint), var(--framer-color-tint-dark))',
                ringColor: 'var(--framer-color-tint-dimmed)'
              }}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-[15px] leading-tight tracking-tight" style={{ color: 'var(--framer-color-text)' }}>Bandwidth</div>
                <div className="text-[11px] leading-tight mt-0.5 font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>Check</div>
              </div>
            </div>
          )}
          {!isExpanded && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md mx-auto flex-shrink-0 ring-2" style={{ 
              background: 'linear-gradient(to bottom right, var(--framer-color-tint), var(--framer-color-tint-dark))',
              ringColor: 'var(--framer-color-tint-dimmed)'
            }}>
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-3 overflow-y-auto px-2">
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
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative group text-left active:scale-[0.98]"
                style={isActive ? {
                  background: `linear-gradient(to right, var(--framer-color-tint-dimmed), var(--framer-color-bg-secondary))`,
                  color: 'var(--framer-color-tint)',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  border: '1px solid var(--framer-color-tint-dimmed)'
                } : {
                  color: 'var(--framer-color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                    e.currentTarget.style.color = 'var(--framer-color-text)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
                  }
                }}
                title={isCollapsed ? tab.label : undefined}
              >
                {/* Active indicator - refined left accent */}
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full shadow-sm"
                    style={{ background: 'linear-gradient(to bottom, var(--framer-color-tint), var(--framer-color-tint-dark))' }}
                  />
                )}
                
                <span 
                  className="flex-shrink-0 transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--framer-color-tint)' : 'var(--framer-color-text-tertiary)',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--framer-color-text-secondary)'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--framer-color-text-tertiary)'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                >
                  {tab.icon}
                </span>
                
                {isExpanded && (
                  <span className={`truncate text-left flex-1 leading-tight transition-all duration-200 ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`}>
                    {tab.label}
                  </span>
                )}

                {/* Tooltip when collapsed */}
                {!isExpanded && (
                  <div 
                    className="absolute left-full ml-3 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-2xl"
                    style={{
                      backgroundColor: 'var(--framer-color-text)',
                      color: 'var(--framer-color-text-reversed)'
                    }}
                  >
                    {tab.label}
                    <div 
                      className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent"
                      style={{ borderRightColor: 'var(--framer-color-text)' }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}

