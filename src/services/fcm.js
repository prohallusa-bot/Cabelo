// Firebase Cloud Messaging (FCM) Service
// Handles push notification permissions and token management

import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { app } from './firebase'
import { saveUserFCMToken } from './firebase'

let messaging = null

// Initialize FCM (only in browser with service worker support)
export const initializeFCM = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      messaging = getMessaging(app)
      return messaging
    } catch (error) {
      console.error('Error initializing FCM:', error)
      return null
    }
  }
  return null
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async (userId) => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return null
    }

    // Request permission
    const permission = await Notification.requestPermission()

    if (permission !== 'granted') {
      console.log('Notification permission denied')
      return null
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = initializeFCM()
    }

    if (!messaging) {
      console.log('FCM not available')
      return null
    }

    // Get the FCM token
    // You need to get your VAPID key from Firebase Console > Project Settings > Cloud Messaging
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY

    if (!vapidKey) {
      console.warn('VAPID key not configured. Add VITE_FIREBASE_VAPID_KEY to your .env file')
      return null
    }

    const token = await getToken(messaging, { vapidKey })

    if (token) {
      console.log('FCM Token:', token)

      // Save token to user's document in Firestore
      if (userId) {
        await saveUserFCMToken(userId, token)
      }

      return token
    } else {
      console.log('No registration token available')
      return null
    }
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    messaging = initializeFCM()
  }

  if (messaging) {
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload)
      callback(payload)
    })
  }

  return () => {} // Return empty unsubscribe function
}

// Show a local notification (for foreground messages)
export const showLocalNotification = (title, body, onClick) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'cabelo-notification'
    })

    if (onClick) {
      notification.onclick = onClick
    }
  }
}
