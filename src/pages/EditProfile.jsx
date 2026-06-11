import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { updateUserData } from '../services/firebase'
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Bell,
  Check,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { COUNTRIES, PHONE_COUNTRIES, getStatesByCountry, getCountryByCode, mapToDropdownCountry, DEFAULT_COUNTRY } from '../constants/countries'

const EditProfile = () => {
  const navigate = useNavigate()
  const { user, userData, refreshUserData } = useAuth()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showPhoneCodeDropdown, setShowPhoneCodeDropdown] = useState(false)
  const countryDropdownRef = useRef(null)
  const phoneCodeDropdownRef = useRef(null)

  // Form fields
  const [displayName, setDisplayName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_COUNTRY)
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [emailNotifications, setEmailNotifications] = useState(true)

  // Get phone code info
  const phoneCountryInfo = PHONE_COUNTRIES.find(c => c.code === phoneCountry) || PHONE_COUNTRIES[0]
  const countryInfo = COUNTRIES.find(c => c.code === country) || COUNTRIES[COUNTRIES.length - 1]
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

  // Load current user data
  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || user?.displayName || '')
      setCity(userData.city || '')
      setState(userData.state || '')
      // Map stored country name/code back to dropdown code
      const storedCountry = userData.countryCode || userData.country || DEFAULT_COUNTRY
      setCountry(mapToDropdownCountry(storedCountry))
      setEmailNotifications(userData.emailNotifications !== false)

      // Parse phone number - extract number without country code
      if (userData.phone) {
        const phoneMatch = userData.phone.match(/^\+\d+\s*(.*)$/)
        if (phoneMatch) {
          setPhoneNumber(phoneMatch[1])
        } else {
          setPhoneNumber(userData.phone)
        }
      }
      setPhoneCountry(userData.phoneCountry || userData.country || DEFAULT_COUNTRY)
    }
  }, [userData, user])

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    setSaved(false)

    try {
      // Format phone with country code
      const fullPhone = phoneNumber.trim()
        ? `${phoneCountryInfo.phoneCode} ${phoneNumber.trim()}`
        : null

      // Map country code to human-readable name
      const countryName = country === 'BR' ? 'Brazil'
        : country === 'US' ? 'United States'
        : country === 'ES' ? 'Spain'
        : country === 'FR' ? 'France'
        : 'Other'

      await updateUserData(user.uid, {
        displayName: displayName.trim() || user.displayName,
        phone: fullPhone,
        phoneCountry: phoneNumber.trim() ? phoneCountry : null,
        city: city.trim() || null,
        state: state.trim() || null,
        country: countryName,
        countryCode: country || null,
        emailNotifications
      })

      await refreshUserData()
      setSaved(true)

      // Hide success message after 2 seconds
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(t('profile.saveError') || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background-light pb-8">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 bg-white/80 glass border-b border-rose-border-light">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text-dark"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-text-dark">{t('settings.editProfile')}</h1>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        {/* Profile Picture */}
        <div className="flex justify-center mb-8">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-card"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-card">
              {displayName?.[0] || user.email?.[0] || '?'}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('auth.namePlaceholder') || 'Your name'}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('auth.namePlaceholder') || 'Your name'}
                className="w-full pl-12 pr-4 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('auth.emailPlaceholder') || 'Email'}
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-3 bg-surface border border-rose-border-light rounded-xl text-text-muted cursor-not-allowed"
            />
          </div>

          {/* Country Selector with Flags */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('auth.countryLabel') || 'Country'}
            </label>
            <div className="relative" ref={countryDropdownRef}>
              <button
                type="button"
                onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors text-left"
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
                        // Only sync phone country if it's a real country (not OTHER)
                        if (c.code !== 'OTHER') {
                          setPhoneCountry(c.code)
                        }
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
          </div>

          {/* Phone with Country Code */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('auth.phonePlaceholder') || 'Phone'}
              <span className="text-text-light ml-1">({t('auth.optional') || 'optional'})</span>
            </label>
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <div className="relative" ref={phoneCodeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowPhoneCodeDropdown(!showPhoneCodeDropdown)}
                  className="flex items-center gap-2 px-3 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors min-w-[100px]"
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
                  className="w-full pl-10 pr-4 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          {/* City/State */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">
              {t('auth.locationLabel') || 'Location'}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('auth.cityPlaceholder') || 'City'}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="relative w-32">
                {statesList.length > 0 ? (
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
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
                    className="w-full px-4 py-3 bg-white border border-rose-border-light rounded-xl outline-none focus:border-primary transition-colors"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Email Notifications - Toggle Button */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-rose-border-light">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <div>
                <span className="text-sm font-medium text-text-dark block">
                  {t('auth.emailNotificationsLabel') || 'Email notifications'}
                </span>
                <span className="text-xs text-text-muted">
                  {t('auth.emailNotificationsDesc') || 'Receive tips, updates, and hair care reminders'}
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

          {/* Success message */}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-600 text-sm text-center font-medium flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                {t('profile.saved') || 'Saved successfully!'}
              </p>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button hover:shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                {t('common.save') || 'Save'}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}

export default EditProfile
