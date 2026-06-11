import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from '../../lib/motion'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { isAdmin, checkAdminStatus } from '../../services/firebase'
import { X, Check, Sparkles, Mail, Lock, User, Eye, EyeOff, ChevronDown } from 'lucide-react'
import { COUNTRIES, PHONE_COUNTRIES, mapToDropdownCountry, DEFAULT_COUNTRY } from '../../constants/countries'

const LoginPrompt = ({
  isOpen,
  onClose,
  type = 'save', // 'save' | 'full' | 'chat'
  onContinueAsGuest,
  initialMode = 'signin' // 'signin' | 'signup'
}) => {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, forgotPassword } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState(initialMode) // 'signin' | 'signup' | 'reset'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [city, setCity] = useState('')

  // Get current country object (for display)
  const currentCountry = COUNTRIES.find(c => c.code === country) || COUNTRIES[COUNTRIES.length - 1]
  // Get phone code from full list (PHONE_COUNTRIES has actual phone codes; COUNTRIES OTHER has none)
  const phoneCountryInfo = PHONE_COUNTRIES.find(c => c.code === country) || PHONE_COUNTRIES[0]

  // Fetch location from IP on mount (only for signup)
  useEffect(() => {
    if (isOpen && mode === 'signup') {
      fetchLocation()
    }
  }, [isOpen, mode])

  const fetchLocation = async () => {
    setLocationLoading(true)
    try {
      const response = await fetch('https://ipapi.co/json/')
      if (response.ok) {
        const data = await response.json()
        // Map detected country to our simplified dropdown (BR, US, ES, FR, or OTHER)
        if (data.country_code) {
          setCountry(mapToDropdownCountry(data.country_code))
        }
        if (data.city) {
          setCity(data.city)
        }
      }
    } catch (err) {
      console.log('Could not detect location, using defaults')
      setCountry(DEFAULT_COUNTRY)
    } finally {
      setLocationLoading(false)
    }
  }

  // Reset mode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
      setError(null)
      setSuccess(null)
      setPassword('')
    }
  }, [isOpen, initialMode])

  const validateForm = () => {
    setError(null)

    if (!email || !email.includes('@')) {
      setError(t('auth.invalidEmail'))
      return false
    }

    // Only validate password length for signup, not login
    if (mode === 'signup' && password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return false
    }

    // For login, just check password is not empty
    if (mode === 'signin' && !password) {
      setError(t('auth.passwordRequired'))
      return false
    }

    if (mode === 'signup' && !displayName.trim()) {
      setError(t('auth.nameRequired'))
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!validateForm()) return

    try {
      setLoading(true)

      if (mode === 'signin') {
        const user = await signIn(email, password)
        onClose()
        // Redirect based on admin status
        const adminByEmail = isAdmin(user.email)
        const adminByFirestore = await checkAdminStatus(user.uid)
        if (adminByEmail || adminByFirestore) {
          navigate('/admin')
        } else {
          navigate('/chat')
        }
      } else if (mode === 'signup') {
        // Map country code to human-readable name
        const countryName = country === 'BR' ? 'Brazil'
          : country === 'US' ? 'United States'
          : country === 'ES' ? 'Spain'
          : country === 'FR' ? 'France'
          : 'Other'

        // Prepare profile data with phone, country, city
        const profileData = {
          phone: phone ? `${phoneCountryInfo.phoneCode} ${phone.replace(/\D/g, '')}` : null,
          phoneCountry: phone ? country : null,
          country: countryName,
          countryCode: country || null,
          city: city || null,
        }
        const user = await signUp(email, password, displayName.trim(), profileData)
        onClose()
        // Redirect based on admin status (unlikely for new signup but check anyway)
        const adminByEmail = isAdmin(user.email)
        if (adminByEmail) {
          navigate('/admin')
        } else {
          navigate('/chat')
        }
      } else if (mode === 'reset') {
        await forgotPassword(email)
        setSuccess(t('auth.resetEmailSent'))
        setTimeout(() => setMode('signin'), 3000)
      }
    } catch (err) {
      console.error('Auth error:', err)

      // Handle specific Firebase errors
      const errorCode = err.code || ''

      if (errorCode === 'auth/user-banned') {
        setError('This account has been banned. Please contact support.')
      } else if (errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/user-not-found') {
        setError(t('auth.invalidCredentials'))
      } else if (errorCode === 'auth/email-already-in-use') {
        setError(t('auth.emailInUse'))
      } else if (errorCode === 'auth/weak-password') {
        setError(t('auth.weakPassword'))
      } else if (errorCode === 'auth/too-many-requests') {
        setError(t('auth.tooManyRequests'))
      } else if (errorCode === 'auth/network-request-failed') {
        setError(t('auth.networkError'))
      } else if (errorCode === 'auth/invalid-email') {
        setError(t('auth.invalidEmail'))
      } else {
        // Generic error fallback
        setError(t('auth.invalidCredentials'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContinueAsGuest = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest()
    }
    onClose()
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      const user = await signInWithGoogle()
      onClose()
      // Redirect based on admin status
      const adminByEmail = isAdmin(user.email)
      const adminByFirestore = await checkAdminStatus(user.uid)
      if (adminByEmail || adminByFirestore) {
        navigate('/admin')
      } else {
        navigate('/chat')
      }
    } catch (err) {
      console.error('Google sign in error:', err)
      const errorCode = err.code || ''
      if (errorCode === 'auth/user-banned') {
        setError('This account has been banned. Please contact support.')
      } else if (errorCode === 'auth/popup-closed-by-user') {
        // User closed popup, don't show error
      } else if (errorCode === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups for this site.')
      } else {
        setError('Could not sign in with Google. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
    setPassword('')
    if (newMode === 'signup') {
      fetchLocation()
    }
  }

  const getTitle = () => {
    if (mode === 'reset') return t('auth.resetPassword')
    if (mode === 'signup') return t('auth.createAccountTitle') || 'Create an account'
    switch (type) {
      case 'save':
        return t('auth.signInToSave')
      case 'full':
        return t('auth.signInForFull')
      case 'chat':
        return t('chat.unlimitedChat')
      default:
        return t('auth.signIn')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Modal - Centered on screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1.5 text-text-muted hover:text-text-dark rounded-full hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header - Icon + Title inline */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-text-dark">
                  {getTitle()}
                </h2>
              </div>

              {/* Benefits - Compact horizontal for signin only */}
              {mode === 'signin' && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {[t('auth.benefit1'), t('auth.benefit2'), t('auth.benefit3')].map((benefit, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs text-text-secondary bg-surface px-2 py-1 rounded-full">
                      <Check className="w-3 h-3 text-green-500" />
                      {benefit}
                    </span>
                  ))}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Display Name - only for signup */}
                {mode === 'signup' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('auth.namePlaceholder')}
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors"
                    />
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors"
                  />
                </div>

                {/* Password - not for reset */}
                {mode !== 'reset' && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.passwordPlaceholder')}
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                {/* Phone + Country/City Row - only for signup */}
                {mode === 'signup' && (
                  <>
                    {/* Phone field */}
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 border-r border-border pr-2">
                        <span className="text-base">{phoneCountryInfo.flag}</span>
                        <span className="text-xs text-text-dark font-medium">{phoneCountryInfo.phoneCode}</span>
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('auth.phoneOptionalPlaceholder') || 'Phone (Optional)'}
                        className="w-full pl-[5.5rem] pr-3 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    {/* Country + City in one row */}
                    <div className="flex gap-2">
                      {/* Country Selector */}
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="w-full pl-3 pr-7 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors text-left flex items-center gap-2"
                        >
                          <span className="text-base">{currentCountry.flag}</span>
                          <span className="text-text-dark truncate">{currentCountry.name}</span>
                        </button>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />

                        {/* Country Dropdown */}
                        <AnimatePresence>
                          {showCountryDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto"
                            >
                              {COUNTRIES.map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setCountry(c.code)
                                    setShowCountryDropdown(false)
                                  }}
                                  className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-surface transition-colors text-sm ${
                                    country === c.code ? 'bg-primary/5 text-primary' : ''
                                  }`}
                                >
                                  <span className="text-base">{c.flag}</span>
                                  <span className="truncate">{c.name}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* City Input */}
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t('auth.cityPlaceholder')}
                        className="flex-1 pl-3 pr-3 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary transition-colors"
                      />
                    </div>

                  </>
                )}

                {/* Forgot password link */}
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}

                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                    <p className="text-red-600 text-xs text-center font-medium">{error}</p>
                  </div>
                )}

                {/* Success message */}
                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                    <p className="text-green-600 text-xs text-center font-medium">{success}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'signin' && t('common.signIn')}
                      {mode === 'signup' && t('auth.createAccount')}
                      {mode === 'reset' && t('auth.sendResetLink')}
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign In */}
              {(mode === 'signin' || mode === 'signup') && (
                <>
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-text-muted">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-2.5 bg-white border border-border text-text-primary text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-surface-hover transition-all disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}

              {/* Mode switcher */}
              <div className="mt-3 text-center text-xs">
                {mode === 'signin' && (
                  <p className="text-text-muted">
                    {t('auth.noAccount')}{' '}
                    <button
                      onClick={() => switchMode('signup')}
                      className="text-primary font-semibold hover:underline"
                    >
                      {t('auth.createAccount')}
                    </button>
                  </p>
                )}
                {mode === 'signup' && (
                  <p className="text-text-muted">
                    {t('auth.hasAccount')}{' '}
                    <button
                      onClick={() => switchMode('signin')}
                      className="text-primary font-semibold hover:underline"
                    >
                      {t('common.signIn')}
                    </button>
                  </p>
                )}
                {mode === 'reset' && (
                  <button
                    onClick={() => switchMode('signin')}
                    className="text-primary font-semibold hover:underline"
                  >
                    {t('auth.backToSignIn')}
                  </button>
                )}
              </div>

              {/* Continue as guest - only for signin */}
              {onContinueAsGuest && mode === 'signin' && (
                <button
                  onClick={handleContinueAsGuest}
                  className="w-full mt-2 py-2 text-text-muted hover:text-text-dark text-xs font-medium transition-colors"
                >
                  {t('common.maybeLater')}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default LoginPrompt
