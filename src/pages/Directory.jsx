import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from '../lib/motion'
import { useLanguage } from '../context/LanguageContext'
import { Scissors, Building2, MapPin, Users, Star, Search, Navigation, Loader2, XCircle, Sparkles } from 'lucide-react'

const Directory = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [index, setIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nearMeLoading, setNearMeLoading] = useState(false)
  const [nearMeError, setNearMeError] = useState(null)

  useEffect(() => {
    // Load directory index
    fetch('/data/directory/index.json')
      .then(res => res.json())
      .then(data => {
        setIndex(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load directory index:', err)
        setLoading(false)
      })
  }, [])

  const handleSalonsNearMe = () => {
    if (!navigator.geolocation) {
      setNearMeError('Geolocation is not supported by your browser')
      return
    }

    setNearMeLoading(true)
    setNearMeError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          // Reverse geocode to find city name
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
            { headers: { 'User-Agent': 'CabeloAI/1.0' } }
          )
          const data = await res.json()
          const cityName = data?.address?.city || data?.address?.town || data?.address?.municipality || ''

          // Try to match to an available city
          const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
          const matchedCity = index?.cities?.find(c =>
            slugify(c.name) === slugify(cityName) ||
            c.name.toLowerCase() === cityName.toLowerCase()
          )

          if (matchedCity) {
            navigate(`/directory/city/${matchedCity.slug}`)
          } else {
            // No matching city — go to salons page with all results
            setNearMeError(`No listings found near you (${cityName || 'unknown location'}). Showing all salons.`)
            setTimeout(() => navigate('/directory/salons'), 1500)
          }
        } catch {
          setNearMeError('Could not determine your location. Showing all salons.')
          setTimeout(() => navigate('/directory/salons'), 1500)
        } finally {
          setNearMeLoading(false)
        }
      },
      (error) => {
        setNearMeLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          setNearMeError('Location permission denied. Showing all salons.')
          setTimeout(() => navigate('/directory/salons'), 2000)
        } else {
          setNearMeError('Could not get your location. Showing all salons.')
          setTimeout(() => navigate('/directory/salons'), 1500)
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-border">
        <h1 className="font-semibold text-text-primary text-center">
          {t('directory.title') || 'Professionals Directory'}
        </h1>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {/* Salons Near Me - Top placement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={handleSalonsNearMe}
            disabled={nearMeLoading}
            className="w-full bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 hover:shadow-lg transition-all text-left group disabled:opacity-70"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                {nearMeLoading ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin" />
                ) : (
                  <Navigation className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {nearMeLoading ? 'Finding salons...' : 'Salons Near Me'}
                </h3>
                <p className="text-sm text-white/80">
                  Use your location to find nearby salons
                </p>
              </div>
            </div>
          </button>

          {/* Near Me Error/Info */}
          {nearMeError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-3"
            >
              <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{nearMeError}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            {t('directory.findNearYou') || 'Find Hair Experts Near You'}
          </h2>
          <p className="text-text-secondary">
            {t('directory.subtitle') || 'Discover top-rated salons and professionals in your city'}
          </p>
        </motion.div>

        {/* Stats */}
        {index && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            <div className="bg-white rounded-xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-primary">{index.cities?.length || 0}</p>
              <p className="text-xs text-text-secondary">{t('directory.cities') || 'Cities'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-primary">{index.totalListings?.toLocaleString() || 0}</p>
              <p className="text-xs text-text-secondary">{t('directory.listings') || 'Listings'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center border border-border">
              <p className="text-2xl font-bold text-primary">4.5+</p>
              <p className="text-xs text-text-secondary">{t('directory.avgRating') || 'Avg Rating'}</p>
            </div>
          </motion.div>
        )}

        {/* Main Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          {/* Find a Professional */}
          <button
            onClick={() => navigate('/directory/professionals')}
            className="w-full bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-pastel-pink flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Scissors className="w-7 h-7 text-text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {t('directory.findProfessional') || 'Find a Hair Professional'}
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  {t('directory.professionalDesc') || 'Individual stylists, colorists, and hair specialists'}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Users className="w-4 h-4" />
                  <span>
                    {index?.cities?.reduce((sum, c) => sum + c.professionalsCount, 0).toLocaleString() || '0'} {t('directory.professionals') || 'professionals'}
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Find a Salon */}
          <button
            onClick={() => navigate('/directory/salons')}
            className="w-full bg-white rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-pastel-blue flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-7 h-7 text-text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-text-primary mb-1">
                  {t('directory.findSalon') || 'Find a Hair Salon'}
                </h3>
                <p className="text-sm text-text-secondary mb-3">
                  {t('directory.salonDesc') || 'Beauty salons with full service offerings'}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <Building2 className="w-4 h-4" />
                  <span>
                    {index?.cities?.reduce((sum, c) => sum + c.salonsCount, 0).toLocaleString() || '0'} {t('directory.salons') || 'salons'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Available Cities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            {t('directory.availableCities') || 'Available Cities'}
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
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
              <p className="text-text-muted text-sm font-medium">Loading directory...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {index?.cities?.map((city) => (
                <button
                  key={city.slug}
                  onClick={() => navigate(`/directory/city/${city.slug}`)}
                  className="bg-white rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="font-medium text-text-primary">{city.name}</span>
                  </div>
                  <p className="text-xs text-text-tertiary">{city.state}</p>
                  <p className="text-xs text-text-secondary mt-1">
                    {city.totalCount.toLocaleString()} {t('directory.listings') || 'listings'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-text-tertiary">
            {t('directory.moreCitiesSoon') || 'More cities coming soon!'}
          </p>
        </motion.div>
      </main>
    </div>
  )
}

export default Directory
