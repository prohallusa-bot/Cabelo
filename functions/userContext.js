/**
 * User Context Module
 * Fetches user data from Firebase for personalization
 */

const CONFIG = require("./config");

// Water API endpoint
const WATER_API_URL = "https://api.cabelo.ai/api/water";

/**
 * Fetch water hardness data for a city
 * @param {string} city - City name
 * @returns {Object|null} Water data or null if not found
 */
async function fetchWaterData(city) {
  if (!city) return null;

  try {
    const response = await fetch(WATER_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city }),
    });

    if (!response.ok) {
      console.log("Water API returned non-OK status:", response.status);
      return null;
    }

    const data = await response.json();

    // Only return data if city was found
    if (data.found) {
      console.log("Water data found for city:", city, "- Hardness:", data.city?.hardness);
      return {
        city: data.city?.name,
        state: data.city?.state,
        stateName: data.city?.state_name,
        hardness: data.city?.hardness,
        classification: data.city?.classification,
        classificationPt: data.city?.classification_pt,
        hairImpact: {
          level: data.hair_impact?.level,
          score: data.hair_impact?.score,
          effects: data.hair_impact?.effects_en || [],
          effectsPt: data.hair_impact?.effects_pt || [],
          recommendations: data.hair_impact?.recommendations_en || [],
          recommendationsPt: data.hair_impact?.recommendations_pt || [],
        },
        // Enriched water quality fields (2025 data)
        waterQuality: data.water_quality || null,
      };
    }

    console.log("Water data not found for city:", city);
    return null;
  } catch (error) {
    console.error("Error fetching water data:", error.message);
    return null;
  }
}

// ===========================================
// Weather API (Google Weather + Geocoding)
// ===========================================

/**
 * Geocode a city name to latitude/longitude using Google Geocoding API
 * @param {string} city - City name
 * @param {string} country - Country name (optional)
 * @returns {Object|null} { lat, lng } or null
 */
async function geocodeCity(city, country) {
  const apiKey = CONFIG.WEATHER?.GEOCODING_API_KEY;
  if (!apiKey || !city) return null;

  try {
    const address = country ? `${city}, ${country}` : city;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return null;
  }
}

// In-memory cache for weather data
const weatherCache = new Map();

/**
 * Fetch current weather data using Google Weather API
 * @param {string} city - City name
 * @param {string} country - Country name (optional)
 * @returns {Object|null} Weather data or null
 */
async function fetchWeatherData(city, country) {
  const apiKey = CONFIG.WEATHER?.API_KEY;
  if (!apiKey || !city) return null;

  // Check cache
  const cacheKey = `${city}_${country || ""}`.toLowerCase();
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < (CONFIG.WEATHER?.CACHE_TTL_MS || 1800000)) {
    console.log("Weather data from cache for:", city);
    return cached.data;
  }

  try {
    // Step 1: Geocode city to lat/lng
    const coords = await geocodeCity(city, country);
    if (!coords) {
      console.log("Could not geocode city:", city);
      return null;
    }

    // Step 2: Call Google Weather API
    const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${coords.lat}&location.longitude=${coords.lng}`;

    const response = await fetch(weatherUrl);
    if (!response.ok) {
      console.log("Weather API returned non-OK status:", response.status);
      return null;
    }

    const data = await response.json();

    const weatherData = {
      temperature: data.temperature?.degrees ?? null,
      temperatureUnit: data.temperature?.unit || "CELSIUS",
      feelsLike: data.feelsLikeTemperature?.degrees ?? null,
      humidity: data.relativeHumidity ?? null,
      uvIndex: data.uvIndex ?? null,
      conditions: data.weatherCondition?.description?.text || null,
      conditionType: data.weatherCondition?.type || null,
      windSpeed: data.wind?.speed?.value ?? null,
      dewPoint: data.dewPoint?.degrees ?? null,
    };

    console.log("Weather data found for:", city, "- Temp:", weatherData.temperature, "Humidity:", weatherData.humidity);

    // Cache the result
    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() });

    return weatherData;
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    return null;
  }
}

/**
 * Get comprehensive user context for AI personalization
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Object} User context object
 */
async function getUserContext(db, userId) {
  if (!userId) {
    return {
      isGuest: true,
      isNewUser: true,
      profile: null,
      firstAnalysis: null,
      latestAnalysis: null,
      analysisCount: 0,
      waterData: null,
    };
  }

  try {
    // Fetch user profile
    const userDoc = await db.collection("users").doc(userId).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    // Fetch all analyses for this user (ordered by date)
    const analysesSnap = await db
      .collection("hairAnalysis")
      .where("userId", "==", userId)
      .orderBy("createdAt", "asc")
      .get();

    const analyses = analysesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch water and weather data in parallel if user has a city
    let waterData = null;
    let weatherData = null;
    const userCity = profile?.city || profile?.location?.city;
    const userCountry = profile?.country || null;

    if (userCity) {
      const [waterResult, weatherResult] = await Promise.all([
        fetchWaterData(userCity),
        fetchWeatherData(userCity, userCountry),
      ]);
      waterData = waterResult;
      weatherData = weatherResult;
    }

    return {
      isGuest: false,
      isNewUser: analyses.length === 0,
      profile: profile,
      displayName: profile?.displayName || null,
      firstAnalysis: analyses.length > 0 ? analyses[0] : null,
      latestAnalysis: analyses.length > 0 ? analyses[analyses.length - 1] : null,
      analysisCount: analyses.length,
      language: profile?.language || CONFIG.DEFAULT_LANGUAGE,
      waterData: waterData,
      weatherData: weatherData,
    };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return {
      isGuest: false,
      isNewUser: true,
      profile: null,
      firstAnalysis: null,
      latestAnalysis: null,
      analysisCount: 0,
      waterData: null,
      error: error.message,
    };
  }
}

/**
 * Get chat history for conversation context
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Max messages to retrieve
 * @returns {Array} Chat history array
 */
async function getChatHistory(db, userId, conversationId, limit = CONFIG.MAX_CHAT_MEMORY) {
  if (!userId || !conversationId) {
    return [];
  }

  try {
    const historySnap = await db
      .collection("users")
      .doc(userId)
      .collection("chats")
      .doc(conversationId)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    // Reverse to get chronological order
    return historySnap.docs
      .map((doc) => doc.data())
      .reverse();
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

/**
 * Save chat messages to Firestore
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {Object} admin - Firebase Admin instance
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {string} userMessage - User's message
 * @param {string} aiResponse - AI's response
 * @param {boolean} hasImage - Whether message had an image
 */
async function saveChatMessages(db, admin, userId, conversationId, userMessage, aiResponse, hasImage = false) {
  if (!userId) return;

  try {
    const chatRef = db.collection("users").doc(userId).collection("chats").doc(conversationId);

    // Save user message
    await chatRef.collection("messages").add({
      role: "user",
      content: userMessage || "[Image message]",
      hasImage: hasImage,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Save AI response
    await chatRef.collection("messages").add({
      role: "assistant",
      content: aiResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update chat metadata
    await chatRef.set(
      {
        lastMessage: (userMessage || "[Image message]").substring(0, 100),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        messageCount: admin.firestore.FieldValue.increment(2),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error saving chat messages:", error);
  }
}

/**
 * Save analysis result to Firestore
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {Object} admin - Firebase Admin instance
 * @param {string} shareId - Share ID for the analysis
 * @param {Object} analysisResult - Analysis data
 * @param {string} userId - User ID
 * @param {boolean} isGuest - Is guest user
 */
async function saveAnalysis(db, admin, shareId, analysisResult, userId, isGuest) {
  try {
    // Save to main hairAnalysis collection
    await db.collection("hairAnalysis").doc(shareId).set({
      ...analysisResult,
      userId: userId,
      isGuest: isGuest,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Also save to user's personal collection if registered
    if (userId && !isGuest) {
      await db
        .collection("users")
        .doc(userId)
        .collection("analyses")
        .doc(shareId)
        .set({
          ...analysisResult,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
  } catch (error) {
    console.error("Error saving analysis:", error);
    throw error;
  }
}

/**
 * Check and get usage limits
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} featureType - Feature to check (hairAnalysis, chat, etc.)
 * @param {boolean} isGuest - Is guest user
 * @returns {Object} Usage check result
 */
async function checkUsageLimit(db, userId, featureType, isGuest) {
  const limits = isGuest ? CONFIG.LIMITS.GUEST : CONFIG.LIMITS.REGISTERED;
  const limit = limits[featureType];

  if (!limit) return { allowed: true };

  const today = new Date().toISOString().split("T")[0];
  const usageRef = db.collection("usage").doc(`${userId}_${today}`);
  const usageDoc = await usageRef.get();

  let currentUsage = 0;
  if (usageDoc.exists) {
    currentUsage = usageDoc.data()[featureType] || 0;
  }

  if (currentUsage >= limit) {
    return { allowed: false, current: currentUsage, limit: limit, isGuest: isGuest };
  }

  return { allowed: true, current: currentUsage, limit: limit };
}

/**
 * Increment usage counter
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {Object} admin - Firebase Admin instance
 * @param {string} userId - User ID
 * @param {string} featureType - Feature type
 */
async function incrementUsage(db, admin, userId, featureType) {
  const today = new Date().toISOString().split("T")[0];
  const usageRef = db.collection("usage").doc(`${userId}_${today}`);

  const updateData = { lastUpdated: admin.firestore.FieldValue.serverTimestamp() };
  updateData[featureType] = admin.firestore.FieldValue.increment(1);

  await usageRef.set(updateData, { merge: true });
}

/**
 * Generate a unique share ID
 * @returns {string} 12-character share ID
 */
function generateShareId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  getUserContext,
  getChatHistory,
  saveChatMessages,
  saveAnalysis,
  checkUsageLimit,
  incrementUsage,
  generateShareId,
  fetchWaterData,
  fetchWeatherData,
};
