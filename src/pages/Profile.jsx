import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getAnalyses } from '../services/firebase'
import LoginPrompt from '../components/auth/LoginPrompt'
import {
  Settings,
  ChevronRight,
  Flame,
  BarChart3,
  MessageCircle,
  Camera,
  Calendar,
  Image,
  User,
  Globe
} from 'lucide-react'

const Profile = () => {
  const navigate = useNavigate()
  const { user, userData } = useAuth()
  const { t, currentLanguageInfo } = useLanguage()
  const [analyses, setAnalyses] = useState([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const analysesData = await getAnalyses(user.uid, 20)
          setAnalyses(analysesData)
        } catch (error) {
          console.error('Error fetching data:', error)
        }
      }
    }
    fetchData()
  }, [user])

  // Not logged in state
  if (!user) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 rounded-full bg-surface flex items-center justify-center mb-6">
          <Camera className="w-12 h-12 text-text-light" />
        </div>
        <h1 className="text-xl font-bold text-text-dark mb-2">{t('profile.title')}</h1>
        <p className="text-text-muted text-center mb-6 max-w-xs">
          Sign in to view your profile, track progress, and access your analysis history.
        </p>
        <button
          onClick={() => setShowLoginPrompt(true)}
          className="px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button"
        >
          Sign In
        </button>
        
        <LoginPrompt
          isOpen={showLoginPrompt}
          onClose={() => setShowLoginPrompt(false)}
          type="save"
        />
      </div>
    )
  }

  const latestScore = analyses[0]?.score || 0
  const memberSince = userData?.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'

  const getStatusColor = (score) => {
    if (score >= 85) return 'text-green-600'
    if (score >= 70) return 'text-blue-600'
    if (score >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-background-light pb-24 lg:pb-8">
      {/* Header */}
      <header className="bg-gradient-to-b from-primary/10 to-background-light px-6 pt-8 pb-6">
        <div className="h-10 mb-6" />

        <div className="flex flex-col items-center">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-card mb-4"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-card mb-4">
              {user.displayName?.[0] || user.email?.[0] || '?'}
            </div>
          )}
          <h1 className="text-xl font-bold text-text-dark">{user.displayName || 'User'}</h1>
          <p className="text-text-muted text-sm">{user.email}</p>
          <p className="text-text-light text-xs mt-1">
            {t('profile.memberSince')} {memberSince}
          </p>
        </div>
      </header>

      {/* Stats Cards */}
      <main className="px-6 -mt-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getStatusColor(latestScore)}`}>
                  {latestScore}
                </p>
                <p className="text-xs text-text-muted">{t('profile.hairScore')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-dark">{userData?.streak || 0}</p>
                <p className="text-xs text-text-muted">{t('profile.streak')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-dark">{analyses.length}</p>
                <p className="text-xs text-text-muted">{t('profile.analyses')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-rose-border-light p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-dark">{userData?.chatCount || 0}</p>
                <p className="text-xs text-text-muted">{t('profile.chats')}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analysis History */}
        <div className="bg-white rounded-2xl border border-rose-border-light shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-rose-border-light">
            <h2 className="font-bold text-text-dark">{t('nav.history')}</h2>
            <span className="text-sm text-text-muted">{analyses.length} total</span>
          </div>

          {analyses.length > 0 ? (
            <div className="divide-y divide-rose-border-light">
              {analyses.map((analysis, index) => (
                <motion.button
                  key={analysis.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/results/${analysis.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <span className={`text-lg font-bold ${getStatusColor(analysis.score)}`}>
                      {analysis.score}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-text-dark">{analysis.status}</p>
                    <p className="text-xs text-text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {analysis.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                      <span className="mx-1">•</span>
                      {analysis.type === 'full' ? '4 photos' : '1 photo'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Camera className="w-12 h-12 text-text-light mx-auto mb-3" />
              <p className="text-text-muted mb-4">No analyses yet</p>
              <button
                onClick={() => navigate('/analysis')}
                className="text-primary font-bold"
              >
                Start your first analysis →
              </button>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('settings.title') || 'Settings'}
          </h2>

          {/* Account */}
          <div className="mb-4">
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
              {t('settings.account') || 'Account'}
            </p>
            <div className="bg-white rounded-2xl border border-rose-border-light overflow-hidden shadow-card">
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-full flex items-center gap-4 p-4 hover:bg-surface transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
                <span className="flex-1 text-left font-medium text-text-dark">
                  {t('settings.editProfile') || 'Edit Profile'}
                </span>
                <ChevronRight className="w-5 h-5 text-text-light" />
              </button>
              <button
                onClick={() => navigate('/myphotos')}
                className="w-full flex items-center gap-4 p-4 hover:bg-surface transition-colors border-t border-rose-border-light"
              >
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                  <Image className="w-5 h-5 text-text-muted" />
                </div>
                <span className="flex-1 text-left font-medium text-text-dark">
                  {t('profile.myPhotos') || 'My Photos'}
                </span>
                <ChevronRight className="w-5 h-5 text-text-light" />
              </button>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2 px-1">
              {t('settings.preferences') || 'Preferences'}
            </p>
            <div className="bg-white rounded-2xl border border-rose-border-light overflow-hidden shadow-card">
              <button
                onClick={() => navigate('/settings/language')}
                className="w-full flex items-center gap-4 p-4 hover:bg-surface transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                  <Globe className="w-5 h-5 text-text-muted" />
                </div>
                <span className="flex-1 text-left font-medium text-text-dark">
                  {t('settings.language') || 'Language'}
                </span>
                <span className="text-text-muted text-sm">{currentLanguageInfo?.name}</span>
                <ChevronRight className="w-5 h-5 text-text-light" />
              </button>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}

export default Profile
