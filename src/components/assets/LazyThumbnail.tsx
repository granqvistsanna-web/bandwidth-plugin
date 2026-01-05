import { useState, useRef, useEffect, memo } from 'react'
import { borders, surfaces, framerColors } from '../../styles/designTokens'

interface LazyThumbnailProps {
  src: string
  alt: string
  fallbackSrc?: string
  size?: number
}

/**
 * Lazy-loaded thumbnail that only loads when visible in viewport.
 * Shows a placeholder until the image is loaded, then fades in.
 */
export const LazyThumbnail = memo(function LazyThumbnail({
  src,
  alt,
  fallbackSrc,
  size = 48
}: LazyThumbnailProps) {
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use IntersectionObserver to detect when thumbnail enters viewport
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect() // Stop observing once visible
          }
        })
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0
      }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

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
      {/* Placeholder - always visible until image loads */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoaded ? 0 : 1,
          transition: 'opacity 0.2s ease'
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

      {/* Image - only rendered when in viewport */}
      {isInView && (
        <img
          src={hasError && fallbackSrc ? fallbackSrc : src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.2s ease'
          }}
        />
      )}
    </div>
  )
})
