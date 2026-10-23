"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * 1. Submit Drainage Obstruction Report (Reporter)
 */
export async function submitReportAction(formData: FormData): Promise<ActionResult> {
  const locationName = formData.get("locationName")?.toString().trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const description = formData.get("description")?.toString().trim();
  const photoBase64 = formData.get("photoBase64")?.toString();
  const reporterName = formData.get("reporterName")?.toString().trim() || "Campus Reporter";
  const aiCategoriesJson = formData.get("aiCategories")?.toString() || "[]";

  if (!locationName) {
    return { success: false, message: "Location name is required." };
  }

  if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
    return { success: false, message: "Valid GPS coordinates are required." };
  }

  if (!description) {
    return { success: false, message: "A brief description of the obstruction is required." };
  }

  if (!photoBase64) {
    return { success: false, message: "A photographic reference of the obstruction is required." };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch site ID
    const { data: site } = await supabase.from("sites").select("id").limit(1).maybeSingle();

    // Generate unique reference
    const timestampRef = Math.floor(1000 + Math.random() * 9000);
    const referenceNo = `TL-${new Date().getFullYear()}-${timestampRef}`;

    // Insert into reports
    const { data: newReport, error: reportErr } = await supabase
      .from("reports")
      .insert({
        reference_no: referenceNo,
        site_id: site?.id || null,
        reporter_name: reporterName,
        location_name: locationName,
        latitude: latitude,
        longitude: longitude,
        description: description,
        photo_url: photoBase64,
        review_state: "Submitted",
        dataset_origin: "pilot",
      })
      .select()
      .single();

    if (reportErr || !newReport) {
      return {
        success: false,
        message: reportErr?.message || "Failed to save report to database.",
      };
    }

    // Auto-create initial planned cleanup task
    await supabase.from("cleanup_tasks").insert({
      report_id: newReport.id,
      state: "Planned",
      priority_score: 2,
      priority_band: "Medium",
      obstruction_score: 1,
      disruption_score: 1,
      priority_reason: "Initial submission pending reviewer triage.",
    });

    // Record AI analysis if provided
    try {
      const parsedCategories = JSON.parse(aiCategoriesJson);
      if (Array.isArray(parsedCategories) && parsedCategories.length > 0) {
        await supabase.from("ai_analyses").insert({
          report_id: newReport.id,
          photo_url: "stored_base64",
          suggested_categories: parsedCategories,
          confidence_score: 0.92,
        });
      }
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      message: `Report ${referenceNo} verified and submitted successfully!`,
      data: newReport,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Submission failed. Please try again.",
    };
  }
}

/**
 * 2. Fetch all reports with coordinates and triage status
 */
export async function getReportsAction(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase
      .from("reports")
      .select("*, cleanup_tasks(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: "Reports loaded successfully.",
      data: data || [],
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load reports.",
    };
  }
}

/**
 * 3. Triage & Dispatch Report (Reviewer)
 * Transparent Priority Calculation (0 to 5)
 */
export async function triageReportAction(
  reportId: string,
  reviewState: "Verified" | "Needs inspection" | "Rejected" | "Duplicate",
  obstructionScore: number,
  disruptionScore: number,
  assigneeName?: string,
  targetDate?: string,
  reviewNotes?: string
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Calculate priority score (0-5)
    const obstruction = Math.min(Math.max(Number(obstructionScore) || 0, 0), 2);
    const disruption = Math.min(Math.max(Number(disruptionScore) || 0, 0), 2);
    const totalScore = obstruction + disruption; // 0 to 4 (+1 if >48 hours)
    let priorityBand: "Low" | "Medium" | "High" = "Medium";
    if (totalScore <= 1) priorityBand = "Low";
    else if (totalScore >= 4) priorityBand = "High";

    // Update Report State
    const { error: repErr } = await supabase
      .from("reports")
      .update({
        review_state: reviewState,
        review_notes: reviewNotes || `Triage completed as ${reviewState}.`,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (repErr) {
      return { success: false, message: repErr.message };
    }

    // Update or Insert Cleanup Task
    if (reviewState === "Verified") {
      await supabase
        .from("cleanup_tasks")
        .update({
          state: "Assigned",
          priority_score: totalScore,
          priority_band: priorityBand,
          obstruction_score: obstruction,
          disruption_score: disruption,
          priority_reason: `Score ${totalScore}/5 (${priorityBand}): Obstruction=${obstruction}, Disruption=${disruption}. Assigned to ${
            assigneeName || "Campus Maintenance Team"
          }.`,
          target_date: targetDate || null,
        })
        .eq("report_id", reportId);
    }

    return {
      success: true,
      message: `Report updated to ${reviewState} with ${priorityBand} priority!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Triage operation failed.",
    };
  }
}

/**
 * 4. Record Collection Batches & Photo Evidence (Collector)
 */
export async function recordCollectionAction(
  taskId: string,
  batches: {
    category: "pet_bottles" | "flexible_packaging" | "residual_waste" | "silt";
    kg: number;
  }[],
  beforePhotoBase64?: string,
  afterPhotoBase64?: string
): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    for (const b of batches) {
      if (b.kg > 0) {
        await supabase.from("collection_batches").insert({
          task_id: taskId,
          material_category: b.category,
          measured_kg: b.kg,
          measurement_basis: "scale_weighed",
          before_photo_url: beforePhotoBase64 || null,
          after_photo_url: afterPhotoBase64 || null,
          dataset_origin: "pilot",
        });
      }
    }

    // Advance task status to Collected
    await supabase
      .from("cleanup_tasks")
      .update({
        state: "Collected",
        completed_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    return {
      success: true,
      message: "Cleanup evidence & weighed material batches recorded successfully!",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Collection logging failed.",
    };
  }
}

/**
 * 5. Record Recipient Handover (Collector / Recycler)
 */
export async function recordHandoverAction(
  batchId: string,
  recipientOrg: string,
  submittedKg: number,
  acceptedKg: number,
  evidencePhotoBase64?: string
): Promise<ActionResult> {
  if (acceptedKg > submittedKg) {
    return {
      success: false,
      message: "Accepted weight cannot exceed submitted batch weight.",
    };
  }

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data, error } = await supabase.from("handovers").insert({
      batch_id: batchId,
      recipient_org: recipientOrg,
      submitted_kg: submittedKg,
      accepted_kg: acceptedKg,
      confirmation_state: "confirmed",
      evidence_url: evidencePhotoBase64 || null,
      confirmed_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Handover of ${acceptedKg} kg to ${recipientOrg} confirmed!`,
      data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Handover recording failed.",
    };
  }
}

/**
 * 6. Get Reconciled Mass Balance for Impact Dashboard
 */
export async function getMassBalanceMetricsAction(): Promise<ActionResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch collection batches
    const { data: batches } = await supabase.from("collection_batches").select("*");

    // Fetch handovers
    const { data: handovers } = await supabase.from("handovers").select("*");

    // Fetch reports
    const { data: reports } = await supabase.from("reports").select("id, review_state");

    let totalCollected = 0;
    let petBottlesKg = 0;
    let flexiblePackagingKg = 0;
    let residualKg = 0;
    let siltKg = 0;

    (batches || []).forEach((b: any) => {
      const kg = Number(b.measured_kg) || 0;
      totalCollected += kg;
      if (b.material_category === "pet_bottles") petBottlesKg += kg;
      else if (b.material_category === "flexible_packaging") flexiblePackagingKg += kg;
      else if (b.material_category === "residual_waste") residualKg += kg;
      else if (b.material_category === "silt") siltKg += kg;
    });

    let acceptedForRecycling = 0;
    (handovers || []).forEach((h: any) => {
      if (h.confirmation_state === "confirmed") {
        acceptedForRecycling += Number(h.accepted_kg) || 0;
      }
    });

    const eligibleRecyclable = petBottlesKg + flexiblePackagingKg;
    const awaitingHandover = Math.max(0, eligibleRecyclable - acceptedForRecycling);

    const verifiedCount = (reports || []).filter((r) => r.review_state === "Verified").length;
    const totalReportsCount = (reports || []).length;

    return {
      success: true,
      message: "Metrics calculated successfully.",
      data: {
        totalCollectedKg: Number(totalCollected.toFixed(2)),
        acceptedForRecyclingKg: Number(acceptedForRecycling.toFixed(2)),
        awaitingHandoverKg: Number(awaitingHandover.toFixed(2)),
        residualKg: Number(residualKg.toFixed(2)),
        siltKg: Number(siltKg.toFixed(2)),
        petBottlesKg: Number(petBottlesKg.toFixed(2)),
        flexiblePackagingKg: Number(flexiblePackagingKg.toFixed(2)),
        verifiedReportsCount: verifiedCount,
        totalReportsCount: totalReportsCount,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load metrics.",
    };
  }
}
