import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import LoginPrompt from '../auth/LoginPrompt'
import {
  Home,
  Camera,
  MessageCircle,
  BookOpen,
  User,
  Settings,
  LogOut,
  Sparkles,
  Globe,
  ChevronDown,
  ChevronLeft,
  Shield,
  Zap,
  MapPin
} from 'lucide-react'

const Sidebar = ({ isOpen = true, onToggle }) => {
  const navigate = useNavigate()
  const { user, signOut, isAdmin } = useAuth()
  const { t, language, setLanguage, supportedLanguages, currentLanguageInfo } = useLanguage()
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState('signup')

  const allNavItems = [
    { path: '/', icon: Home, label: t('nav.dashboard'), color: 'bg-pastel-green', authOnly: true },
    { path: '/analysis', icon: Camera, label: t('nav.analysis'), color: 'bg-pastel-blue' },
    { path: '/chat', icon: MessageCircle, label: t('nav.aiCoach'), color: 'bg-pastel-purple' },
    { path: '/learn', icon: BookOpen, label: t('nav.learn'), color: 'bg-pastel-orange' },
    { path: '/directory', icon: MapPin, label: t('nav.directory'), color: 'bg-pastel-pink' },
    { path: '/profile', icon: User, label: t('profile.title'), color: 'bg-pastel-cyan', authOnly: true },
  ]

  const navItems = user
    ? allNavItems
    : allNavItems.filter(item => !item.authOnly)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Guest users get the compact 180px sidebar
  if (!user) {
    return (
      <aside className="fixed left-0 top-0 w-[180px] h-screen bg-surface-light border-r border-border-light flex flex-col z-40">
        {/* Logo */}
        <div className="p-5 pb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-pastel-cyan flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-text-primary" />
            </div>
            <span className="font-semibold text-text-primary text-base">Cabelo.ai</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label, color }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-white border border-border-DEFAULT shadow-clean'
                    : 'hover:bg-white hover:border hover:border-border-light'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  </div>
                  <span className={`text-sm ${isActive ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Language Selector */}
        <div className="px-3 py-2 border-t border-border-light">
          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-2 w-full px-2 py-2 text-text-secondary hover:bg-white rounded-xl transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span className="flex-1 text-left text-xs">
                {currentLanguageInfo?.flag} {currentLanguageInfo?.name}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLangDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-elevated border border-border-DEFAULT overflow-hidden z-50">
                {supportedLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangDropdown(false)
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
        </div>

        {/* Register / Sign In */}
        <div className="p-4 pt-2 space-y-2">
          <button
            onClick={() => { setLoginMode('signup'); setShowLogin(true) }}
            className="w-full py-2.5 text-sm font-medium text-text-DEFAULT bg-white border border-border-DEFAULT rounded-xl hover:bg-surface-hover transition-colors"
          >
            Register
          </button>
          <button
            onClick={() => { setLoginMode('signin'); setShowLogin(true) }}
            className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
          >
            Sign In
          </button>
        </div>

        <LoginPrompt
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          initialMode={loginMode}
          onContinueAsGuest={() => setShowLogin(false)}
        />
      </aside>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-border-DEFAULT rounded-xl shadow-soft hover:bg-surface-hover transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-text-secondary rotate-180" />
      </button>
    )
  }

  return (
    <aside className="fixed left-0 top-0 w-[280px] h-screen bg-surface-light border-r border-border-light flex flex-col z-40 transition-all duration-300">
      {/* Header */}
      <div className="p-5 border-b border-border-light">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pastel-green to-pastel-cyan flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-semibold text-text-DEFAULT tracking-tight">Cabelo.ai</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/analysis')}
            className="flex items-center gap-2 px-3 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-light transition-all duration-200"
          >
            <Camera className="w-4 h-4" />
            {t('nav.scanHair')}
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border-DEFAULT rounded-xl text-sm font-medium text-text-DEFAULT hover:bg-surface-hover transition-all duration-200"
          >
            <Zap className="w-4 h-4" />
            {t('nav.askAI')}
          </button>
        </div>
      </div>

      {/* Tools/Navigation */}
      <div className="flex-1 overflow-y-auto px-4 subtle-scrollbar">
        <div className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 mb-3">
          {t('nav.tools')}
        </div>

        <nav className="space-y-1">
          {navItems.map(({ path, icon: Icon, label, color }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white border border-border-DEFAULT shadow-clean'
                    : 'hover:bg-white hover:border hover:border-border-light'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  </div>
                  <span className={`text-sm ${isActive ? 'font-medium text-text-DEFAULT' : 'text-text-secondary'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Admin link */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-white border border-border-DEFAULT shadow-clean'
                    : 'hover:bg-white hover:border hover:border-border-light'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="w-8 h-8 rounded-lg bg-pastel-yellow flex items-center justify-center transition-transform group-hover:scale-105">
                    <Shield className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                  </div>
                  <span className={`text-sm ${isActive ? 'font-medium text-text-DEFAULT' : 'text-text-secondary'}`}>
                    {t('nav.admin')}
                  </span>
                </>
              )}
            </NavLink>
          )}
        </nav>

      </div>

      {/* Language Selector */}
      <div className="px-4 py-3 border-t border-border-light">
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 w-full px-3 py-2.5 text-text-secondary hover:bg-white rounded-xl transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="flex-1 text-left text-sm">
              {currentLanguageInfo?.flag} {currentLanguageInfo?.name}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLangDropdown && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-elevated border border-border-DEFAULT overflow-hidden z-50 animate-slide-up">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code)
                    setShowLangDropdown(false)
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-surface-hover transition-colors ${
                    language === lang.code ? 'bg-surface text-primary font-medium' : 'text-text-DEFAULT'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-primary">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="px-4 pb-5 pt-2 border-t border-border-light">
        <div className="flex items-center gap-3 p-2">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-pastel-green flex items-center justify-center text-sm font-medium text-text-DEFAULT">
              {user.displayName?.[0] || user.email?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-text-DEFAULT truncate">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs text-text-muted truncate">
              {user.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            title={t('common.signOut')}
          >
            <LogOut className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
