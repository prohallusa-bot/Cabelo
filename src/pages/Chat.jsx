import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { sendChatMessageStream } from '../services/gemini'
import { saveChat, getChat, updateUserData } from '../services/firebase'
import { compressForChat } from '../utils/imageCompression'
import LoginPrompt from '../components/auth/LoginPrompt'
import MarkdownRenderer from '../components/common/MarkdownRenderer'
import { Send, Sparkles, Image as ImageIcon, X, AlertCircle, ArrowUp } from 'lucide-react'

// Image validation constants (aligned with backend)
const MAX_FILE_SIZE = 7 * 1024 * 1024 // 7 MB
const SUPPORTED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']

const Chat = () => {
  const location = useLocation()
  const { user, userData, canSendGuestMessage, incrementGuestMessageCount, getRemainingGuestMessages } = useAuth()
  const { t } = useLanguage()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageError, setImageError] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const typingQueueRef = useRef([])
  const typingTimerRef = useRef(null)
  const displayedTextRef = useRef('')

  // Load chat history
  useEffect(() => {
    const loadChat = async () => {
      if (user) {
        try {
          const history = await getChat(user.uid)
          if (history.length > 0) {
            setMessages(history)
          } else {
            setMessages([])
          }
        } catch (error) {
          console.error('Error loading chat:', error)
        }
      } else {
        setMessages([])
      }
    }
    loadChat()
  }, [user])

  // Handle initial message from landing page - auto-send
  const shouldAutoSendRef = useRef(false)

  useEffect(() => {
    if (location.state?.initialMessage) {
      setInput(location.state.initialMessage)
      shouldAutoSendRef.current = true
      window.history.replaceState({}, document.title)
    }
  }, [location])

  useEffect(() => {
    if (shouldAutoSendRef.current && input.trim()) {
      shouldAutoSendRef.current = false
      handleSend()
    }
  }, [input])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save chat to Firestore when messages change (but not while streaming)
  useEffect(() => {
    // Don't save if any message is still streaming
    const isStreaming = messages.some(m => m.isStreaming)
    if (user && messages.length > 0 && !isStreaming) {
      const saveMessages = async () => {
        try {
          // Clean messages before saving - remove undefined values and isStreaming
          const cleanedMessages = messages.map(msg => {
            const cleaned = {}
            for (const [key, value] of Object.entries(msg)) {
              // Skip isStreaming and undefined values
              if (key !== 'isStreaming' && value !== undefined) {
                cleaned[key] = value
              }
            }
            return cleaned
          })
          await saveChat(user.uid, cleanedMessages)
          await updateUserData(user.uid, {
            chatCount: messages.filter(m => m.role === 'user').length
          })
        } catch (error) {
          console.error('Error saving chat:', error)
        }
      }
      saveMessages()
    }
  }, [messages, user])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const validateImage = (file) => {
    if (!SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase())) {
      const supportedFormats = SUPPORTED_MIME_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ')
      return { valid: false, error: `Invalid file type. Please upload ${supportedFormats} only.` }
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2)
      return { valid: false, error: `File too large (${sizeMB}MB). Maximum size is 7MB.` }
    }
    return { valid: true }
  }

  const handleImageSelect = async (e) => {
    setImageError(null)
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImage(file)
    if (!validation.valid) {
      setImageError(validation.error)
      e.target.value = ''
      return
    }

    try {
      // Compress the image before storing
      console.log('Compressing image for chat...')
      const compressedFile = await compressForChat(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage({ file: compressedFile, dataUrl: reader.result, name: file.name })
      }
      reader.onerror = () => {
        setImageError('Failed to read image file. Please try another image.')
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Error compressing image:', err)
      // Fallback to original file if compression fails
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage({ file, dataUrl: reader.result, name: file.name })
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImageError(null)
  }

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading) return

    if (!user && !canSendGuestMessage()) {
      setShowLoginPrompt(true)
      return
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '[Image message]',
      image: selectedImage?.dataUrl,
      timestamp: new Date()
    }

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInput('')
    const imageToSend = selectedImage
    setSelectedImage(null)
    setImageError(null)
    setLoading(true)

    if (!user) {
      incrementGuestMessageCount()
    }

    try {
      const hairProfile = userData?.latestAnalysis?.hairProfile || null
      const images = imageToSend ? [{
        base64: imageToSend.dataUrl.split(',')[1],
        mimeType: imageToSend.file.type
      }] : []

      // Use streaming with word-by-word typing effect
      typingQueueRef.current = []
      displayedTextRef.current = ''
      let streamDone = false

      // Start typing animation - pulls words from queue
      const startTyping = () => {
        if (typingTimerRef.current) return
        typingTimerRef.current = setInterval(() => {
          if (typingQueueRef.current.length > 0) {
            const word = typingQueueRef.current.shift()
            displayedTextRef.current += word
            const displayed = displayedTextRef.current
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: displayed }
                : msg
            ))
          } else if (streamDone) {
            // Queue empty and stream finished - stop timer
            clearInterval(typingTimerRef.current)
            typingTimerRef.current = null
            setMessages(prev => prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, isStreaming: false }
                : msg
            ))
          }
        }, 30) // 30ms per word = smooth typing
      }

      await sendChatMessageStream(
        userMessage.content === '[Image message]' ? '' : userMessage.content,
        {
          chatHistory: messages,
          userProfile: hairProfile,
          images,
          userId: user?.uid || null,
          isGuest: !user,
          conversationId: null
        },
        // onChunk callback - queue words for typing animation
        (chunk) => {
          // Split into words, preserving leading and trailing spaces
          const words = chunk.match(/\s*\S+\s*/g) || [chunk]
          typingQueueRef.current.push(...words)
          startTyping()
        }
      )

      // Stream done - let timer drain remaining words
      streamDone = true

      // Wait for typing queue to finish
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (typingQueueRef.current.length === 0) {
            clearInterval(check)
            if (typingTimerRef.current) {
              clearInterval(typingTimerRef.current)
              typingTimerRef.current = null
            }
            resolve()
          }
        }, 50)
      })

      // Final update: set complete text and mark done
      const finalText = displayedTextRef.current
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content: finalText, isStreaming: false }
          : msg
      ))
    } catch (error) {
      console.error('Error sending message:', error)

      // Show user-friendly error message (no technical details)
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      if (error?.error === 'LIMIT_REACHED' || error?.code === 'LIMIT_REACHED') {
        errorMessage = error.isGuest
          ? 'Chat limit reached. Sign up for unlimited messages!'
          : 'Daily chat limit reached. Please try again tomorrow.'
      }
      // Don't expose other error messages to users - just use generic message

      // Update the streaming message with error or add new error message
      setMessages(prev => {
        const hasStreamingMessage = prev.some(msg => msg.id === assistantMessageId)
        if (hasStreamingMessage) {
          return prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: errorMessage, error: true, isStreaming: false }
              : msg
          )
        }
        return [...prev, {
          id: assistantMessageId,
          role: 'assistant',
          content: errorMessage,
          timestamp: new Date(),
          error: true
        }]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const suggestedQuestions = [
    "How do I reduce frizz in humid weather?",
    "What's the best routine for curly hair?",
    "How often should I wash my hair?",
    "What causes hair breakage?"
  ]

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Messages Area - Full height with bottom padding for input */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty state - Centered welcome */
          <div className="h-full flex flex-col items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              {/* Logo */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl font-semibold text-text-DEFAULT mb-2">
                How can I help with your hair today?
              </h1>
              <p className="text-text-secondary mb-8">
                I'm your AI hair care assistant. Ask me anything about hair care, styling, or treatments.
              </p>

              {/* Suggested questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(question)}
                    className="p-4 text-left text-sm bg-surface-light hover:bg-surface border border-border rounded-xl transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>

              {!user && (
                <p className="mt-8 text-sm text-text-muted">
                  <span className="font-medium text-primary">{getRemainingGuestMessages()}</span> free messages remaining.{' '}
                  <button onClick={() => setShowLoginPrompt(true)} className="text-primary font-medium hover:underline">
                    Sign in
                  </button>{' '}
                  for unlimited access.
                </p>
              )}
            </motion.div>
          </div>
        ) : (
          /* Messages list */
          <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-6 ${message.role === 'user' ? '' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      message.role === 'assistant'
                        ? 'bg-primary'
                        : 'bg-surface border border-border'
                    }`}>
                      {message.role === 'assistant' ? (
                        <Sparkles className="w-4 h-4 text-white" />
                      ) : user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-medium text-text-secondary">
                          {user?.displayName?.[0] || user?.email?.[0] || 'U'}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-muted mb-1">
                        {message.role === 'assistant' ? 'Cabelo AI' : 'You'}
                      </p>

                      {/* Image if present */}
                      {message.image && (
                        <div className="mb-3">
                          <img
                            src={message.image}
                            alt="Uploaded"
                            className="max-w-xs rounded-lg border border-border"
                          />
                        </div>
                      )}

                      {/* Text */}
                      <div className={`${message.error ? 'text-red-600' : 'text-text-DEFAULT'}`}>
                        {message.role === 'user' ? (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        ) : message.isStreaming && !message.content ? (
                          /* Show "Thinking" with animated dots when waiting for response */
                          <div className="flex items-center gap-2 py-1 text-text-muted">
                            <span className="text-sm">Thinking</span>
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <MarkdownRenderer content={message.content} className="prose prose-sm max-w-none" />
                            {message.isStreaming && message.content && (
                              <span className="inline-block w-2 h-4 bg-primary ml-0.5 animate-pulse" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator - removed as we now use streaming placeholder message */}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="border-t border-border bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Image Error */}
          {imageError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">{imageError}</p>
              <button onClick={() => setImageError(null)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-2 bg-surface rounded-xl border border-border inline-flex items-center gap-3"
            >
              <img src={selectedImage.dataUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-DEFAULT truncate max-w-[150px]">{selectedImage.name}</p>
                <p className="text-xs text-text-muted">{(selectedImage.file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={handleRemoveImage}
                className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-text-DEFAULT"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Input container */}
          <div className="relative bg-surface border border-border rounded-2xl focus-within:border-text-muted transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="flex items-end gap-2 p-2">
              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || selectedImage !== null}
                className={`p-2 rounded-lg transition-colors ${
                  selectedImage ? 'text-primary bg-pastel-green' : 'text-text-muted hover:text-text-DEFAULT hover:bg-surface-hover'
                } disabled:opacity-50`}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={selectedImage ? "Add a message (optional)..." : "Message Cabelo AI..."}
                rows={1}
                className="flex-1 bg-transparent resize-none outline-none text-text-DEFAULT placeholder-text-muted py-2 max-h-[200px]"
                disabled={loading}
              />

              {/* Send button */}
              <button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || loading}
                className="p-2 rounded-lg bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-light transition-colors"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Helper text */}
          {!user && messages.length > 0 && getRemainingGuestMessages() <= 2 && getRemainingGuestMessages() > 0 && (
            <p className="text-xs text-center text-text-muted mt-3">
              {getRemainingGuestMessages()} messages remaining.{' '}
              <button onClick={() => setShowLoginPrompt(true)} className="text-primary font-medium hover:underline">
                Sign in for unlimited
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Login Prompt */}
      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        type="chat"
        initialMode="signup"
        onContinueAsGuest={() => setShowLoginPrompt(false)}
      />
    </div>
  )
}

export default Chat
