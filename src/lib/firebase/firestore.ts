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
  batch_id: string;
  recipient_org: string;
  submitted_kg: number;
  accepted_kg: number;
  confirmation_state: "pending" | "confirmed" | "rejected";
  evidence_url?: string | null;
  notes?: string;
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
 * 3. Triage & Dispatch Report in Firestore
 */
export async function triageFirestoreReport(
  reportId: string,
  reviewState: "Verified" | "Needs inspection" | "Rejected" | "Duplicate",
  obstructionScore: number,
  disruptionScore: number,
  assigneeName?: string,
  targetDate?: string,
  reviewNotes?: string
) {
  const obstruction = Math.min(Math.max(Number(obstructionScore) || 0, 0), 2);
  const disruption = Math.min(Math.max(Number(disruptionScore) || 0, 0), 2);
  const totalScore = obstruction + disruption;
  let priorityBand: "Low" | "Medium" | "High" = "Medium";
  if (totalScore <= 1) priorityBand = "Low";
  else if (totalScore >= 4) priorityBand = "High";

  const nowIso = new Date().toISOString();

  // 1. Update Report
  const reportRef = doc(db, "reports", reportId);
  await updateDoc(reportRef, {
    review_state: reviewState,
    review_notes: reviewNotes || `Triage completed as ${reviewState}.`,
    reviewed_at: nowIso,
  });

  // 2. Update Associated Task if Verified
  if (reviewState === "Verified") {
    const tasksCol = collection(db, "cleanup_tasks");
    const qTask = query(tasksCol, where("report_id", "==", reportId));
    const taskSnap = await getDocs(qTask);

    if (!taskSnap.empty) {
      const targetDoc = taskSnap.docs[0];
      await updateDoc(doc(db, "cleanup_tasks", targetDoc.id), {
        state: "Assigned",
        priority_score: totalScore,
        priority_band: priorityBand,
        obstruction_score: obstruction,
        disruption_score: disruption,
        priority_reason: `Score ${totalScore}/5 (${priorityBand}): Obstruction=${obstruction}, Disruption=${disruption}. Assigned to ${
          assigneeName || "Maintenance Team"
        }.`,
        target_date: targetDate || null,
      });
    } else {
      // Create task if missing
      await addDoc(tasksCol, {
        report_id: reportId,
        state: "Assigned",
        priority_score: totalScore,
        priority_band: priorityBand,
        obstruction_score: obstruction,
        disruption_score: disruption,
        priority_reason: `Score ${totalScore}/5 (${priorityBand}). Assigned to ${assigneeName || "Maintenance Team"}.`,
        target_date: targetDate || null,
        created_at: nowIso,
      });
    }
  }

  return { priorityBand, totalScore };
}

/**
 * 4. Record Collection Batches & Photo Evidence
 */
export async function recordFirestoreCollection(
  taskId: string,
  batches: {
    category: "pet_bottles" | "flexible_packaging" | "residual_waste" | "silt";
    kg: number;
  }[],
  beforePhotoBase64?: string,
  afterPhotoBase64?: string
) {
  const nowIso = new Date().toISOString();
  const batchesCol = collection(db, "collection_batches");

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

  const validBatches = batches.filter((b) => Number(b.kg) > 0);
  const totalKg = validBatches.reduce((sum, b) => sum + (Number(b.kg) || 0), 0);

  // Update Task State to Collected & Completed
  const taskRef = doc(db, "cleanup_tasks", taskId);
  await updateDoc(taskRef, {
    state: "Collected",
    status: "Completed",
    completed_at: nowIso,
    total_kg: totalKg,
    batches: validBatches,
    before_photo_url: beforePhotoBase64 || null,
    after_photo_url: afterPhotoBase64 || null,
  });
}

/**
 * 5. Record Recipient Handover
 */
export async function recordFirestoreHandover(
  batchId: string,
  recipientOrg: string,
  submittedKg: number,
  acceptedKg: number,
  evidencePhotoBase64?: string
) {
  if (acceptedKg > submittedKg) {
    throw new Error("Accepted weight cannot exceed submitted batch weight.");
  }

  const nowIso = new Date().toISOString();
  const handoversCol = collection(db, "handovers");
  const docRef = await addDoc(handoversCol, {
    batch_id: batchId,
    recipient_org: recipientOrg,
    submitted_kg: submittedKg,
    accepted_kg: acceptedKg,
    confirmation_state: "confirmed",
    evidence_url: evidencePhotoBase64 || null,
    confirmed_at: nowIso,
    created_at: nowIso,
  });

  return { id: docRef.id };
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
