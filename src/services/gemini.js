/**
 * Gemini Service - Uses Backend API for all AI operations
 * API keys are kept secure on the server
 * Fixed version with proper error handling and user ID passing
 */

import {
  analyzeHairFull as apiAnalyzeFull,
  analyzeHairQuick as apiAnalyzeQuick,
  sendChatMessage as apiSendChat,
  sendChatMessageStream as apiSendChatStream
} from './api.js'

/**
 * Send a chat message to the AI Hair Coach
 * @param {string} userMessage - The user's message
 * @param {Array} chatHistory - Previous messages for context (not used, handled by backend)
 * @param {Object} userProfile - User's hair profile for personalization
 * @param {Array} images - Array of image objects with base64 and mimeType (optional)
 * @param {string} userId - User ID (null for guest)
 * @param {boolean} isGuest - Whether user is a guest
 * @param {string} conversationId - Conversation ID for continuity
 * @returns {Promise<string>} - AI response
 */
export const sendChatMessage = async (userMessage, chatHistory = [], userProfile = null, images = [], userId = null, isGuest = true, conversationId = null) => {
  try {
    const result = await apiSendChat(userMessage, conversationId, userId, isGuest, userProfile, images)
    return result.response
  } catch (error) {
    console.error('Error sending chat message:', error)
    // Pass through the full error object with all properties
    throw error
  }
}

/**
 * Send a streaming chat message to the AI Hair Coach
 * Returns chunks in real-time for letter-by-letter display
 * @param {string} userMessage - The user's message
 * @param {Object} options - Options object
 * @param {Function} onChunk - Callback called with each text chunk (chunk, fullText)
 * @returns {Promise<Object>} - { response, conversationId }
 */
export const sendChatMessageStream = async (userMessage, options = {}, onChunk) => {
  const {
    chatHistory = [],
    userProfile = null,
    images = [],
    userId = null,
    isGuest = true,
    conversationId = null
  } = options

  try {
    const result = await apiSendChatStream(
      userMessage,
      conversationId,
      userId,
      isGuest,
      userProfile,
      images,
      onChunk
    )
    return result
  } catch (error) {
    console.error('Error sending streaming chat message:', error)
    throw error
  }
}

/**
 * Analyze hair photo(s) using backend AI
 * @param {Array<string>} photos - Array of photo data URLs or File objects
 * @param {string} userId - User ID (null for guest)
 * @param {boolean} isGuest - Whether user is a guest
 * @param {string} analysisType - 'quick' or 'full' - defaults to auto-detect based on photo count
 * @param {Object} quizAnswers - Optional quiz answers for enhanced analysis
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeHairPhotos = async (photos, userId = null, isGuest = true, analysisType = 'auto', quizAnswers = null) => {
  try {
    console.log('analyzeHairPhotos called with userId:', userId, 'isGuest:', isGuest, 'analysisType:', analysisType, 'hasQuiz:', !!quizAnswers)

    let result

    // Determine which API to call
    const shouldUseQuick = analysisType === 'quick' || (analysisType === 'auto' && photos.length === 1)

    if (shouldUseQuick && analysisType !== 'full') {
      // Quick scan - single image from QuickScan page
      console.log('Using quick analysis')
      result = await apiAnalyzeQuick(photos[0], userId, isGuest, quizAnswers)
    } else {
      // Full analysis - from FullAnalysis page or multiple images
      console.log('Using full analysis with', photos.length, 'photo(s)')
      result = await apiAnalyzeFull(photos, userId, isGuest, quizAnswers)
    }

    console.log('Analysis result:', result)
    
    if (!result.success) {
      // Create error with all backend properties
      const error = new Error(result.message || 'Analysis failed')
      error.code = result.error
      error.isLimitReached = result.error === 'LIMIT_REACHED'
      error.isGuest = result.isGuest
      throw error
    }
    
    // Transform backend response to match expected format
    const data = result.data
    return {
      score: data.condition_score * 10, // Convert 1-10 to 0-100
      status: getStatusFromScore(data.condition_score * 10),
      hairProfile: {
        type: getHairTypeCategory(data.hair_type),
        subtype: data.hair_type,
        porosity: capitalizeFirst(data.porosity),
        texture: capitalizeFirst(data.texture),
        density: capitalizeFirst(data.density)
      },
      metrics: {
        hydration: data.moisture_level * 10,
        shine: data.condition_score * 10,
        strength: data.protein_balance * 10
      },
      issues: data.concerns || [],
      strengths: getStrengthsFromData(data),
      tips: generateTipsFromData(data),
      shareId: data.shareId,
      shareUrl: result.shareUrl,
      summary: data.summary,
      primaryNeed: data.primary_need,
      chemicalHistory: data.chemical_history
    }
  } catch (error) {
    console.error('Error analyzing photos:', error)
    // Pass through the full error - don't swallow it!
    throw error
  }
}

/**
 * Get personalized tips based on hair profile
 * @param {Object} hairProfile - User's hair profile from analysis
 * @returns {Promise<Array>} - Array of personalized tips
 */
export const getPersonalizedTips = async (hairProfile) => {
  // Generate tips locally based on profile (no API call needed)
  const tips = []
  
  // Add tips based on hair type
  if (hairProfile.type === 'Curly' || hairProfile.type === 'Coily') {
    tips.push({
      id: 'curl-define',
      title: 'Define Your Curls',
      description: 'Use a curl-defining cream or gel on wet hair, scrunching upward to encourage curl formation.',
      category: 'Frizz Control',
      ingredients: ['Shea Butter', 'Flaxseed Gel']
    })
  }
  
  // Add tips based on porosity
  if (hairProfile.porosity === 'High') {
    tips.push({
      id: 'seal-moisture',
      title: 'Seal in Moisture',
      description: 'After conditioning, use a heavier oil or butter to seal moisture into your high-porosity hair.',
      category: 'Hydration',
      ingredients: ['Castor Oil', 'Shea Butter']
    })
  } else if (hairProfile.porosity === 'Low') {
    tips.push({
      id: 'heat-help',
      title: 'Use Heat to Help Products Penetrate',
      description: 'Low porosity hair benefits from heat during conditioning. Use a warm towel or hooded dryer.',
      category: 'Hydration',
      ingredients: ['Lightweight Oils', 'Glycerin']
    })
  }
  
  // Add general tips
  tips.push({
    id: 'hydration-1',
    title: 'Deep Hydration',
    description: 'Use a hydrating mask with hyaluronic acid and aloe vera weekly to maintain moisture balance.',
    category: 'Hydration',
    ingredients: ['Hyaluronic Acid', 'Aloe Vera']
  })
  
  tips.push({
    id: 'strength-1',
    title: 'Strengthen with Protein',
    description: 'Incorporate keratin treatments to repair damaged cuticles and reduce breakage.',
    category: 'Strength',
    ingredients: ['Keratin', 'Amino Acids']
  })
  
  tips.push({
    id: 'protect-1',
    title: 'Heat Protection',
    description: 'Always use a heat protectant before styling with hot tools to prevent damage.',
    category: 'Strength',
    ingredients: ['Silicones', 'Argan Oil']
  })
  
  return tips.slice(0, 5) // Return max 5 tips
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStatusFromScore(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Attention'
}

function getHairTypeCategory(subtype) {
  if (!subtype) return 'Unknown'
  const first = subtype.charAt(0)
  if (first === '1') return 'Straight'
  if (first === '2') return 'Wavy'
  if (first === '3') return 'Curly'
  if (first === '4') return 'Coily'
  return 'Unknown'
}

function capitalizeFirst(str) {
  if (!str) return 'Medium'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function getStrengthsFromData(data) {
  const strengths = []
  
  if (data.condition_score >= 7) {
    strengths.push('Overall healthy appearance')
  }
  if (data.moisture_level >= 7) {
    strengths.push('Good hydration levels')
  }
  if (data.protein_balance >= 7) {
    strengths.push('Strong protein structure')
  }
  if (!data.concerns || data.concerns.length === 0) {
    strengths.push('No major visible concerns')
  }
  if (data.hair_type_confidence === 'high') {
    strengths.push('Well-defined hair pattern')
  }
  
  // Ensure at least one strength
  if (strengths.length === 0) {
    strengths.push('Hair shows potential for improvement')
  }
  
  return strengths.slice(0, 3)
}

function generateTipsFromData(data) {
  const tips = []
  
  // Tips based on primary need
  if (data.primary_need === 'HYDRATION') {
    tips.push({
      title: 'Boost Hydration',
      description: 'Your hair needs moisture! Use a deep conditioning mask twice weekly and consider a leave-in conditioner.',
      category: 'Hydration'
    })
  } else if (data.primary_need === 'RECONSTRUCTION') {
    tips.push({
      title: 'Repair Damage',
      description: 'Focus on protein treatments to rebuild damaged hair structure. Look for products with keratin or amino acids.',
      category: 'Strength'
    })
  } else if (data.primary_need === 'SMOOTHING') {
    tips.push({
      title: 'Tame Frizz',
      description: 'Use anti-humidity products and consider a smoothing treatment to control frizz and add shine.',
      category: 'Frizz Control'
    })
  }
  
  // Tips based on concerns
  if (data.concerns && data.concerns.includes('Dryness/dehydration')) {
    tips.push({
      title: 'Lock in Moisture',
      description: 'Apply oil to damp hair to seal in moisture. Avoid sulfates that strip natural oils.',
      category: 'Hydration'
    })
  }
  
  if (data.concerns && data.concerns.includes('Frizz/lack of definition')) {
    tips.push({
      title: 'Define & Smooth',
      description: 'Use a microfiber towel instead of regular towels. Apply products to soaking wet hair.',
      category: 'Frizz Control'
    })
  }
  
  // General tip
  tips.push({
    title: 'Protect from Heat',
    description: 'Always use heat protection before styling. Air dry when possible to minimize damage.',
    category: 'Strength'
  })
  
  return tips.slice(0, 4)
}

// Helper function to convert blob to base64 (kept for compatibility)
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default {
  sendChatMessage,
  sendChatMessageStream,
  analyzeHairPhotos,
  getPersonalizedTips
}
