import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { X, Check, Sparkles, Mail, Lock, User, Eye, EyeOff, Phone, MapPin, Bell, ChevronDown } from 'lucide-react'
import { COUNTRIES, PHONE_COUNTRIES, getStatesByCountry, getCountryByCode, mapToDropdownCountry, DEFAULT_COUNTRY } from '../../constants/countries'

const RegisterPrompt = ({ isOpen, onClose, onSwitchToSignIn }) => {
  const { signUp } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [detectingLocation, setDetectingLocation] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showPhoneCodeDropdown, setShowPhoneCodeDropdown] = useState(false)
  const countryDropdownRef = useRef(null)
  const phoneCodeDropdownRef = useRef(null)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Get phone code for selected country
  const phoneCountryInfo = PHONE_COUNTRIES.find(c => c.code === phoneCountry) || PHONE_COUNTRIES[0]
  const countryInfo = COUNTRIES.find(c => c.code === country) || COUNTRIES[COUNTRIES.length - 1]

  // Get appropriate states list based on country
  const statesList = getStatesByCountry(country)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false)
      }
      if (phoneCodeDropdownRef.current && !phoneCodeDropdownRef.current.contains(event.target)) {
        setShowPhoneCodeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-detect location on mount
  useEffect(() => {
    if (isOpen) {
      detectLocation()
    }
  }, [isOpen])

  const detectLocation = async () => {
    setDetectingLocation(true)
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
              )
              const data = await response.json()

              if (data.address) {
                setCity(data.address.city || data.address.town || data.address.municipality || '')
                setState(data.address.state || '')
                const rawCountryCode = data.address.country_code?.toUpperCase() || DEFAULT_COUNTRY
                // Map to our simplified dropdown (BR, US, ES, FR, or OTHER)
                setCountry(mapToDropdownCountry(rawCountryCode))
                // For phone code, use the actual country code
                const phoneMatch = PHONE_COUNTRIES.find(c => c.code === rawCountryCode)
                setPhoneCountry(phoneMatch ? rawCountryCode : DEFAULT_COUNTRY)
              }
            } catch (err) {
              console.log('Reverse geocoding failed:', err)
              detectFromTimezone()
            }
            setDetectingLocation(false)
          },
          () => {
            detectFromTimezone()
            setDetectingLocation(false)
          },
          { timeout: 5000 }
        )
      } else {
        detectFromTimezone()
        setDetectingLocation(false)
      }
    } catch (err) {
      console.log('Location detection failed:', err)
      setDetectingLocation(false)
    }
  }

  const detectFromTimezone = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezone.includes('Sao_Paulo') || timezone.includes('Brasilia') || timezone.includes('America/Fortaleza') || timezone.includes('America/Recife')) {
        setCountry('BR')
        setPhoneCountry('BR')
      } else if (timezone.includes('America/New_York') || timezone.includes('America/Los_Angeles') || timezone.includes('America/Chicago') || timezone.includes('America/Denver')) {
        setCountry('US')
        setPhoneCountry('US')
      } else if (timezone.includes('Europe/Madrid')) {
        setCountry('ES')
        setPhoneCountry('ES')
      } else if (timezone.includes('Europe/Paris')) {
        setCountry('FR')
        setPhoneCountry('FR')
      } else {
        // Any other timezone → set country to OTHER
        setCountry('OTHER')
      }
    } catch (err) {
      console.log('Timezone detection failed:', err)
    }
  }

  const validateForm = () => {
    setError(null)

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    if (!displayName.trim()) {
      setError('Please enter your name')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    try {
      setLoading(true)
      // Format phone with country code
      const fullPhone = phoneNumber.trim()
        ? `${phoneCountryInfo.phoneCode} ${phoneNumber.trim()}`
        : null

      // Map country code to name for Firestore storage
      const countryName = country === 'BR' ? 'Brazil'
        : country === 'US' ? 'United States'
        : country === 'ES' ? 'Spain'
        : country === 'FR' ? 'France'
        : 'Other'

      const profileData = {
        phone: fullPhone,
        phoneCountry: phoneNumber.trim() ? phoneCountry : null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: countryName,
        countryCode: country || null,
        emailNotifications
      }
      await signUp(email, password, displayName.trim(), profileData)
      onClose()
    } catch (err) {
      console.error('Signup error:', err)

      const errorCode = err.code || ''

      if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.')
      } else if (errorCode === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.')
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address')
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.')
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
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

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 pb-10 max-w-lg mx-auto shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-dark rounded-full hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-button">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-text-dark text-center mb-2">
              Register to save your results
            </h2>

            {/* Benefits */}
            <div className="mb-6">
              <div className="space-y-2">
                {['Save your analysis results', 'Track your progress over time', 'Unlimited AI chat', 'Personalized recommendations'].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-text-dark">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-12 pr-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-dark"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Country Selector with Flags */}
              <div className="relative" ref={countryDropdownRef}>
                <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">
                  {t('auth.countryLabel') || 'Country'}
                </label>
                <button
                  type="button"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors text-left"
                >
                  <span className="text-xl">{countryInfo?.flag || '🌍'}</span>
                  <span className="flex-1 text-text-dark">{countryInfo?.name || 'Select country'}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCountryDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-lg border border-rose-border-light max-h-60 overflow-y-auto"
                  >
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountry(c.code)
                          // Set phone country to match (if not OTHER)
                          if (c.code !== 'OTHER') setPhoneCountry(c.code)
                          setState('')
                          setShowCountryDropdown(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-surface transition-colors text-left ${
                          country === c.code ? 'bg-primary/5 text-primary' : 'text-text-dark'
                        }`}
                      >
                        <span className="text-xl">{c.flag}</span>
                        <span className="flex-1">{c.name}</span>
                        {country === c.code && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Phone with Country Code Selector */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">
                  {t('auth.phonePlaceholder') || 'Phone'} <span className="text-text-light">({t('auth.optional') || 'optional'})</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <div className="relative" ref={phoneCodeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowPhoneCodeDropdown(!showPhoneCodeDropdown)}
                      className="flex items-center gap-2 px-3 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors min-w-[100px]"
                    >
                      <span className="text-lg">{phoneCountryInfo.flag}</span>
                      <span className="text-sm text-text-dark">{phoneCountryInfo.phoneCode}</span>
                      <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${showPhoneCodeDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showPhoneCodeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-50 mt-2 w-48 bg-white rounded-xl shadow-lg border border-rose-border-light max-h-60 overflow-y-auto"
                      >
                        {PHONE_COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setPhoneCountry(c.code)
                              setShowPhoneCodeDropdown(false)
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors text-left ${
                              phoneCountry === c.code ? 'bg-primary/5 text-primary' : 'text-text-dark'
                            }`}
                          >
                            <span className="text-lg">{c.flag}</span>
                            <span className="text-sm">{c.phoneCode}</span>
                            <span className="text-xs text-text-muted flex-1">{c.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ''))}
                      placeholder="Phone number"
                      className="w-full pl-10 pr-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* City/State */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={t('auth.cityPlaceholder') || 'City'}
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="relative w-32">
                  {statesList.length > 0 ? (
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                    >
                      <option value="">{t('auth.statePlaceholder') || 'State'}</option>
                      {statesList.map(s => (
                        <option key={s.code} value={s.code}>{s.code}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder={t('auth.statePlaceholder') || 'State'}
                      className="w-full px-4 py-3 bg-surface border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                    />
                  )}
                </div>
              </div>
              {detectingLocation && (
                <p className="text-xs text-text-muted -mt-2 ml-1">
                  {t('auth.detectingLocation') || 'Detecting your location...'}
                </p>
              )}

              {/* Email notifications - Toggle Button */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-rose-border-light">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-sm font-medium text-text-dark block">
                      {t('auth.emailNotificationsLabel') || 'Email notifications'}
                    </span>
                    <span className="text-xs text-text-muted">
                      {t('auth.emailNotificationsDesc') || 'Tips & hair care reminders'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    emailNotifications ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ left: emailNotifications ? '26px' : '4px' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button hover:shadow-soft transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Switch to Sign In */}
            <div className="mt-4 text-center text-sm">
              <p className="text-text-muted">
                Already have an account?{' '}
                <button
                  onClick={onSwitchToSignIn}
                  className="text-primary font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default RegisterPrompt
