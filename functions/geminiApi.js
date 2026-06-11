/**
 * Google AI Gemini API for Image Analysis
 * Uses @google/generative-ai SDK (not Vertex AI)
 * Model: gemini-3-flash-preview
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Get API key from environment variable
// Set via: firebase functions:secrets:set GEMINI_API_KEY
// Or in .env file for local development
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY not found. Set it via environment variable or Firebase secrets.");
}

// Initialize Google AI
let genAI = null;

function getGeminiClient() {
  if (!genAI && GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Analyze images using Google AI Gemini API
 * @param {Array} images - Array of base64 image strings or objects with {base64, mimeType}
 * @param {string} prompt - The analysis prompt
 * @param {Object} quizAnswers - Optional quiz answers to include in prompt
 * @returns {Promise<string>} - The model's response text
 */
async function analyzeImageWithGemini(images, prompt, quizAnswers = null) {
  const client = getGeminiClient();

  if (!client) {
    throw new Error("Gemini API client not initialized. Check API key configuration.");
  }

  // Get the model
  const model = client.getGenerativeModel({
    model: "gemini-3-flash-preview",  // Latest vision model for hair analysis
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });

  // Build the content parts
  const parts = [];

  // Add the prompt text first
  let fullPrompt = prompt;

  // Embed quiz answers if available
  if (quizAnswers) {
    fullPrompt += `

## USER-PROVIDED INFORMATION (from pre-analysis quiz):
The user answered these questions about their hair before taking photos:
- Hair Pattern: ${quizAnswers.hairType || 'Not provided'}
- Strand Thickness: ${quizAnswers.hairTexture || 'Not provided'}
- Self-assessed Condition: ${quizAnswers.currentCondition || 'Not provided'}
- Chemical Treatments (last 12 months): ${Array.isArray(quizAnswers.chemicalTreatments) ? quizAnswers.chemicalTreatments.join(', ') : quizAnswers.chemicalTreatments || 'None'}
- Main Concern: ${quizAnswers.mainConcern || 'Not provided'}
- Heat Tool Usage: ${quizAnswers.heatStyling || 'Not provided'}
- Hair Goal: ${quizAnswers.hairGoal || 'Not provided'}

USE THIS INFORMATION to:
1. Validate your visual assessment against user's self-report
2. Adjust porosity assessment based on chemical treatment history (bleach/highlights = higher porosity)
3. Prioritize recommendations based on their main concern and goal
4. If visual analysis conflicts with user's self-report, note the discrepancy and trust the user's answers for treatment history
`;
  }

  parts.push({ text: fullPrompt });

  // Add images
  for (const img of images) {
    let base64Data, mimeType;

    if (typeof img === 'string') {
      // Handle base64 string (with or without data URL prefix)
      if (img.startsWith('data:')) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        } else {
          throw new Error('Invalid data URL format');
        }
      } else {
        // Assume raw base64 with default JPEG mime type
        mimeType = 'image/jpeg';
        base64Data = img;
      }
    } else if (img && typeof img === 'object') {
      // Handle object with base64 and mimeType properties
      base64Data = img.base64 || img.data;
      mimeType = img.mimeType || 'image/jpeg';

      // Remove data URL prefix if present
      if (base64Data && base64Data.startsWith('data:')) {
        const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }
    } else {
      continue; // Skip invalid images
    }

    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      });
    }
  }

  console.log(`[GeminiAPI] Sending request with ${parts.length - 1} images`);

  try {
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    console.log(`[GeminiAPI] Received response: ${text.substring(0, 200)}...`);

    return text;
  } catch (error) {
    console.error('[GeminiAPI] Error:', error.message);
    throw error;
  }
}

module.exports = {
  analyzeImageWithGemini,
  getGeminiClient
};
