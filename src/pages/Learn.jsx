import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from '../lib/motion'
import { useLanguage } from '../context/LanguageContext'
import { getBlogPosts } from '../services/firebase'
import { 
  Droplets, 
  Sun, 
  Dumbbell, 
  Sparkles, 
  Moon,
  Wind,
  Clock,
  BookOpen
} from 'lucide-react'

// Default static tips (fallback if no Firebase posts)
const DEFAULT_TIPS = [
  {
    id: 'hydration-basics',
    title: 'Deep Hydration',
    description: 'Use a hydrating mask with hyaluronic acid and aloe vera weekly to maintain moisture balance.',
    fullContent: `Hydration is the foundation of healthy hair...`,
    category: 'Hydration',
    icon: 'Droplets',
    color: 'blue',
    readTime: 3,
    ingredients: ['Hyaluronic Acid', 'Aloe Vera', 'Glycerin']
  },
  {
    id: 'frizz-control',
    title: 'Frizz Control Secrets',
    description: 'Apply a light oil like argan or grape seed to damp hair to create a humidity barrier.',
    fullContent: `Frizz occurs when the outer layer of your hair...`,
    category: 'Frizz Control',
    icon: 'Wind',
    color: 'yellow',
    readTime: 4,
    ingredients: ['Argan Oil', 'Grape Seed Oil', 'Jojoba Oil']
  },
  {
    id: 'keratin-strength',
    title: 'Keratin Strength',
    description: 'Keratin treatments repair damaged cuticles and reduce breakage. Ideal for chemically treated hair.',
    fullContent: `Keratin is the protein that makes up 95% of your hair...`,
    category: 'Strength',
    icon: 'Dumbbell',
    color: 'green',
    readTime: 4,
    ingredients: ['Keratin', 'Amino Acids', 'Biotin']
  },
  {
    id: 'shine-boost',
    title: 'Natural Shine Boost',
    description: 'Cold water rinses and apple cider vinegar help seal cuticles for mirror-like shine.',
    fullContent: `Shiny hair reflects light because the cuticle layer lies flat...`,
    category: 'Shine',
    icon: 'Sun',
    color: 'amber',
    readTime: 3,
    ingredients: ['Apple Cider Vinegar', 'Vitamin E', 'Argan Oil']
  },
  {
    id: 'night-care',
    title: 'Night Care Routine',
    description: 'Protect your hair while you sleep with silk pillowcases and proper styling.',
    fullContent: `You spend 6-8 hours sleeping...`,
    category: 'Night Care',
    icon: 'Moon',
    color: 'purple',
    readTime: 3,
    ingredients: ['Leave-in Conditioner', 'Silk', 'Argan Oil']
  },
  {
    id: 'scalp-health',
    title: 'Scalp Health Essentials',
    description: 'A healthy scalp is the foundation for healthy hair growth. Learn to care for it properly.',
    fullContent: `Your scalp is skin...`,
    category: 'Scalp Health',
    icon: 'Sparkles',
    color: 'pink',
    readTime: 4,
    ingredients: ['Tea Tree Oil', 'Salicylic Acid', 'Peppermint']
  }
]

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'Hydration', label: 'Hydration' },
  { key: 'Frizz Control', label: 'Frizz Control' },
  { key: 'Strength', label: 'Strength' },
  { key: 'Shine', label: 'Shine' },
  { key: 'Night Care', label: 'Night Care' },
  { key: 'Scalp Health', label: 'Scalp Health' },
  { key: 'Keratin', label: 'Keratin' },
]

const ICON_MAP = {
  Droplets,
  Sun,
  Dumbbell,
  Sparkles,
  Moon,
  Wind,
}

const Learn = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('all')
  const [tips, setTips] = useState([])
  const [loading, setLoading] = useState(true)

  // Load blog posts from Firebase
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        const posts = await getBlogPosts(language)
        
        if (posts && posts.length > 0) {
          // Map Firebase posts to tip format
          const mappedPosts = posts.map(post => ({
            ...post,
            icon: post.icon || getCategoryIcon(post.category)
          }))
          setTips(mappedPosts)
        } else {
          // Use default tips if no posts
          setTips(DEFAULT_TIPS)
        }
      } catch (error) {
        console.error('Error loading posts:', error)
        setTips(DEFAULT_TIPS)
      } finally {
        setLoading(false)
      }
    }
    
    loadPosts()
  }, [language])

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Hydration': 'Droplets',
      'Frizz Control': 'Wind',
      'Strength': 'Dumbbell',
      'Shine': 'Sun',
      'Night Care': 'Moon',
      'Scalp Health': 'Sparkles',
      'Keratin': 'Dumbbell',
    }
    return iconMap[category] || 'Sparkles'
  }

  const filteredTips = activeCategory === 'all'
    ? tips
    : tips.filter(tip => tip.category === activeCategory)

  const colorClasses = {
    blue: 'from-blue-50 to-white border-blue-100 hover:border-blue-200',
    yellow: 'from-yellow-50 to-white border-yellow-100 hover:border-yellow-200',
    green: 'from-green-50 to-white border-green-100 hover:border-green-200',
    amber: 'from-amber-50 to-white border-amber-100 hover:border-amber-200',
    purple: 'from-purple-50 to-white border-purple-100 hover:border-purple-200',
    pink: 'from-pink-50 to-white border-pink-100 hover:border-pink-200',
  }

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-500',
    yellow: 'bg-yellow-100 text-yellow-500',
    green: 'bg-green-100 text-green-500',
    amber: 'bg-amber-100 text-amber-500',
    purple: 'bg-purple-100 text-purple-500',
    pink: 'bg-pink-100 text-pink-500',
  }

  return (
    <div className="min-h-screen bg-background-light pb-24 lg:pb-8">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <h1 className="text-2xl font-bold text-text-dark">{t('learn.title')}</h1>
        <p className="text-text-muted text-sm sm:text-base">{t('learn.subtitle')}</p>
      </header>

      {/* Category Filter */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-1 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? 'bg-primary text-white shadow-button'
                  : 'bg-white text-text-muted border border-rose-border-light hover:border-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Grid */}
      <main className="px-4 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
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
            <p className="text-text-muted text-sm font-medium">Loading tips...</p>
          </div>
        ) : filteredTips.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-text-light mx-auto mb-4" />
            <p className="text-text-muted">{t('learn.noTips')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTips.map((tip, index) => {
              const IconComponent = ICON_MAP[tip.icon] || Sparkles
              return (
                <motion.button
                  key={tip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/learn/${tip.id}`, { state: { tip } })}
                  className={`text-left bg-gradient-to-br ${colorClasses[tip.color] || colorClasses.blue} rounded-2xl p-4 sm:p-5 border shadow-card card-hover`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${iconColorClasses[tip.color] || iconColorClasses.blue} flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text-dark mb-1 text-sm sm:text-base">{tip.title}</h3>
                      <p className="text-xs sm:text-sm text-text-muted line-clamp-2 mb-2 sm:mb-3">
                        {tip.description}
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] sm:text-xs text-text-light">
                          <Clock className="w-3 h-3" />
                          {tip.readTime} {t('learn.readTime')}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {tip.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default Learn
