import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { ArrowLeft, Bookmark, Share2, Clock, Sparkles, ChevronRight, Droplets, Sun, Shield, Scissors } from 'lucide-react'

const TipDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, tips } = useLanguage()

  const tip = tips?.find(t => t.id === id)

  if (!tip) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-text-primary font-medium mb-4">Tip not found</p>
          <button
            onClick={() => navigate('/learn')}
            className="px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-light transition-colors"
          >
            Back to Tips
          </button>
        </div>
      </div>
    )
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hydration': return Droplets
      case 'protection': return Shield
      case 'styling': return Scissors
      default: return Sun
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'hydration': return 'bg-pastel-blue'
      case 'protection': return 'bg-pastel-green'
      case 'styling': return 'bg-pastel-purple'
      default: return 'bg-pastel-orange'
    }
  }

  const CategoryIcon = getCategoryIcon(tip.category)

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
        <h1 className="font-semibold text-text-primary">Hair Tip</h1>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-xl bg-surface-hover flex items-center justify-center text-text-primary hover:bg-gray-100 transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-6 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Hero Card */}
          <div className={`${getCategoryColor(tip.category)} rounded-2xl p-6`}>
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                <CategoryIcon className="w-7 h-7 text-text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  {tip.category}
                </span>
                <h2 className="text-xl font-semibold text-text-primary mt-1">
                  {tip.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>3 min read</span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>Expert Tip</span>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-clean">
            <div className="prose prose-sm max-w-none">
              <p className="text-text-secondary leading-relaxed">
                {tip.content || tip.description}
              </p>
              
              {tip.steps && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-text-primary">How to Apply</h3>
                  {tip.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-pastel-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium">{i + 1}</span>
                      </div>
                      <p className="text-sm text-text-secondary">{step}</p>
                    </div>
                  ))}
                </div>
              )}

              {tip.tips && (
                <div className="mt-6 p-4 bg-pastel-green rounded-xl">
                  <h4 className="font-medium text-text-primary mb-2">Pro Tips</h4>
                  <ul className="space-y-2">
                    {tip.tips.map((t, i) => (
                      <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Related Tips */}
          <div className="bg-white rounded-2xl border border-border p-4 shadow-clean">
            <h3 className="font-semibold text-text-primary mb-3">Related Tips</h3>
            <div className="space-y-2">
              {tips?.filter(t => t.category === tip.category && t.id !== tip.id).slice(0, 3).map((related, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/tip/${related.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl hover:bg-surface-hover transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${getCategoryColor(related.category)} flex items-center justify-center`}>
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center">
                      <CategoryIcon className="w-3 h-3 text-text-primary" />
                    </div>
                  </div>
                  <span className="flex-1 text-sm font-medium text-text-primary truncate">{related.title}</span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary" />
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/chat')}
            className="w-full py-4 bg-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-light transition-colors"
          >
            Ask About This Tip
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </main>
    </div>
  )
}

export default TipDetail
