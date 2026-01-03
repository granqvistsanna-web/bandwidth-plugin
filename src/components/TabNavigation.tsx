import { useState } from 'react'

type Tab = 'overview' | 'assets' | 'recommendations' | 'debug'

interface TabNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null)
  
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assets', label: 'Assets', icon: '🖼️' },
    { id: 'recommendations', label: 'Recommendations', icon: '💡' },
    { id: 'debug', label: 'Debug', icon: '🔍' }
  ]

  return (
    <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <nav className="flex items-center justify-between px-2 py-1">
        {/* Icon-only tabs for compact design */}
        <div className="flex items-center gap-1 flex-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            const isHovered = hoveredTab === tab.id
            return (
              <div key={tab.id} className="relative flex-1">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onTabChange(tab.id)
                  }}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className={`
                    w-full py-2.5 px-2 text-lg transition-all 
                    rounded-md relative
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
                    ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                  style={{ 
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                  aria-label={tab.label}
                  aria-selected={isActive}
                  role="tab"
                  title={tab.label}
                >
                  <div className="flex items-center justify-center">
                    <span>{tab.icon}</span>
                  </div>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
                
                {/* Tooltip on hover */}
                {isHovered && !isActive && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                    {tab.label}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Active tab label on the right */}
        <div className="ml-2 px-2 py-1 text-xs font-medium text-gray-600 min-w-[80px] text-right">
          {tabs.find(t => t.id === activeTab)?.label}
        </div>
      </nav>
    </div>
  )
}
