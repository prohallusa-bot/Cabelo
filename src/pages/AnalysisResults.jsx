import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getAnalysis, getUserPhotos } from '../services/firebase'
import { ArrowLeft, Share2, Droplets, Sun, Shield, Sparkles, TrendingUp, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'

const AnalysisResults = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  
  const [analysis, setAnalysis] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      try {
        // getAnalysis only needs the analysis ID, not user ID
        const analysisData = await getAnalysis(id)
        setAnalysis(analysisData)

        // Only fetch photos if user is logged in
        if (user) {
          const photosData = await getUserPhotos(user.uid, id)
          setPhotos(photosData)
        }
      } catch (err) {
        console.error('Error fetching analysis:', err)
        setError('Could not load analysis results')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, id])

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
          <p className="text-text-muted text-sm font-medium">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-text-primary font-medium mb-4">{error || 'Analysis not found'}</p>
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'details', label: 'Details' },
    { id: 'recommendations', label: 'Tips' }
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
        <h1 className="font-semibold text-text-primary">{t('results.title')}</h1>
        <button
          onClick={() => navigate(`/share/${id}`)}
          className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Score Hero */}
      <div className="bg-white border-b border-border px-6 py-8">
        <div className="max-w-lg mx-auto flex items-center gap-6">
          {/* Score Circle */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#F0F0F0" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="8"
                strokeLinecap="round"
                style={{
                  strokeDasharray: 263.9,
                  strokeDashoffset: 263.9 - (263.9 * (analysis.score || 0)) / 100
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-text-primary">{analysis.score || 0}</span>
              <span className="text-xs font-medium text-text-secondary">{analysis.status || 'Good'}</span>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              {t('results.yourScore')}
            </h2>
            <p className="text-text-secondary text-sm mb-3">
              {new Date(analysis.createdAt?.toDate?.() || analysis.createdAt).toLocaleDateString()}
            </p>
            {analysis.type === 'full' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pastel-purple rounded-full text-sm font-medium text-text-primary">
                <Sparkles className="w-3 h-3" />
                Full Analysis
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-border px-6">
        <div className="max-w-lg mx-auto flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-text-primary text-text-primary'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="p-6 max-w-lg mx-auto space-y-4">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-pastel-blue rounded-2xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-text-primary" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{analysis.metrics?.hydration || 0}%</p>
                <p className="text-xs text-text-secondary">{t('dashboard.hydration')}</p>
              </div>
              <div className="bg-pastel-orange rounded-2xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white flex items-center justify-center">
                  <Sun className="w-5 h-5 text-text-primary" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{analysis.metrics?.shine || 0}%</p>
                <p className="text-xs text-text-secondary">{t('dashboard.shine')}</p>
              </div>
              <div className="bg-pastel-green rounded-2xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white flex items-center justify-center">
                  <Shield className="w-5 h-5 text-text-primary" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{analysis.metrics?.strength || 0}%</p>
                <p className="text-xs text-text-secondary">{t('dashboard.strength')}</p>
              </div>
            </div>

            {/* Hair Profile */}
            <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
              <h3 className="font-semibold text-text-primary mb-3">{t('results.hairProfile')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t('results.type'), value: analysis.hairProfile?.type },
                  { label: t('results.porosity'), value: analysis.hairProfile?.porosity },
                  { label: t('results.texture'), value: analysis.hairProfile?.texture },
                  { label: t('results.density'), value: analysis.hairProfile?.density }
                ].map((item, i) => (
                  <div key={i} className="bg-surface rounded-xl p-3">
                    <p className="text-xs text-text-tertiary mb-1">{item.label}</p>
                    <p className="font-medium text-text-primary">{item.value || 'Unknown'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
                <h3 className="font-semibold text-text-primary mb-3">Photos</h3>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface">
                      <img src={photo.url} alt={`Hair ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'details' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Concerns */}
            {analysis.concerns?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Areas to Address
                </h3>
                <div className="space-y-2">
                  {analysis.concerns.map((concern, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-pastel-peach rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium">{i + 1}</span>
                      </div>
                      <p className="text-sm text-text-primary">{concern}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {analysis.strengths?.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
                <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Strengths
                </h3>
                <div className="space-y-2">
                  {analysis.strengths.map((strength, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-pastel-green rounded-xl">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <p className="text-sm text-text-primary">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {analysis.summary && (
              <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
                <h3 className="font-semibold text-text-primary mb-3">Summary</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{analysis.summary}</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'recommendations' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {analysis.recommendations?.map((rec, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-border p-4 shadow-clean flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  i % 4 === 0 ? 'bg-pastel-blue' :
                  i % 4 === 1 ? 'bg-pastel-green' :
                  i % 4 === 2 ? 'bg-pastel-purple' :
                  'bg-pastel-orange'
                }`}>
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary">{rec}</p>
                </div>
              </div>
            ))}

            {(!analysis.recommendations || analysis.recommendations.length === 0) && (
              <div className="text-center py-8">
                <p className="text-text-tertiary">No specific recommendations available</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => navigate('/chat')}
              className="w-full mt-4 py-4 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
            >
              Get Personalized Advice
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default AnalysisResults
