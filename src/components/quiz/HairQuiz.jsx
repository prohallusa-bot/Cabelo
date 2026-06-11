import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from '../../lib/motion'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const QUIZ_QUESTIONS = [
  {
    id: 'hairType',
    key: 'q1',
    options: ['straight', 'wavy', 'curly', 'coily'],
    multiSelect: false
  },
  {
    id: 'hairTexture',
    key: 'q2',
    options: ['fine', 'medium', 'coarse'],
    multiSelect: false
  },
  {
    id: 'currentCondition',
    key: 'q3',
    options: ['healthy', 'slightlyDamaged', 'damaged', 'veryDamaged'],
    multiSelect: false
  },
  {
    id: 'chemicalTreatments',
    key: 'q4',
    options: ['none', 'colorDye', 'bleach', 'keratin', 'relaxerPerm'],
    multiSelect: true
  },
  {
    id: 'mainConcern',
    key: 'q5',
    options: ['frizz', 'dryness', 'damage', 'hairLoss', 'volume', 'oily'],
    multiSelect: false
  },
  {
    id: 'heatStyling',
    key: 'q6',
    options: ['daily', 'fewTimesWeek', 'occasionally', 'never'],
    multiSelect: false
  },
  {
    id: 'hairGoal',
    key: 'q7',
    options: ['smooth', 'healthy', 'repair', 'definedCurls', 'volume', 'growLonger'],
    multiSelect: false
  }
]

export default function HairQuiz({ isOpen, onClose, onComplete, onSkip }) {
  const { t } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [direction, setDirection] = useState(1) // 1 for forward, -1 for back

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentQuestion(0)
      setAnswers({})
      setDirection(1)
    }
  }, [isOpen])

  const question = QUIZ_QUESTIONS[currentQuestion]
  const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1
  const isFirstQuestion = currentQuestion === 0
  const hasCurrentAnswer = question?.multiSelect
    ? answers[question.id]?.length > 0
    : !!answers[question.id]

  const handleOptionSelect = (option) => {
    if (question.multiSelect) {
      // Toggle selection for multi-select
      const current = answers[question.id] || []

      // If selecting 'none', clear other selections
      if (option === 'none') {
        setAnswers(prev => ({ ...prev, [question.id]: ['none'] }))
        return
      }

      // If something else selected, remove 'none' from selection
      const filtered = current.filter(o => o !== 'none')

      if (filtered.includes(option)) {
        setAnswers(prev => ({ ...prev, [question.id]: filtered.filter(o => o !== option) }))
      } else {
        setAnswers(prev => ({ ...prev, [question.id]: [...filtered, option] }))
      }
    } else {
      // Single select
      setAnswers(prev => ({ ...prev, [question.id]: option }))
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      onComplete(answers)
    } else {
      setDirection(1)
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (!isFirstQuestion) {
      setDirection(-1)
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  const isOptionSelected = (option) => {
    if (question.multiSelect) {
      return (answers[question.id] || []).includes(option)
    }
    return answers[question.id] === option
  }

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleSkip}
          />

          {/* Modal - Centered on page */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && handleSkip()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md max-h-[85vh] bg-white rounded-3xl flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header - Compact */}
            <div className="px-5 pt-4 pb-3">
              {/* Drag Handle */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold text-text-dark">{t('quiz.title')}</h2>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1.5 text-text-muted hover:text-text-dark rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {QUIZ_QUESTIONS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentQuestion ? 1 : -1)
                      setCurrentQuestion(index)
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentQuestion
                        ? 'w-5 bg-primary'
                        : index < currentQuestion
                          ? 'w-1.5 bg-green-500'
                          : 'w-1.5 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 pb-3">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentQuestion}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                >
                  {/* Question */}
                  <h3 className="text-sm font-semibold text-text-dark mb-1">
                    {t(`quiz.${question.key}.question`)}
                  </h3>
                  {question.multiSelect && (
                    <p className="text-xs text-text-muted mb-1">{t('quiz.selectMultiple')}</p>
                  )}

                  {/* Options - Compact */}
                  <div className="space-y-1.5 mt-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(option)}
                        className={`w-full px-3 py-2.5 rounded-lg text-left transition-all ${
                          isOptionSelected(option)
                            ? 'bg-primary text-white shadow-sm'
                            : 'bg-gray-50 text-text-dark hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-medium text-sm">
                          {t(`quiz.${question.key}.${option}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer - Compact */}
            <div className="flex-shrink-0 px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between gap-2">
                {/* Back Button */}
                {!isFirstQuestion ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1 px-2 py-2 text-text-muted font-medium hover:text-text-dark transition-colors text-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('quiz.back')}
                  </button>
                ) : (
                  <button
                    onClick={handleSkip}
                    className="px-2 py-2 text-text-muted font-medium hover:text-text-dark transition-colors text-xs"
                  >
                    {t('quiz.skipText')}
                  </button>
                )}

                {/* Next/Finish Button */}
                <button
                  onClick={handleNext}
                  disabled={!hasCurrentAnswer}
                  className={`flex-1 max-w-[160px] flex items-center justify-center gap-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all ${
                    hasCurrentAnswer
                      ? 'bg-primary text-white shadow-md hover:shadow-lg'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLastQuestion ? t('quiz.finish') : t('quiz.continue')}
                  {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
