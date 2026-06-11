import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp 
} from 'firebase/firestore'
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Default admin email list (used as fallback if Firestore settings don't exist)
const DEFAULT_ADMIN_EMAILS = [
  'admin@cabelo.ai',
  'ralph@prohallprofessional.com'
]

// Cached admin emails from Firestore
let cachedAdminEmails = null

// Get admin emails from Firestore
export const getAdminEmails = async () => {
  // Return cached values immediately if available
  if (cachedAdminEmails) return cachedAdminEmails

  try {
    const docRef = doc(db, 'settings', 'admin')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists() && docSnap.data().adminEmails) {
      cachedAdminEmails = docSnap.data().adminEmails
      return cachedAdminEmails
    }
    // Document doesn't exist yet - use defaults (admin can create via admin panel)
    cachedAdminEmails = DEFAULT_ADMIN_EMAILS
    return DEFAULT_ADMIN_EMAILS
  } catch {
    // Non-admin users don't have permission to read settings - this is expected
    cachedAdminEmails = DEFAULT_ADMIN_EMAILS
    return DEFAULT_ADMIN_EMAILS
  }
}

// Save admin emails to Firestore
export const saveAdminEmails = async (emails) => {
  try {
    const docRef = doc(db, 'settings', 'admin')
    await setDoc(docRef, {
      adminEmails: emails.map(e => e.toLowerCase()),
      updatedAt: serverTimestamp()
    }, { merge: true })
    cachedAdminEmails = emails.map(e => e.toLowerCase())
    return true
  } catch (error) {
    console.error('Error saving admin emails:', error)
    throw error
  }
}

// Check if user is admin (checks both cached list and Firestore)
export const isAdmin = (email) => {
  if (!email) return false
  const emailLower = email.toLowerCase()
  // First check cached emails if available
  if (cachedAdminEmails) {
    return cachedAdminEmails.includes(emailLower)
  }
  // Fallback to default list
  return DEFAULT_ADMIN_EMAILS.includes(emailLower)
}

// Async version to check admin status with fresh data from Firestore
export const isAdminAsync = async (email) => {
  if (!email) return false
  const adminEmails = await getAdminEmails()
  return adminEmails.includes(email.toLowerCase())
}

// Check admin status from Firestore (async version)
export const checkAdminStatus = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data().isAdmin === true
    }
    return false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Set user as admin in Firestore
export const setUserAsAdmin = async (uid, isAdminStatus = true) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isAdmin: isAdminStatus,
      updatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error setting admin status:', error)
    throw error
  }
}

// Make user admin by email (find user by email and set as admin)
export const makeUserAdminByEmail = async (email) => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      throw new Error('User not found with this email')
    }

    const userDoc = querySnapshot.docs[0]
    await setUserAsAdmin(userDoc.id, true)
    return { uid: userDoc.id, email: userDoc.data().email }
  } catch (error) {
    console.error('Error making user admin:', error)
    throw error
  }
}

// Check if user/email is banned
export const checkIfBanned = async (email) => {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data()
      return userData.isBanned === true
    }
    return false
  } catch (error) {
    console.error('Error checking ban status:', error)
    return false
  }
}

// Auth functions - Email/Password
export const signInWithEmail = async (email, password) => {
  try {
    // Check if user is banned before allowing sign in
    const isBanned = await checkIfBanned(email)
    if (isBanned) {
      throw { code: 'auth/user-banned', message: 'This account has been banned.' }
    }

    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = result.user

    // Update user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || email.split('@')[0],
      lastLogin: serverTimestamp(),
      isAdmin: isAdmin(user.email),
    }, { merge: true })

    return user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export const signUpWithEmail = async (email, password, displayName, profileData = {}) => {
  try {
    // Check if email is banned before allowing sign up
    const isBanned = await checkIfBanned(email)
    if (isBanned) {
      throw { code: 'auth/user-banned', message: 'This email has been banned and cannot create an account.' }
    }

    const result = await createUserWithEmailAndPassword(auth, email, password)
    const user = result.user

    // Update profile with display name
    if (displayName) {
      await updateProfile(user, { displayName })
    }

    // Create user document with additional profile data
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName || email.split('@')[0],
      photoURL: null,
      phone: profileData.phone || null,
      phoneCountry: profileData.phoneCountry || null,
      city: profileData.city || null,
      state: profileData.state || null,
      country: profileData.country || null,
      emailNotifications: profileData.emailNotifications !== false, // Default to true
      provider: 'email',
      quiz: false, // Default to false, set to true when quiz is completed
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      lastActiveDate: serverTimestamp(),
      streak: 1,
      isAdmin: isAdmin(user.email),
    })

    return user
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    console.error('Error sending reset email:', error)
    throw error
  }
}

// Google Sign In
const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user

    // Check if user is banned
    const isBanned = await checkIfBanned(user.email)
    if (isBanned) {
      // Sign out the user immediately
      await signOut(auth)
      throw { code: 'auth/user-banned', message: 'This account has been banned.' }
    }

    // Check if this is a new user (no existing document)
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    const isNewUser = !userDoc.exists()

    // Create/update user document
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      lastActiveDate: serverTimestamp(),
      isAdmin: isAdmin(user.email),
      provider: 'google'
    }

    // Add fields only for new users
    if (isNewUser) {
      userData.createdAt = serverTimestamp()
      userData.quiz = false // Default to false, set to true when quiz is completed
      userData.streak = 1
      userData.emailNotifications = true
    }

    await setDoc(doc(db, 'users', user.uid), userData, { merge: true })

    return user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

export const logOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// User functions
export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? docSnap.data() : null
  } catch (error) {
    console.error('Error getting user data:', error)
    throw error
  }
}

export const updateUserData = async (uid, data) => {
  try {
    const docRef = doc(db, 'users', uid)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating user data:', error)
    throw error
  }
}

export const updateUserStreak = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      const lastActive = userData.lastActiveDate?.toDate()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let streak = userData.streak || 0
      
      if (lastActive) {
        const lastActiveDay = new Date(lastActive)
        lastActiveDay.setHours(0, 0, 0, 0)
        
        const diffDays = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          streak += 1
        } else if (diffDays > 1) {
          streak = 1
        }
      } else {
        streak = 1
      }
      
      await updateDoc(userRef, {
        streak,
        lastActiveDate: serverTimestamp(),
      })
      
      return streak
    }
  } catch (error) {
    console.error('Error updating streak:', error)
    throw error
  }
}

// Analysis functions
export const saveAnalysis = async (uid, analysisData) => {
  try {
    const docRef = await addDoc(collection(db, 'analyses'), {
      userId: uid,
      ...analysisData,
      createdAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving analysis:', error)
    throw error
  }
}

export const getAnalyses = async (uid, limitCount = 10) => {
  try {
    // Query from hairAnalysis collection (new backend location)
    const q = query(
      collection(db, 'hairAnalysis'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      // Transform backend format to frontend format
      return {
        id: doc.id,
        score: data.condition_score * 10,
        status: getStatusFromScore(data.condition_score * 10),
        hairProfile: {
          type: getHairTypeCategory(data.hair_type),
          subtype: data.hair_type,
          porosity: capitalizeFirst(data.porosity),
          texture: capitalizeFirst(data.texture),
          density: capitalizeFirst(data.density)
        },
        metrics: {
          hydration: data.moisture_level * 10,
          shine: data.condition_score * 10,
          strength: data.protein_balance * 10
        },
        analysisType: data.analysisType,
        createdAt: data.createdAt,
        shareId: data.shareId || doc.id
      }
    })
  } catch (error) {
    console.error('Error getting analyses:', error)
    throw error
  }
}

export const getAnalysis = async (analysisId) => {
  try {
    // Try hairAnalysis collection first (used by backend)
    let docRef = doc(db, 'hairAnalysis', analysisId)
    let docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      // Transform backend data format to match frontend expectations
      return {
        id: docSnap.id,
        score: data.condition_score * 10,
        status: getStatusFromScore(data.condition_score * 10),
        hairProfile: {
          type: getHairTypeCategory(data.hair_type),
          subtype: data.hair_type,
          porosity: capitalizeFirst(data.porosity),
          texture: capitalizeFirst(data.texture),
          density: capitalizeFirst(data.density)
        },
        metrics: {
          hydration: data.moisture_level * 10,
          shine: data.condition_score * 10,
          strength: data.protein_balance * 10
        },
        concerns: data.concerns || [],
        strengths: getStrengthsFromData(data),
        recommendations: generateTipsFromData(data).map(tip => tip.title + ': ' + tip.description),
        summary: data.summary,
        primaryNeed: data.primary_need,
        chemicalHistory: data.chemical_history,
        type: data.analysisType, // 'full' or 'quick' for badge display
        analysisType: data.analysisType,
        createdAt: data.createdAt,
        shareId: data.shareId
      }
    }

    // Fall back to analyses collection for backward compatibility
    docRef = doc(db, 'analyses', analysisId)
    docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch (error) {
    console.error('Error getting analysis:', error)
    throw error
  }
}

// Helper functions for getAnalysis
function getStatusFromScore(score) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Attention'
}

function getHairTypeCategory(subtype) {
  if (!subtype) return 'Unknown'
  const first = subtype.charAt(0)
  if (first === '1') return 'Straight'
  if (first === '2') return 'Wavy'
  if (first === '3') return 'Curly'
  if (first === '4') return 'Coily'
  return 'Unknown'
}

function capitalizeFirst(str) {
  if (!str) return 'Medium'
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function getStrengthsFromData(data) {
  const strengths = []

  if (data.condition_score >= 7) {
    strengths.push('Overall healthy appearance')
  }
  if (data.moisture_level >= 7) {
    strengths.push('Good hydration levels')
  }
  if (data.protein_balance >= 7) {
    strengths.push('Strong protein structure')
  }
  if (!data.concerns || data.concerns.length === 0) {
    strengths.push('No major visible concerns')
  }
  if (data.hair_type_confidence === 'high') {
    strengths.push('Well-defined hair pattern')
  }

  // Ensure at least one strength
  if (strengths.length === 0) {
    strengths.push('Hair shows potential for improvement')
  }

  return strengths.slice(0, 3)
}

function generateTipsFromData(data) {
  const tips = []

  // Tips based on primary need
  if (data.primary_need && data.primary_need.toLowerCase().includes('hydration')) {
    tips.push({
      title: 'Boost Hydration',
      description: 'Your hair needs moisture! Use a deep conditioning mask twice weekly and consider a leave-in conditioner.',
      category: 'Hydration'
    })
  } else if (data.primary_need && data.primary_need.toLowerCase().includes('repair')) {
    tips.push({
      title: 'Repair Damage',
      description: 'Focus on protein treatments to rebuild damaged hair structure. Look for products with keratin or amino acids.',
      category: 'Strength'
    })
  } else if (data.primary_need && data.primary_need.toLowerCase().includes('smooth')) {
    tips.push({
      title: 'Tame Frizz',
      description: 'Use anti-humidity products and consider a smoothing treatment to control frizz and add shine.',
      category: 'Frizz Control'
    })
  }

  // Tips based on concerns
  if (data.concerns && data.concerns.some(c => c.toLowerCase().includes('dry'))) {
    tips.push({
      title: 'Lock in Moisture',
      description: 'Apply oil to damp hair to seal in moisture. Avoid sulfates that strip natural oils.',
      category: 'Hydration'
    })
  }

  if (data.concerns && data.concerns.some(c => c.toLowerCase().includes('frizz'))) {
    tips.push({
      title: 'Define & Smooth',
      description: 'Use a microfiber towel instead of regular towels. Apply products to soaking wet hair.',
      category: 'Frizz Control'
    })
  }

  // General tip
  tips.push({
    title: 'Protect from Heat',
    description: 'Always use heat protection before styling. Air dry when possible to minimize damage.',
    category: 'Strength'
  })

  return tips.slice(0, 4)
}

// Photo storage functions
export const uploadPhoto = async (uid, file, analysisId) => {
  try {
    const fileName = `${Date.now()}_${file.name}`
    const storageRef = ref(storage, `users/${uid}/photos/${fileName}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef)
    
    await addDoc(collection(db, 'photos'), {
      userId: uid,
      analysisId,
      url: downloadURL,
      fileName,
      createdAt: serverTimestamp(),
    })
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading photo:', error)
    throw error
  }
}

export const getUserPhotos = async (uid) => {
  try {
    const q = query(
      collection(db, 'photos'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting user photos:', error)
    throw error
  }
}

// Get user's analysis photos from userPhotos collection (saved during hair analysis)
export const getUserAnalysisPhotos = async (uid) => {
  try {
    const q = query(
      collection(db, 'userPhotos'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting user analysis photos:', error)
    return []
  }
}

export const deletePhoto = async (photoId, fileName, uid) => {
  try {
    const storageRef = ref(storage, `users/${uid}/photos/${fileName}`)
    await deleteObject(storageRef)
    await deleteDoc(doc(db, 'photos', photoId))
  } catch (error) {
    console.error('Error deleting photo:', error)
    throw error
  }
}

// Chat functions
export const saveChat = async (uid, messages) => {
  try {
    const chatRef = doc(db, 'chats', uid)
    await setDoc(chatRef, {
      messages,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error('Error saving chat:', error)
    throw error
  }
}

export const getChat = async (uid) => {
  try {
    const docRef = doc(db, 'chats', uid)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? docSnap.data().messages : []
  } catch (error) {
    console.error('Error getting chat:', error)
    throw error
  }
}

// Blog/Learn functions
export const getBlogPosts = async (lang = 'en') => {
  try {
    const q = query(
      collection(db, 'blogPosts'),
      where('published', '==', true),
      where('language', '==', lang),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting blog posts:', error)
    return []
  }
}

export const getBlogPost = async (postId) => {
  try {
    const docRef = doc(db, 'blogPosts', postId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
  } catch (error) {
    console.error('Error getting blog post:', error)
    throw error
  }
}

export const createBlogPost = async (postData) => {
  try {
    const docRef = await addDoc(collection(db, 'blogPosts'), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error creating blog post:', error)
    throw error
  }
}

export const updateBlogPost = async (postId, postData) => {
  try {
    const docRef = doc(db, 'blogPosts', postId)
    await updateDoc(docRef, {
      ...postData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating blog post:', error)
    throw error
  }
}

export const deleteBlogPost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'blogPosts', postId))
  } catch (error) {
    console.error('Error deleting blog post:', error)
    throw error
  }
}

export const getAllBlogPosts = async () => {
  try {
    const q = query(
      collection(db, 'blogPosts'),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting all blog posts:', error)
    return []
  }
}

// Delete account
export const deleteUserAccount = async (uid) => {
  try {
    const photos = await getUserPhotos(uid)
    for (const photo of photos) {
      await deletePhoto(photo.id, photo.fileName, uid)
    }
    
    const analyses = await getAnalyses(uid, 1000)
    for (const analysis of analyses) {
      await deleteDoc(doc(db, 'analyses', analysis.id))
    }
    
    await deleteDoc(doc(db, 'chats', uid))
    await deleteDoc(doc(db, 'users', uid))
    
    if (auth.currentUser) {
      await auth.currentUser.delete()
    }
  } catch (error) {
    console.error('Error deleting account:', error)
    throw error
  }
}

// Admin functions - Get all users
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'))
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

// Admin functions - Get all chats (from user subcollections)
export const getAllChats = async () => {
  try {
    // Get all users first
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const allChats = []

    // For each user, get their chats
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const chatsSnapshot = await getDocs(collection(db, 'users', userId, 'chats'))

      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data()
        // Get messages for this chat
        const messagesSnapshot = await getDocs(
          collection(db, 'users', userId, 'chats', chatDoc.id, 'messages')
        )
        const messages = messagesSnapshot.docs.map(msgDoc => ({
          id: msgDoc.id,
          ...msgDoc.data(),
          timestamp: msgDoc.data().timestamp?.toDate?.()?.toISOString() || null
        }))

        allChats.push({
          id: chatDoc.id,
          userId,
          ...chatData,
          lastUpdated: chatData.lastUpdated?.toDate?.()?.toISOString() || null,
          messages
        })
      }
    }

    return allChats
  } catch (error) {
    console.error('Error getting all chats:', error)
    return []
  }
}

// Admin functions - Get all analyses
export const getAllAnalyses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'hairAnalysis'))
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error getting all analyses:', error)
    return []
  }
}

// ============================================
// NOTIFICATION SETTINGS
// ============================================

// Default notification settings
const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: true,
  inactiveDays: 7,
  title: "We miss you! 💇",
  body: "Your hair care journey awaits. Come back and check your hair health!",
  lastUpdated: null
}

// Get notification settings from Firestore
export const getNotificationSettings = async () => {
  try {
    const docRef = doc(db, 'settings', 'notifications')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...docSnap.data() }
    }
    // If no settings exist, create them with defaults
    await setDoc(docRef, {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      createdAt: serverTimestamp()
    })
    return DEFAULT_NOTIFICATION_SETTINGS
  } catch (error) {
    console.error('Error getting notification settings:', error)
    return DEFAULT_NOTIFICATION_SETTINGS
  }
}

// Save notification settings to Firestore
export const saveNotificationSettings = async (settings) => {
  try {
    const docRef = doc(db, 'settings', 'notifications')
    await setDoc(docRef, {
      ...settings,
      lastUpdated: serverTimestamp()
    }, { merge: true })
    return true
  } catch (error) {
    console.error('Error saving notification settings:', error)
    throw error
  }
}

// Save user's FCM token for push notifications
export const saveUserFCMToken = async (uid, token) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.error('Error saving FCM token:', error)
    throw error
  }
}

// Get all users who have FCM tokens and are inactive
export const getInactiveUsersWithTokens = async (inactiveDays) => {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays)

    const querySnapshot = await getDocs(collection(db, 'users'))
    const inactiveUsers = []

    querySnapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.fcmToken && !data.isBanned) {
        const lastActive = data.lastActiveDate?.toDate() || data.lastLogin?.toDate()
        if (lastActive && lastActive < cutoffDate) {
          inactiveUsers.push({
            uid: doc.id,
            email: data.email,
            displayName: data.displayName,
            fcmToken: data.fcmToken,
            lastActive
          })
        }
      }
    })

    return inactiveUsers
  } catch (error) {
    console.error('Error getting inactive users:', error)
    return []
  }
}

// Log notification sent (for tracking)
export const logNotificationSent = async (userId, notificationType, status) => {
  try {
    await addDoc(collection(db, 'notificationLogs'), {
      userId,
      notificationType,
      status,
      sentAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error logging notification:', error)
  }
}

export { onAuthStateChanged }
