/**
 * Vertex AI Module - Direct REST API with JWT Auth
 * Fully self-contained: no SDK dependencies
 *
 * Uses service account JWT → Bearer token → Vertex AI REST API
 *
 * MODELS:
 * - gemini-2.5-flash: AI Coach chat (text + image chat + streaming)
 * - gemini-3-flash: Hair analysis vision step (quick & full)
 *
 * Both use same RAG corpus for knowledge grounding
 */

const crypto = require("crypto");
const https = require("https");

// --- Service Account ---
const SERVICE_ACCOUNT = require("./service-account-chat.json");

// --- Configuration ---
const PROJECT_ID = "prohall-professional-products";
const LOCATION = "us-west1";

// Model IDs
const CHAT_MODEL = "gemini-2.5-flash"; // AI Coach chat + image chat
const VISION_MODEL = "gemini-3-flash-preview"; // Hair analysis (quick & full)

// RAG Corpus
const RAG_CORPUS_ID = "6917529027641081856";
const RAG_CORPUS = `projects/${PROJECT_ID}/locations/${LOCATION}/ragCorpora/${RAG_CORPUS_ID}`;

// Vertex AI hosts
// gemini-3-flash-preview requires "global" location on Vertex AI
const API_HOST = `${LOCATION}-aiplatform.googleapis.com`;
const GLOBAL_API_HOST = "aiplatform.googleapis.com";

// Helper: build API host and path for a given model and method
function getEndpoint(modelId, method) {
  // Gemini 3 models require global endpoint
  if (modelId.startsWith("gemini-3")) {
    return {
      hostname: GLOBAL_API_HOST,
      path: `/v1/projects/${PROJECT_ID}/locations/global/publishers/google/models/${modelId}:${method}`,
    };
  }
  return {
    hostname: API_HOST,
    path: `/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${modelId}:${method}`,
  };
}

// ===========================================
// JWT AUTH
// ===========================================

function base64UrlEncode(data) {
  return Buffer.from(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function createJWT(serviceAccount) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  const signature = sign.sign(serviceAccount.private_key);
  const signatureB64 = base64UrlEncode(signature);

  return `${unsignedToken}.${signatureB64}`;
}

// Token cache
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  // Return cached token if still valid (with 5min buffer)
  if (cachedToken && Date.now() < tokenExpiry - 300000) {
    return cachedToken;
  }

  const jwt = createJWT(SERVICE_ACCOUNT);

  const postData = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(body);
            if (result.access_token) {
              cachedToken = result.access_token;
              tokenExpiry = Date.now() + (result.expires_in || 3600) * 1000;
              resolve(result.access_token);
            } else {
              reject(new Error(`Token exchange failed: ${body}`));
            }
          } catch (e) {
            reject(new Error(`Token parse failed: ${body}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// ===========================================
// GENERIC REST API CALLER
// ===========================================

/**
 * Make a non-streaming generateContent call
 * @param {string} modelId - Model to use
 * @param {Object} payload - Full request payload
 * @returns {string} Response text
 */
async function callGenerateContent(modelId, payload) {
  const accessToken = await getAccessToken();
  const postData = JSON.stringify(payload);
  const endpoint = getEndpoint(modelId, "generateContent");

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: endpoint.hostname,
        path: endpoint.path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            console.error("API error:", res.statusCode, body.substring(0, 500));
            reject(new Error(`Vertex AI API error: ${res.statusCode}`));
            return;
          }
          try {
            const result = JSON.parse(body);
            const text =
              result.candidates?.[0]?.content?.parts
                ?.map((p) => p.text || "")
                .join("") || "";
            if (!text) {
              console.error("Empty response from model. Body:", body.substring(0, 500));
            }
            resolve(text);
          } catch (e) {
            reject(new Error("Failed to parse Vertex AI response"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Make a streaming generateContent call with byte-by-byte JSON parsing
 * @param {string} modelId - Model to use
 * @param {Object} payload - Full request payload
 * @param {Function} onChunk - Called with each text chunk
 * @returns {string} Full response text
 */
async function callStreamGenerateContent(modelId, payload, onChunk) {
  const accessToken = await getAccessToken();
  const postData = JSON.stringify(payload);
  const endpoint = getEndpoint(modelId, "streamGenerateContent");

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: endpoint.hostname,
        path: endpoint.path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let fullResponse = "";
        let buffer = "";
        let braceDepth = 0;
        let inString = false;
        let escapeNext = false;

        if (res.statusCode !== 200) {
          let errorBody = "";
          res.on("data", (chunk) => (errorBody += chunk));
          res.on("end", () => {
            console.error("Vertex AI error:", res.statusCode, errorBody.substring(0, 300));
            reject(new Error(`Vertex AI API error: ${res.statusCode}`));
          });
          return;
        }

        // Parse byte-by-byte for streaming JSON array
        res.on("data", (data) => {
          const str = data.toString("utf-8");

          for (const char of str) {
            buffer += char;

            if (escapeNext) {
              escapeNext = false;
              continue;
            }
            if (char === "\\" && inString) {
              escapeNext = true;
              continue;
            }
            if (char === '"') {
              inString = !inString;
              continue;
            }
            if (inString) continue;

            if (char === "{") {
              braceDepth++;
            } else if (char === "}") {
              braceDepth--;

              if (braceDepth === 0) {
                const objStart = buffer.indexOf("{");
                const objStr = buffer.substring(objStart);
                buffer = "";

                try {
                  const chunk = JSON.parse(objStr);
                  if (chunk.candidates && chunk.candidates.length > 0) {
                    const candidate = chunk.candidates[0];
                    if (candidate.content && candidate.content.parts) {
                      for (const part of candidate.content.parts) {
                        if (part.text) {
                          fullResponse += part.text;
                          if (onChunk) onChunk(part.text);
                        }
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parse errors on partial data
                }
              }
            }
          }
        });

        res.on("end", () => {
          console.log("Stream complete, length:", fullResponse.length);
          resolve(fullResponse);
        });

        res.on("error", reject);
      }
    );

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// ===========================================
// PAYLOAD BUILDERS
// ===========================================

/**
 * Build payload for RAG-grounded text query
 */
function buildRAGPayload(systemPrompt, userMessage, chatHistory = [], genConfig = null) {
  const contents = [];

  // Add chat history
  for (const msg of chatHistory.slice(-10)) {
    contents.push({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    });
  }

  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  const payload = {
    contents,
    generationConfig: genConfig || {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topK: 40,
      topP: 0.95,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
    tools: [
      {
        retrieval: {
          vertexRagStore: {
            ragResources: [{ ragCorpus: RAG_CORPUS }],
            ragRetrievalConfig: { topK: 5 },
          },
        },
      },
    ],
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  return payload;
}

/**
 * Build payload for image analysis (no RAG, just vision)
 */
function buildVisionPayload(images, prompt, quizAnswers = null) {
  const parts = [];

  // Build prompt text (with quiz answers if available)
  let fullPrompt = prompt;
  if (quizAnswers) {
    fullPrompt += `

## USER-PROVIDED INFORMATION (from pre-analysis quiz):
The user answered these questions about their hair before taking photos:
- Hair Pattern: ${quizAnswers.hairType || "Not provided"}
- Strand Thickness: ${quizAnswers.hairTexture || "Not provided"}
- Self-assessed Condition: ${quizAnswers.currentCondition || "Not provided"}
- Chemical Treatments (last 12 months): ${Array.isArray(quizAnswers.chemicalTreatments) ? quizAnswers.chemicalTreatments.join(", ") : quizAnswers.chemicalTreatments || "None"}
- Main Concern: ${quizAnswers.mainConcern || "Not provided"}
- Heat Tool Usage: ${quizAnswers.heatStyling || "Not provided"}
- Hair Goal: ${quizAnswers.hairGoal || "Not provided"}

USE THIS INFORMATION to:
1. Validate your visual assessment against user's self-report
2. Adjust porosity assessment based on chemical treatment history (bleach/highlights = higher porosity)
3. Prioritize recommendations based on their main concern and goal
4. If visual analysis conflicts with user's self-report, note the discrepancy and trust the user's answers for treatment history
`;
  }

  parts.push({ text: fullPrompt });

  // Add images as inline base64
  for (const img of images) {
    let base64Data, mimeType;

    if (typeof img === "string") {
      if (img.startsWith("data:")) {
        const match = img.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      } else {
        mimeType = "image/jpeg";
        base64Data = img;
      }
    } else if (img && typeof img === "object") {
      base64Data = img.base64 || img.data;
      mimeType = img.mimeType || "image/jpeg";

      if (base64Data && base64Data.startsWith("data:")) {
        const match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }
    }

    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }
  }

  return {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      topP: 0.8,
      topK: 40,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };
}

// ===========================================
// IMAGE ANALYSIS (Direct REST API - no geminiApi.js)
// Uses gemini-3-flash for vision
// ===========================================

/**
 * Analyze images using Vertex AI REST API with gemini-3-flash
 * @param {Array} images - Array of {base64, mimeType} objects
 * @param {string} prompt - Analysis prompt
 * @param {Object} quizAnswers - Optional quiz answers
 * @returns {string} Text description from vision model
 */
async function analyzeImageWithVision(images, prompt, quizAnswers = null) {
  console.log("=== analyzeImageWithVision (REST API, gemini-3-flash) ===");
  console.log("Images:", images.length);

  const payload = buildVisionPayload(images, prompt, quizAnswers);

  const text = await callGenerateContent(VISION_MODEL, payload);

  console.log("Vision analysis complete, length:", text.length);

  if (text.length < 100) {
    console.warn("Warning: Vision response seems very short:", text);
  }

  return text;
}

// ===========================================
// AI COACH CHAT (gemini-2.5-flash + RAG)
// ===========================================

/**
 * Non-streaming chat with RAG
 * Two-step for images: vision (gemini-2.5-flash) → RAG (gemini-2.5-flash)
 */
async function chatWithRAG(systemPrompt, userMessage, images = [], chatHistory = []) {
  console.log("=== chatWithRAG (REST API) ===");

  let queryForRAG = userMessage;

  // Two-step for images
  if (images && images.length > 0) {
    const imageExtractionPrompt = `Analyze this hair image and describe in detail:
- Hair texture (straight, wavy, curly, coily)
- Hair condition (healthy, dry, damaged, frizzy)
- Color and treatments visible
- Visible concerns (split ends, breakage, etc.)
- Hair density
Provide a comprehensive text description for hair care advice.`;

    // Use CHAT_MODEL (gemini-2.5-flash) for image analysis in chat context
    const visionPayload = buildVisionPayload(images, imageExtractionPrompt);
    const imageDescription = await callGenerateContent(CHAT_MODEL, visionPayload);
    console.log("Chat image analyzed, length:", imageDescription.length);

    queryForRAG = userMessage && userMessage.trim()
      ? `Hair analysis from image:\n${imageDescription}\n\nUser's question: ${userMessage}`
      : `Hair analysis from image:\n${imageDescription}\n\nProvide personalized hair care advice.`;
    chatHistory = [];
  }

  const payload = buildRAGPayload(systemPrompt, queryForRAG, chatHistory);
  return await callGenerateContent(CHAT_MODEL, payload);
}

/**
 * Streaming chat with RAG
 * Two-step for images: vision (gemini-2.5-flash) → streaming RAG (gemini-2.5-flash)
 */
async function streamChatWithRAG(systemPrompt, userMessage, images = [], chatHistory = [], onChunk) {
  console.log("=== streamChatWithRAG (REST API) ===");
  console.log("Message:", userMessage?.substring(0, 50));
  console.log("Images:", images?.length || 0);

  let queryForRAG = userMessage;

  // Two-step for images
  if (images && images.length > 0) {
    console.log("Step 1: Analyzing image with gemini-2.5-flash...");
    const imageExtractionPrompt = `Analyze this hair image and describe in detail:
- Hair texture (straight, wavy, curly, coily)
- Hair condition (healthy, dry, damaged, frizzy)
- Color and treatments visible
- Visible concerns (split ends, breakage, etc.)
- Hair density
Provide a comprehensive text description for hair care advice.`;

    const visionPayload = buildVisionPayload(images, imageExtractionPrompt);
    const imageDescription = await callGenerateContent(CHAT_MODEL, visionPayload);
    console.log("Image analyzed, length:", imageDescription.length);

    queryForRAG = userMessage && userMessage.trim()
      ? `Hair analysis from image:\n${imageDescription}\n\nUser's question: ${userMessage}`
      : `Hair analysis from image:\n${imageDescription}\n\nProvide personalized hair care advice.`;

    chatHistory = [];
  }

  const payload = buildRAGPayload(systemPrompt, queryForRAG, chatHistory);

  console.log("Streaming from Vertex AI REST API...");
  return await callStreamGenerateContent(CHAT_MODEL, payload, onChunk);
}

// ===========================================
// HAIR ANALYSIS (Two-step: gemini-3-flash vision → gemini-2.5-flash RAG)
// ===========================================

/**
 * Full hair analysis with RAG grounding
 * Step 1: gemini-3-flash analyzes images (with quiz data)
 * Step 2: gemini-2.5-flash queries RAG knowledge base with visual description
 *
 * @param {string} analysisPrompt - Analysis prompt from prompts.js
 * @param {Array} images - Array of {base64, mimeType} image objects
 * @param {Object} quizAnswers - Optional quiz answers
 * @returns {Object} Parsed JSON analysis result
 */
async function analyzeWithRAG(analysisPrompt, images, quizAnswers = null) {
  console.log("=== analyzeWithRAG (REST API) ===");
  console.log("Images:", images.length);
  console.log("Has quiz answers:", !!quizAnswers);

  // Validate images
  const validImages = images.filter((img) => img && img.base64 && img.base64.length > 100);
  if (validImages.length === 0) {
    console.error("No valid images with base64 data");
    throw new Error("No valid images provided");
  }
  console.log("Valid images with data:", validImages.length);

  // Step 1: Vision analysis with gemini-3-flash
  const visionPrompt = `You are a professional trichologist analyzing hair images. Examine each image carefully and provide a COMPLETE detailed analysis.

IMPORTANT: Provide thorough observations for ALL of these categories:

1. HAIR TYPE & TEXTURE:
   - Curl pattern: straight (1A-1C), wavy (2A-2C), curly (3A-3C), or coily (4A-4C)
   - Strand thickness: fine, medium, or coarse
   - Overall texture description

2. HAIR CONDITION:
   - General health: healthy, slightly dry, dry/frizzy, damaged, or severely damaged
   - Visible damage: split ends, breakage, roughness, dullness
   - Cuticle appearance: smooth, slightly raised, raised, or very damaged

3. POROSITY INDICATORS:
   - Shine level: high shine, moderate shine, low shine, or dull
   - Frizz level: minimal, moderate, significant
   - How hair appears to hold moisture

4. COLOR & CHEMICAL TREATMENT:
   - Natural color or treated
   - Signs of: bleaching, dyeing, keratin treatment, relaxer, perm
   - Root growth or color variation
   - Damage from chemical processes

5. DENSITY & THICKNESS:
   - Overall density: thin, medium, or thick
   - Scalp visibility: clearly visible, somewhat visible, or not visible
   - Hair volume assessment

6. VISIBLE CONCERNS:
   - List all concerns you observe: dryness, frizz, split ends, breakage, thinning, oiliness, dandruff, lack of shine, tangling, heat damage

7. SCALP (if visible):
   - Any visible scalp conditions
   - Oiliness or dryness at roots

Write a comprehensive paragraph for each category. Be specific and detailed. This analysis will be used for personalized hair care recommendations.`;

  console.log("Step 1: Analyzing images with gemini-3-flash...");
  const visualDescription = await analyzeImageWithVision(validImages, visionPrompt, quizAnswers);
  console.log("Visual description extracted, length:", visualDescription.length);

  if (visualDescription.length < 300) {
    console.error("Visual description too short, likely incomplete:", visualDescription);
    throw new Error("Failed to properly analyze images - response was truncated");
  }

  // Step 2: RAG analysis with gemini-2.5-flash
  console.log("Step 2: Querying RAG with gemini-2.5-flash...");
  const ragQuery = `You are a professional hair care AI that uses a knowledge base of hair analysis criteria.

Based on the following visual analysis of a user's hair:
---
${visualDescription}
---

Using the HAIR IMAGE ASSESSMENT CRITERIA from the knowledge base, provide a complete hair analysis.

${analysisPrompt}

IMPORTANT: Your response must be valid JSON matching the required schema. Use the knowledge base to determine accurate scores and classifications.`;

  const ragPayload = buildRAGPayload(null, ragQuery, [], {
    temperature: 0.2,
    maxOutputTokens: 4096,
    topK: 40,
    topP: 0.95,
  });

  const ragResponse = await callGenerateContent(CHAT_MODEL, ragPayload);
  console.log("RAG response length:", ragResponse.length);

  return parseAnalysisResponse(ragResponse);
}

// ===========================================
// JSON PARSER
// ===========================================

function parseAnalysisResponse(responseText) {
  let jsonText = responseText.trim();

  // Remove markdown code blocks
  if (jsonText.includes("```")) {
    const match = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match && match[1]) {
      jsonText = match[1].trim();
    } else {
      jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    }
  }

  // Find JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("JSON parse error:", e.message);
    }
  }

  // Direct parse
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse response:", responseText.substring(0, 500));
    throw new Error("Failed to parse analysis response as JSON");
  }
}

// ===========================================
// EXPORTS
// ===========================================

module.exports = {
  chatWithRAG,
  analyzeWithRAG,
  streamChatWithRAG,
};
