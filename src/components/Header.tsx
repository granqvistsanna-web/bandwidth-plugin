interface HeaderProps {
  onRefresh: () => void
  loading: boolean
}

export function Header({ onRefresh, loading }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
      <h1 className="text-base font-semibold text-gray-900">Bandwidth Check</h1>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={loading ? 'Analyzing...' : 'Refresh analysis'}
      >
        {loading ? (
          <span className="flex items-center gap-1">
            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Analyzing</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </span>
        )}
      </button>
    </div>
  )
}
