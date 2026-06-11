import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../locales/en.json'
import pt from '../locales/pt.json'
import es from '../locales/es.json'

const translations = { en, pt, es }

const DEFAULT_LANGUAGE = 'pt' // Brazilian Portuguese as default

const SUPPORTED_LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
]

const COOKIE_NAME = 'cabelo_language'
const COOKIE_DAYS = 365

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Cookie helpers
const getCookie = (name) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop().split(';').shift()
  return null
}

const setCookie = (name, value, days) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
}

// Country → language mapping for IP-based detection
const COUNTRY_LANGUAGE_MAP = {
  // Portuguese-speaking
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  // Spanish-speaking
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es', EC: 'es',
  GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es',
  CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // English-speaking
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en', ZA: 'en', IN: 'en',
  PH: 'en', SG: 'en', KE: 'en', NG: 'en', GH: 'en',
}

// Detect language from IP geolocation (async)
const detectLanguageFromIP = async () => {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data = await res.json()
    const country = data.country_code
    if (country && COUNTRY_LANGUAGE_MAP[country]) {
      console.log('IP language detected:', COUNTRY_LANGUAGE_MAP[country], '(country:', country, ')')
      return COUNTRY_LANGUAGE_MAP[country]
    }
    return null
  } catch {
    console.log('IP language detection failed, using fallback')
    return null
  }
}

// Detect language from browser settings (instant, no API call)
const detectLanguageFromBrowser = () => {
  try {
    // Get browser language
    const browserLang = navigator.language || navigator.userLanguage || 'en'
    const langCode = browserLang.split('-')[0].toLowerCase()

    // Check if we support this language
    if (translations[langCode]) {
      console.log('Browser language detected:', langCode)
      return langCode
    }

    // Check navigator.languages for alternatives
    if (navigator.languages) {
      for (const lang of navigator.languages) {
        const code = lang.split('-')[0].toLowerCase()
        if (translations[code]) {
          console.log('Alternative browser language detected:', code)
          return code
        }
      }
    }

    return DEFAULT_LANGUAGE // Default fallback
  } catch (error) {
    console.log('Browser language detection failed:', error.message)
    return DEFAULT_LANGUAGE
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize language on mount
  useEffect(() => {
    const initLanguage = async () => {
      // 1. First check cookie (user's previous preference)
      const cookieLang = getCookie(COOKIE_NAME)
      if (cookieLang && translations[cookieLang]) {
        console.log('Using cookie language:', cookieLang)
        setLanguageState(cookieLang)
        setIsLoading(false)
        return
      }

      // 2. Check localStorage (legacy support)
      const storedLang = localStorage.getItem('language')
      if (storedLang && translations[storedLang]) {
        console.log('Using localStorage language:', storedLang)
        setLanguageState(storedLang)
        setCookie(COOKIE_NAME, storedLang, COOKIE_DAYS)
        setIsLoading(false)
        return
      }

      // 3. New user - detect from browser settings immediately (no delay)
      const browserLang = detectLanguageFromBrowser()
      console.log('Browser detection result:', browserLang)
      setLanguageState(browserLang)
      setIsLoading(false)

      // 4. Also try IP-based detection in background for more accuracy
      const ipLang = await detectLanguageFromIP()
      if (ipLang && ipLang !== browserLang) {
        console.log('IP detection overrides browser:', browserLang, '→', ipLang)
        setLanguageState(ipLang)
        setCookie(COOKIE_NAME, ipLang, COOKIE_DAYS)
        localStorage.setItem('language', ipLang)
      } else {
        setCookie(COOKIE_NAME, browserLang, COOKIE_DAYS)
        localStorage.setItem('language', browserLang)
      }
    }

    initLanguage()
  }, [])

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode)
      setCookie(COOKIE_NAME, langCode, COOKIE_DAYS)
      localStorage.setItem('language', langCode)
      document.documentElement.lang = langCode
    }
  }, [])

  // Translation function with nested key support
  const t = useCallback((key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to default language (Portuguese), then English
        let fallbackValue = translations[DEFAULT_LANGUAGE] || translations['en']
        for (const fallbackKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fallbackKey in fallbackValue) {
            fallbackValue = fallbackValue[fallbackKey]
          } else {
            return key
          }
        }
        value = fallbackValue
        break
      }
    }

    // Replace parameters
    if (typeof value === 'string') {
      Object.entries(params).forEach(([param, val]) => {
        value = value.replace(`{{${param}}}`, val)
      })
    }

    return value || key
  }, [language])

  const value = {
    language,
    setLanguage,
    t,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageInfo: SUPPORTED_LANGUAGES.find(l => l.code === language)
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export default LanguageContext
