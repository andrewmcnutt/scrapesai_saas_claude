import JSZip from 'jszip'

/**
 * Downloads all carousel images as a single ZIP file.
 * Fetches images in parallel, adds them to a ZIP archive,
 * then triggers a browser download.
 *
 * @param imageUrls - Array of image URLs to include in the ZIP
 * @param carouselName - Name used for the downloaded ZIP filename
 */
export async function downloadCarouselZip(
  imageUrls: string[],
  carouselName: string
): Promise<void> {
  const zip = new JSZip()

  // Fetch all images in parallel
  const results = await Promise.allSettled(
    imageUrls.map(async (url, index) => {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch image ${index + 1}: HTTP ${response.status}`)
      }
      const blob = await response.blob()
      return { blob, url, index }
    })
  )

  // Add successfully fetched images to ZIP
  let addedCount = 0
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { blob, url, index } = result.value
      const extension = getExtensionFromUrl(url)
      const filename = `slide-${index + 1}.${extension}`
      zip.file(filename, blob)
      addedCount++
    } else {
      console.warn(`Skipping image due to fetch error:`, result.reason)
    }
  }

  if (addedCount === 0) {
    throw new Error('No images could be fetched for ZIP download')
  }

  // Generate ZIP blob and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(zipBlob)

  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = `${sanitizeFilename(carouselName)}-carousel.zip`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // Clean up object URL to free memory
  URL.revokeObjectURL(objectUrl)
}

/**
 * Extracts the file extension from a URL.
 * Defaults to 'png' if no recognizable extension is found.
 */
function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const lastSegment = pathname.split('/').pop() ?? ''
    const parts = lastSegment.split('.')
    if (parts.length > 1) {
      const ext = parts.pop()?.toLowerCase()
      if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
        return ext
      }
    }
  } catch {
    // Ignore URL parsing errors
  }
  return 'png'
}

/**
 * Sanitizes a string for use as a filename by removing disallowed characters.
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50)
}
