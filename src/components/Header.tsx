interface HeaderProps {
  onRefresh: () => void
  loading: boolean
  lastScanned: Date | null
}

function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Header({ onRefresh, loading, lastScanned }: HeaderProps) {
  return (
    <div 
      className="px-6 py-4 border-b backdrop-blur-sm"
      style={{ 
        borderColor: 'var(--framer-color-divider)',
        background: 'linear-gradient(to bottom, var(--framer-color-bg), var(--framer-color-bg-secondary))'
      }}
    >
      <div className="flex flex-col gap-3">
        {/* Title and Status */}
        <div className="flex items-center gap-3">
          <h1 
            className="text-lg font-bold leading-tight tracking-tight"
            style={{ color: 'var(--framer-color-text)' }}
          >
            Bandwidth Check
          </h1>
          {lastScanned && (
            <div className="flex items-center gap-1.5">
              <div 
                className={`w-1.5 h-1.5 rounded-full ${loading ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: loading ? '#facc15' : '#22c55e' }}
              />
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--framer-color-text-secondary)' }}
              >
                {loading ? 'Analyzing...' : `Scanned ${formatTimestamp(lastScanned)}`}
              </span>
            </div>
          )}
        </div>

        {/* Rescan Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 w-fit active:scale-[0.98] shadow-sm hover:shadow-md"
          style={loading ? {
            backgroundColor: 'var(--framer-color-bg-tertiary)',
            color: 'var(--framer-color-text-tertiary)',
            cursor: 'not-allowed'
          } : {
            backgroundColor: 'var(--framer-color-tint)',
            color: 'var(--framer-color-text-reversed)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dark)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
            }
          }}
          title={loading ? 'Analyzing project...' : 'Rescan project for changes'}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Rescan</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
