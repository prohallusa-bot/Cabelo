import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { analyzeHairPhotos } from '../services/gemini'
import { saveAnalysis, uploadPhoto } from '../services/firebase'
import { compressMultipleImages } from '../utils/imageCompression'
import LoginPrompt from '../components/auth/LoginPrompt'
import HairQuiz from '../components/quiz/HairQuiz'
import { Camera, Upload, X, ArrowLeft, RefreshCw, Sparkles, Zap, Droplets, Sun, Shield, SwitchCamera, Check } from 'lucide-react'

// Image validation constants (aligned with backend)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']

const QuickScan = () => {
  const navigate = useNavigate()
  const { user, userData, loading, hasCompletedQuiz, getQuizAnswers, saveQuizAnswers } = useAuth()
  const { t } = useLanguage()
  const fileInputRef = useRef(null)

  // Quiz is now shown only from the main Hair Analysis button on home page
  // Not auto-shown here to avoid duplicate popups

  const [photo, setPhoto] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStatus, setAnalysisStatus] = useState('')
  const [compressionStats, setCompressionStats] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [pendingAnalysis, setPendingAnalysis] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('user') // 'user' = front, 'environment' = back
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async (mode = facingMode) => {
    try {
      // First show the camera UI so video element is in DOM
      setShowCamera(true)
      setCameraReady(false)

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Wait a tick for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100))

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready to play
        await new Promise((resolve, reject) => {
          const video = videoRef.current
          if (!video) return reject(new Error('No video element'))

          video.onloadedmetadata = () => {
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
    } catch (err) {
      console.error('Error accessing camera:', err)
      setShowCamera(false)
      setCameraReady(false)
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please use file upload instead.')
      } else {
        setError('Could not access camera. Please use file upload instead.')
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
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
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setPhoto(dataUrl)
      stopCamera()
    }
  }

  const validateFile = (file) => {
    if (!SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase())) {
      const supportedFormats = SUPPORTED_MIME_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ')
      return { valid: false, error: `Unsupported file type. Please upload ${supportedFormats} images only.` }
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      return { valid: false, error: `File too large (${sizeMB}MB). Maximum size is 10MB.` }
    }
    return { valid: true }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error)
      e.target.value = ''
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhoto(reader.result)
    }
    reader.onerror = () => {
      setError('Failed to read image file. Please try another image.')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleAnalyze = async () => {
    if (!photo) return

    // Check if quiz is needed (not completed yet)
    const quizDone = hasCompletedQuiz()

    if (!quizDone) {
      // Show quiz before analysis
      setPendingAnalysis(true)
      setShowQuiz(true)
      return
    }

    // Quiz done - proceed with analysis
    runAnalysis(getQuizAnswers())
  }

  const runAnalysis = async (quizAnswers = null) => {
    setAnalyzing(true)
    setError(null)
    setAnalysisProgress(0)
    setAnalysisStatus(t('analysis.preparingPhotos') || 'Preparing photo...')
    setCompressionStats(null)

    try {
      console.log('=== Starting Quick Analysis ===')
      console.log('Quiz answers:', quizAnswers)

      // Step 1: Compress image (20%)
      setAnalysisProgress(10)
      setAnalysisStatus(t('analysis.compressingPhotos') || 'Compressing photo...')

      // Calculate original size
      const originalSize = Math.ceil(photo.length * 0.75 / 1024) // Approximate KB from base64

      const compressedPhotos = await compressMultipleImages([photo], {
        quality: 0.85,
        maxWidth: 2048,
        maxHeight: 2048
      })

      // Calculate compressed size
      const compressedSize = Math.ceil(compressedPhotos[0].length * 0.75 / 1024)
      const savings = originalSize > 0 ? Math.round((1 - compressedSize / originalSize) * 100) : 0

      setCompressionStats({
        original: originalSize,
        compressed: compressedSize,
        savings
      })

      // Step 2: Uploading (40%)
      setAnalysisProgress(30)
      setAnalysisStatus(t('analysis.uploadingPhotos') || 'Uploading photo...')

      const userId = user?.uid || null
      const isGuest = !user

      console.log('Calling API with:', {
        photoCount: 1,
        userId,
        isGuest,
        analysisType: 'quick',
        hasQuizAnswers: !!quizAnswers
      })

      // Step 3: Analyzing (60-90%)
      setAnalysisProgress(50)
      setAnalysisStatus(t('analysis.analyzingHair') || 'Analyzing your hair...')

      // Simulate progress while waiting for API
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 5, 85))
      }, 1000)

      const analysis = await analyzeHairPhotos(compressedPhotos, userId, isGuest, 'quick', quizAnswers)

      clearInterval(progressInterval)
      setAnalysisProgress(95)
      setAnalysisStatus(t('analysis.finalizing') || 'Finalizing results...')

      console.log('Analysis complete:', analysis)

      // Check if we got a valid response with shareId
      const analysisId = analysis.shareId || analysis.data?.shareId

      if (analysisId) {
        // Navigate to results page
        navigate(`/results/${analysisId}`)
      } else {
        // Show inline results (fallback)
        setResults(analysis)
        setAnalyzing(false)
      }
    } catch (err) {
      console.error('Analysis error:', err)
      // Extract actual error message from the error object
      const errorMessage = err?.message || err?.error || t('errors.analysisError') || 'Could not analyze photo. Please try again.'
      setError(errorMessage)
      setAnalyzing(false)
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

  const handleSaveResults = async () => {
    if (!user) {
      setShowLoginPrompt(true)
      return
    }

    try {
      const photoBlob = await fetch(photo).then(r => r.blob())
      const photoFile = new File([photoBlob], 'quick-scan.jpg', { type: 'image/jpeg' })
      
      const analysisId = await saveAnalysis(user.uid, {
        type: 'quick',
        ...results
      })
      
      await uploadPhoto(user.uid, photoFile, analysisId)
      
      navigate(`/results/${analysisId}`)
    } catch (err) {
      console.error('Error saving results:', err)
      setError('Could not save results. Please try again.')
    }
  }

  const resetScan = () => {
    setPhoto(null)
    setResults(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-text-primary">{t('analysis.quickScan')}</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {/* Camera View */}
          {showCamera && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden mb-6"
            >
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
                  <RefreshCw className="w-10 h-10 text-white animate-spin mb-4" />
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              )}

              {/* Guide circle */}
              {cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white/50 rounded-full" />
                </div>
              )}

              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                <button
                  onClick={stopCamera}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-primary" />
                </button>
                <button
                  onClick={switchCamera}
                  disabled={!cameraReady}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-50"
                  title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
                >
                  <SwitchCamera className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Analyzing State - Full screen progress UI */}
          {analyzing && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-12"
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

              <h2 className="text-xl font-bold text-text-primary mb-2">
                {t('analysis.analyzing')}
              </h2>
              <p className="text-text-secondary mb-6">
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
                    {t('analysis.photosOptimized') || 'Photo optimized'}
                  </p>
                  <p className="text-green-600 text-xs mt-1">
                    {t('analysis.saved') || 'Saved'} {compressionStats.savings}% · {' '}
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

          {/* Photo Preview */}
          {photo && !showCamera && !results && !analyzing && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-clean">
                <img src={photo} alt="Hair photo" className="w-full h-full object-cover" />
                <button
                  onClick={resetScan}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-primary shadow-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleAnalyze}
                className="w-full mt-4 py-4 bg-primary text-white font-semibold rounded-xl shadow-clean flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                {t('analysis.analyzePhoto') || 'Analyze Photo'}
              </button>
            </motion.div>
          )}

          {/* Upload Options */}
          {!photo && !showCamera && !results && !analyzing && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-pastel-cyan flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                  <Zap className="w-6 h-6 text-text-primary" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-text-primary mb-2">
                Quick Scan
              </h2>
              <p className="text-text-secondary mb-8">
                Take a quick photo for instant hair analysis
              </p>

              <div className="space-y-3">
                <button
                  onClick={startCamera}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-clean flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  {t('analysis.takePhoto')}
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-white border border-border text-text-primary font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-hover transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  {t('analysis.uploadPhoto')}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              <p className="mt-6 text-sm text-text-tertiary">
                {t('analysis.resultsNotSaved')}
              </p>
            </motion.div>
          )}

          {/* Results */}
          {results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Score Card */}
              <div className="bg-white rounded-2xl border border-border p-6 shadow-clean text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#F0F0F0" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#1a1a1a"
                      strokeWidth="8"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: 251.2,
                        strokeDashoffset: 251.2 - (251.2 * results.score) / 100
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-text-primary">{results.score}</span>
                    <span className="text-sm font-medium text-text-secondary">{results.status}</span>
                  </div>
                </div>

                <h2 className="text-lg font-semibold text-text-primary mb-1">
                  {t('results.yourScore')}
                </h2>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="bg-pastel-blue rounded-xl p-3">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-text-primary">{results.metrics?.hydration || 0}%</p>
                    <p className="text-xs text-text-secondary">{t('dashboard.hydration')}</p>
                  </div>
                  <div className="bg-pastel-orange rounded-xl p-3">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center">
                      <Sun className="w-4 h-4 text-text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-text-primary">{results.metrics?.shine || 0}%</p>
                    <p className="text-xs text-text-secondary">{t('dashboard.shine')}</p>
                  </div>
                  <div className="bg-pastel-green rounded-xl p-3">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-white flex items-center justify-center">
                      <Shield className="w-4 h-4 text-text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-text-primary">{results.metrics?.strength || 0}%</p>
                    <p className="text-xs text-text-secondary">{t('dashboard.strength')}</p>
                  </div>
                </div>
              </div>

              {/* Hair Profile */}
              <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
                <h3 className="font-semibold text-text-primary mb-3">{t('results.hairProfile')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-tertiary mb-1">{t('results.type')}</p>
                    <p className="font-medium text-text-primary">{results.hairProfile?.type || 'Unknown'}</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-tertiary mb-1">{t('results.porosity')}</p>
                    <p className="font-medium text-text-primary">{results.hairProfile?.porosity || 'Unknown'}</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-tertiary mb-1">{t('results.texture')}</p>
                    <p className="font-medium text-text-primary">{results.hairProfile?.texture || 'Unknown'}</p>
                  </div>
                  <div className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-tertiary mb-1">{t('results.density')}</p>
                    <p className="font-medium text-text-primary">{results.hairProfile?.density || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSaveResults}
                  className="w-full py-4 bg-primary text-white font-semibold rounded-xl shadow-clean hover:bg-primary-light transition-colors"
                >
                  {t('analysis.saveResults')}
                </button>
                
                <button
                  onClick={() => navigate('/analysis')}
                  className="w-full py-4 bg-white border border-border text-text-primary font-semibold rounded-xl hover:bg-surface-hover transition-colors"
                >
                  {t('analysis.getFullAnalysis')}
                </button>
                
                <button
                  onClick={resetScan}
                  className="w-full py-3 text-text-secondary font-medium hover:text-text-primary transition-colors"
                >
                  {t('analysis.retake')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}
      </main>

      {/* Login Prompt */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        type="save"
        initialMode="signup"
        onContinueAsGuest={() => setShowLoginPrompt(false)}
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
    </div>
  )
}

export default QuickScan
