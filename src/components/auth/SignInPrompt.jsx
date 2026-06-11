import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { X, Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react'

const SignInPrompt = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { signIn, forgotPassword } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const validateForm = () => {
    setError(null)

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (!showForgotPassword && !password) {
      setError('Please enter your password')
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

      if (showForgotPassword) {
        await forgotPassword(email)
        setSuccess('Password reset email sent! Check your inbox.')
        setTimeout(() => {
          setShowForgotPassword(false)
          setSuccess(null)
        }, 3000)
      } else {
        await signIn(email, password)
        onClose()
      }
    } catch (err) {
      console.error('Auth error:', err)

      const errorCode = err.code || ''

      if (errorCode === 'auth/invalid-credential' ||
          errorCode === 'auth/wrong-password' ||
          errorCode === 'auth/user-not-found') {
        setError('Invalid email or password')
      } else if (errorCode === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else if (errorCode === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.')
      } else if (errorCode === 'auth/invalid-email') {
        setError('Please enter a valid email address')
      } else {
        setError('Failed to sign in. Please try again.')
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
            <h2 className="text-xl font-bold text-text-dark text-center mb-6">
              {showForgotPassword ? 'Reset Password' : 'Sign in to save your results'}
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {/* Password - not for reset */}
              {!showForgotPassword && (
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
              )}

              {/* Forgot password link */}
              {!showForgotPassword && (
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              )}

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <p className="text-red-600 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-green-600 text-sm text-center font-medium">{success}</p>
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
                  showForgotPassword ? 'Send Reset Link' : 'Sign In'
                )}
              </button>
            </form>

            {/* Switch to Register or back to sign in */}
            <div className="mt-4 text-center text-sm">
              {showForgotPassword ? (
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setError(null)
                    setSuccess(null)
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  Back to Sign In
                </button>
              ) : (
                <p className="text-text-muted">
                  Don't have an account?{' '}
                  <button
                    onClick={onSwitchToRegister}
                    className="text-primary font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SignInPrompt
