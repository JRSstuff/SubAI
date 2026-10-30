"use server";

import { cookies } from "next/headers";
import {
  submitFirestoreReport,
  getFirestoreReports,
  triageFirestoreReport,
  recordFirestoreCollection,
  recordFirestoreHandover,
  getFirestoreHandovers,
  confirmFirestoreHandover,
  closeFirestoreTask,
  getFirestoreMassBalanceMetrics,
} from "@/lib/firebase/firestore";

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * 1. Submit Drainage Obstruction Report (Reporter) via Firestore
 */
export async function submitReportAction(formData: FormData): Promise<ActionResult> {
  const locationName = formData.get("locationName")?.toString().trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const classification = formData.get("classification")?.toString().trim();
  const rawDescription = formData.get("description")?.toString().trim() || "";
  const description = classification ? `[${classification}] ${rawDescription}` : rawDescription;
  const photoBase64 = formData.get("photoBase64")?.toString();
  const reporterName = formData.get("reporterName")?.toString().trim() || "CDO Reporter";
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
    let userId: string | null = null;
    const sessionCookie =
      cookieStore.get("subai_session")?.value ||
      cookieStore.get("tubigloop_session")?.value;
    if (sessionCookie) {
      try {
        const parsed = JSON.parse(sessionCookie);
        userId = parsed.id || null;
      } catch {
        // ignore
      }
    }

    const { report } = await submitFirestoreReport({
      locationName,
      latitude,
      longitude,
      description,
      photoBase64,
      reporterName,
      reporterId: userId,
      aiCategories: aiCategoriesJson,
    });

    return {
      success: true,
      message: `Report submitted successfully! Ref: ${report.reference_no}`,
      data: report,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to record report in Firestore.",
    };
  }
}

/**
 * 2. Fetch all reports with coordinates and triage status from Firestore
 */
export async function getReportsAction(): Promise<ActionResult> {
  try {
    const data = await getFirestoreReports();
    return {
      success: true,
      message: "Reports loaded successfully.",
      data: data || [],
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load reports from Firestore.",
    };
  }
}

/**
 * 3. Triage & Dispatch Report (Reviewer) in Firestore
 * Transparent Priority Calculation (0 to 5)
 */
export async function triageReportAction(
  reportId: string,
  reviewState: "Verified" | "Needs inspection" | "Rejected" | "Duplicate",
  obstructionScore: number,
  disruptionScore: number,
  assigneeName?: string,
  targetDate?: string,
  reviewNotes?: string,
  duplicateOfId?: string
): Promise<ActionResult> {
  try {
    const result = await triageFirestoreReport(
      reportId,
      reviewState,
      obstructionScore,
      disruptionScore,
      assigneeName,
      targetDate,
      reviewNotes,
      duplicateOfId
    );

    return {
      success: true,
      message: `Report updated to ${reviewState} with ${result.priorityBand} priority!`,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Triage operation failed in Firestore.",
    };
  }
}

/**
 * 4. Record Collection Batches & Photo Evidence (Collector) in Firestore (Step 4)
 * Supports scale-weighed or unmeasured collection
 */
export async function recordCollectionAction(
  taskId: string,
  batches: {
    category: "pet_bottles" | "flexible_packaging" | "residual_waste" | "silt";
    kg: number;
  }[],
  beforePhotoBase64?: string,
  afterPhotoBase64?: string,
  isUnmeasured = false
): Promise<ActionResult> {
  try {
    await recordFirestoreCollection(taskId, batches, beforePhotoBase64, afterPhotoBase64, isUnmeasured);

    return {
      success: true,
      message: isUnmeasured
        ? "Qualitative collection evidence recorded (unmeasured scale basis)!"
        : "Cleanup evidence & weighed material batches recorded successfully in Firestore!",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Collection logging failed in Firestore.",
    };
  }
}

/**
 * 5. Record Recipient Handover (Collector / Recycler) in Firestore (Step 5)
 */
export async function recordHandoverAction(
  taskId: string,
  batchId: string,
  materialCategory: string,
  recipientOrg: string,
  submittedKg: number,
  acceptedKg: number,
  evidencePhotoBase64?: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const result = await recordFirestoreHandover(
      taskId,
      batchId,
      materialCategory,
      recipientOrg,
      submittedKg,
      acceptedKg,
      evidencePhotoBase64,
      notes
    );

    return {
      success: true,
      message: `Handover of ${acceptedKg} kg to ${recipientOrg} submitted for review!`,
      data: result,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Handover recording failed.",
    };
  }
}

/**
 * 6. Get All Handovers for Reviewer Audit (Step 6)
 */
export async function getHandoversAction(): Promise<ActionResult> {
  try {
    const handovers = await getFirestoreHandovers();
    return {
      success: true,
      message: "Handovers loaded successfully.",
      data: handovers,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load handovers.",
    };
  }
}

/**
 * 6. Confirm or Reject Handover (Reviewer) (Step 6)
 */
export async function confirmHandoverAction(
  handoverId: string,
  state: "confirmed" | "rejected",
  reviewerNotes?: string
): Promise<ActionResult> {
  try {
    await confirmFirestoreHandover(handoverId, state, reviewerNotes);
    return {
      success: true,
      message: `Handover has been ${state}!`,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to update handover confirmation.",
    };
  }
}

/**
 * 7. Close Task (Reviewer) (Step 7)
 */
export async function closeTaskAction(
  taskId: string,
  notes?: string
): Promise<ActionResult> {
  try {
    await closeFirestoreTask(taskId, notes);
    return {
      success: true,
      message: "Task has been officially closed and archived in mass balance.",
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to close task.",
    };
  }
}

/**
 * 8. Get Reconciled Mass Balance for Impact Dashboard from Firestore
 */
export async function getMassBalanceMetricsAction(): Promise<ActionResult> {
  try {
    const metrics = await getFirestoreMassBalanceMetrics();
    return {
      success: true,
      message: "Metrics calculated successfully from Firestore.",
      data: metrics,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to load metrics from Firestore.",
    };
  }
}
