/**
 * Image download service
 * Handles downloading optimized images for manual replacement
 */

/**
 * Download optimized image as a file
 */
export async function downloadOptimizedImage(
  optimizedImage: Uint8Array,
  format: string,
  originalName: string
): Promise<void> {
  try {
    // Determine file extension from format
    const mimeType = format.startsWith('image/') ? format : `image/${format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp'}`
    const extension = mimeType === 'image/webp' ? 'webp' : 
                     mimeType === 'image/jpeg' ? 'jpg' : 
                     mimeType === 'image/png' ? 'png' : 'jpg'
    
    // Create blob
    const blob = new Blob([optimizedImage], { type: mimeType })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizeFileName(originalName)}_optimized.${extension}`
    a.style.display = 'none'
    
    // Trigger download
    document.body.appendChild(a)
    a.click()
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error('Error downloading image:', error)
    throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Sanitize file name for download
 */
function sanitizeFileName(name: string): string {
  // Remove invalid characters and limit length
  return name
    .replace(/[^a-z0-9_-]/gi, '_')
    .substring(0, 50)
    .trim() || 'image'
}

/**
 * Get file size from Uint8Array
 */
export function getFileSize(bytes: Uint8Array): number {
  return bytes.length
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

