import { useState, memo } from 'react'
import { borders, surfaces, framerColors } from '../../styles/designTokens'

interface LazyThumbnailProps {
  src: string
  alt: string
  fallbackSrc?: string
  size?: number
}

/**
 * Thumbnail with loading placeholder and fade-in effect.
 * Works with virtualized lists - no IntersectionObserver needed
 * since the row is only rendered when visible.
 */
export const LazyThumbnail = memo(function LazyThumbnail({
  src,
  alt,
  fallbackSrc,
  size = 48
}: LazyThumbnailProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    if (fallbackSrc && !hasError) {
      setHasError(true)
    }
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: borders.radius.md,
        border: `1px solid var(--framer-color-divider)`,
        backgroundColor: surfaces.tertiary,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Placeholder - visible until image loads */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke={framerColors.textTertiary}
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Image */}
      <img
        src={hasError && fallbackSrc ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.15s ease'
        }}
      />
    </div>
  )
})
