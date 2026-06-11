/**
 * Configuration for Cabelo.AI Cloud Functions
 * Vertex AI + Firebase settings
 */

const CONFIG = {
  // ===========================================
  // VERTEX AI / GCP Settings
  // ===========================================
  GCP_PROJECT_ID: "prohall-professional-products",

  // Locations - RAG corpus is in europe-west1
  GCP_LOCATION: "europe-west1",           // For RAG corpus
  VISION_LOCATION: "europe-west1",         // For vision model

  // RAG Corpus - your knowledge base (stays in europe-west1)
  RAG_CORPUS_ID: "2305843009213693952",

  // Full corpus resource name (computed)
  get RAG_CORPUS_NAME() {
    return `projects/${this.GCP_PROJECT_ID}/locations/${this.GCP_LOCATION}/ragCorpora/${this.RAG_CORPUS_ID}`;
  },

  // Gemini models
  GEMINI_MODEL: "gemini-2.5-flash",        // For text/RAG queries (europe-west1)
  VISION_MODEL: "gemini-3-flash-preview",   // For image analysis (us-central1) - GA model

  // RAG retrieval settings
  RAG_TOP_K: 5,              // Number of relevant chunks to retrieve
  RAG_DISTANCE_THRESHOLD: 0.5, // Similarity threshold (0-1, lower = more strict)

  // ===========================================
  // Generation Settings
  // ===========================================
  GENERATION: {
    CHAT: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topK: 40,
      topP: 0.95,
    },
    ANALYSIS: {
      temperature: 0.2,  // Lower for more consistent analysis
      maxOutputTokens: 2048,
    },
  },

  // ===========================================
  // Usage Limits
  // ===========================================
  LIMITS: {
    GUEST: {
      hairAnalysis: 1,
      chat: 5,
      chatImagesPerDay: 2,
    },
    REGISTERED: {
      hairAnalysis: 5,
      chat: 100,
      chatImagesPerDay: 20,
    },
  },

  // ===========================================
  // Chat Settings
  // ===========================================
  MAX_CHAT_MEMORY: 15,       // Number of previous messages to include
  MAX_IMAGES_PER_CHAT: 1,    // Max images per chat message
  MAX_FILE_SIZE_MB: 10,
  SUPPORTED_FILE_TYPES: ["image/jpeg", "image/png", "image/webp", "image/heic"],

  // ===========================================
  // Supported Languages
  // ===========================================
  SUPPORTED_LANGUAGES: ["en", "pt", "es"],
  DEFAULT_LANGUAGE: "en",

  // ===========================================
  // Weather API Settings (Google Weather API)
  // ===========================================
  WEATHER: {
    API_KEY: process.env.GOOGLE_WEATHER_API_KEY || "",
    GEOCODING_API_KEY: process.env.GOOGLE_GEOCODING_API_KEY || "",
    CACHE_TTL_MS: 30 * 60 * 1000, // 30 minutes cache
  },
};

module.exports = CONFIG;
