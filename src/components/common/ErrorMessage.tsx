interface ErrorMessageProps {
  error: Error
  onRetry: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 max-w-sm text-center">
        <div className="text-red-500 text-4xl">⚠</div>
        <h3 className="font-semibold text-gray-900">Analysis Failed</h3>
        <p className="text-sm text-gray-600">{error.message}</p>
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
