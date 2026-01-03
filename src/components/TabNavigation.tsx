type Tab = 'overview' | 'assets' | 'recommendations'

interface TabNavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'assets', label: 'Assets' },
    { id: 'recommendations', label: 'Recommendations' }
  ]

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <nav className="flex px-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2.5 text-sm font-medium transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-white'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
