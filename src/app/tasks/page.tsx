"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import {
  Wrench,
  Camera,
  FolderOpen,
  Scale,
  Recycle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Upload,
  X,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { compressImage } from "@/lib/image-compress";
import {
  getReportsAction,
  recordCollectionAction,
} from "@/app/actions/operations";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isLoading, setIsLoading] = useState(true);

  // Collection modal state
  const [petKg, setPetKg] = useState<number>(0);
  const [flexibleKg, setFlexibleKg] = useState<number>(0);
  const [residualKg, setResidualKg] = useState<number>(0);
  const [siltKg, setSiltKg] = useState<number>(0);

  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  // Handover state
  const [recipientOrg, setRecipientOrg] = useState("CDO Materials Recovery Facility");
  const [collectorName, setCollectorName] = useState("Authorized Collector");

  const [isPending, startTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const beforeCameraInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterCameraInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    const res = await getReportsAction();
    if (res.success && res.data) {
      const allReports = res.data as any[];
      const taskList: any[] = [];
      allReports.forEach((r) => {
        const ct = r.cleanup_tasks?.[0] || r.cleanup_tasks;
        if (ct) {
          taskList.push({
            ...ct,
            report: r,
          });
        }
      });
      setTasks(taskList);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const totalWeighedKg =
    Number(petKg || 0) +
    Number(flexibleKg || 0) +
    Number(residualKg || 0) +
    Number(siltKg || 0);

  const totalRecyclableKg = Number(petKg || 0) + Number(flexibleKg || 0);

  const openTaskModal = (task: any) => {
    setSelectedTask(task);
    setActionFeedback(null);
    setPetKg(0);
    setFlexibleKg(0);
    setResidualKg(0);
    setSiltKg(0);
    setBeforePhoto(null);
    setAfterPhoto(null);
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "before" | "after"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64 } = await compressImage(file);
      if (type === "before") setBeforePhoto(base64);
      else setAfterPhoto(base64);
    } catch {
      alert("Failed to process photo evidence.");
    }
  };

  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (totalWeighedKg <= 0) {
      alert("Please record weighed mass in kg for at least one category.");
      return;
    }

    setActionFeedback(null);

    const batches = [
      { category: "pet_bottles" as const, kg: Number(petKg) || 0 },
      { category: "flexible_packaging" as const, kg: Number(flexibleKg) || 0 },
      { category: "residual_waste" as const, kg: Number(residualKg) || 0 },
      { category: "silt" as const, kg: Number(siltKg) || 0 },
    ].filter((b) => b.kg > 0);

    startTransition(async () => {
      const res = await recordCollectionAction(
        selectedTask.id,
        batches,
        beforePhoto || undefined,
        afterPhoto || undefined
      );
      setActionFeedback(res);
      if (res.success) {
        await loadTasks();
        setTimeout(() => {
          setSelectedTask(null);
        }, 1200);
      }
    });
  };

  const filteredTasks = tasks.filter((t) => {
    const isCompleted = t.status === "Completed" || t.status === "Done";
    return activeTab === "active" ? !isCompleted : isCompleted;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-5">
        {/* Minimal Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC]">
              Step 4 & 5: Cleanup & Scale Weighing
            </span>
            <span className="text-xs text-[#64748B] font-medium">Authorized Collector</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Collector Tasks
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Execute on-site culvert cleanups, capture before/after photo evidence, and weigh segregated waste batches.
          </p>
        </div>

        {/* ─── SEGMENTED STATUS SWITCHER PILLS ─── */}
        <div className="inline-flex p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
              activeTab === "active"
                ? "bg-[#30AFFF] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Active Tasks ({tasks.filter((t) => t.status !== "Completed" && t.status !== "Done").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
              activeTab === "completed"
                ? "bg-[#30AFFF] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            Completed ({tasks.filter((t) => t.status === "Completed" || t.status === "Done").length})
          </button>
        </div>

        {/* ─── TASK CARDS LIST ─── */}
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="p-10 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-2">
              <Wrench className="w-8 h-8 text-[#94A3B8]" />
              <span className="text-sm font-bold text-[#475569]">
                No {activeTab} cleanup tasks assigned at this moment.
              </span>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isHigh = t.priority_band === "High";
              const isDone = t.status === "Completed" || t.status === "Done";

              return (
                <div
                  key={t.id}
                  className="p-4 sm:p-5 bg-white border border-[#E2E8F0] hover:border-[#30AFFF] rounded-3xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-[#D8FFC5] border border-[#86EFAC] flex items-center justify-center shrink-0">
                      <Wrench className="w-6 h-6 text-[#0F2E1B]" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md">
                          Task #{t.id.slice(0, 8)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isHigh
                              ? "bg-[#FEE2E2] text-[#991B1B]"
                              : "bg-[#92EEFF] text-[#0F172A]"
                          }`}
                        >
                          {t.priority_band} Priority
                        </span>
                        <span className="text-[10px] font-semibold text-[#64748B]">
                          Score: {t.priority_score ?? 3} / 5
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#0F172A] mt-1 truncate">
                        {t.report?.location_name || "Campus Drainage Point"}
                      </h3>
                      <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5">
                        Assigned to: <span className="font-semibold text-[#0F172A]">{t.assigned_to || "Facilities Crew"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    <span className="text-xs font-semibold text-[#64748B]">
                      Status: <span className="font-bold text-[#0F172A]">{t.status || "Assigned"}</span>
                    </span>

                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => openTaskModal(t)}
                        className="px-4 py-2 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Weigh</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── COLLECTION & WEIGHING MODAL ─── */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#30AFFF] uppercase tracking-wider">
                    Task Execution & Scale Weighing
                  </span>
                  <span className="text-sm font-extrabold text-[#0F172A] truncate">
                    {selectedTask.report?.location_name || "Assigned Culvert"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-1.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form action="javascript:void(0);" onSubmit={handleSubmitCollection} className="p-5 flex flex-col gap-4 overflow-y-auto">
                {/* 1. Before & After Photo Evidence */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-2.5">
                  <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#30AFFF]" />
                    <span>Photo Evidence</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Before Photo */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-[#475569]">Before Photo:</span>
                      {beforePhoto ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-[#86EFAC]">
                          <img src={beforePhoto} alt="Before" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => beforeCameraInputRef.current?.click()}
                            className="flex-1 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[11px] font-bold text-[#0F172A] flex items-center justify-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-[#30AFFF]" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => beforeFileInputRef.current?.click()}
                            className="p-2 bg-white border border-[#CBD5E1] rounded-xl text-[#64748B]"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* After Photo */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-semibold text-[#475569]">After Photo:</span>
                      {afterPhoto ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-[#86EFAC]">
                          <img src={afterPhoto} alt="After" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => afterCameraInputRef.current?.click()}
                            className="flex-1 py-2 bg-white border border-[#CBD5E1] rounded-xl text-[11px] font-bold text-[#0F172A] flex items-center justify-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-[#30AFFF]" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => afterFileInputRef.current?.click()}
                            className="p-2 bg-white border border-[#CBD5E1] rounded-xl text-[#64748B]"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Scale Weighing Inputs */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Material Scale Readings (kg)</span>
                    </span>
                    <span className="text-xs font-extrabold text-[#059669] bg-[#C4F7CA] px-2.5 py-0.5 rounded-full">
                      Total: {totalWeighedKg.toFixed(2)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* PET Bottles */}
                    <div className="p-3 bg-[#92EEFF]/20 border border-[#92EEFF] rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#0F172A]">PET Bottles (kg)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={petKg || ""}
                        onChange={(e) => setPetKg(Number(e.target.value))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A]"
                      />
                    </div>

                    {/* Flexible Packaging */}
                    <div className="p-3 bg-[#92EEFF]/20 border border-[#92EEFF] rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#0F172A]">Flexible Bags (kg)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={flexibleKg || ""}
                        onChange={(e) => setFlexibleKg(Number(e.target.value))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A]"
                      />
                    </div>

                    {/* Residual Waste */}
                    <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#475569]">Residual Trash (kg)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={residualKg || ""}
                        onChange={(e) => setResidualKg(Number(e.target.value))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A]"
                      />
                    </div>

                    {/* Silt & Sediment */}
                    <div className="p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-[#475569]">Silt / Mud (kg)</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={siltKg || ""}
                        onChange={(e) => setSiltKg(Number(e.target.value))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-xl text-sm font-bold text-[#0F172A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Handover Recycler */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569]">
                    Designated Handover Recycler:
                  </label>
                  <select
                    value={recipientOrg}
                    onChange={(e) => setRecipientOrg(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  >
                    <option value="CDO Materials Recovery Facility">CDO Materials Recovery Facility</option>
                    <option value="Green Loop Recycling Hub">Green Loop Recycling Hub</option>
                    <option value="Northern Mindanao Plastic Recovery">Northern Mindanao Plastic Recovery</option>
                  </select>
                </div>

                {/* Feedback Banner */}
                {actionFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                      actionFeedback.success
                        ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                        : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                    }`}
                  >
                    {actionFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
                    )}
                    <span>{actionFeedback.message}</span>
                  </div>
                )}

                {/* Confirm Action Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <span>Confirm</span>
                  )}
                </button>

                {/* Native file inputs */}
                <input
                  ref={beforeCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "before")}
                />
                <input
                  ref={beforeFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "before")}
                />
                <input
                  ref={afterCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "after")}
                />
                <input
                  ref={afterFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoUpload(e, "after")}
                />
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
