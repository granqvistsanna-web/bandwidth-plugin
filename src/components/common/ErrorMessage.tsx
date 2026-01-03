interface ErrorMessageProps {
  error: Error
  onRetry: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <div className="text-4xl" style={{ color: '#ef4444' }}>⚠</div>
        <h3 className="font-semibold" style={{ color: 'var(--framer-color-text)' }}>Analysis Failed</h3>
        <p className="text-sm" style={{ color: 'var(--framer-color-text-secondary)' }}>{error.message}</p>
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: 'var(--framer-color-tint)',
            color: 'var(--framer-color-text-reversed)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
