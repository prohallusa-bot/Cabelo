import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getAnalysis } from '../services/firebase'
import { ArrowLeft, Download, Share2, Copy, Check, Sparkles, Droplets, Sun, Shield } from 'lucide-react'

const ShareScore = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const cardRef = useRef(null)
  
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [shareStyle, setShareStyle] = useState('card')

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!user || !id) return
      
      try {
        const data = await getAnalysis(user.uid, id)
        setAnalysis(data)
      } catch (err) {
        console.error('Error fetching analysis:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [user, id])

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/shared/${id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Error copying:', err)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: 'My Hair Health Score',
      text: `Check out my hair health score: ${analysis?.score || 0}%`,
      url: `${window.location.origin}/shared/${id}`
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      handleCopyLink()
    }
  }

  const handleDownload = async () => {
    // In a real app, you'd use html2canvas or similar
    alert('Download feature coming soon!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              className="absolute -inset-2 border-2 border-primary/20 rounded-[24px]"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <p className="text-text-muted text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-text-primary font-medium mb-4">Analysis not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-light transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const styles = [
    { id: 'card', name: 'Card', bg: 'bg-white' },
    { id: 'dark', name: 'Dark', bg: 'bg-gray-900' },
    { id: 'gradient', name: 'Gradient', bg: 'bg-gradient-to-br from-pastel-purple to-pastel-blue' }
  ]

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
        <h1 className="font-semibold text-text-primary">Share Results</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-6">
        {/* Style Selector */}
        <div className="flex gap-2">
          {styles.map(style => (
            <button
              key={style.id}
              onClick={() => setShareStyle(style.id)}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
                shareStyle === style.id
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {style.name}
            </button>
          ))}
        </div>

        {/* Share Card Preview */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl overflow-hidden shadow-lg ${
            shareStyle === 'card' ? 'bg-white' :
            shareStyle === 'dark' ? 'bg-gray-900' :
            'bg-gradient-to-br from-pastel-purple to-pastel-blue'
          }`}
        >
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                shareStyle === 'dark' ? 'bg-white/10' : 'bg-pastel-cyan'
              }`}>
                <Sparkles className={`w-4 h-4 ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`} />
              </div>
              <span className={`font-semibold ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`}>
                Cabelo.ai
              </span>
            </div>

            {/* Score */}
            <div className="text-center mb-6">
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={shareStyle === 'dark' ? '#333' : '#F0F0F0'}
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={shareStyle === 'dark' ? '#fff' : '#1a1a1a'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    style={{
                      strokeDasharray: 263.9,
                      strokeDashoffset: 263.9 - (263.9 * (analysis.score || 0)) / 100
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`}>
                    {analysis.score || 0}
                  </span>
                  <span className={`text-sm font-medium ${shareStyle === 'dark' ? 'text-gray-400' : 'text-text-secondary'}`}>
                    {analysis.status || 'Good'}
                  </span>
                </div>
              </div>

              <h2 className={`text-lg font-semibold ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`}>
                My Hair Health Score
              </h2>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`rounded-xl p-3 text-center ${
                shareStyle === 'dark' ? 'bg-white/5' : 'bg-pastel-blue'
              }`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                  shareStyle === 'dark' ? 'bg-white/10' : 'bg-white'
                }`}>
                  <Droplets className={`w-4 h-4 ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`} />
                </div>
                <p className={`text-lg font-semibold ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`}>
                  {analysis.metrics?.hydration || 0}%
                </p>
                <p className={`text-xs ${shareStyle === 'dark' ? 'text-gray-400' : 'text-text-secondary'}`}>
                  Hydration
                </p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                shareStyle === 'dark' ? 'bg-white/5' : 'bg-pastel-orange'
              }`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                  shareStyle === 'dark' ? 'bg-white/10' : 'bg-white'
                }`}>
                  <Sun className={`w-4 h-4 ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`} />
                </div>
                <p className={`text-lg font-semibold ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`}>
                  {analysis.metrics?.shine || 0}%
                </p>
                <p className={`text-xs ${shareStyle === 'dark' ? 'text-gray-400' : 'text-text-secondary'}`}>
                  Shine
                </p>
              </div>
              <div className={`rounded-xl p-3 text-center ${
                shareStyle === 'dark' ? 'bg-white/5' : 'bg-pastel-green'
              }`}>
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                  shareStyle === 'dark' ? 'bg-white/10' : 'bg-white'
                }`}>
                  <Shield className={`w-4 h-4 ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`} />
                </div>
                <p className={`text-lg font-semibold ${shareStyle === 'dark' ? 'text-white' : 'text-text-primary'}`}>
                  {analysis.metrics?.strength || 0}%
                </p>
                <p className={`text-xs ${shareStyle === 'dark' ? 'text-gray-400' : 'text-text-secondary'}`}>
                  Strength
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`px-6 py-3 border-t ${
            shareStyle === 'dark' ? 'border-white/10' : 'border-border'
          }`}>
            <p className={`text-xs text-center ${shareStyle === 'dark' ? 'text-gray-500' : 'text-text-tertiary'}`}>
              Analyzed with Cabelo.ai • {new Date().toLocaleDateString()}
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleShare}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="py-3 bg-white border border-border text-text-primary font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-surface-hover transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="py-3 bg-white border border-border text-text-primary font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-surface-hover transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ShareScore
