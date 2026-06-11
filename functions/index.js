/**
 * CABELO.AI - Firebase Cloud Functions v2
 * Backend API with Vertex AI RAG Integration
 *
 * Features:
 * - AI Coach Chat with RAG-grounded knowledge base
 * - Hair Analysis with RAG-grounded guidelines
 * - User personalization from Firebase data
 * - Streaming support for real-time responses (2nd gen)
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Import modules
const CONFIG = require("./config");
const { buildChatSystemPrompt, buildAnalysisPrompt } = require("./prompts");
const {
  getUserContext,
  getChatHistory,
  saveChatMessages,
  saveAnalysis,
  checkUsageLimit,
  incrementUsage,
  generateShareId,
} = require("./userContext");
const { chatWithRAG, analyzeWithRAG, streamChatWithRAG } = require("./vertexAI");

// ============================================
// AUTH HELPERS
// ============================================

const ADMIN_EMAILS = ["admin@cabelo.ai", "prohallusa@gmail.com"];

/**
 * Verify the caller's Firebase ID token (Authorization: Bearer <token>).
 * On failure, sends a 401 response and returns null so callers can `return`.
 */
async function verifyAuthToken(req, res) {
  const header = req.headers.authorization || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!idToken) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or expired token" });
    return null;
  }
}

/**
 * True if the decoded token belongs to an admin (custom claim or known email).
 * Email/claims come from Firebase Auth and cannot be spoofed by writing to
 * a user's own Firestore document.
 */
function isEmailAdmin(decoded) {
  return !!decoded && (
    decoded.admin === true ||
    ADMIN_EMAILS.includes((decoded.email || "").toLowerCase())
  );
}

// ============================================
// SAME-USER VERIFICATION FOR HAIR ANALYSIS
// ============================================

/**
 * Verify that a new analysis likely belongs to the same user
 * by comparing hair_type category and texture with previous analysis.
 *
 * @param {Object} newAnalysis - New analysis result
 * @param {Object} previousAnalysis - User's latest previous analysis
 * @returns {Object} { isDifferentHair: boolean, warning: string|null }
 */
function verifySameUser(newAnalysis, previousAnalysis) {
  if (!previousAnalysis || !newAnalysis) {
    return { isDifferentHair: false, warning: null };
  }

  // Compare hair type category (first digit: 1/2/3/4) and texture
  const prevType = (previousAnalysis.hair_type || "").toUpperCase().trim();
  const newType = (newAnalysis.hair_type || "").toUpperCase().trim();
  const prevTexture = (previousAnalysis.texture || "").toLowerCase().trim();
  const newTexture = (newAnalysis.texture || "").toLowerCase().trim();

  // Hair type category: "1", "2", "3", or "4"
  const prevCategory = prevType.charAt(0);
  const newCategory = newType.charAt(0);

  const typeMatch = prevCategory === newCategory;
  const textureMatch = prevTexture === newTexture;

  // Only flag when BOTH hair type category AND texture differ
  if (!typeMatch && !textureMatch) {
    console.log(`Different hair detected: type ${prevType}->${newType}, texture ${prevTexture}->${newTexture}`);
    return {
      isDifferentHair: true,
      warning: "We noticed this hair is different from your previous results. Make sure to upload only your hair images.",
    };
  }

  return { isDifferentHair: false, warning: null };
}

// ============================================
// AI COACH CHAT
// ============================================

/**
 * AI Chat with RAG Knowledge Base
 * Supports text and images
 */
exports.chat = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB",
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      console.log("=== chat called ===");

      try {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { message, images = [], userId, conversationId, isGuest = true } = req.body;

        console.log("Message:", message ? message.substring(0, 50) : "none");
        console.log("Images:", images.length);
        console.log("UserId:", userId);
        console.log("IsGuest:", isGuest);

        // Validate input
        if ((!message || !message.trim()) && images.length === 0) {
          return res.status(400).json({
            error: "INVALID_REQUEST",
            message: "Please enter a message or upload an image",
          });
        }

        if (images.length > CONFIG.MAX_IMAGES_PER_CHAT) {
          return res.status(400).json({
            error: "INVALID_REQUEST",
            message: `Maximum ${CONFIG.MAX_IMAGES_PER_CHAT} image per message`,
          });
        }

        // Get effective user ID
        const guestId = isGuest ? req.ip || `guest_${Date.now()}` : null;
        const effectiveUserId = userId || guestId;

        // Check usage limits
        const usageCheck = await checkUsageLimit(db, effectiveUserId, "chat", isGuest);
        if (!usageCheck.allowed) {
          return res.status(429).json({
            error: "LIMIT_REACHED",
            message: isGuest
              ? "Chat limit reached. Sign up for more!"
              : "Daily chat limit reached.",
            isGuest,
          });
        }

        // Check image limit if images provided
        if (images.length > 0) {
          const imageCheck = await checkUsageLimit(db, effectiveUserId, "chatImagesPerDay", isGuest);
          if (!imageCheck.allowed) {
            return res.status(429).json({
              error: "LIMIT_REACHED",
              message: isGuest
                ? "Daily image limit reached. Sign up for more!"
                : "Daily image upload limit reached.",
              isGuest,
            });
          }
        }

        // Fetch user context for personalization
        const userContext = await getUserContext(db, isGuest ? null : userId);
        console.log("User context:", {
          isGuest: userContext.isGuest,
          isNewUser: userContext.isNewUser,
          hasAnalysis: !!userContext.latestAnalysis,
          analysisCount: userContext.analysisCount,
        });

        // Get chat history
        const chatHistory = await getChatHistory(
          db,
          userId,
          conversationId,
          CONFIG.MAX_CHAT_MEMORY
        );
        console.log("Chat history loaded:", chatHistory.length, "messages");

        // Build personalized system prompt
        const systemPrompt = buildChatSystemPrompt(userContext);

        // Call Vertex AI with RAG
        console.log("Calling Vertex AI...");
        const responseText = await chatWithRAG(systemPrompt, message, images, chatHistory);

        // Generate conversation ID if new conversation
        const effectiveConversationId = conversationId || generateShareId();

        // Save chat messages
        if (userId && !isGuest) {
          await saveChatMessages(
            db,
            admin,
            userId,
            effectiveConversationId,
            message,
            responseText,
            images.length > 0
          );
        }

        // Increment usage
        await incrementUsage(db, admin, effectiveUserId, "chat");
        if (images.length > 0) {
          await incrementUsage(db, admin, effectiveUserId, "chatImagesPerDay");
        }

        console.log("=== chat success ===");
        return res.status(200).json({
          success: true,
          response: responseText,
          conversationId: effectiveConversationId,
        });
      } catch (error) {
        console.error("=== chat ERROR ===");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        return res.status(500).json({
          error: "SERVER_ERROR",
          message: "Unable to process your message. Please try again.",
        });
      }
    });
  });

// ============================================
// STREAMING CHAT (Real-time letter by letter)
// Using 2nd gen Cloud Functions for true streaming
// ============================================

/**
 * Streaming Chat with Server-Sent Events (2nd Gen)
 * Returns response chunks in real-time for letter-by-letter display
 * 2nd gen functions have better streaming support with less buffering
 *
 * NOTE: Named chatStreamV2 because Firebase doesn't allow upgrading
 * existing 1st gen functions to 2nd gen in-place.
 */
exports.chatStreamV2 = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB",
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      // Set SSE headers - critical for streaming
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

      console.log("=== chatStreamV2 (1st gen) called === v2");

    try {
      if (req.method !== "POST") {
        res.write(`data: ${JSON.stringify({ error: "Method not allowed" })}\n\n`);
        res.end();
        return;
      }

      const { message, images = [], userId, conversationId, isGuest = true } = req.body;

      // Validate input
      if ((!message || !message.trim()) && images.length === 0) {
        res.write(`data: ${JSON.stringify({ error: "INVALID_REQUEST", message: "Please enter a message" })}\n\n`);
        res.end();
        return;
      }

      const guestId = isGuest ? req.ip || `guest_${Date.now()}` : null;
      const effectiveUserId = userId || guestId;

      // Check limits
      const usageCheck = await checkUsageLimit(db, effectiveUserId, "chat", isGuest);
      if (!usageCheck.allowed) {
        res.write(`data: ${JSON.stringify({ error: "LIMIT_REACHED", message: "Chat limit reached" })}\n\n`);
        res.end();
        return;
      }

      // Get context
      const userContext = await getUserContext(db, isGuest ? null : userId);
      const chatHistory = await getChatHistory(db, userId, conversationId, CONFIG.MAX_CHAT_MEMORY);
      const systemPrompt = buildChatSystemPrompt(userContext);

      const effectiveConversationId = conversationId || generateShareId();

      // Send conversation ID first
      res.write(`data: ${JSON.stringify({ type: "start", conversationId: effectiveConversationId })}\n\n`);

      // If images present, send a "thinking" status
      if (images.length > 0) {
        res.write(`data: ${JSON.stringify({ type: "status", message: "Analyzing image..." })}\n\n`);
      }

      // Stream response chunks as they arrive from Vertex AI
      // Frontend handles word-by-word typing animation
      let fullResponse = "";
      await streamChatWithRAG(systemPrompt, message, images, chatHistory, (chunk) => {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`);
      });

      // Save chat after streaming complete
      if (userId && !isGuest) {
        await saveChatMessages(
          db,
          admin,
          userId,
          effectiveConversationId,
          message,
          fullResponse,
          images.length > 0
        );
      }

      await incrementUsage(db, admin, effectiveUserId, "chat");

      // Send completion
      res.write(`data: ${JSON.stringify({ type: "done", fullResponse })}\n\n`);
      res.end();
      console.log("=== chatStreamV2 (1st gen) success ===");
    } catch (error) {
      console.error("chatStreamV2 error:", error.message);
      res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
      res.end();
    }
    });
  });

// ============================================
// HAIR ANALYSIS - FULL (Multiple images)
// ============================================

/**
 * Full Hair Analysis (1-4 images)
 * For registered users
 */
exports.analyzeHairFull = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB",
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      console.log("=== analyzeHairFull called ===");

      try {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { images, userId, isGuest = false, quizAnswers = null } = req.body;

        console.log("Images count:", images ? images.length : 0);
        console.log("UserId:", userId);
        console.log("IsGuest:", isGuest);
        console.log("HasQuiz:", !!quizAnswers);

        // Validate images
        if (!images || !Array.isArray(images) || images.length < 1 || images.length > 4) {
          return res.status(400).json({
            error: "INVALID_REQUEST",
            message: "Please upload 1 to 4 images",
          });
        }

        const guestId = isGuest ? req.ip || `guest_${Date.now()}` : null;
        const effectiveUserId = userId || guestId;

        // Check limits
        const usageCheck = await checkUsageLimit(db, effectiveUserId, "hairAnalysis", isGuest);
        if (!usageCheck.allowed) {
          return res.status(429).json({
            error: "LIMIT_REACHED",
            message: isGuest
              ? "Daily limit reached. Sign up for more!"
              : "Daily analysis limit reached.",
            isGuest,
          });
        }

        // Get user context for personalization
        const userContext = await getUserContext(db, isGuest ? null : userId);

        // Build analysis prompt
        const analysisPrompt = buildAnalysisPrompt("full", userContext);

        // Call Vertex AI with quiz answers
        console.log("Calling Vertex AI for analysis...");
        const analysisResult = await analyzeWithRAG(analysisPrompt, images, quizAnswers);

        // Check if valid hair image
        if (analysisResult.valid_hair_image === false) {
          return res.status(400).json({
            error: "INVALID_IMAGE",
            message: analysisResult.summary || "Please upload a photo of your hair.",
            detected: analysisResult.detected_content,
          });
        }

        // Same-user verification: compare with latest previous analysis
        if (userContext.latestAnalysis) {
          const verification = verifySameUser(analysisResult, userContext.latestAnalysis);
          if (verification.isDifferentHair) {
            analysisResult.different_hair_warning = verification.warning;
            console.log("Different hair detected in full analysis");
          }
        }

        // Add metadata
        const shareId = generateShareId();
        analysisResult.shareId = shareId;
        analysisResult.analysisType = "full";
        analysisResult.createdAt = new Date().toISOString();

        // Save to Firestore
        await saveAnalysis(db, admin, shareId, analysisResult, effectiveUserId, isGuest);

        // Increment usage
        await incrementUsage(db, admin, effectiveUserId, "hairAnalysis");

        console.log("=== analyzeHairFull success ===");
        return res.status(200).json({
          success: true,
          data: analysisResult,
          shareUrl: `/hair-analysis/${shareId}`,
        });
      } catch (error) {
        console.error("=== analyzeHairFull ERROR ===");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        return res.status(500).json({
          error: "SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        });
      }
    });
  });

// ============================================
// HAIR ANALYSIS - QUICK (Single image)
// ============================================

/**
 * Quick Hair Scan (1 image)
 * For guests and quick checks
 */
exports.analyzeHairQuick = functions
  .runWith({
    timeoutSeconds: 120,
    memory: "1GB",
  })
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      console.log("=== analyzeHairQuick called ===");

      try {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Method not allowed" });
        }

        const { image, userId, isGuest = true, quizAnswers = null } = req.body;

        console.log("Image received:", image ? "yes" : "no");
        console.log("UserId:", userId);
        console.log("IsGuest:", isGuest);
        console.log("HasQuiz:", !!quizAnswers);

        if (!image || !image.base64) {
          return res.status(400).json({
            error: "INVALID_REQUEST",
            message: "Please upload an image",
          });
        }

        const guestId = isGuest ? req.ip || `guest_${Date.now()}` : null;
        const effectiveUserId = userId || guestId;

        // Check limits
        const usageCheck = await checkUsageLimit(db, effectiveUserId, "hairAnalysis", isGuest);
        if (!usageCheck.allowed) {
          return res.status(429).json({
            error: "LIMIT_REACHED",
            message: isGuest
              ? "Daily limit reached. Sign up for more!"
              : "Daily analysis limit reached.",
            isGuest,
          });
        }

        // Get user context (minimal for quick scan)
        const userContext = await getUserContext(db, isGuest ? null : userId);

        // Build analysis prompt
        const analysisPrompt = buildAnalysisPrompt("quick", userContext);

        // Call Vertex AI with quiz answers
        console.log("Calling Vertex AI for quick analysis...");
        const analysisResult = await analyzeWithRAG(analysisPrompt, [image], quizAnswers);

        // Check if valid hair image
        if (analysisResult.valid_hair_image === false) {
          return res.status(400).json({
            error: "INVALID_IMAGE",
            message: analysisResult.summary || "Please upload a photo of your hair.",
            detected: analysisResult.detected_content,
          });
        }

        // Same-user verification: compare with latest previous analysis
        if (userContext.latestAnalysis) {
          const verification = verifySameUser(analysisResult, userContext.latestAnalysis);
          if (verification.isDifferentHair) {
            analysisResult.different_hair_warning = verification.warning;
            console.log("Different hair detected in quick analysis");
          }
        }

        // Add metadata
        const shareId = generateShareId();
        analysisResult.shareId = shareId;
        analysisResult.analysisType = "quick";
        analysisResult.createdAt = new Date().toISOString();

        // Save to Firestore
        await saveAnalysis(db, admin, shareId, analysisResult, effectiveUserId, isGuest);

        // Increment usage
        await incrementUsage(db, admin, effectiveUserId, "hairAnalysis");

        console.log("=== analyzeHairQuick success ===");
        return res.status(200).json({
          success: true,
          data: analysisResult,
          shareUrl: `/hair-analysis/${shareId}`,
        });
      } catch (error) {
        console.error("=== analyzeHairQuick ERROR ===");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        return res.status(500).json({
          error: "SERVER_ERROR",
          message: "Something went wrong. Please try again.",
        });
      }
    });
  });

// ============================================
// UTILITY ENDPOINTS (Keep same as before)
// ============================================

/**
 * Get Shared Analysis
 */
exports.getSharedAnalysis = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const shareId = req.query.id;
      if (!shareId) {
        return res.status(400).json({ error: "INVALID_REQUEST", message: "Analysis ID required" });
      }

      const doc = await db.collection("hairAnalysis").doc(shareId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "NOT_FOUND", message: "Analysis not found" });
      }

      const data = doc.data();
      return res.status(200).json({
        success: true,
        data: {
          hair_type: data.hair_type,
          hair_type_confidence: data.hair_type_confidence,
          texture: data.texture,
          density: data.density,
          porosity: data.porosity,
          condition_score: data.condition_score,
          moisture_level: data.moisture_level,
          protein_balance: data.protein_balance,
          concerns: data.concerns,
          chemical_history: data.chemical_history,
          primary_need: data.primary_need,
          summary: data.summary,
          analysisType: data.analysisType,
        },
      });
    } catch (error) {
      console.error("getSharedAnalysis error:", error.message);
      return res.status(500).json({ error: "SERVER_ERROR", message: "Unable to load analysis" });
    }
  });
});

/**
 * Create User Profile on Sign Up
 */
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  console.log("Creating profile for user:", user.uid);
  try {
    await db.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      language: CONFIG.DEFAULT_LANGUAGE,
    });
    console.log("Profile created for:", user.uid);
  } catch (error) {
    console.error("Error creating profile:", error.message);
  }
});

/**
 * Get User Profile
 */
exports.getUserProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const decoded = await verifyAuthToken(req, res);
      if (!decoded) return;

      const userId = req.query.userId || decoded.uid;
      if (userId !== decoded.uid && !isEmailAdmin(decoded)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();

      // Get today's usage
      const today = new Date().toISOString().split("T")[0];
      const usageDoc = await db.collection("usage").doc(`${userId}_${today}`).get();
      const todayUsage = usageDoc.exists ? usageDoc.data() : {};

      // Get recent analyses
      const analysesSnap = await db
        .collection("users")
        .doc(userId)
        .collection("analyses")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      const recentAnalyses = analysesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        success: true,
        profile: {
          email: userData.email,
          displayName: userData.displayName,
          language: userData.language,
        },
        usage: {
          today: todayUsage,
          limits: CONFIG.LIMITS.REGISTERED,
        },
        recentAnalyses,
      });
    } catch (error) {
      console.error("getUserProfile error:", error.message);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

/**
 * Update User Profile
 */
exports.updateUserProfile = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const decoded = await verifyAuthToken(req, res);
      if (!decoded) return;

      const { userId: bodyUserId, updates } = req.body;
      const userId = bodyUserId || decoded.uid;
      if (userId !== decoded.uid && !isEmailAdmin(decoded)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      const allowedFields = ["displayName", "language", "settings"];
      const safeUpdates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

      for (const key of allowedFields) {
        if (updates && updates[key] !== undefined) {
          safeUpdates[key] = updates[key];
        }
      }

      await db.collection("users").doc(userId).update(safeUpdates);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("updateUserProfile error:", error.message);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

/**
 * Get Analysis History
 */
exports.getAnalysisHistory = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const decoded = await verifyAuthToken(req, res);
      if (!decoded) return;

      const userId = req.query.userId || decoded.uid;
      const limitParam = parseInt(req.query.limit) || 10;

      if (userId !== decoded.uid && !isEmailAdmin(decoded)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      const snapshot = await db
        .collection("hairAnalysis")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limitParam)
        .get();

      const analyses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, analyses });
    } catch (error) {
      console.error("getAnalysisHistory error:", error.message);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

/**
 * Get Chat History
 */
exports.getChatHistory = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const decoded = await verifyAuthToken(req, res);
      if (!decoded) return;

      const userId = req.query.userId || decoded.uid;
      const conversationId = req.query.conversationId;

      if (userId !== decoded.uid && !isEmailAdmin(decoded)) {
        return res.status(403).json({ error: "FORBIDDEN" });
      }

      if (conversationId) {
        // Get messages for specific conversation
        const messagesSnap = await db
          .collection("users")
          .doc(userId)
          .collection("chats")
          .doc(conversationId)
          .collection("messages")
          .orderBy("timestamp", "asc")
          .get();

        const messages = messagesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return res.status(200).json({ success: true, messages });
      }

      // Get all conversations
      const chatsSnap = await db
        .collection("users")
        .doc(userId)
        .collection("chats")
        .orderBy("lastUpdated", "desc")
        .limit(20)
        .get();

      const conversations = chatsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, conversations });
    } catch (error) {
      console.error("getChatHistory error:", error.message);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

/**
 * Get Config (public)
 */
exports.getConfig = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    return res.status(200).json({
      success: true,
      config: {
        maxFileSize: CONFIG.MAX_FILE_SIZE_MB,
        supportedTypes: CONFIG.SUPPORTED_FILE_TYPES,
        limits: {
          guest: CONFIG.LIMITS.GUEST,
          registered: CONFIG.LIMITS.REGISTERED,
        },
        supportedLanguages: CONFIG.SUPPORTED_LANGUAGES,
      },
    });
  });
});

// ============================================
// PUSH NOTIFICATION FUNCTIONS
// ============================================

/**
 * Scheduled function that runs daily at 10:00 AM UTC
 * Checks for inactive users and sends push notifications
 */
exports.sendInactiveUserNotifications = functions.pubsub
  .schedule("0 10 * * *") // Runs at 10:00 AM UTC daily
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("Starting inactive user notification job...");

    try {
      // Get notification settings
      const settingsDoc = await db.collection("settings").doc("notifications").get();

      if (!settingsDoc.exists) {
        console.log("No notification settings found");
        return null;
      }

      const settings = settingsDoc.data();

      // Check if notifications are enabled
      if (!settings.enabled) {
        console.log("Notifications are disabled");
        return null;
      }

      const inactiveDays = settings.inactiveDays || 7;
      const title = settings.title || "We miss you! 💇";
      const body = settings.body || "Your hair care journey awaits. Come back and check your hair health!";

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      console.log("Looking for users inactive since:", cutoffDate.toISOString());

      // Get all users
      const usersSnapshot = await db.collection("users").get();

      const notifications = [];
      const notificationLogs = [];

      const usersToUpdate = []; // Track users to update lastNotificationSent

      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        const odcId = doc.id;

        // Skip if no FCM token or user is banned
        if (!user.fcmToken || user.isBanned) {
          return;
        }

        // Check last active date
        let lastActive = user.lastActiveDate ? user.lastActiveDate.toDate() : null;
        if (!lastActive && user.lastLogin) {
          lastActive = user.lastLogin.toDate();
        }

        // Skip if not inactive
        if (!lastActive || lastActive >= cutoffDate) {
          return;
        }

        // CHECK: Have we already notified this user for THIS inactive period?
        // Only send notification if:
        // 1. We never sent a notification before, OR
        // 2. The user was active AFTER the last notification (meaning they came back and left again)
        const lastNotificationSent = user.lastInactiveNotification ? user.lastInactiveNotification.toDate() : null;

        if (lastNotificationSent) {
          // If we already notified them and they haven't been active since, skip
          if (lastNotificationSent > lastActive) {
            return; // Already notified for this inactive period
          }
        }

        // This user needs a notification
        usersToUpdate.push(odcId);
        notifications.push({
          token: user.fcmToken,
          notification: {
            title: title,
            body: body,
          },
          data: {
            type: "inactive_reminder",
            odcId: odcId,
          },
          android: {
            priority: "high",
            notification: {
              channelId: "default",
            },
          },
          apns: {
            payload: {
              aps: {
                badge: 1,
                sound: "default",
              },
            },
          },
        });

        notificationLogs.push({
          odcId: odcId,
          notificationType: "inactive_reminder",
          status: "pending",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      console.log("Found", notifications.length, "inactive users to notify");

      if (notifications.length === 0) {
        return null;
      }

      // Send notifications in batches (FCM limit is 500 per batch)
      const batchSize = 500;
      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);

        try {
          const response = await admin.messaging().sendEach(batch);

          response.responses.forEach((resp, idx) => {
            if (resp.success) {
              successCount++;
              notificationLogs[i + idx].status = "sent";
            } else {
              failureCount++;
              notificationLogs[i + idx].status = "failed";
              notificationLogs[i + idx].error = resp.error ? resp.error.message : "Unknown error";

              // If token is invalid, remove it from user document
              if (resp.error && (
                resp.error.code === "messaging/registration-token-not-registered" ||
                resp.error.code === "messaging/invalid-registration-token"
              )) {
                const odcId = notifications[i + idx].data.odcId;
                db.collection("users").doc(odcId).update({
                  fcmToken: admin.firestore.FieldValue.delete(),
                }).catch((err) => {
                  console.error("Error removing invalid token:", err);
                });
              }
            }
          });
        } catch (error) {
          console.error("Error sending batch:", error);
        }
      }

      // Log all notifications
      const logBatch = db.batch();
      notificationLogs.forEach((log) => {
        const logRef = db.collection("notificationLogs").doc();
        logBatch.set(logRef, log);
      });
      await logBatch.commit();

      // Update lastInactiveNotification for successfully notified users
      // This prevents sending daily notifications to the same inactive user
      const updatePromises = [];
      for (let i = 0; i < notificationLogs.length; i++) {
        if (notificationLogs[i].status === "sent") {
          const userId = usersToUpdate[i];
          if (userId) {
            updatePromises.push(
              db.collection("users").doc(userId).update({
                lastInactiveNotification: admin.firestore.FieldValue.serverTimestamp(),
              }).catch((err) => {
                console.error("Error updating lastInactiveNotification:", err);
              })
            );
          }
        }
      }
      await Promise.all(updatePromises);

      console.log("Notification job complete. Success:", successCount, "Failed:", failureCount);

      return { success: successCount, failed: failureCount };
    } catch (error) {
      console.error("Error in notification job:", error);
      throw error;
    }
  });

/**
 * HTTP function to manually trigger notifications (for testing)
 * Only callable by authenticated admins
 */
exports.triggerNotificationsManually = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      // Admin status comes from the verified token (custom claim or known
      // email), NOT from a Firestore field a user could write to their own doc.
      const decoded = await verifyAuthToken(req, res);
      if (!decoded) return;

      if (!isEmailAdmin(decoded)) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const userId = decoded.uid;
      console.log("Manually triggering notification job by admin:", userId);

      // Get notification settings and inactive users count
      const settingsDoc = await db.collection("settings").doc("notifications").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : { inactiveDays: 7, enabled: false };

      if (!settings.enabled) {
        return res.status(200).json({
          success: false,
          message: "Notifications are disabled. Enable them first.",
        });
      }

      const inactiveDays = settings.inactiveDays || 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      const usersSnapshot = await db.collection("users").get();
      let inactiveCount = 0;

      usersSnapshot.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken && !user.isBanned) {
          let lastActive = user.lastActiveDate ? user.lastActiveDate.toDate() : null;
          if (!lastActive && user.lastLogin) {
            lastActive = user.lastLogin.toDate();
          }
          if (lastActive && lastActive < cutoffDate) {
            inactiveCount++;
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: `Notification job will run. Found ${inactiveCount} inactive users with tokens.`,
        inactiveUsers: inactiveCount,
        settings: {
          enabled: settings.enabled,
          inactiveDays: settings.inactiveDays,
          title: settings.title,
        },
      });
    } catch (error) {
      console.error("triggerNotificationsManually error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });
});

/**
 * Cleanup old notification logs (runs weekly on Sundays at midnight UTC)
 */
exports.cleanupNotificationLogs = functions.pubsub
  .schedule("0 0 * * 0")
  .timeZone("UTC")
  .onRun(async (context) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logsSnapshot = await db.collection("notificationLogs")
      .where("sentAt", "<", thirtyDaysAgo)
      .get();

    if (logsSnapshot.empty) {
      console.log("No old logs to clean up");
      return null;
    }

    const batch = db.batch();
    logsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log("Deleted", logsSnapshot.size, "old notification logs");

    return { deleted: logsSnapshot.size };
  });
