import { useState, useEffect } from 'react'
import { motion } from '../lib/motion'
import { Sparkles, AlertTriangle } from 'lucide-react'

const NotFound = () => {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = 'https://cabelo.ai/'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        {/* Icon */}
        <div className="relative mb-6">
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <AlertTriangle className="w-10 h-10 text-white" />
          </motion.div>
          <motion.div
            className="absolute -inset-2 border-2 border-primary/20 rounded-[24px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold text-text-dark mb-2">404</h1>
        <p className="text-lg font-medium text-text-dark mb-2">Page not found</p>
        <p className="text-text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card w-full mb-6">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-text-dark font-medium">
              Redirecting to home page in <span className="text-primary font-bold text-lg">{countdown}</span>
            </p>
          </div>
        </div>

        {/* Manual link */}
        <a
          href="https://cabelo.ai/"
          className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button hover:shadow-button-hover transition-all"
        >
          Go to Home Page
        </a>
      </motion.div>
    </div>
  )
}

export default NotFound
