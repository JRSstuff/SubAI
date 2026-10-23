"use client";

import React, { useEffect, useState, useTransition, useRef } from "react";
import {
  Wrench,
  Camera,
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
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { compressImage } from "@/lib/image-compress";
import {
  getReportsAction,
  recordCollectionAction,
  recordHandoverAction,
} from "@/app/actions/operations";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
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
  const [acceptedKg, setAcceptedKg] = useState<number>(0);

  const [isPending, startTransition] = useTransition();
  const [actionFeedback, setActionFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const loadTasks = async () => {
    setIsLoading(true);
    const res = await getReportsAction();
    if (res.success && res.data) {
      // Filter reports that have cleanup tasks
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
    setAcceptedKg(0);
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
      alert("Failed to process image.");
    }
  };

  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (totalWeighedKg <= 0) {
      alert("Please enter measured kilograms for at least one material category.");
      return;
    }

    setActionFeedback(null);

    startTransition(async () => {
      // 1. Record Collection Batches
      const batches = [
        { category: "pet_bottles" as const, kg: Number(petKg) || 0 },
        { category: "flexible_packaging" as const, kg: Number(flexibleKg) || 0 },
        { category: "residual_waste" as const, kg: Number(residualKg) || 0 },
        { category: "silt" as const, kg: Number(siltKg) || 0 },
      ];

      const res = await recordCollectionAction(
        selectedTask.id,
        batches,
        beforePhoto || undefined,
        afterPhoto || undefined
      );

      // 2. If recyclable material exists and recipient is specified, record handover
      if (res.success && totalRecyclableKg > 0 && acceptedKg > 0) {
        await recordHandoverAction(
          selectedTask.id,
          recipientOrg,
          totalRecyclableKg,
          acceptedKg
        );
      }

      setActionFeedback(res);
      if (res.success) {
        await loadTasks();
        setTimeout(() => {
          setSelectedTask(null);
        }, 1500);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D8FFC5] text-[#064E3B] border border-[#86EFAC]">
              Step 4 & 5: Cleanup & Handover
            </span>
            <span className="text-xs text-[#64748B] font-medium">Authorized Collector Terminal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Collector Assignments & Evidence
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Record before/after cleanup photo evidence, scale-weighed kilograms, and partner recycler handovers.
          </p>
        </div>

        {/* Task Cards */}
        {isLoading ? (
          <div className="w-full p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#30AFFF]" />
            <span className="text-xs font-semibold text-[#64748B]">Loading assigned tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#E2E8F0] flex flex-col items-center gap-2">
            <Wrench className="w-8 h-8 text-[#30AFFF]" />
            <span className="font-bold text-base text-[#0F172A]">No active cleanup tasks</span>
            <span className="text-xs text-[#64748B]">Check back once reviewer has dispatched reports.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const r = task.report;
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#64748B]">
                        {r?.reference_no}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          task.state === "Collected"
                            ? "bg-[#D8FFC5] text-[#064E3B] border border-[#86EFAC]"
                            : task.state === "Assigned"
                            ? "bg-[#92EEFF] text-[#0F172A] border border-[#30AFFF]"
                            : "bg-[#F1F5F9] text-[#64748B]"
                        }`}
                      >
                        {task.state}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-bold text-[#0F172A]">
                        {r?.location_name || "Campus Drainage"}
                      </h3>
                      <p className="text-xs text-[#475569] line-clamp-2">
                        {r?.description}
                      </p>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#475569]">Priority Band:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md ${
                          task.priority_band === "High"
                            ? "bg-[#EF4444] text-white"
                            : task.priority_band === "Medium"
                            ? "bg-[#30AFFF] text-white"
                            : "bg-[#10B981] text-white"
                        }`}
                      >
                        {task.priority_band || "Medium"} ({task.priority_score || 2}/5)
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">
                      Due: {task.target_date || "Today"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openTaskModal(task)}
                      className="px-3.5 py-1.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      Weigh
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── COLLECTION & EVIDENCE MODAL ─── */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#64748B]">
                    {selectedTask.report?.reference_no}
                  </span>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    Log Cleanup & Material Batches
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-1 text-[#64748B] hover:text-[#0F172A]"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmitCollection} className="flex flex-col gap-5">
                {/* 1. Before & After Photos */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#30AFFF]" />
                    <span>1. Before & After Photo Evidence</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before Photo Box */}
                    <div
                      onClick={() => beforeInputRef.current?.click()}
                      className="aspect-video rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-[#30AFFF] transition-all overflow-hidden"
                    >
                      {beforePhoto ? (
                        <img src={beforePhoto} alt="Before" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Upload className="w-5 h-5 text-[#64748B]" />
                          <span className="text-xs font-bold text-[#0F172A]">Before Photo</span>
                          <span className="text-[10px] text-[#64748B]">Clogged drain</span>
                        </div>
                      )}
                    </div>

                    {/* After Photo Box */}
                    <div
                      onClick={() => afterInputRef.current?.click()}
                      className="aspect-video rounded-2xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] flex flex-col items-center justify-center p-2 text-center cursor-pointer hover:border-[#10B981] transition-all overflow-hidden"
                    >
                      {afterPhoto ? (
                        <img src={afterPhoto} alt="After" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                          <span className="text-xs font-bold text-[#0F172A]">After Photo</span>
                          <span className="text-[10px] text-[#64748B]">Cleared drain</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, "before")}
                    className="hidden"
                  />
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoUpload(e, "after")}
                    className="hidden"
                  />
                </div>

                {/* 2. Measured Kilograms Input */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wider">
                      <Scale className="w-4 h-4 text-[#30AFFF]" />
                      <span>2. Measured Mass by Category (kg)</span>
                    </label>
                    <span className="text-xs font-bold text-[#0F172A] bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                      Total: {totalWeighedKg.toFixed(2)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-[#475569]">
                        PET Bottles (kg)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={petKg || ""}
                        onChange={(e) => setPetKg(parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Flexible Plastics (kg)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={flexibleKg || ""}
                        onChange={(e) => setFlexibleKg(parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Residual Waste (kg)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={residualKg || ""}
                        onChange={(e) => setResidualKg(parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] mt-1"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Silt & Sediment (kg)
                      </span>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={siltKg || ""}
                        onChange={(e) => setSiltKg(parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Partner Recycler Handover */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-3">
                  <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wider">
                    <Recycle className="w-4 h-4 text-[#059669]" />
                    <span>3. Recycler Partner Handover (Optional)</span>
                  </label>

                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[#475569]">
                        Recipient Organization:
                      </span>
                      <input
                        type="text"
                        value={recipientOrg}
                        onChange={(e) => setRecipientOrg(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-semibold text-[#475569]">
                          Eligible Recyclable (kg):
                        </span>
                        <div className="h-10 px-3 bg-[#E2E8F0]/50 rounded-xl flex items-center text-xs font-bold text-[#475569] mt-1">
                          {totalRecyclableKg.toFixed(2)} kg
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#475569]">
                          Accepted by Recycler (kg):
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={totalRecyclableKg}
                          value={acceptedKg || ""}
                          onChange={(e) => setAcceptedKg(parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="w-full h-10 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {actionFeedback && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      actionFeedback.success
                        ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                        : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                    }`}
                  >
                    {actionFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                    )}
                    <span>{actionFeedback.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
