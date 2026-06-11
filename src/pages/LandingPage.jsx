import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import LoginPrompt from '../components/auth/LoginPrompt'
import { Sparkles, Camera, MessageCircle, BookOpen, MapPin, Search, Compass, Send } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()
  const { getRemainingGuestMessages } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [loginMode, setLoginMode] = useState('signup')
  const [chatInput, setChatInput] = useState('')
  const chatInputRef = useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const guestNavItems = [
    { icon: Camera, label: 'Analysis', action: () => navigate('/analysis'), color: 'bg-pastel-green' },
    { icon: MessageCircle, label: 'AI Coach', action: null, color: 'bg-pastel-purple', active: true },
    { icon: BookOpen, label: 'Learn', action: () => navigate('/learn'), color: 'bg-pastel-orange' },
    { icon: MapPin, label: 'Directory', action: () => navigate('/directory'), color: 'bg-pastel-pink' },
  ]

  const quickActions = [
    { icon: Search, label: 'Analyse hair', action: () => navigate('/quick-scan') },
    { icon: Compass, label: 'Find hair professional near me', action: () => navigate('/directory') },
    { icon: Sparkles, label: 'Hair care tips', action: () => navigate('/learn') },
  ]

  const handleRegister = () => {
    setLoginMode('signup')
    setShowLogin(true)
  }

  const handleSignIn = () => {
    setLoginMode('signin')
    setShowLogin(true)
  }

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return
    navigate('/chat', { state: { initialMessage: chatInput.trim() } })
  }

  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSubmit()
    }
  }

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop Sidebar */}
      {!isMobile && (
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
            {guestNavItems.map(({ icon: Icon, label, action, color, active }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-white border border-border-DEFAULT shadow-clean'
                    : 'hover:bg-white hover:border hover:border-border-light'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-text-secondary'}`} />
                </div>
                <span className={`text-sm ${active ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                  {label}
                </span>
              </button>
            ))}
          </nav>

          {/* Register / Sign In */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleRegister}
              className="w-full py-2.5 text-sm font-medium text-text-primary bg-white border border-border-DEFAULT rounded-xl hover:bg-surface-hover transition-colors"
            >
              Register
            </button>
            <button
              onClick={handleSignIn}
              className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Sign In
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col items-center justify-center ${!isMobile ? 'ml-[180px]' : ''} min-h-screen px-6`}>
        {/* Mobile Header */}
        {isMobile && (
          <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg px-4 py-3 flex items-center justify-between border-b border-border-light">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pastel-cyan flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-text-primary" />
              </div>
              <span className="font-semibold text-text-primary">Cabelo.ai</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegister}
                className="px-3 py-1.5 text-xs font-medium text-text-primary border border-border-DEFAULT rounded-lg hover:bg-surface-hover transition-colors"
              >
                Register
              </button>
              <button
                onClick={handleSignIn}
                className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign In
              </button>
            </div>
          </header>
        )}

        <div className={`w-full max-w-2xl text-center ${isMobile ? 'pt-20 pb-28' : ''}`}>
          {/* Sparkle Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-14 h-14 mx-auto mb-8 rounded-2xl bg-gray-900 flex items-center justify-center"
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl lg:text-4xl font-bold text-text-primary mb-10"
          >
            How can I help with your hair today?
          </motion.h1>

          {/* Input Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 max-w-xl mx-auto"
          >
            <div className="relative bg-white border border-border-DEFAULT rounded-2xl shadow-clean focus-within:border-primary transition-colors">
              <div className="flex items-center gap-2 px-4 py-3">
                <Camera
                  className="w-5 h-5 text-text-muted flex-shrink-0 cursor-pointer hover:text-text-primary transition-colors"
                  onClick={() => navigate('/quick-scan')}
                />
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyPress}
                  placeholder="Ask anything about hair care..."
                  className="flex-1 bg-transparent outline-none text-text-primary placeholder-text-muted text-sm"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim()}
                  className="p-1.5 text-text-muted disabled:opacity-30 disabled:cursor-not-allowed hover:text-text-primary transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick Action Chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {quickActions.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-DEFAULT rounded-full text-sm text-text-secondary hover:border-text-tertiary hover:text-text-primary transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </motion.div>

          {/* Free messages text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-text-muted"
          >
            {getRemainingGuestMessages()} free messages remaining.{' '}
            <button onClick={handleSignIn} className="font-semibold text-text-primary hover:underline">
              Sign in
            </button>{' '}
            for unlimited access.
          </motion.p>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light px-4 pt-2 pb-6 flex justify-around items-center z-50 safe-bottom">
          {guestNavItems.map(({ icon: Icon, label, action, color, active }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                active ? color : 'bg-transparent'
              }`}>
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-primary' : 'text-text-muted'
                  }`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] transition-colors ${
                active ? 'font-semibold text-text-DEFAULT' : 'font-medium text-text-muted'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </nav>
      )}

      {/* Login Modal */}
      <LoginPrompt
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        initialMode={loginMode}
        onContinueAsGuest={() => {
          setShowLogin(false)
          navigate('/chat')
        }}
      />
    </div>
  )
}

export default LandingPage
