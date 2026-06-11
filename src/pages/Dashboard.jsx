import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getAnalyses } from '../services/firebase'
import {
  Camera,
  MessageCircle,
  Share2,
  Droplets,
  Sun,
  Dumbbell,
  Flame,
  BarChart3,
  ArrowRight,
  Settings,
  ChevronRight,
  Sparkles,
  ScanLine,
  MapPin,
  AlertTriangle
} from 'lucide-react'

const WATER_API_URL = 'https://api.cabelo.ai/api/water'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, userData } = useAuth()
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [waterData, setWaterData] = useState(null)
  const [waterLoading, setWaterLoading] = useState(false)
  const [waterError, setWaterError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const data = await getAnalyses(user.uid, 10)
          setAnalyses(data)
          if (data.length > 0) {
            setLatestAnalysis(data[0])
          }
        } catch (error) {
          console.error('Error fetching analyses:', error)
        }
      }
    }
    fetchData()
  }, [user])

  // Fetch water quality data
  useEffect(() => {
    const fetchWater = async () => {
      const city = userData?.city
      if (!city) {
        setWaterError('no_city')
        return
      }
      setWaterLoading(true)
      setWaterError(null)
      try {
        const res = await fetch(WATER_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city })
        })
        const data = await res.json()
        if (data.found) {
          setWaterData(data)
        } else {
          setWaterError('not_found')
        }
      } catch {
        setWaterError('api_error')
      } finally {
        setWaterLoading(false)
      }
    }
    if (user) fetchWater()
  }, [user, userData?.city])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.goodMorning')
    if (hour < 18) return t('dashboard.goodAfternoon')
    return t('dashboard.goodEvening')
  }

  const getStatusLabel = (score) => {
    if (score >= 85) return t('dashboard.excellent')
    if (score >= 70) return t('dashboard.good')
    if (score >= 50) return t('dashboard.fair')
    return t('dashboard.needsAttention')
  }

  const getStatusColor = (score) => {
    if (score >= 85) return 'text-green-600 bg-green-50'
    if (score >= 70) return 'text-blue-600 bg-blue-50'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // Default values when no analysis exists
  const score = latestAnalysis?.score || 0
  const metrics = latestAnalysis?.metrics || { hydration: 0, shine: 0, strength: 0 }
  const tips = latestAnalysis?.tips || []

  // Placeholder tips if none exist
  const defaultTips = [
    {
      title: 'Deep Hydration',
      description: 'Use a hydrating mask with hyaluronic acid and aloe vera weekly to maintain moisture balance.',
      category: 'Hydration',
      icon: Droplets,
      color: 'blue'
    },
    {
      title: 'Frizz Control',
      description: 'Apply a light oil like argan or grape seed to damp hair to create a humidity barrier.',
      category: 'Frizz Control',
      icon: Sun,
      color: 'yellow'
    },
    {
      title: 'Strengthen with Keratin',
      description: 'Keratin treatments repair damaged cuticles and reduce breakage. Ideal for chemically treated hair.',
      category: 'Strength',
      icon: Dumbbell,
      color: 'green'
    }
  ]

  const displayTips = tips.length > 0 ? tips : defaultTips

  return (
    <div className="min-h-screen bg-background-light p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <p className="text-text-muted text-sm">{getGreeting()}</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-dark">
            {t('dashboard.welcomeBack')}, {user?.displayName?.split(' ')[0] || 'there'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-white border border-rose-border-light flex items-center justify-center shadow-card lg:hidden"
          >
            <Settings className="w-5 h-5 text-text-dark" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hair Health Score Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-border-light p-6 shadow-card self-start">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-dark">{t('dashboard.hairHealth')}</h2>
              <p className="text-sm text-text-muted">
                {latestAnalysis ? t('dashboard.updatedToday') : 'No analysis yet'}
              </p>
            </div>
            {latestAnalysis && (
              <span className="px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 bg-green-50 text-green-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                +5%
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
            {/* Score Circle */}
            <div className="relative w-32 h-32 lg:w-36 lg:h-36 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#ffe4ea"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 251.2,
                    strokeDashoffset: 251.2 - (251.2 * score) / 100,
                    transition: 'stroke-dashoffset 1s ease-out'
                  }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ee2b5b" />
                    <stop offset="100%" stopColor="#ff6b8a" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-text-dark">{score}</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${getStatusColor(score)}`}>
                  {getStatusLabel(score)}
                </span>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="flex-1 grid grid-cols-3 gap-3 lg:gap-4 w-full">
              <div className="bg-blue-50 rounded-xl p-3 lg:p-4 text-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <Droplets className="w-4 h-4 lg:w-5 lg:h-5 text-blue-500" />
                </div>
                <p className="text-xl lg:text-2xl font-bold text-text-dark">{metrics.hydration}%</p>
                <p className="text-xs text-text-muted">{t('dashboard.hydration')}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 lg:p-4 text-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-2">
                  <Sun className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-500" />
                </div>
                <p className="text-xl lg:text-2xl font-bold text-text-dark">{metrics.shine}%</p>
                <p className="text-xs text-text-muted">{t('dashboard.shine')}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 lg:p-4 text-center">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <Dumbbell className="w-4 h-4 lg:w-5 lg:h-5 text-green-500" />
                </div>
                <p className="text-xl lg:text-2xl font-bold text-text-dark">{metrics.strength}%</p>
                <p className="text-xs text-text-muted">{t('dashboard.strength')}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/analysis')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button flex items-center gap-2 hover:shadow-soft transition-all"
          >
            <Camera className="w-5 h-5" />
            {t('dashboard.newAnalysis')}
          </button>
        </div>

        {/* Water Quality + Quick Stats */}
        <div className="space-y-4">
          {/* Water Quality Card - Top placement */}
          <WaterQualityCard
            waterData={waterData}
            waterLoading={waterLoading}
            waterError={waterError}
            navigate={navigate}
            t={t}
          />

          <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-text-dark">{analyses.length}</p>
                <p className="text-xs text-text-muted">{t('dashboard.totalAnalyses')}</p>
              </div>
              {analyses.length === 0 && (
                <button
                  onClick={() => navigate('/analysis')}
                  className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Try now
                </button>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-dark">{userData?.streak || 0}</p>
                <p className="text-xs text-text-muted">{t('dashboard.dayStreak')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-text-dark">{userData?.chatCount || 0}</p>
                <p className="text-xs text-text-muted">{t('dashboard.aiChats')}</p>
              </div>
              {(userData?.chatCount || 0) === 0 && (
                <button
                  onClick={() => navigate('/chat')}
                  className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Try now
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile */}
        <div className="lg:hidden grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-bold text-text-dark">{t('nav.aiCoach')}</span>
          </button>
          <button
            onClick={() => navigate('/analysis')}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <ScanLine className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-sm font-bold text-text-dark">{t('nav.analysis')}</span>
          </button>
          <button
            onClick={() => navigate('/directory')}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm font-bold text-text-dark">{t('nav.directory') || 'Directory'}</span>
          </button>
        </div>

        {/* Tips Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-rose-border-light p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-text-dark">{t('dashboard.tipsForYou')}</h2>
              <p className="text-sm text-text-muted">{t('dashboard.basedOnAnalysis')}</p>
            </div>
            <button
              onClick={() => navigate('/learn')}
              className="text-sm font-bold text-primary flex items-center gap-1"
            >
              {t('common.seeAll')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayTips.slice(0, 4).map((tip, index) => {
              const Icon = tip.icon || Sparkles
              const colorClasses = {
                blue: 'from-blue-50 to-white border-blue-100',
                yellow: 'from-yellow-50 to-white border-yellow-100',
                green: 'from-green-50 to-white border-green-100',
                purple: 'from-purple-50 to-white border-purple-100'
              }
              const iconColorClasses = {
                blue: 'bg-blue-100 text-blue-500',
                yellow: 'bg-yellow-100 text-yellow-500',
                green: 'bg-green-100 text-green-500',
                purple: 'bg-purple-100 text-purple-500'
              }
              const color = tip.color || ['blue', 'yellow', 'green', 'purple'][index % 4]
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 lg:p-5 border`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${iconColorClasses[color]} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-text-dark">{tip.title}</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">
                    {tip.description}
                  </p>
                  <button
                    onClick={() => navigate('/learn')}
                    className="text-sm font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    {t('common.learnMore')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* History Section */}
        <div className="bg-white rounded-2xl border border-rose-border-light p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text-dark">{t('dashboard.yourProgress')}</h2>
            <button className="text-sm font-bold text-primary">{t('common.seeAll')}</button>
          </div>
          
          <div className="space-y-3">
            {analyses.length > 0 ? (
              analyses.slice(0, 4).map((analysis, index) => (
                <button
                  key={analysis.id}
                  onClick={() => navigate(`/results/${analysis.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-surface-light rounded-xl hover:bg-surface transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <span className="font-bold text-primary">{analysis.score}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-text-dark text-sm">{getStatusLabel(analysis.score)}</p>
                    <p className="text-xs text-text-muted">
                      {analysis.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                    </p>
                  </div>
                  {analyses[index + 1] && (
                    <span className="text-xs text-green-600 font-bold">
                      +{Math.max(0, analysis.score - analyses[index + 1].score)}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-text-muted text-sm mb-4">No analyses yet</p>
                <button
                  onClick={() => navigate('/analysis')}
                  className="text-primary font-bold text-sm"
                >
                  Start your first analysis →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Water Quality Card Component
const WaterQualityCard = ({ waterData, waterLoading, waterError, navigate, t }) => {
  const [expanded, setExpanded] = useState(false)

  const getScoreColor = (level) => {
    switch (level) {
      case 'low': return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Good for Hair' }
      case 'moderate': return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Could Be Better' }
      case 'high': case 'very_high': return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Needs Attention' }
      default: return { text: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Unknown' }
    }
  }

  const getHardnessPercent = (classification) => {
    switch (classification) {
      case 'Soft': return 15
      case 'Moderately Hard': return 40
      case 'Hard': return 65
      case 'Very Hard': return 90
      default: return 50
    }
  }

  const getMineralStatus = (key, value) => {
    if (value == null) return null
    const thresholds = { chlorine: [1, 2], iron: [0.1, 0.3], copper: [0.05, 0.1], aluminum: [0.1, 0.2] }
    const t = thresholds[key]
    if (!t) return { status: 'normal', color: 'bg-green-100 text-green-700' }
    if (value > t[1]) return { status: 'HIGH', color: 'bg-red-100 text-red-700' }
    if (value > t[0]) return { status: 'ELEVATED', color: 'bg-yellow-100 text-yellow-700' }
    return { status: 'NORMAL', color: 'bg-green-100 text-green-700' }
  }

  // No city set
  if (waterError === 'no_city') {
    return (
      <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-text-dark text-sm">Water Quality</p>
            <p className="text-xs text-text-muted">Your local water data</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm text-amber-800 font-medium">City not set</p>
            <p className="text-xs text-amber-600">Add your city in profile settings to see water data</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/profile/edit')}
          className="mt-3 w-full py-2.5 text-sm font-bold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors"
        >
          Update Profile
        </button>
      </div>
    )
  }

  // Loading
  if (waterLoading) {
    return (
      <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-text-dark text-sm">Water Quality</p>
            <p className="text-xs text-text-muted">Loading...</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-blue-300 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  // API error or not found
  if (waterError || !waterData) {
    return (
      <div className="bg-white rounded-2xl border border-rose-border-light p-5 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="font-bold text-text-dark text-sm">Water Quality</p>
            <p className="text-xs text-text-muted">-</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-muted">No water data available for your city</p>
      </div>
    )
  }

  // Data loaded
  const city = waterData.city
  const wq = waterData.water_quality || {}
  const impact = waterData.hair_impact || {}
  const scoreStyle = getScoreColor(impact.level)
  const hardnessPercent = getHardnessPercent(city.classification)

  const minerals = [
    { key: 'chlorine', label: 'Cl', name: 'Chlorine', unit: 'mg/L', value: wq.chlorine },
    { key: 'iron', label: 'Fe', name: 'Iron', unit: 'mg/L', value: wq.iron },
    { key: 'copper', label: 'Cu', name: 'Copper', unit: 'mg/L', value: wq.copper },
  ].filter(m => m.value != null)

  return (
    <div className="bg-white rounded-2xl border border-rose-border-light shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-50 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-text-dark text-sm">Water Quality</p>
              <p className="text-xs text-text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {city.name}, {city.state}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${scoreStyle.bg} ${scoreStyle.text} border ${scoreStyle.border}`}>
            {scoreStyle.label}
          </span>
        </div>

        {/* Hardness Meter */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-medium text-text-muted">Water Hardness</span>
            <div>
              <span className="text-xl font-bold text-text-dark">{city.hardness}</span>
              <span className="text-xs text-text-muted ml-1">mg/L</span>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 opacity-30 rounded-full" />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-800 rounded-full border-2 border-white shadow-sm"
              style={{ left: `${hardnessPercent}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-text-muted">
            <span>Soft</span>
            <span>Moderate</span>
            <span>Hard</span>
            <span>Very Hard</span>
          </div>
        </div>
      </div>

      {/* Expandable Minerals */}
      {minerals.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            {expanded ? 'Hide Details' : 'See Mineral Breakdown'}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>

          {expanded && (
            <div className="px-5 pb-4 grid grid-cols-3 gap-2">
              {minerals.map(m => {
                const st = getMineralStatus(m.key, m.value)
                return (
                  <div key={m.key} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-xs font-bold text-text-muted mb-0.5">{m.label}</p>
                    <p className="text-sm font-bold text-text-dark">{m.value}</p>
                    <p className="text-[10px] text-text-muted">{m.name} ({m.unit})</p>
                    {st && (
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold ${st.color}`}>
                        {st.status}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Hair Impact Tip */}
      {impact.level && impact.level !== 'low' && (
        <div className="mx-5 mb-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            {(impact.effects_en || [])[0] || `${city.classification} water may affect your hair`}
          </p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
