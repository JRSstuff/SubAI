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
  "gemini-3.1-flash-lite",
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
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(25000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.warn(`[Gemini Vision] Model ${model} returned status ${res.status}:`, errText);
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

      const normalizedCategories = new Set<string>();
      const allText = `${Array.isArray(rawCategories) ? rawCategories.join(" ") : ""} ${parsed.suggestedDescription || ""} ${rawText}`.toLowerCase();

      if (allText.includes("bottle") || allText.includes("pet") || allText.includes("beverage") || allText.includes("cup")) {
        normalizedCategories.add("pet_bottles");
      }
      if (allText.includes("packaging") || allText.includes("sachet") || allText.includes("wrapper") || allText.includes("plastic") || allText.includes("film") || allText.includes("bag")) {
        normalizedCategories.add("flexible_packaging");
      }
      if (allText.includes("organic") || allText.includes("branch") || allText.includes("twig") || allText.includes("leaf") || allText.includes("leaves") || allText.includes("wood") || allText.includes("plant")) {
        normalizedCategories.add("organic_debris");
      }
      if (allText.includes("silt") || allText.includes("mud") || allText.includes("sand") || allText.includes("sediment")) {
        normalizedCategories.add("silt");
      }
      if (allText.includes("construction") || allText.includes("metallic") || allText.includes("rubble") || allText.includes("concrete") || allText.includes("slab")) {
        normalizedCategories.add("construction_debris");
      }
      if (allText.includes("trash") || allText.includes("foam") || allText.includes("styrofoam") || allText.includes("waste") || allText.includes("debris")) {
        normalizedCategories.add("residual_waste");
      }

      if (Array.isArray(rawCategories)) {
        for (const cat of rawCategories) {
          if (["pet_bottles", "flexible_packaging", "silt", "organic_debris", "construction_debris", "residual_waste"].includes(cat)) {
            normalizedCategories.add(cat);
          }
        }
      }

      let detectedClassification: string | undefined = undefined;
      const classText = `${rawClassification} ${parsed.suggestedDescription || ""}`.toLowerCase();
      if (classText.includes("culvert") || classText.includes("pipe")) {
        detectedClassification = "Culvert";
      } else if (classText.includes("curb") || classText.includes("inlet")) {
        detectedClassification = "Curb Inlet";
      } else if (classText.includes("catch") || classText.includes("basin") || classText.includes("grate")) {
        detectedClassification = "Catch Basin";
      } else if (classText.includes("creek") || classText.includes("outfall") || classText.includes("river")) {
        detectedClassification = "Creek Outfall";
      } else if (classText.includes("canal") || classText.includes("ditch") || classText.includes("channel")) {
        detectedClassification = "Open Canal";
      }

      return {
        success: true,
        modelUsed: model,
        drainageClassification: detectedClassification,
        detectedCategories: Array.from(normalizedCategories),
        obstructionSeverity: parsed.obstructionSeverity || "substantial",
        suggestedDescription: parsed.suggestedDescription || "",
        recommendedAction: parsed.recommendedAction || "verified",
        confidenceNotes: "SubAI Vision",
        isUnclear: Boolean(parsed.isUnclear),
      };
    } catch (modelErr: any) {
      console.warn(`[Gemini Vision] Model ${model} caught error:`, modelErr?.message || modelErr);
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
