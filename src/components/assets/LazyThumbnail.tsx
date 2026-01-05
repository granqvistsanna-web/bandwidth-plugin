import { useState, memo, useCallback, useEffect, useRef } from 'react'
import { borders, surfaces, framerColors } from '../../styles/designTokens'

interface LazyThumbnailProps {
  src: string
  alt: string
  fallbackSrc?: string
  size?: number
  /** When true, starts loading the image immediately (bypasses intersection observer) */
  forceLoad?: boolean
}

/**
 * Thumbnail that loads when visible in viewport using Intersection Observer.
 * Shows placeholder until image is visible, then loads and caches the image.
 */
export const LazyThumbnail = memo(function LazyThumbnail({
  src,
  alt,
  fallbackSrc,
  size = 48,
  forceLoad = false
}: LazyThumbnailProps) {
  const [shouldLoad, setShouldLoad] = useState(forceLoad)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use Intersection Observer to load images when they're visible
  useEffect(() => {
    if (forceLoad || shouldLoad) return // Already loading or forced

    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      {
        // Start loading when thumbnail is 50px away from viewport
        rootMargin: '50px',
        threshold: 0.01
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [forceLoad, shouldLoad])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    if (fallbackSrc && !hasError) {
      setHasError(true)
    }
  }, [fallbackSrc, hasError])

  return (
    <div
      ref={containerRef}
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
      {/* Placeholder - always visible until image fully loads */}
      {!isLoaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: shouldLoad ? 'pulse 1.5s ease-in-out infinite' : 'none'
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

      {/* Image - rendered when visible in viewport */}
      {shouldLoad && (
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
      )}
    </div>
  )
})
