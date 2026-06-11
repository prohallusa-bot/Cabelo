import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { analyzeHairPhotos } from '../services/gemini'
import { getAnalyses } from '../services/firebase'
import { compressMultipleImages } from '../utils/imageCompression'
import LoginPrompt from '../components/auth/LoginPrompt'
import HairQuiz from '../components/quiz/HairQuiz'
import { Camera, Upload, X, ArrowRight, Check, AlertCircle, AlertTriangle, SkipForward, User, Sparkles, RefreshCw, SwitchCamera } from 'lucide-react'

// Custom back view icon (person from behind)
const BackViewIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="6" r="4" />
    <path d="M6 21v-2a6 6 0 0 1 12 0v2" />
    <path d="M12 10v4" />
  </svg>
)

// Step icons
const STEP_ICONS = {
  front: User,
  back: BackViewIcon,
}

// Only 2 steps now: Front and Back
const STEPS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
]

// Image validation constants (aligned with Gemini 2.0 Flash limits)
const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7 MB
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']
const MAX_IMAGES = 2
const MIN_IMAGES = 1

const FullAnalysis = () => {
  const navigate = useNavigate()
  const { user, hasCompletedQuiz, getQuizAnswers, saveQuizAnswers } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [currentStep, setCurrentStep] = useState(0)
  const [photos, setPhotos] = useState({})
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('user') // 'user' = front, 'environment' = back
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [compressionStats, setCompressionStats] = useState(null)
  const [error, setError] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [pendingAnalysis, setPendingAnalysis] = useState(false)
  const [validationError, setValidationError] = useState(null)
  const [hairWarning, setHairWarning] = useState(null)
  const [pendingResultId, setPendingResultId] = useState(null)

  const stepKeys = ['frontView', 'backView']
  const stepDescKeys = ['frontViewDesc', 'backViewDesc']

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Quiz is now shown only from the main Hair Analysis button on home page
  // Not auto-shown here to avoid duplicate popups

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col">
        <header className="px-6 py-4 bg-white/80 glass border-b border-rose-border-light">
          <h1 className="font-bold text-text-dark text-center">{t('analysis.fullAnalysis')}</h1>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-dark mb-2">
              {t('auth.signInForFull')}
            </h2>
            <p className="text-text-muted mb-6">
              Full analysis requires 1-4 photos and saves your results for tracking progress.
            </p>
            <button
              onClick={() => setShowLoginPrompt(true)}
              className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button"
            >
              Sign In to Continue
            </button>
            <button
              onClick={() => navigate('/quick-scan')}
              className="w-full mt-3 py-3 text-text-muted font-medium"
            >
              Try Quick Scan instead
            </button>
          </div>
        </div>

        <LoginPrompt
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          type="full"
        />
      </div>
    )
  }

  /**
   * Validate image file before processing
   */
  const validateImage = (file) => {
    console.log('Validating image:', file.name, 'Size:', file.size, 'Type:', file.type)

    // Check file type
    if (!SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase())) {
      const supportedFormats = SUPPORTED_MIME_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ')
      return {
        valid: false,
        error: `Invalid file type. Please upload ${supportedFormats} only.`
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2)
      return {
        valid: false,
        error: `File too large (${sizeMB}MB). Maximum size is 7MB.`
      }
    }

    return { valid: true }
  }

  /**
   * Validate base64 data URL
   */
  const validateDataUrl = (dataUrl) => {
    // Check if it's a valid data URL
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return {
        valid: false,
        error: 'Invalid image data.'
      }
    }

    // Extract mime type
    const mimeMatch = dataUrl.match(/^data:(image\/[a-z]+);/)
    if (!mimeMatch) {
      return {
        valid: false,
        error: 'Could not detect image type.'
      }
    }

    const mimeType = mimeMatch[1].toLowerCase()
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      const supportedFormats = SUPPORTED_MIME_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ')
      return {
        valid: false,
        error: `Invalid image type. Please use ${supportedFormats} only.`
      }
    }

    // Estimate size from base64 (rough estimate)
    const base64Length = dataUrl.split(',')[1]?.length || 0
    const estimatedSize = (base64Length * 3) / 4

    if (estimatedSize > MAX_FILE_SIZE) {
      const sizeMB = (estimatedSize / 1024 / 1024).toFixed(2)
      return {
        valid: false,
        error: `Image too large (${sizeMB}MB). Maximum size is 7MB.`
      }
    }

    return { valid: true }
  }

  const startCamera = async (mode = facingMode) => {
    setValidationError(null)
    try {
      console.log('Requesting camera access with facingMode:', mode)

      // First show the camera UI so video element is in DOM
      setShowCamera(true)
      setCameraReady(false)

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Wait a tick for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100))

      // Request camera permission with proper constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      console.log('Camera access granted, stream:', stream)
      streamRef.current = stream

      // Wait for video element to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to load metadata and start playing
        await new Promise((resolve, reject) => {
          const video = videoRef.current
          if (!video) return reject(new Error('No video element'))

          video.onloadedmetadata = () => {
            console.log('Video metadata loaded')
            video.play()
              .then(() => {
                setCameraReady(true)
                resolve()
              })
              .catch(reject)
          }
          video.onerror = reject

          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Video load timeout')), 5000)
        })
      }

      console.log('Camera ready')
    } catch (err) {
      console.error('Error accessing camera:', err)
      setShowCamera(false)
      setCameraReady(false)

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setValidationError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setValidationError('No camera found. Please connect a camera or use upload instead.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setValidationError('Camera is already in use by another application.')
      } else {
        setValidationError('Could not access camera. Please try upload instead.')
      }
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera...')
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        console.log('Track stopped:', track.kind)
      })
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
    setCameraReady(false)
  }

  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    await startCamera(newMode)
  }

  const capturePhoto = () => {
    setValidationError(null)

    if (!videoRef.current) {
      setValidationError('Camera not ready. Please try again.')
      return
    }

    try {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight

      if (canvas.width === 0 || canvas.height === 0) {
        setValidationError('Camera not ready. Please wait a moment and try again.')
        return
      }

      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)

      // Convert to JPEG with 0.9 quality to reduce size
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

      // Validate the captured image
      const validation = validateDataUrl(dataUrl)
      if (!validation.valid) {
        setValidationError(validation.error)
        return
      }

      console.log('Photo captured successfully')
      setPhotos(prev => ({ ...prev, [STEPS[currentStep].key]: dataUrl }))
      stopCamera()
    } catch (err) {
      console.error('Error capturing photo:', err)
      setValidationError('Failed to capture photo. Please try again.')
    }
  }

  const handleFileUpload = (e) => {
    setValidationError(null)

    const file = e.target.files?.[0]
    if (!file) return

    console.log('File selected:', file.name, file.type, file.size)

    // Validate file before processing
    const validation = validateImage(file)
    if (!validation.valid) {
      setValidationError(validation.error)
      e.target.value = '' // Reset input
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result

      // Double-check the data URL
      const dataValidation = validateDataUrl(result)
      if (!dataValidation.valid) {
        setValidationError(dataValidation.error)
        return
      }

      console.log('Image loaded successfully')
      setPhotos(prev => ({ ...prev, [STEPS[currentStep].key]: result }))
    }
    reader.onerror = () => {
      setValidationError('Failed to read image file. Please try another image.')
    }
    reader.readAsDataURL(file)
  }

  const handleNext = () => {
    setValidationError(null)

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleAnalyze()
    }
  }

  const handleSkip = () => {
    setValidationError(null)

    // Check if we have at least one photo
    const photoCount = Object.keys(photos).length

    if (photoCount === 0) {
      setValidationError('Please upload at least 1 photo before skipping.')
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Last step - analyze with what we have
      handleAnalyze()
    }
  }

  const handleRetake = () => {
    setValidationError(null)
    const key = STEPS[currentStep].key
    setPhotos(prev => {
      const newPhotos = { ...prev }
      delete newPhotos[key]
      return newPhotos
    })
  }

  /**
   * Get user-friendly error message based on error type
   */
  const getErrorMessage = (err) => {
    console.log('getErrorMessage received:', err)
    console.log('Error type:', typeof err)
    console.log('Error JSON:', JSON.stringify(err, null, 2))

    // Handle plain object errors (from API response)
    const errorCode = err?.error || err?.code || ''
    const errorMessage = err?.message || err?.toString?.() || ''
    const isLimitReached = err?.isLimitReached || errorCode === 'LIMIT_REACHED'
    const isGuestUser = err?.isGuest === true

    console.log('Parsed error - code:', errorCode, 'message:', errorMessage, 'isLimitReached:', isLimitReached)

    // LIMIT_REACHED - most common error, check first!
    if (isLimitReached || errorCode === 'LIMIT_REACHED') {
      if (isGuestUser || !user) {
        return 'Daily limit reached. Sign up for more analyses!'
      }
      return 'Daily limit reached. Come back tomorrow!'
    }

    // Also check nested data for API responses
    const detected = err?.data?.detected || ''

    // Check specific error codes
    switch (errorCode) {
      case 'INVALID_IMAGE':
        return detected
          ? `${errorMessage || 'This doesn\'t appear to be a hair photo.'} (Detected: ${detected})`
          : errorMessage || 'Please upload a real photo of your hair for analysis.'
      case 'NETWORK_ERROR':
        return 'Network error. Please check your connection and try again.'
      case 'CORS_ERROR':
        return 'Upload blocked by browser. Please disable ad blockers and try again.'
      case 'PARSE_ERROR':
        return 'Server error processing results. Our AI had trouble understanding the response. Please try again.'
      case 'INVALID_REQUEST':
        return errorMessage || 'Invalid image format. Please upload JPG, PNG, WebP, or HEIC images only.'
      case 'CONFIG_ERROR':
        return 'Server configuration error. Our API key may be missing. Please contact support.'
      case 'TIMEOUT':
        return 'Request timed out after waiting too long. Please try again with fewer or smaller images.'
      case 'SERVER_ERROR':
        return errorMessage || 'Server error occurred. Please try again in a moment.'
    }

    // If backend sent a clear, useful message, use it directly
    if (errorMessage && errorMessage.length > 10) {
      const lowerMsg = errorMessage.toLowerCase()

      // Skip generic messages and use backend message for specific ones
      if (!lowerMsg.includes('failed') && !lowerMsg.includes('something went wrong')) {
        return errorMessage
      }

      // Pattern-based fallbacks for generic messages
      if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.'
      }
      if (lowerMsg.includes('cors') || lowerMsg.includes('blocked')) {
        return 'Upload blocked by browser. Please disable ad blockers or try a different browser.'
      }
      if (lowerMsg.includes('timeout')) {
        return 'Request timed out. Please try again with smaller images.'
      }
      if (lowerMsg.includes('quota') || lowerMsg.includes('limit')) {
        return 'Daily limit reached. Please try again tomorrow.'
      }
      if (lowerMsg.includes('too large') || lowerMsg.includes('size')) {
        return 'Image file too large. Please use images under 7MB.'
      }
    }

    // Generic fallback
    return 'Analysis failed. Please try again with different photos or contact support if this persists.'
  }

  const handleAnalyze = async () => {
    // Check if quiz is needed (not completed yet)
    if (!hasCompletedQuiz()) {
      setPendingAnalysis(true)
      setShowQuiz(true)
      return
    }

    // Proceed with analysis
    runAnalysis(getQuizAnswers())
  }

  const runAnalysis = async (quizAnswers = null) => {
    setAnalyzing(true)
    setError(null)
    setValidationError(null)
    setAnalysisProgress(0)
    setAnalysisStatus(t('analysis.preparingPhotos') || 'Preparing photos...')
    setCompressionStats(null)

    try {
      const photoArray = STEPS.map(step => photos[step.key]).filter(Boolean)

      console.log('=== Starting Analysis ===')
      console.log('Total photos:', photoArray.length)
      console.log('Quiz answers:', quizAnswers)

      // Validate we have at least 1 photo
      if (photoArray.length < MIN_IMAGES) {
        throw new Error(`Please upload at least ${MIN_IMAGES} photo before analyzing.`)
      }

      // Validate we don't exceed max
      if (photoArray.length > MAX_IMAGES) {
        throw new Error(`Maximum ${MAX_IMAGES} photos allowed.`)
      }

      // Step 1: Compress images (20%)
      setAnalysisProgress(10)
      setAnalysisStatus(t('analysis.compressingPhotos') || 'Compressing photos...')

      // Calculate original size
      let originalSize = 0
      photoArray.forEach(photo => {
        if (photo) {
          originalSize += Math.ceil(photo.length * 0.75 / 1024) // Approximate KB from base64
        }
      })

      const compressedPhotos = await compressMultipleImages(photoArray, {
        quality: 0.85,
        maxWidth: 2048,
        maxHeight: 2048
      })

      // Calculate compressed size
      let compressedSize = 0
      compressedPhotos.forEach(photo => {
        if (photo) {
          compressedSize += Math.ceil(photo.length * 0.75 / 1024)
        }
      })

      const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0
      setCompressionStats({
        original: originalSize,
        compressed: compressedSize,
        savings
      })

      // Step 2: Uploading (40%)
      setAnalysisProgress(30)
      setAnalysisStatus(t('analysis.uploadingPhotos') || 'Uploading photos...')

      // Pass userId and isGuest to the analysis function
      const userId = user?.uid || null
      const isGuest = !user

      console.log('Calling API with:', {
        photoCount: compressedPhotos.length,
        userId,
        isGuest,
        analysisType: 'full',
        hasQuizAnswers: !!quizAnswers
      })

      // Step 3: Analyzing (60-90%)
      setAnalysisProgress(50)
      setAnalysisStatus(t('analysis.analyzingHair') || 'Analyzing your hair...')

      // Simulate progress while waiting for API
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 5, 85))
      }, 1000)

      const analysis = await analyzeHairPhotos(compressedPhotos, userId, isGuest, 'full', quizAnswers)

      clearInterval(progressInterval)
      setAnalysisProgress(95)
      setAnalysisStatus(t('analysis.finalizing') || 'Finalizing results...')

      console.log('Analysis complete:', analysis)

      // Backend already saves to Firestore and returns shareId
      const analysisId = analysis.shareId || analysis.data?.shareId

      if (!analysisId) {
        console.error('No shareId in response:', analysis)
        throw {
          error: 'PARSE_ERROR',
          message: 'Analysis completed but no ID returned. Please try again.'
        }
      }

      // Check hair consistency against previous analysis
      if (user && analysis.hairProfile) {
        try {
          const pastAnalyses = await getAnalyses(user.uid, 5)
          const previousAnalysis = pastAnalyses.find(a =>
            a.id !== analysisId && a.shareId !== analysisId
          )
          if (previousAnalysis?.hairProfile) {
            const currentType = analysis.hairProfile.type
            const previousType = previousAnalysis.hairProfile.type
            const currentTexture = analysis.hairProfile.texture
            const previousTexture = previousAnalysis.hairProfile.texture

            const typeMismatch = currentType && previousType &&
              currentType !== 'Unknown' && previousType !== 'Unknown' &&
              currentType !== previousType
            const textureMismatch = currentTexture && previousTexture &&
              currentTexture !== previousTexture

            if (typeMismatch || textureMismatch) {
              setHairWarning({
                currentType, previousType, typeMismatch,
                currentTexture, previousTexture, textureMismatch
              })
              setPendingResultId(analysisId)
              setAnalyzing(false)
              return // Don't navigate yet - show warning first
            }
          }
        } catch (err) {
          console.error('Error checking hair consistency:', err)
        }
      }

      console.log('Navigating to results:', analysisId)
      navigate(`/results/${analysisId}`)

    } catch (err) {
      console.error('=== Analysis Error ===')
      console.error('Error object:', err)
      console.error('Error message:', err?.message)
      console.error('Error stack:', err?.stack)

      // Get user-friendly error message
      const errorMessage = getErrorMessage(err)
      console.log('Displaying error to user:', errorMessage)
      setError(errorMessage)
      setAnalyzing(false)

      // If limit reached for guest, show login prompt
      if (err?.isLimitReached && err?.isGuest) {
        setTimeout(() => setShowLoginPrompt(true), 1000)
      }
    }
  }

  const handleQuizComplete = async (answers) => {
    try {
      await saveQuizAnswers(answers)
      setShowQuiz(false)
      if (pendingAnalysis) {
        setPendingAnalysis(false)
        runAnalysis(answers)
      }
    } catch (err) {
      console.error('Error saving quiz:', err)
      setShowQuiz(false)
      if (pendingAnalysis) {
        setPendingAnalysis(false)
        runAnalysis(null)
      }
    }
  }

  const handleQuizSkip = () => {
    setShowQuiz(false)
    if (pendingAnalysis) {
      setPendingAnalysis(false)
      runAnalysis(null)
    }
  }

  const currentPhoto = photos[STEPS[currentStep].key]
  const photoCount = Object.keys(photos).length
  const canAnalyze = photoCount >= MIN_IMAGES

  return (
    <div className="min-h-screen bg-background-light flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 bg-white/80 glass border-b border-rose-border-light">
        <h1 className="font-bold text-text-dark text-center">{t('analysis.fullAnalysis')}</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-5 py-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {/* Analyzing State */}
          {analyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              {/* Animated Icon */}
              <div className="relative mb-6">
                <motion.div
                  className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                {/* Rotating ring */}
                <motion.div
                  className="absolute -inset-3 border-2 border-primary/20 rounded-[32px]"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <h2 className="text-xl font-bold text-text-dark mb-2">
                {t('analysis.analyzing')}
              </h2>
              <p className="text-text-muted mb-6">
                {analysisStatus}
              </p>

              {/* Progress Bar */}
              <div className="w-full max-w-sm mb-4">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm font-semibold text-primary mt-2">{analysisProgress}%</p>
              </div>

              {/* Compression Stats */}
              {compressionStats && compressionStats.savings > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 max-w-sm w-full"
                >
                  <p className="text-green-700 text-sm font-medium flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    {t('analysis.photosOptimized')}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    {t('analysis.saved')} {compressionStats.savings}% · {' '}
                    {compressionStats.original >= 1024
                      ? `${(compressionStats.original / 1024).toFixed(1)} MB`
                      : `${compressionStats.original} KB`}
                    {' → '}
                    {compressionStats.compressed >= 1024
                      ? `${(compressionStats.compressed / 1024).toFixed(1)} MB`
                      : `${compressionStats.compressed} KB`}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Camera View */}
          {showCamera && !analyzing && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col flex-1"
            >
              {/* Camera Preview */}
              <div className="relative flex-1 bg-black rounded-2xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Loading overlay */}
                {!cameraReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
                    <RefreshCw className="w-10 h-10 text-white animate-spin mb-3" />
                    <p className="text-white text-sm">Starting camera...</p>
                  </div>
                )}

                {/* Guide overlay */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/40 rounded-full" />
                  </div>
                )}

                {/* Step indicator */}
                <div className="absolute top-4 left-0 right-0 flex justify-center">
                  <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full">
                    <p className="text-white text-sm font-medium">
                      {t(`analysis.${stepKeys[currentStep]}`)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Camera Controls */}
              <div className="flex justify-center items-center gap-6 py-6">
                <button
                  onClick={stopCamera}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-18 h-18 rounded-full bg-primary flex items-center justify-center shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
                  style={{ width: '72px', height: '72px' }}
                >
                  <div className="w-14 h-14 rounded-full border-4 border-white" />
                </button>
                <button
                  onClick={switchCamera}
                  disabled={!cameraReady}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                  title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                >
                  <SwitchCamera className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Photo Preview or Capture UI */}
          {!showCamera && !analyzing && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col flex-1"
            >
              {/* Step Progress Indicator */}
              <div className="flex items-center justify-center gap-3 mb-5">
                {STEPS.map((step, index) => {
                  const StepIcon = STEP_ICONS[step.key]
                  const isCompleted = photos[step.key]
                  const isCurrent = index === currentStep
                  return (
                    <button
                      key={step.key}
                      onClick={() => setCurrentStep(index)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                        isCompleted
                          ? 'bg-green-100 text-green-700'
                          : isCurrent
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-gray-100 text-text-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">{t(`analysis.${stepKeys[index]}`)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Photo Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {currentPhoto ? (
                  <div className="relative flex-1 rounded-2xl overflow-hidden border-2 border-green-400 shadow-lg">
                    <img src={currentPhoto} alt="Hair photo" className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-md">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center">
                    {(() => {
                      const StepIcon = STEP_ICONS[STEPS[currentStep].key]
                      return (
                        <>
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                            <StepIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-text-muted text-sm font-medium mb-1">
                            {t(`analysis.${stepKeys[currentStep]}`)}
                          </p>
                          <p className="text-text-light text-xs px-8 text-center">
                            {t(`analysis.${stepDescKeys[currentStep]}`)}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Validation Error */}
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <p className="text-orange-700 text-sm">{validationError}</p>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 space-y-3">
                {currentPhoto ? (
                  <>
                    <button
                      onClick={handleNext}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      {currentStep < STEPS.length - 1 ? (
                        <>
                          {t('analysis.continue')}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          {t('analysis.analyzePhotos')} ({photoCount})
                          <Sparkles className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleRetake}
                      className="w-full py-3 text-text-muted font-medium hover:text-text-dark transition-colors"
                    >
                      {t('analysis.retake')}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startCamera}
                      className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                      <Camera className="w-5 h-5" />
                      {t('analysis.takePhoto')}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 bg-white border-2 border-gray-200 text-text-dark font-bold rounded-2xl flex items-center justify-center gap-2 hover:border-gray-300 hover:bg-gray-50 transition-colors active:scale-[0.98]"
                    >
                      <Upload className="w-5 h-5" />
                      {t('analysis.uploadPhoto')}
                    </button>
                    {canAnalyze && (
                      <button
                        onClick={handleSkip}
                        className="w-full py-2 text-text-muted text-sm font-medium flex items-center justify-center gap-1 hover:text-primary transition-colors"
                      >
                        <SkipForward className="w-4 h-4" />
                        {t('analysis.skipPhoto')}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-medium mb-1">Analysis Failed</p>
                <p className="text-red-600 text-sm mb-3">{error}</p>
                <button
                  onClick={() => {
                    setError(null)
                    handleAnalyze()
                  }}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-xl transition-colors"
                >
                  {t('common.tryAgain') || 'Try Again'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>


      {/* Login Prompt Modal */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        type="full"
        initialMode="signup"
      />

      {/* Hair Quiz */}
      <HairQuiz
        isOpen={showQuiz}
        onClose={() => {
          setShowQuiz(false)
          setPendingAnalysis(false)
        }}
        onComplete={handleQuizComplete}
        onSkip={handleQuizSkip}
      />

      {/* Hair Mismatch Warning Modal */}
      <AnimatePresence>
        {hairWarning && pendingResultId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-bold text-text-primary text-lg">Different Hair Detected</h3>
              </div>

              <p className="text-sm text-text-secondary mb-4">
                We detected this may not be your hair compared to your previous analysis.
              </p>

              <div className="bg-amber-50 rounded-xl p-3 mb-5 space-y-1">
                {hairWarning.typeMismatch && (
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Type:</span> {hairWarning.previousType} → {hairWarning.currentType}
                  </p>
                )}
                {hairWarning.textureMismatch && (
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Texture:</span> {hairWarning.previousTexture} → {hairWarning.currentTexture}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setHairWarning(null)
                    setPendingResultId(null)
                  }}
                  className="flex-1 py-3 bg-surface text-text-primary font-medium rounded-xl hover:bg-surface-hover transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    const resultId = pendingResultId
                    setHairWarning(null)
                    setPendingResultId(null)
                    navigate(`/results/${resultId}`)
                  }}
                  className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-light transition-colors"
                >
                  View Results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FullAnalysis
