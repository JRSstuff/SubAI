"use server";

export interface AIScanResult {
  success: boolean;
  modelUsed?: string;
  drainageClassification?: string;
  detectedCategories: string[];
  obstructionSeverity: "low" | "partial" | "substantial";
  suggestedDescription: string;
  recommendedAction: "verified" | "needs_inspection";
  confidenceNotes: string;
  isUnclear: boolean;
  error?: string;
}

const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

export const VALID_DRAINAGE_CLASSIFICATIONS = [
  "Curb Inlet",
  "Catch Basin",
  "Open Canal",
  "Culvert",
  "Creek Outfall",
] as const;

/**
 * Server Action: Multimodal vision scan of drainage obstruction photos via Google Gemini Vision.
 * If offline or key is missing, DOES NOT return fake pre-filled data.
 */
export async function analyzeObstructionPhoto(base64Image: string): Promise<AIScanResult> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Never return fake data when API key is missing. Fail honestly and gracefully.
  if (!apiKey) {
    return {
      success: false,
      detectedCategories: [],
      obstructionSeverity: "low",
      suggestedDescription: "",
      recommendedAction: "needs_inspection",
      confidenceNotes: "AI offline (GEMINI_API_KEY not configured)",
      isUnclear: true,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  if (!base64Image) {
    return {
      success: false,
      detectedCategories: [],
      obstructionSeverity: "low",
      suggestedDescription: "",
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

  const prompt = `You are SubAI CDO Vision Assistant for urban drainage maintenance in Cagayan de Oro City.
Analyze this photo of a drainage structure and debris blockage.

Respond with ONLY a valid JSON object matching this schema:
{
  "drainageClassification": "Curb Inlet" | "Catch Basin" | "Open Canal" | "Culvert" | "Creek Outfall",
  "detectedCategories": ["pet_bottles" | "flexible_packaging" | "silt" | "organic_debris" | "construction_debris" | "residual_waste"],
  "obstructionSeverity": "low" | "partial" | "substantial",
  "suggestedDescription": "Factual 1-sentence description of the specific drainage structure and visible debris.",
  "recommendedAction": "verified" | "needs_inspection",
  "confidenceNotes": "Notes on materials observed",
  "isUnclear": false
}

Rules:
1. If no debris is visible, set detectedCategories to [].
2. Return raw JSON only, no markdown backticks.`;

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
            maxOutputTokens: 350,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanedJson = rawText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanedJson);

      const rawCategories =
        parsed.detectedCategories ||
        parsed.waste_materials ||
        parsed.detected_categories ||
        parsed.categories ||
        [];

      const rawClassification =
        parsed.drainageClassification ||
        parsed.drainage_type ||
        parsed.drainageType ||
        parsed.classification ||
        "";

      let detectedClassification: string | undefined = undefined;
      if (typeof rawClassification === "string" && rawClassification.trim()) {
        const rawClass = rawClassification.trim().toLowerCase();
        if (rawClass.includes("curb")) {
          detectedClassification = "Curb Inlet";
        } else if (rawClass.includes("catch") || rawClass.includes("basin") || rawClass.includes("grate")) {
          detectedClassification = "Catch Basin";
        } else if (rawClass.includes("culvert") || rawClass.includes("pipe")) {
          detectedClassification = "Culvert";
        } else if (rawClass.includes("creek") || rawClass.includes("outfall") || rawClass.includes("river")) {
          detectedClassification = "Creek Outfall";
        } else if (rawClass.includes("canal") || rawClass.includes("ditch") || rawClass.includes("channel")) {
          detectedClassification = "Open Canal";
        }
      }

      return {
        success: true,
        modelUsed: model,
        drainageClassification: detectedClassification,
        detectedCategories: Array.isArray(rawCategories) ? rawCategories : [],
        obstructionSeverity: parsed.obstructionSeverity || "partial",
        suggestedDescription: parsed.suggestedDescription || "",
        recommendedAction: parsed.recommendedAction || "verified",
        confidenceNotes: parsed.confidenceNotes || "Vision AI Analysis",
        isUnclear: Boolean(parsed.isUnclear),
      };
    } catch {
      continue;
    }
  }

  // Never return fake data when AI fails. Return honest failure.
  return {
    success: false,
    detectedCategories: [],
    obstructionSeverity: "low",
    suggestedDescription: "",
    recommendedAction: "needs_inspection",
    confidenceNotes: "AI unreachable",
    isUnclear: true,
    error: "AI service unreachable.",
  };
}
