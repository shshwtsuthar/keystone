import sharp from 'sharp'

/**
 * Converts a GIF image to PNG (extracts middle frame) for PDF compatibility
 * @param imageUrl - URL of the image to convert
 * @returns Base64 data URL of the converted PNG image, or original URL if not a GIF
 */
export async function convertGifToPngForPdf(imageUrl: string): Promise<string> {
  try {
    // Check if URL is a GIF
    const isGif = imageUrl.toLowerCase().includes('.gif') || imageUrl.includes('image/gif')
    
    if (!isGif) {
      // Not a GIF, return original URL
      return imageUrl
    }

    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${imageUrl}`)
      return imageUrl // Fallback to original URL
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get metadata to find number of frames
    const image = sharp(buffer, { animated: true })
    const metadata = await image.metadata()
    const frameCount = metadata.pages || 1

    // Calculate middle frame index (0-based)
    // For even number of frames, we'll use the frame before the middle
    const middleFrameIndex = Math.floor((frameCount - 1) / 2)

    let pngBuffer: Buffer

    if (frameCount > 1) {
      // For animated GIFs, Sharp may stack frames vertically
      // Check if we have pageHeight (indicates stacked frames)
      const pageHeight = metadata.pageHeight
      const totalHeight = metadata.height || 0

      if (pageHeight && pageHeight < totalHeight) {
        // Frames are stacked vertically - extract the middle frame
        const frameTop = middleFrameIndex * pageHeight
        pngBuffer = await image
          .extract({
            left: 0,
            top: frameTop,
            width: metadata.width || 0,
            height: pageHeight,
          })
          .png()
          .toBuffer()
      } else {
        // Frames might not be stacked or pageHeight not available
        // Calculate frame height from total height and frame count
        const calculatedFrameHeight = Math.floor(totalHeight / frameCount)
        
        if (calculatedFrameHeight > 0 && totalHeight > 0) {
          // Extract middle frame using calculated dimensions
          const frameTop = middleFrameIndex * calculatedFrameHeight
          pngBuffer = await image
            .extract({
              left: 0,
              top: frameTop,
              width: metadata.width || 0,
              height: calculatedFrameHeight,
            })
            .png()
            .toBuffer()
        } else {
          // Fallback: just convert (will get first frame)
          // This shouldn't happen, but provides a fallback
          pngBuffer = await image.png().toBuffer()
        }
      }
    } else {
      // Single frame, just convert to PNG
      pngBuffer = await image.png().toBuffer()
    }

    // Convert to base64 data URL for PDF
    const base64 = pngBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.error('Error converting GIF to PNG:', error)
    // Fallback to original URL if conversion fails
    return imageUrl
  }
}

