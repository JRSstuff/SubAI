import { NextResponse } from "next/server";
import { getFirestoreReports } from "@/lib/firebase/firestore";

export async function GET() {
  try {
    const data = await getFirestoreReports();
    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reports.";
    console.warn("GET /api/reports warning:", message);
    return NextResponse.json({
      success: false,
      message,
      data: [],
    });
  }
}
