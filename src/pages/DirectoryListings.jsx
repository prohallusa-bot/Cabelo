import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import {
  ArrowLeft, Search, MapPin, Star, Phone, Globe, MessageCircle,
  X, Scissors, Building2, SlidersHorizontal, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react'

const ITEMS_PER_PAGE = 50

const DirectoryListings = () => {
  const navigate = useNavigate()
  const { type, citySlug } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useLanguage()

  // State
  const [index, setIndex] = useState(null)
  const [cityData, setCityData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(citySlug || '')
  const [minRating, setMinRating] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('rating')
  const [currentPage, setCurrentPage] = useState(1)

  // Determine filter type based on route
  const filterType = type === 'professionals' ? 'professional' : type === 'salons' ? 'salon' : null

  // Load index on mount
  useEffect(() => {
    fetch('/data/directory/index.json')
      .then(res => res.json())
      .then(data => setIndex(data))
      .catch(err => console.error('Failed to load index:', err))
  }, [])

  // Load city data when city changes
  useEffect(() => {
    if (!selectedCity && index?.cities?.length > 0) {
      setSelectedCity(index.cities[0].slug)
      return
    }

    if (selectedCity) {
      setLoading(true)
      setCurrentPage(1) // Reset to page 1 when city changes
      fetch(`/data/directory/${selectedCity}.json`)
        .then(res => res.json())
        .then(data => {
          setCityData(data)
          setLoading(false)
        })
        .catch(err => {
          console.error('Failed to load city data:', err)
          setLoading(false)
        })
    }
  }, [selectedCity, index])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, minRating, sortBy])

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    if (!cityData?.listings) return []

    let results = [...cityData.listings]

    // Filter by type if specified
    if (filterType) {
      results = results.filter(l => l.type === filterType)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.address?.street?.toLowerCase().includes(query) ||
        l.category?.toLowerCase().includes(query)
      )
    }

    // Filter by minimum rating
    if (minRating > 0) {
      results = results.filter(l => l.rating >= minRating)
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        results.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'reviews':
        results.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))
        break
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return results
  }, [cityData, filterType, searchQuery, minRating, sortBy])

  // Pagination calculations
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedListings = filteredListings.slice(startIndex, endIndex)

  // Get page title
  const getTitle = () => {
    if (type === 'professionals') return t('directory.professionals') || 'Hair Professionals'
    if (type === 'salons') return t('directory.salons') || 'Hair Salons'
    if (citySlug && cityData) return cityData.city
    return t('directory.allListings') || 'All Listings'
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/directory')}
            className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-text-primary">{getTitle()}</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              showFilters ? 'bg-primary text-white' : 'bg-surface-hover text-text-primary'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('directory.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-4 h-4 text-text-tertiary" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-4 bg-surface">
                {/* City Selector */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">
                    {t('directory.city')}
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-border focus:border-primary outline-none text-sm"
                  >
                    {index?.cities?.map((city) => (
                      <option key={city.slug} value={city.slug}>
                        {city.name}, {city.state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type Filter (if not already filtered by route) */}
                {!filterType && (
                  <div>
                    <label className="text-xs font-medium text-text-secondary mb-2 block">
                      {t('directory.type')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/directory/professionals')}
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary transition-colors"
                      >
                        {t('directory.professionals')}
                      </button>
                      <button
                        onClick={() => navigate('/directory/salons')}
                        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary transition-colors"
                      >
                        {t('directory.salons')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Rating Filter */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">
                    {t('directory.minRating')}
                  </label>
                  <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating)}
                        className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                          minRating === rating
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {rating === 0 ? 'All' : `${rating}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-2 block">
                    {t('directory.sortBy')}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-border focus:border-primary outline-none text-sm"
                  >
                    <option value="rating">{t('directory.sortRating')}</option>
                    <option value="reviews">{t('directory.sortReviews')}</option>
                    <option value="name">{t('directory.sortName')}</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Results Count */}
      <div className="px-4 py-3 bg-white border-b border-border">
        <p className="text-sm text-text-secondary">
          {loading ? (
            t('directory.loading')
          ) : (
            <>
              <span className="font-medium text-text-primary">{filteredListings.length.toLocaleString()}</span>
              {' '}{t('directory.resultsFound')}
              {cityData && <span className="text-text-tertiary"> in {cityData.city}</span>}
              {totalPages > 1 && (
                <span className="text-text-tertiary ml-2">
                  • {t('directory.page')} {currentPage} {t('directory.of')} {totalPages}
                </span>
              )}
            </>
          )}
        </p>
      </div>

      {/* Listings */}
      <main className="p-4">
        {loading ? (
          // Nice Loading Animation
          <div className="flex flex-col items-center justify-center py-16">
            <motion.div
              className="relative mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.div
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="w-10 h-10 text-white" />
              </motion.div>
              {/* Rotating ring */}
              <motion.div
                className="absolute -inset-3 border-2 border-primary/20 rounded-[28px]"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              {/* Pulsing ring */}
              <motion.div
                className="absolute -inset-6 border border-primary/10 rounded-[36px]"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <motion.p
              className="text-lg font-semibold text-text-primary mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t('directory.loadingDirectory')}
            </motion.p>
            <motion.p
              className="text-sm text-text-secondary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {t('common.loading')}
            </motion.p>
          </div>
        ) : paginatedListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
              <Search className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary">
              {t('directory.noResults')}
            </p>
            <p className="text-sm text-text-tertiary mt-1">
              {t('directory.tryDifferentSearch')}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedListings.map((listing, idx) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                >
                  <ListingCard listing={listing} t={t} />
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('directory.previous')}
                </button>

                <div className="flex items-center gap-1">
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-white'
                            : 'hover:bg-surface'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface transition-colors"
                >
                  {t('directory.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

// Listing Card Component
const ListingCard = ({ listing, t }) => {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            listing.type === 'salon' ? 'bg-pastel-blue' : 'bg-pastel-pink'
          }`}>
            {listing.type === 'salon' ? (
              <Building2 className="w-6 h-6 text-text-primary" />
            ) : (
              <Scissors className="w-6 h-6 text-text-primary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{listing.name}</h3>
            <p className="text-xs text-text-tertiary truncate">{listing.category}</p>

            {/* Rating */}
            {listing.rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium text-text-primary">{listing.rating}</span>
                {listing.reviewsCount > 0 && (
                  <span className="text-xs text-text-tertiary">
                    ({listing.reviewsCount} {t('directory.reviews')})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        {(listing.address?.street || listing.address?.city) && (
          <div className="flex items-start gap-2 mt-3 text-sm text-text-secondary">
            <MapPin className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {[listing.address.street, listing.address.city, listing.address.state]
                .filter(Boolean)
                .join(', ')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Phone className="w-4 h-4" />
              {t('directory.call')}
            </a>
          )}

          {listing.phone && (
            <a
              href={`https://wa.me/${listing.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}

          {listing.googleMapsUrl && (
            <a
              href={listing.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-surface text-text-primary text-sm font-medium rounded-lg hover:bg-surface-hover transition-colors"
            >
              <MapPin className="w-4 h-4" />
              {t('directory.map')}
            </a>
          )}

          {listing.website && (
            <a
              href={listing.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-surface text-text-primary text-sm font-medium rounded-lg hover:bg-surface-hover transition-colors"
            >
              <Globe className="w-4 h-4" />
              {t('directory.website')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

export default DirectoryListings
