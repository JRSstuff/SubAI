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

// Ordered strictly by response speed & active availability in Google AI Studio
const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

/**
 * Server Action: Multimodal ultra-fast vision scan of drainage obstruction photos.
 * Uses high-speed Gemini Flash Lite models with automated fast-cascade fallback.
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
      confidenceNotes: "Pending review.",
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
You are TubigLoop CDO AI Vision Assistant for Cagayan de Oro drainage maintenance and circular waste recovery.
Analyze this photo of a drainage canal, culvert, inlet, catch basin, curb opening, or creek in Cagayan de Oro.

Return ONLY a valid JSON object matching this schema:
{
  "detectedCategories": ["pet_bottles" | "flexible_packaging" | "residual_waste" | "silt" | "organic_debris"],
  "obstructionSeverity": "low" | "partial" | "substantial",
  "suggestedDescription": "Factual 1-sentence description of visible debris, water flow, or blockage",
  "recommendedAction": "verified" | "needs_inspection",
  "confidenceNotes": "Brief notes on clarity or materials observed",
  "isUnclear": false
}

Rules:
1. Do not invent exact mass in kilograms.
2. If image is blurry or unclear, set "isUnclear": true and "recommendedAction": "needs_inspection".
3. Return raw JSON without markdown code blocks.
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
            maxOutputTokens: 250,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) {
        // Try next candidate model immediately
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
          parsed.suggestedDescription || "Drainage blockage reported in Cagayan de Oro.",
        recommendedAction: parsed.recommendedAction || "verified",
        confidenceNotes:
          parsed.confidenceNotes || "Analyzed via TubigLoop Vision AI.",
        isUnclear: Boolean(parsed.isUnclear),
      };
    } catch {
      // Fast fallback to next model
      continue;
    }
  }

  // Graceful fallback if all AI models fail or network times out
  return {
    success: false,
    detectedCategories: ["residual_waste"],
    obstructionSeverity: "partial",
    suggestedDescription: "Drainage blockage observed.",
    recommendedAction: "needs_inspection",
    confidenceNotes: "Pending review.",
    isUnclear: true,
    error: "AI service unavailable.",
  };
}
