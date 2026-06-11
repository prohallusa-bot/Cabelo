import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { deleteUserAccount } from '../services/firebase'
import {
  User,
  Globe,
  Trash2,
  ChevronRight,
  AlertTriangle,
  ArrowLeft,
  Image
} from 'lucide-react'

const Settings = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { t, currentLanguageInfo } = useLanguage()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return

    setDeleting(true)
    try {
      await deleteUserAccount(user.uid)
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Could not delete account. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  // Show nothing while redirecting
  if (!user) {
    return null
  }

  const settingsSections = [
    {
      title: t('settings.account'),
      items: [
        {
          icon: User,
          label: t('settings.editProfile'),
          onClick: () => navigate('/profile/edit'),
        },
        {
          icon: Image,
          label: t('profile.myPhotos') || 'My Photos',
          onClick: () => navigate('/myphotos'),
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          icon: Globe,
          label: t('settings.language'),
          value: currentLanguageInfo?.name,
          onClick: () => navigate('/settings/language'),
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background-light pb-8">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 bg-white/80 glass border-b border-rose-border-light lg:hidden">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text-dark"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-text-dark">{t('settings.title')}</h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        <h1 className="hidden lg:block text-2xl font-bold text-text-dark mb-6">
          {t('settings.title')}
        </h1>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-3 px-1">
                {section.title}
              </h2>
              <div className="bg-white rounded-2xl border border-rose-border-light overflow-hidden shadow-card">
                {section.items.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-4 p-4 hover:bg-surface transition-colors ${
                      index > 0 ? 'border-t border-rose-border-light' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-text-muted" />
                    </div>
                    <span className="flex-1 text-left font-medium text-text-dark">
                      {item.label}
                    </span>
                    {item.value && (
                      <span className="text-text-muted text-sm">{item.value}</span>
                    )}
                    <ChevronRight className="w-5 h-5 text-text-light" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Danger Zone */}
          <div>
            <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-3 px-1">
              {t('settings.dangerZone')}
            </h2>
            <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <span className="flex-1 text-left font-medium text-red-600">
                  {t('settings.deleteAccount')}
                </span>
                <ChevronRight className="w-5 h-5 text-red-300" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-text-dark">
                {t('settings.deleteAccount')}
              </h2>
            </div>
            
            <p className="text-text-muted text-sm mb-6">
              {t('settings.deleteAccountWarning')}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-dark mb-2">
                {t('settings.typeDelete')}
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-3 border border-rose-border-light rounded-xl focus:outline-none focus:border-red-400"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirm('')
                }}
                className="flex-1 py-3 bg-surface text-text-dark font-bold rounded-xl"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {deleting ? '...' : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
