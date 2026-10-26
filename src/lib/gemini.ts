"use server";

export interface AIScanResult {
  success: boolean;
  modelUsed?: string;
  detectedCategories: string[];
  obstructionSeverity: "low" | "partial" | "substantial";
  suggestedDescription: string;
  recommendedAction: "verified" | "needs_inspection";
  confidenceNotes: string;
  isUnclear: boolean;
  error?: string;
}

const CANDIDATE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-pro-vision",
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

/**
 * Server Action: Multimodal vision scan of drainage obstruction photos.
 * Uses Google Gemini AI Studio with automated model cascade fallback.
 */
export async function analyzeObstructionPhoto(base64Image: string): Promise<AIScanResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      detectedCategories: [],
      obstructionSeverity: "low",
      suggestedDescription: "AI analysis unavailable (GEMINI_API_KEY not configured).",
      recommendedAction: "needs_inspection",
      confidenceNotes: "Manual classification required.",
      isUnclear: true,
      error: "GEMINI_API_KEY environment variable is missing.",
    };
  }

  if (!base64Image) {
    return {
      success: false,
      detectedCategories: [],
      obstructionSeverity: "low",
      suggestedDescription: "No image provided for AI analysis.",
      recommendedAction: "needs_inspection",
      confidenceNotes: "Missing image data.",
      isUnclear: true,
      error: "No image provided.",
    };
  }

  // Clean data URL prefix if present (e.g. data:image/jpeg;base64,...)
  let cleanBase64 = base64Image;
  let mimeType = "image/jpeg";
  if (base64Image.includes(";base64,")) {
    const parts = base64Image.split(";base64,");
    mimeType = parts[0].replace("data:", "");
    cleanBase64 = parts[1];
  }

  const prompt = `
You are TubigLoop CDO AI Vision Assistant for campus drainage and circular material recovery.
Analyze this photo of a campus drainage, canal, catch basin, or collected waste.

Return ONLY a valid JSON object with the following schema:
{
  "detectedCategories": ["pet_bottles" | "flexible_packaging" | "residual_waste" | "silt" | "organic_debris"],
  "obstructionSeverity": "low" | "partial" | "substantial",
  "suggestedDescription": "A factual, 1-2 sentence description of visible obstructions and water flow conditions",
  "recommendedAction": "verified" | "needs_inspection",
  "confidenceNotes": "Brief notes on image clarity, lighting, or visible obstacles",
  "isUnclear": false
}

Rules:
1. Do not invent exact mass in kilograms (weights are physically measured by scale).
2. If image is blurry, obscured, or lacks clear drainage context, set "isUnclear": true and "recommendedAction": "needs_inspection".
3. Return raw JSON without markdown code fences.
`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!res.ok) {
        // Try next candidate model
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      // Clean potential markdown backticks
      const cleanedJson = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);

      return {
        success: true,
        modelUsed: model,
        detectedCategories: Array.isArray(parsed.detectedCategories)
          ? parsed.detectedCategories
          : ["residual_waste"],
        obstructionSeverity: parsed.obstructionSeverity || "partial",
        suggestedDescription:
          parsed.suggestedDescription || "Obstruction reported at campus drain.",
        recommendedAction: parsed.recommendedAction || "verified",
        confidenceNotes:
          parsed.confidenceNotes || "Analyzed via Gemini Vision.",
        isUnclear: Boolean(parsed.isUnclear),
      };
    } catch {
      // Continue to next model on network/parse error
      continue;
    }
  }

  // Graceful fallback if all AI models fail or quota is reached
  return {
    success: false,
    detectedCategories: ["residual_waste"],
    obstructionSeverity: "partial",
    suggestedDescription: "Drainage blockage observed. Manual review recommended.",
    recommendedAction: "needs_inspection",
    confidenceNotes: "AI assistance temporarily unavailable; manual review enabled.",
    isUnclear: true,
    error: "AI service temporarily unavailable.",
  };
}
