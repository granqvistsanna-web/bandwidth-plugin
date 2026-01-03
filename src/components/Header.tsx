interface HeaderProps {
  onRefresh: () => void
  loading: boolean
}

export function Header({ onRefresh, loading }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <h1 className="text-lg font-semibold text-gray-900">Bandwidth Check</h1>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Analyzing...' : 'Refresh'}
      </button>
    </div>
  )
}
