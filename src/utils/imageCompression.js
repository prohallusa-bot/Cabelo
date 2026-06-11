/**
 * Image Compression Utility using Compressor.js
 * Compresses images before sending to the API to reduce upload time and bandwidth
 */

import Compressor from 'compressorjs'

// Default compression settings
const DEFAULT_OPTIONS = {
  quality: 0.8,           // 80% quality - good balance between size and quality
  maxWidth: 1920,         // Max width in pixels
  maxHeight: 1920,        // Max height in pixels
  convertSize: 1000000,   // Convert to JPEG if larger than 1MB
  convertTypes: ['image/png', 'image/webp', 'image/heic', 'image/heif'],
  mimeType: 'image/jpeg', // Output format
}

/**
 * Compress an image file
 * @param {File|Blob} file - The image file to compress
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

    new Compressor(file, {
      quality: mergedOptions.quality,
      maxWidth: mergedOptions.maxWidth,
      maxHeight: mergedOptions.maxHeight,
      convertSize: mergedOptions.convertSize,
      convertTypes: mergedOptions.convertTypes,
      mimeType: mergedOptions.mimeType,
      success(result) {
        // Log compression results
        const originalSize = file.size / 1024
        const compressedSize = result.size / 1024
        const savings = ((1 - result.size / file.size) * 100).toFixed(1)

        console.log(`Image compressed: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${savings}% smaller)`)

        resolve(result)
      },
      error(err) {
        console.error('Image compression failed:', err)
        // Return original file if compression fails
        resolve(file)
      }
    })
  })
}

/**
 * Compress an image from a data URL
 * @param {string} dataUrl - The image data URL (base64)
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<string>} - Compressed image as data URL
 */
export const compressDataUrl = async (dataUrl, options = {}) => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Compress the blob
    const compressedBlob = await compressImage(blob, options)

    // Convert back to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(compressedBlob)
    })
  } catch (err) {
    console.error('Error compressing data URL:', err)
    // Return original if compression fails
    return dataUrl
  }
}

/**
 * Compress multiple images (data URLs)
 * @param {Array<string>} dataUrls - Array of image data URLs
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<Array<string>>} - Array of compressed image data URLs
 */
export const compressMultipleImages = async (dataUrls, options = {}) => {
  const compressed = await Promise.all(
    dataUrls.map(dataUrl => compressDataUrl(dataUrl, options))
  )
  return compressed
}

/**
 * Compress an image for chat (smaller size for quick uploads)
 * @param {File|Blob} file - The image file
 * @returns {Promise<File>} - Compressed image
 */
export const compressForChat = (file) => {
  return compressImage(file, {
    quality: 0.7,         // Slightly lower quality for chat
    maxWidth: 1280,       // Smaller max dimensions
    maxHeight: 1280,
    convertSize: 500000,  // Convert if > 500KB
  })
}

/**
 * Compress an image for analysis (higher quality)
 * @param {File|Blob} file - The image file
 * @returns {Promise<File>} - Compressed image
 */
export const compressForAnalysis = (file) => {
  return compressImage(file, {
    quality: 0.85,        // Higher quality for better analysis
    maxWidth: 2048,       // Larger dimensions for detail
    maxHeight: 2048,
    convertSize: 2000000, // Convert if > 2MB
  })
}

/**
 * Compress a data URL for analysis
 * @param {string} dataUrl - The image data URL
 * @returns {Promise<string>} - Compressed image data URL
 */
export const compressDataUrlForAnalysis = (dataUrl) => {
  return compressDataUrl(dataUrl, {
    quality: 0.85,
    maxWidth: 2048,
    maxHeight: 2048,
    convertSize: 2000000,
  })
}

/**
 * Compress a data URL for chat
 * @param {string} dataUrl - The image data URL
 * @returns {Promise<string>} - Compressed image data URL
 */
export const compressDataUrlForChat = (dataUrl) => {
  return compressDataUrl(dataUrl, {
    quality: 0.7,
    maxWidth: 1280,
    maxHeight: 1280,
    convertSize: 500000,
  })
}

export default {
  compressImage,
  compressDataUrl,
  compressMultipleImages,
  compressForChat,
  compressForAnalysis,
  compressDataUrlForAnalysis,
  compressDataUrlForChat
}
