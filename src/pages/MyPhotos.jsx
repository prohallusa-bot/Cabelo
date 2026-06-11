import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from '../lib/motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getUserAnalysisPhotos } from '../services/firebase'
import { ArrowLeft, Image, X, Calendar, ChevronRight, Camera, Sparkles, ArrowUpDown } from 'lucide-react'

const MyPhotos = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest'

  const getPhotoDate = (photo) => {
    if (photo.createdAt?.toDate) return photo.createdAt.toDate()
    if (photo.createdAt) return new Date(photo.createdAt)
    return new Date(0)
  }

  const sortedPhotos = [...photos].sort((a, b) => {
    const dateA = getPhotoDate(a)
    const dateB = getPhotoDate(b)
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
  })

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user) {
        navigate('/')
        return
      }

      try {
        const photosData = await getUserAnalysisPhotos(user.uid)
        setPhotos(photosData)
      } catch (err) {
        console.error('Error fetching photos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [user, navigate])

  if (!user) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
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
          <p className="text-text-muted text-sm font-medium">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-light pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 bg-white/80 glass border-b border-rose-border-light">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text-dark hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-text-dark flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            {t('profile.myPhotos') || 'My Photos'}
          </h1>
          {photos.length > 0 && (
            <p className="text-xs text-text-muted">
              {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
            </p>
          )}
        </div>
        {photos.length > 0 && (
          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-text-secondary bg-surface rounded-lg hover:bg-surface-hover transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortOrder === 'newest'
              ? (t('photos.sortNewest') || 'Newest first')
              : (t('photos.sortOldest') || 'Oldest first')}
          </button>
        )}
      </header>

      <main className="p-6 max-w-4xl mx-auto">
        {photos.length === 0 ? (
          /* Empty State - Beautiful UX */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            {/* Decorative Icon */}
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Camera className="w-14 h-14 text-primary/40" />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-text-dark mb-3 text-center">
              {t('photos.emptyTitle') || 'Your Photo Gallery'}
            </h2>

            {/* Description */}
            <p className="text-text-muted text-center max-w-sm mb-8 leading-relaxed">
              {t('photos.emptyMessage') || 'Photos from your hair analyses will appear here. Each analysis automatically saves your photos for tracking your hair journey.'}
            </p>

            {/* Info Card */}
            <div className="bg-white rounded-2xl border border-rose-border-light p-5 w-full max-w-sm shadow-card mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <Image className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-text-dark mb-1">
                    {t('photos.tipTitle') || 'How it works'}
                  </p>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {t('photos.tipMessage') || 'Every time you complete a hair analysis, your photos are securely saved here. Track your progress over time!'}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => navigate('/analysis')}
              className="px-8 py-4 bg-gradient-to-r from-primary to-primary-light text-white font-bold rounded-xl shadow-button hover:shadow-button-hover transition-all flex items-center gap-3"
            >
              <Camera className="w-5 h-5" />
              {t('photos.startAnalysis') || 'Start Your First Analysis'}
            </button>

            {/* Helper text */}
            <p className="text-xs text-text-light mt-4">
              {t('photos.helperText') || 'It only takes 2 minutes'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedPhotos.map((photo, i) => {
                const photoDate = getPhotoDate(photo)
                return (
                  <motion.button
                    key={photo.id || i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    onClick={() => setSelectedPhoto(photo)}
                    className="rounded-2xl overflow-hidden bg-surface shadow-card hover:ring-2 hover:ring-primary transition-all group"
                  >
                    <div className="aspect-square relative">
                      <img
                        src={photo.url}
                        alt={`Hair photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="px-3 py-2 bg-white">
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {photoDate.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </main>

      {/* Photo Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl max-h-[85vh] w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              {/* Photo */}
              <img
                src={selectedPhoto.url}
                alt="Hair photo"
                className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
              />

              {/* Info & Actions */}
              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {selectedPhoto.createdAt?.toDate?.()?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) || new Date(selectedPhoto.createdAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {selectedPhoto.analysisId && (
                  <button
                    onClick={() => {
                      setSelectedPhoto(null)
                      navigate(`/results/${selectedPhoto.analysisId}`)
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    {t('profile.viewAnalysis') || 'View Analysis'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyPhotos
