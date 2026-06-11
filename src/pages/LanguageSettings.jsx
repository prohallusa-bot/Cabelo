import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { ArrowLeft, Check, Globe } from 'lucide-react'

// Only show languages that are actually supported with translations
const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
]

const LanguageSettings = () => {
  const navigate = useNavigate()
  const { language, setLanguage, t } = useLanguage()

  const handleLanguageChange = (code) => {
    setLanguage(code)
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-text-primary">{t('settings.language')}</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Icon */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-pastel-purple flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <Globe className="w-5 h-5 text-text-primary" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Select Language</h2>
            <p className="text-sm text-text-secondary mt-1">Choose your preferred language</p>
          </div>

          {/* Language List */}
          <div className="bg-white rounded-2xl border border-border shadow-clean overflow-hidden">
            {languages.map((lang, i) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-hover transition-colors text-left ${
                  i !== languages.length - 1 ? 'border-b border-border-light' : ''
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{lang.name}</p>
                  <p className="text-sm text-text-tertiary">{lang.native}</p>
                </div>
                {language === lang.code && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Info */}
          <p className="text-center text-sm text-text-tertiary">
            Language changes will apply immediately throughout the app
          </p>
        </motion.div>
      </main>
    </div>
  )
}

export default LanguageSettings
