import { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { Home, Camera, MessageCircle, BookOpen, MapPin, User, Globe } from 'lucide-react'

const BottomNav = () => {
  const { t, language, setLanguage, supportedLanguages, currentLanguageInfo } = useLanguage()
  const { user } = useAuth()
  const [showLangPicker, setShowLangPicker] = useState(false)
  const langRef = useRef(null)

  // Close picker on outside click
  useEffect(() => {
    if (!showLangPicker) return
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangPicker(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [showLangPicker])

  const allNavItems = [
    { path: '/', icon: Home, label: t('nav.home'), color: 'bg-pastel-green', authOnly: true },
    { path: '/analysis', icon: Camera, label: t('nav.analysis'), color: 'bg-pastel-blue' },
    { path: '/chat', icon: MessageCircle, label: t('nav.aiCoach'), color: 'bg-pastel-purple' },
    { path: '/learn', icon: BookOpen, label: t('nav.learn'), color: 'bg-pastel-orange' },
    { path: '/directory', icon: MapPin, label: t('nav.directory'), color: 'bg-pastel-pink' },
    { path: '/profile', icon: User, label: t('nav.profile'), color: 'bg-pastel-cyan', authOnly: true },
  ]

  const navItems = user
    ? allNavItems
    : allNavItems.filter(item => !item.authOnly)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light px-2 pt-2 pb-6 flex justify-around items-center z-50 safe-bottom">
      {navItems.map(({ path, icon: Icon, label, color }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              isActive ? 'bg-surface' : ''
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isActive ? color : 'bg-transparent'
              }`}>
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-text-muted'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] transition-colors ${
                isActive ? 'font-semibold text-text-DEFAULT' : 'font-medium text-text-muted'
              }`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}

      {/* Language picker for guest users on mobile */}
      {!user && (
        <div ref={langRef} className="relative">
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-text-muted" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium text-text-muted">
              {currentLanguageInfo?.flag || '🌐'}
            </span>
          </button>

          {showLangPicker && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-elevated border border-border-DEFAULT overflow-hidden z-50 min-w-[140px]">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setShowLangPicker(false)
                  }}
                  className={`flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-surface-hover transition-colors ${
                    language === lang.code ? 'bg-surface text-primary font-medium' : 'text-text-DEFAULT'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-xs">{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-primary text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default BottomNav
