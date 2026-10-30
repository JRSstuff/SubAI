import { NextResponse } from "next/server";
import { analyzeObstructionPhoto } from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.image) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing image in request body",
          detectedCategories: [],
          obstructionSeverity: "low",
          suggestedDescription: "",
          recommendedAction: "needs_inspection",
          confidenceNotes: "No image received",
          isUnclear: true,
        },
        { status: 400 }
      );
    }

    console.log(`[API /api/analyze] Received image of length: ${body.image.length}`);
    const result = await analyzeObstructionPhoto(body.image);
    console.log(`[API /api/analyze] Result: success=${result.success}, model=${result.modelUsed}, categories=${result.detectedCategories.join(",")}`);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API /api/analyze] Handler crashed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Server analysis error",
        detectedCategories: [],
        obstructionSeverity: "low",
        suggestedDescription: "",
        recommendedAction: "needs_inspection",
        confidenceNotes: "AI offline",
        isUnclear: true,
      },
      { status: 500 }
    );
  }
}
