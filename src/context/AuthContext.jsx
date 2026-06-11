import { createContext, useContext, useState, useEffect } from 'react'
import {
  auth,
  onAuthStateChanged,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle as firebaseSignInWithGoogle,
  resetPassword,
  logOut as firebaseLogOut,
  getUserData,
  updateUserStreak,
  updateUserData,
  isAdmin,
  getAdminEmails
} from '../services/firebase'

const AuthContext = createContext()

// Safely parse JSON from localStorage; clears the key if it's corrupt.
const safeParse = (key, fallback = null) => {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guestMessageCount, setGuestMessageCount] = useState(() => {
    const saved = localStorage.getItem('guestMessageCount')
    return saved ? parseInt(saved, 10) : 0
  })

  // Quiz state
  const [quizCompleted, setQuizCompleted] = useState(() => {
    // Check localStorage for guests
    return localStorage.getItem('guestQuizCompleted') === 'true'
  })
  const [quizAnswers, setQuizAnswers] = useState(() => safeParse('guestQuizAnswers', null))

  const GUEST_MESSAGE_LIMIT = 5

  useEffect(() => {
    let isMounted = true

    // Pre-load admin emails from Firestore to populate cache
    getAdminEmails().catch(console.error)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return
      setUser(user)

      if (user) {
        try {
          // Independent reads/writes run in parallel
          const [data] = await Promise.all([
            getUserData(user.uid),
            updateUserStreak(user.uid),
          ])
          if (!isMounted) return
          setUserData(data)

          // Sync quiz status from user data
          if (data?.quiz === true) {
            setQuizCompleted(true)
            setQuizAnswers(data.quizAnswers || null)
          } else if (localStorage.getItem('guestQuizCompleted') === 'true') {
            // Migrate guest quiz to user account
            const answers = safeParse('guestQuizAnswers', null)
            if (answers) {
              await updateUserData(user.uid, {
                quiz: true,
                quizAnswers: answers,
                quizCompletedAt: new Date().toISOString()
              })
              if (!isMounted) return
              setQuizCompleted(true)
              setQuizAnswers(answers)
              // Clear guest quiz data
              localStorage.removeItem('guestQuizCompleted')
              localStorage.removeItem('guestQuizAnswers')
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        setUserData(null)
        // Check localStorage for guest quiz status
        const guestCompleted = localStorage.getItem('guestQuizCompleted') === 'true'
        setQuizCompleted(guestCompleted)
        if (guestCompleted) {
          setQuizAnswers(safeParse('guestQuizAnswers', null))
        }
      }

      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('guestMessageCount', guestMessageCount.toString())
  }, [guestMessageCount])

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const user = await signInWithEmail(email, password)
      setGuestMessageCount(0)
      localStorage.removeItem('guestMessageCount')
      return user
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, displayName, profileData = {}) => {
    try {
      setLoading(true)
      const user = await signUpWithEmail(email, password, displayName, profileData)
      setGuestMessageCount(0)
      localStorage.removeItem('guestMessageCount')
      return user
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const user = await firebaseSignInWithGoogle()
      setGuestMessageCount(0)
      localStorage.removeItem('guestMessageCount')
      return user
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email) => {
    try {
      await resetPassword(email)
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseLogOut()
      setUser(null)
      setUserData(null)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const incrementGuestMessageCount = () => {
    setGuestMessageCount(prev => prev + 1)
  }

  const canSendGuestMessage = () => {
    return guestMessageCount < GUEST_MESSAGE_LIMIT
  }

  const getRemainingGuestMessages = () => {
    return Math.max(0, GUEST_MESSAGE_LIMIT - guestMessageCount)
  }

  const refreshUserData = async () => {
    if (user) {
      const data = await getUserData(user.uid)
      setUserData(data)
    }
  }

  // Check admin from both email list AND Firestore userData
  const checkIsAdmin = () => {
    // Check hardcoded email list OR isAdmin field in userData from Firestore
    return user && (isAdmin(user.email) || userData?.isAdmin === true)
  }

  // Quiz methods
  const hasCompletedQuiz = () => {
    // For logged-in users, check Firestore userData
    if (user) {
      // If userData hasn't loaded yet, return false to show quiz
      // If userData exists, check the quiz field (undefined = not completed)
      return userData?.quiz === true
    }
    // For guests, check localStorage state
    return quizCompleted
  }

  const getQuizAnswers = () => {
    if (user && userData?.quizAnswers) {
      return userData.quizAnswers
    }
    return quizAnswers
  }

  const saveQuizAnswers = async (answers) => {
    try {
      if (user) {
        // Save to Firestore for registered users
        await updateUserData(user.uid, {
          quiz: true,
          quizAnswers: answers,
          quizCompletedAt: new Date().toISOString()
        })
        // Refresh user data to update local state
        const data = await getUserData(user.uid)
        setUserData(data)
      } else {
        // Save to localStorage for guests
        localStorage.setItem('guestQuizCompleted', 'true')
        localStorage.setItem('guestQuizAnswers', JSON.stringify(answers))
      }
      setQuizCompleted(true)
      setQuizAnswers(answers)
      return true
    } catch (error) {
      console.error('Error saving quiz answers:', error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    forgotPassword,
    isAuthenticated: !!user,
    isAdmin: checkIsAdmin(),
    guestMessageCount,
    incrementGuestMessageCount,
    canSendGuestMessage,
    getRemainingGuestMessages,
    refreshUserData,
    GUEST_MESSAGE_LIMIT,
    // Quiz
    hasCompletedQuiz,
    getQuizAnswers,
    saveQuizAnswers
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
