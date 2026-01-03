export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div 
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: 'var(--framer-color-tint)' }}
        ></div>
        <p className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>Analyzing bandwidth...</p>
      </div>
    </div>
  )
}
