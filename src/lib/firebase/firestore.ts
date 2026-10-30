import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "./config";

export interface ReportItem {
  id: string;
  reference_no: string;
  site_id?: string | null;
  reporter_id?: string | null;
  reporter_name?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  description: string;
  photo_url: string;
  review_state: "Submitted" | "Needs inspection" | "Verified" | "Rejected" | "Duplicate";
  reviewer_id?: string | null;
  review_notes?: string;
  duplicate_of_id?: string | null;
  dataset_origin?: string;
  reviewed_at?: string;
  created_at: string;
  cleanup_tasks?: CleanupTaskItem[];
  ai_analyses?: unknown[];
}

export interface CleanupTaskItem {
  id: string;
  report_id: string;
  assignee_id?: string | null;
  assigned_to?: string | null;
  state: "Planned" | "Assigned" | "In progress" | "Collected" | "Awaiting disposition" | "Closed";
  status?: string;
  priority_score: number;
  priority_band: "Low" | "Medium" | "High";
  obstruction_score: number;
  disruption_score: number;
  time_awaiting_score?: number;
  priority_reason?: string;
  target_date?: string | null;
  created_at: string;
  completed_at?: string | null;
  closed_at?: string | null;
  total_kg?: number;
  is_unmeasured?: boolean;
  disposition_notes?: string;
  batches?: {
    category: "pet_bottles" | "flexible_packaging" | "residual_waste" | "silt";
    kg: number;
  }[];
  before_photo_url?: string | null;
  after_photo_url?: string | null;
}

export interface CollectionBatchItem {
  id?: string;
  task_id: string;
  collector_id?: string | null;
  material_category: "pet_bottles" | "flexible_packaging" | "residual_waste" | "silt" | "other";
  measured_kg: number;
  measurement_basis: "scale_weighed" | "unmeasured";
  before_photo_url?: string | null;
  after_photo_url?: string | null;
  dataset_origin?: string;
  collected_at: string;
}

export interface HandoverItem {
  id?: string;
  task_id?: string;
  batch_id: string;
  material_category?: string;
  recipient_org: string;
  submitted_kg: number;
  accepted_kg: number;
  confirmation_state: "pending" | "confirmed" | "rejected";
  evidence_url?: string | null;
  notes?: string;
  reviewer_notes?: string;
  confirmed_at?: string;
  created_at: string;
}

/**
 * 1. Submit Drainage Obstruction Report to Firestore
 */
export async function submitFirestoreReport(data: {
  locationName: string;
  latitude: number;
  longitude: number;
  description: string;
  photoBase64: string;
  reporterName?: string;
  reporterId?: string | null;
  aiCategories?: string;
}) {
  const timestampRef = Math.floor(1000 + Math.random() * 9000);
  const referenceNo = `TL-${new Date().getFullYear()}-${timestampRef}`;
  const nowIso = new Date().toISOString();

  const reportsCol = collection(db, "reports");
  const newReportRef = doc(reportsCol);

  const reportPayload: ReportItem = {
    id: newReportRef.id,
    reference_no: referenceNo,
    site_id: "ustp-cdo-main",
    reporter_id: data.reporterId || null,
    reporter_name: data.reporterName || "CDO Reporter",
    location_name: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    description: data.description,
    photo_url: data.photoBase64,
    review_state: "Submitted",
    dataset_origin: "pilot",
    created_at: nowIso,
  };

  await setDoc(newReportRef, reportPayload);

  // Initialize associated task in cleanup_tasks collection
  const tasksCol = collection(db, "cleanup_tasks");
  const newTaskRef = doc(tasksCol);
  const taskPayload: CleanupTaskItem = {
    id: newTaskRef.id,
    report_id: newReportRef.id,
    state: "Assigned",
    priority_score: 2,
    priority_band: "Medium",
    obstruction_score: 1,
    disruption_score: 1,
    priority_reason: "Initial intake awaiting triage",
    created_at: nowIso,
  };

  await setDoc(newTaskRef, taskPayload);

  return {
    report: reportPayload,
    task: taskPayload,
  };
}

/**
 * 2. Get All Reports with Associated Cleanup Tasks
 */
export async function getFirestoreReports(): Promise<ReportItem[]> {
  const reportsCol = collection(db, "reports");
  const qReports = query(reportsCol, orderBy("created_at", "desc"));
  const reportsSnap = await getDocs(qReports);

  const tasksCol = collection(db, "cleanup_tasks");
  const tasksSnap = await getDocs(tasksCol);

  const tasksByReportId = new Map<string, CleanupTaskItem[]>();
  tasksSnap.forEach((d) => {
    const t = { id: d.id, ...d.data() } as CleanupTaskItem;
    if (t.report_id) {
      const arr = tasksByReportId.get(t.report_id) || [];
      arr.push(t);
      tasksByReportId.set(t.report_id, arr);
    }
  });

  const reports: ReportItem[] = [];
  reportsSnap.forEach((d) => {
    const r = { id: d.id, ...d.data() } as ReportItem;
    r.cleanup_tasks = tasksByReportId.get(d.id) || [];
    reports.push(r);
  });

  return reports;
}

/**
 * 3. Triage & Dispatch Report in Firestore (Steps 2 & 3)
 */
export async function triageFirestoreReport(
  reportId: string,
  reviewState: "Verified" | "Needs inspection" | "Rejected" | "Duplicate",
  obstructionScore: number,
  disruptionScore: number,
  assigneeName?: string,
  targetDate?: string,
  reviewNotes?: string,
  duplicateOfId?: string
) {
  const obstruction = Math.min(Math.max(Number(obstructionScore) || 0, 0), 2);
  const disruption = Math.min(Math.max(Number(disruptionScore) || 0, 0), 2);
  const totalScore = obstruction + disruption;
  let priorityBand: "Low" | "Medium" | "High" = "Medium";
  if (totalScore <= 1) priorityBand = "Low";
  else if (totalScore >= 4) priorityBand = "High";

  const nowIso = new Date().toISOString();

  // 1. Update Report with Reviewer decision & optional duplicate link
  const reportRef = doc(db, "reports", reportId);
  const updateData: Record<string, any> = {
    review_state: reviewState,
    review_notes: reviewNotes || `Triage completed as ${reviewState}.`,
    reviewed_at: nowIso,
  };
  if (reviewState === "Duplicate" && duplicateOfId) {
    updateData.duplicate_of_id = duplicateOfId;
    updateData.review_notes = reviewNotes || `Marked as duplicate of report ${duplicateOfId}.`;
  }
  await updateDoc(reportRef, updateData);

  // 2. Enforce only ONE active task per report
  const tasksCol = collection(db, "cleanup_tasks");
  const qTask = query(tasksCol, where("report_id", "==", reportId));
  const taskSnap = await getDocs(qTask);

  if (reviewState === "Verified") {
    if (!taskSnap.empty) {
      const targetDoc = taskSnap.docs[0];
      await updateDoc(doc(db, "cleanup_tasks", targetDoc.id), {
        state: "Assigned",
        assigned_to: assigneeName || "Facilities Operations Team 1",
        priority_score: totalScore,
        priority_band: priorityBand,
        obstruction_score: obstruction,
        disruption_score: disruption,
        priority_reason: `Score ${totalScore}/5 (${priorityBand}): Obstruction=${obstruction}, Disruption=${disruption}. Assigned to ${
          assigneeName || "Facilities Operations Team 1"
        }.`,
        target_date: targetDate || null,
      });
    } else {
      await addDoc(tasksCol, {
        report_id: reportId,
        state: "Assigned",
        assigned_to: assigneeName || "Facilities Operations Team 1",
        priority_score: totalScore,
        priority_band: priorityBand,
        obstruction_score: obstruction,
        disruption_score: disruption,
        priority_reason: `Score ${totalScore}/5 (${priorityBand}). Assigned to ${assigneeName || "Facilities Operations Team 1"}.`,
        target_date: targetDate || null,
        created_at: nowIso,
      });
    }
  } else if (reviewState === "Rejected" || reviewState === "Duplicate") {
    // If rejected or duplicate, close any active task so it doesn't linger in collector queue
    if (!taskSnap.empty) {
      for (const tDoc of taskSnap.docs) {
        await updateDoc(doc(db, "cleanup_tasks", tDoc.id), {
          state: "Closed",
          status: reviewState,
          closed_at: nowIso,
        });
      }
    }
  }

  return { priorityBand, totalScore };
}

/**
 * 4. Record Collection Batches & Photo Evidence (Step 4)
 */
export async function recordFirestoreCollection(
  taskId: string,
  batches: {
    category: "pet_bottles" | "flexible_packaging" | "residual_waste" | "silt";
    kg: number;
  }[],
  beforePhotoBase64?: string,
  afterPhotoBase64?: string,
  isUnmeasured = false
) {
  const nowIso = new Date().toISOString();
  const batchesCol = collection(db, "collection_batches");

  if (isUnmeasured) {
    // Qualitative unmeasured record: strictly 0 numeric kg to preserve mathematical mass balance
    await addDoc(batchesCol, {
      task_id: taskId,
      material_category: "residual_waste",
      measured_kg: 0,
      measurement_basis: "unmeasured",
      before_photo_url: beforePhotoBase64 || null,
      after_photo_url: afterPhotoBase64 || null,
      dataset_origin: "pilot",
      collected_at: nowIso,
    });
  } else {
    for (const b of batches) {
      if (b.kg > 0) {
        await addDoc(batchesCol, {
          task_id: taskId,
          material_category: b.category,
          measured_kg: b.kg,
          measurement_basis: "scale_weighed",
          before_photo_url: beforePhotoBase64 || null,
          after_photo_url: afterPhotoBase64 || null,
          dataset_origin: "pilot",
          collected_at: nowIso,
        });
      }
    }
  }

  const validBatches = batches.filter((b) => Number(b.kg) > 0);
  const totalKg = validBatches.reduce((sum, b) => sum + (Number(b.kg) || 0), 0);

  // Update Task State to Collected & Completed
  const taskRef = doc(db, "cleanup_tasks", taskId);
  await updateDoc(taskRef, {
    state: "Collected",
    status: "Completed",
    completed_at: nowIso,
    is_unmeasured: isUnmeasured,
    total_kg: isUnmeasured ? 0 : totalKg,
    batches: isUnmeasured ? [] : validBatches,
    before_photo_url: beforePhotoBase64 || null,
    after_photo_url: afterPhotoBase64 || null,
  });
}

/**
 * 5. Record Recipient Handover (Step 5)
 * Sets status to 'pending' for reviewer audit, and marks task as 'Awaiting disposition'
 */
export async function recordFirestoreHandover(
  taskId: string,
  batchId: string,
  materialCategory: string,
  recipientOrg: string,
  submittedKg: number,
  acceptedKg: number,
  evidencePhotoBase64?: string,
  notes?: string
) {
  if (acceptedKg > submittedKg) {
    throw new Error("Accepted weight cannot exceed submitted batch weight.");
  }

  const nowIso = new Date().toISOString();
  const handoversCol = collection(db, "handovers");
  const docRef = await addDoc(handoversCol, {
    task_id: taskId,
    batch_id: batchId,
    material_category: materialCategory,
    recipient_org: recipientOrg,
    submitted_kg: submittedKg,
    accepted_kg: acceptedKg,
    confirmation_state: "pending", // Step 5 sets pending, Step 6 Reviewer confirms
    evidence_url: evidencePhotoBase64 || null,
    notes: notes || null,
    created_at: nowIso,
  });

  const taskRef = doc(db, "cleanup_tasks", taskId);
  await updateDoc(taskRef, {
    state: "Awaiting disposition",
  });

  return { id: docRef.id };
}

/**
 * 6. Get All Handovers for Reviewer Audit (Step 6)
 */
export async function getFirestoreHandovers(): Promise<HandoverItem[]> {
  const handoversCol = collection(db, "handovers");
  const qHandovers = query(handoversCol, orderBy("created_at", "desc"));
  const snap = await getDocs(qHandovers);
  const handovers: HandoverItem[] = [];
  snap.forEach((d) => {
    handovers.push({ id: d.id, ...d.data() } as HandoverItem);
  });
  return handovers;
}

/**
 * 6. Confirm or Reject Handover (Step 6)
 */
export async function confirmFirestoreHandover(
  handoverId: string,
  state: "confirmed" | "rejected",
  reviewerNotes?: string
) {
  const handoverRef = doc(db, "handovers", handoverId);
  const nowIso = new Date().toISOString();
  await updateDoc(handoverRef, {
    confirmation_state: state,
    reviewer_notes: reviewerNotes || (state === "confirmed" ? "Handover evidence verified by reviewer." : "Handover rejected."),
    confirmed_at: nowIso,
  });
}

/**
 * 7. Close Task (Step 7)
 * When all batches have a documented disposition
 */
export async function closeFirestoreTask(taskId: string, notes?: string) {
  const taskRef = doc(db, "cleanup_tasks", taskId);
  const nowIso = new Date().toISOString();
  await updateDoc(taskRef, {
    state: "Closed",
    status: "Closed",
    closed_at: nowIso,
    disposition_notes: notes || "All material batches verified and accounted for.",
  });
}

/**
 * 6. Get Reconciled Mass Balance Metrics from Firestore
 */
export async function getFirestoreMassBalanceMetrics() {
  const [batchesSnap, handoversSnap, reportsSnap] = await Promise.all([
    getDocs(collection(db, "collection_batches")),
    getDocs(collection(db, "handovers")),
    getDocs(collection(db, "reports")),
  ]);

  let totalCollected = 0;
  let petBottlesKg = 0;
  let flexiblePackagingKg = 0;
  let residualKg = 0;
  let siltKg = 0;

  batchesSnap.forEach((doc) => {
    const b = doc.data();
    const kg = Number(b.measured_kg) || 0;
    totalCollected += kg;
    if (b.material_category === "pet_bottles") petBottlesKg += kg;
    else if (b.material_category === "flexible_packaging") flexiblePackagingKg += kg;
    else if (b.material_category === "residual_waste") residualKg += kg;
    else if (b.material_category === "silt") siltKg += kg;
  });

  let acceptedForRecycling = 0;
  handoversSnap.forEach((doc) => {
    const h = doc.data();
    if (h.confirmation_state === "confirmed") {
      acceptedForRecycling += Number(h.accepted_kg) || 0;
    }
  });

  const eligibleRecyclable = petBottlesKg + flexiblePackagingKg;
  const awaitingHandover = Math.max(0, eligibleRecyclable - acceptedForRecycling);

  let verifiedCount = 0;
  let totalReportsCount = 0;
  reportsSnap.forEach((doc) => {
    totalReportsCount++;
    if (doc.data().review_state === "Verified") {
      verifiedCount++;
    }
  });

  return {
    totalCollectedKg: Number(totalCollected.toFixed(2)),
    acceptedForRecyclingKg: Number(acceptedForRecycling.toFixed(2)),
    awaitingHandoverKg: Number(awaitingHandover.toFixed(2)),
    residualKg: Number(residualKg.toFixed(2)),
    siltKg: Number(siltKg.toFixed(2)),
    petBottlesKg: Number(petBottlesKg.toFixed(2)),
    flexiblePackagingKg: Number(flexiblePackagingKg.toFixed(2)),
    verifiedReportsCount: verifiedCount,
    totalReportsCount: totalReportsCount,
  };
}

/**
 * 7. Admin: Fetch All Registered Users
 */
export async function getFirestoreUsers() {
  const usersCol = collection(db, "users");
  const snap = await getDocs(usersCol);
  const users: Array<{ id: string; full_name: string; email: string; role: string; created_at?: string }> = [];
  snap.forEach((d) => {
    const u = d.data();
    users.push({
      id: d.id,
      full_name: u.username || u.full_name || "User",
      email: u.email || "",
      role: u.role || "reporter",
      created_at: u.created_at || "",
    });
  });
  return users;
}

/**
 * 8. Admin: Update User Role in Firestore
 */
export async function updateFirestoreUserRole(userId: string, newRole: string) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    role: newRole.toLowerCase(),
    updated_at: new Date().toISOString(),
  });
}
