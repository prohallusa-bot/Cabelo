/**
 * API Service for Cabelo.ai
 * Handles all calls to Firebase Cloud Functions backend
 * Fixed version with proper error handling and user ID passing
 */

// Base URL for Firebase Functions
// In production, use relative /api paths (routed through Firebase Hosting)
// In development, use the full Firebase Functions URL
const FUNCTIONS_BASE_URL = import.meta.env.DEV
  ? 'https://us-central1-cosmeticos-ai.cloudfunctions.net'
  : '/api'

/**
 * Full Hair Analysis (4 images)
 */
export const analyzeHairFull = async (images, userId = null, isGuest = true, quizAnswers = null) => {
  try {
    console.log('analyzeHairFull API call - userId:', userId, 'isGuest:', isGuest, 'hasQuiz:', !!quizAnswers)

    const imageData = await Promise.all(images.map(prepareImageForUpload))

    const response = await fetch(`${FUNCTIONS_BASE_URL}/analyzeHairFull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: imageData,
        userId,
        isGuest,
        quizAnswers
      })
    })
    
    const data = await response.json()
    console.log('analyzeHairFull response:', response.status, data)
    
    if (!response.ok) {
      // Create a proper error object with all backend info
      const error = new Error(data.message || 'Analysis failed')
      error.code = data.error
      error.status = response.status
      error.isLimitReached = data.error === 'LIMIT_REACHED' || data.isLimitReached
      error.isGuest = data.isGuest
      error.data = data
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Full analysis error:', error)
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const networkError = new Error('Network error. Please check your connection.')
      networkError.code = 'NETWORK_ERROR'
      throw networkError
    }
    
    // Handle Firebase Storage CORS errors
    if (error.message && error.message.includes('CORS')) {
      const corsError = new Error('Upload blocked. Please try again or disable ad blockers.')
      corsError.code = 'CORS_ERROR'
      throw corsError
    }
    
    // Pass through errors with proper structure
    throw error
  }
}

/**
 * Quick Hair Scan (1 image)
 */
export const analyzeHairQuick = async (image, userId = null, isGuest = true, quizAnswers = null) => {
  try {
    console.log('analyzeHairQuick API call - userId:', userId, 'isGuest:', isGuest, 'hasQuiz:', !!quizAnswers)

    const imageData = await prepareImageForUpload(image)

    const response = await fetch(`${FUNCTIONS_BASE_URL}/analyzeHairQuick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageData,
        userId,
        isGuest,
        quizAnswers
      })
    })
    
    const data = await response.json()
    console.log('analyzeHairQuick response:', response.status, data)
    
    if (!response.ok) {
      const error = new Error(data.message || 'Analysis failed')
      error.code = data.error
      error.status = response.status
      error.isLimitReached = data.error === 'LIMIT_REACHED' || data.isLimitReached
      error.isGuest = data.isGuest
      error.data = data
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Quick analysis error:', error)
    
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const networkError = new Error('Network error. Please check your connection.')
      networkError.code = 'NETWORK_ERROR'
      throw networkError
    }
    
    throw error
  }
}

/**
 * AI Chat (supports text and images)
 */
export const sendChatMessage = async (message, conversationId = null, userId = null, isGuest = true, userProfile = null, images = []) => {
  try {
    console.log('sendChatMessage API call - userId:', userId, 'isGuest:', isGuest, 'images:', images.length)

    const response = await fetch(`${FUNCTIONS_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        images, // Images are already in { base64, mimeType } format from Chat.jsx
        conversationId,
        userId,
        isGuest,
        userProfile
      })
    })

    const data = await response.json()
    console.log('sendChatMessage response:', response.status, data)

    if (!response.ok) {
      const error = new Error(data.message || 'Chat failed')
      error.error = data.error
      error.code = data.error
      error.isLimitReached = data.error === 'LIMIT_REACHED' || data.isLimitReached
      error.isGuest = data.isGuest
      error.data = data
      throw error
    }

    return data
  } catch (error) {
    console.error('Chat error:', error)

    // Handle network errors
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const networkError = new Error('Network error. Please check your connection.')
      networkError.code = 'NETWORK_ERROR'
      throw networkError
    }

    throw error
  }
}

/**
 * AI Chat with Streaming (Server-Sent Events)
 * Returns response chunks in real-time for letter-by-letter display
 */
export const sendChatMessageStream = async (message, conversationId = null, userId = null, isGuest = true, userProfile = null, images = [], onChunk) => {
  try {
    console.log('sendChatMessageStream API call - userId:', userId, 'isGuest:', isGuest, 'images:', images.length)

    // Note: In prod, /api/chatStream is rewritten to chatStreamV2 function via firebase.json
    // In dev, we call the function directly by name
    const endpoint = import.meta.env.DEV ? '/chatStreamV2' : '/chatStream'
    const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        images,
        conversationId,
        userId,
        isGuest,
        userProfile
      })
    })

    if (!response.ok) {
      const error = new Error('Stream failed')
      error.code = 'STREAM_ERROR'
      throw error
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let streamConversationId = conversationId

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            // Handle error responses (both direct error and type: "error")
            if (data.error || data.type === 'error') {
              const errorMsg = data.message || data.error || 'Chat failed'
              const error = new Error(errorMsg)
              error.error = data.error || 'STREAM_ERROR'
              error.code = data.error || 'STREAM_ERROR'
              error.isLimitReached = data.error === 'LIMIT_REACHED'
              throw error
            }

            if (data.type === 'start') {
              streamConversationId = data.conversationId
            } else if (data.type === 'status') {
              // Status update (e.g., "Analyzing image...")
              // Can be used to show loading indicators
              console.log('Stream status:', data.message)
            } else if (data.type === 'chunk') {
              fullResponse += data.text
              if (onChunk) {
                onChunk(data.text, fullResponse)
              }
            } else if (data.type === 'done') {
              // Stream complete
            }
          } catch (parseError) {
            // Ignore JSON parse errors for incomplete chunks
            if (parseError.code) throw parseError
          }
        }
      }
    }

    return {
      success: true,
      response: fullResponse,
      conversationId: streamConversationId
    }
  } catch (error) {
    console.error('Chat stream error:', error)

    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      const networkError = new Error('Network error. Please check your connection.')
      networkError.code = 'NETWORK_ERROR'
      throw networkError
    }

    throw error
  }
}

/**
 * Get Shared Analysis
 */
export const getSharedAnalysis = async (shareId) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/getSharedAnalysis?id=${shareId}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }
    
    return data
  } catch (error) {
    console.error('Get shared analysis error:', error)
    throw error
  }
}

/**
 * Get User Profile
 */
export const getUserProfile = async (userId) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/getUserProfile?userId=${userId}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }
    
    return data
  } catch (error) {
    console.error('Get profile error:', error)
    throw error
  }
}

/**
 * Update User Profile
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/updateUserProfile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, updates })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }
    
    return data
  } catch (error) {
    console.error('Update profile error:', error)
    throw error
  }
}

/**
 * Get Analysis History
 */
export const getAnalysisHistory = async (userId, limit = 10) => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/getAnalysisHistory?userId=${userId}&limit=${limit}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }
    
    return data
  } catch (error) {
    console.error('Get analysis history error:', error)
    throw error
  }
}

/**
 * Get Chat History
 */
export const getChatHistory = async (userId, conversationId = null) => {
  try {
    let url = `${FUNCTIONS_BASE_URL}/getChatHistory?userId=${userId}`
    if (conversationId) {
      url += `&conversationId=${conversationId}`
    }
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }
    
    return data
  } catch (error) {
    console.error('Get chat history error:', error)
    throw error
  }
}

/**
 * Get App Configuration
 */
export const getConfig = async () => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/getConfig`)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Get config error:', error)
    return {
      config: {
        maxFileSize: 10,
        supportedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        limits: {
          guest: { hairAnalysis: 1, chat: 5 },
          registered: { hairAnalysis: 2, chat: 99 }
        }
      }
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Prepare image for upload (convert to base64 with metadata)
 */
const prepareImageForUpload = async (imageSource) => {
  // If it's already prepared (object with base64)
  if (imageSource && imageSource.base64) {
    return imageSource
  }
  
  // If it's a File object
  if (imageSource instanceof File) {
    const base64 = await fileToBase64(imageSource)
    return {
      base64: base64.split(',')[1], // Remove data URL prefix
      mimeType: imageSource.type,
      fileSize: imageSource.size
    }
  }
  
  // If it's a Blob
  if (imageSource instanceof Blob) {
    const base64 = await blobToBase64(imageSource)
    return {
      base64: base64.split(',')[1],
      mimeType: imageSource.type,
      fileSize: imageSource.size
    }
  }
  
  // If it's a data URL string
  if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
    const [header, data] = imageSource.split(',')
    const mimeMatch = header.match(/data:(.*);/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
    return {
      base64: data,
      mimeType,
      fileSize: Math.ceil(data.length * 0.75) // Approximate size
    }
  }
  
  // If it's a URL, fetch and convert
  if (typeof imageSource === 'string' && (imageSource.startsWith('http') || imageSource.startsWith('blob:'))) {
    const response = await fetch(imageSource)
    const blob = await response.blob()
    const base64 = await blobToBase64(blob)
    return {
      base64: base64.split(',')[1],
      mimeType: blob.type,
      fileSize: blob.size
    }
  }
  
  throw new Error('Invalid image source')
}

/**
 * Convert File to base64
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Convert Blob to base64
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Validate image before upload
 */
export const validateImage = (file, maxSizeMB = 10, supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']) => {
  const errors = []
  
  if (!supportedTypes.includes(file.type)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: 'Please upload a JPG, PNG, or WebP image.',
      action: 'Try a different image format'
    })
  }
  
  const maxBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxBytes) {
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `Image must be under ${maxSizeMB}MB.`,
      action: 'Compress or resize your image'
    })
  }
  
  return errors
}

/**
 * Get user-friendly error message from error code
 */
export const getErrorMessage = (error, t = null) => {
  const code = error.code || error.error || 'UNKNOWN'
  
  // If translation function provided, use it
  if (t) {
    const key = `analysis.errors.${code.toLowerCase()}`
    const translated = t(key)
    if (translated !== key) return translated
  }
  
  // Fallback to hardcoded messages
  const messages = {
    'LIMIT_REACHED': error.isGuest 
      ? 'Daily limit reached. Sign up for more analyses!'
      : 'Daily limit reached. Come back tomorrow!',
    'INVALID_REQUEST': 'Invalid request. Please check your photos.',
    'INVALID_IMAGE': 'Please upload a valid image (JPG, PNG, or WebP).',
    'CONFIG_ERROR': 'Server configuration error. Please try again later.',
    'PARSE_ERROR': 'Server error processing results. Please try again.',
    'NETWORK_ERROR': 'Network error. Please check your connection.',
    'CORS_ERROR': 'Upload blocked. Please try again or disable ad blockers.',
    'FILE_TOO_LARGE': 'Image is too large. Maximum size is 10MB.',
    'TIMEOUT': 'Request timed out. Please try again.',
    'UNKNOWN': 'Something went wrong. Please try again.'
  }
  
  return messages[code] || error.message || messages['UNKNOWN']
}

export default {
  analyzeHairFull,
  analyzeHairQuick,
  sendChatMessage,
  sendChatMessageStream,
  getSharedAnalysis,
  getUserProfile,
  updateUserProfile,
  getAnalysisHistory,
  getChatHistory,
  getConfig,
  validateImage,
  getErrorMessage
}
