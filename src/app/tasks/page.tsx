"use client";

import React, { useEffect, useState, useTransition, useRef, useMemo } from "react";
import {
  Wrench,
  Camera,
  FolderOpen,
  Scale,
  Recycle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  Building,
  Upload,
  X,
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  RotateCcw,
  MapPin,
  Calendar,
  ZoomIn,
  Trash2,
  Layers,
  Sparkles,
  Inbox,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { compressImage } from "@/lib/image-compress";
import {
  getReportsAction,
  recordCollectionAction,
} from "@/app/actions/operations";

export const isTaskCompleted = (t: any): boolean => {
  if (!t) return false;
  const state = String(t.state || "").trim().toLowerCase();
  const status = String(t.status || "").trim().toLowerCase();
  return (
    state === "collected" ||
    state === "closed" ||
    state === "awaiting disposition" ||
    status === "completed" ||
    status === "done" ||
    status === "collected" ||
    Boolean(t.completed_at)
  );
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters for large task volumes
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "High" | "Medium" | "Low">("all");
  const [sortBy, setSortBy] = useState<"priority_desc" | "newest" | "oldest">("priority_desc");

  // Zoom preview modal for photos
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Success celebration banner
  const [completionBanner, setCompletionBanner] = useState<{
    id: string;
    location: string;
    kg: number;
  } | null>(null);

  // Collection modal state
  const [petKg, setPetKg] = useState<number>(0);
  const [flexibleKg, setFlexibleKg] = useState<number>(0);
  const [residualKg, setResidualKg] = useState<number>(0);
  const [siltKg, setSiltKg] = useState<number>(0);

  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  // Handover state
  const [recipientOrg, setRecipientOrg] = useState("CDO Materials Recovery Facility");

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
    let allReports: any[] = [];
    try {
      const apiRes = await fetch("/api/reports");
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json?.data)) {
          allReports = json.data;
        }
      }
    } catch {
      // fallback to server action
    }

    if (allReports.length === 0) {
      try {
        const res = await getReportsAction();
        if (res?.success && Array.isArray(res?.data)) {
          allReports = res.data as any[];
        }
      } catch (err) {
        console.warn("Could not load reports for tasks:", err);
      }
    }

    const taskList: any[] = [];
    allReports.forEach((r) => {
      const ctList = Array.isArray(r.cleanup_tasks)
        ? r.cleanup_tasks
        : r.cleanup_tasks
        ? [r.cleanup_tasks]
        : [];

      ctList.forEach((ct: any) => {
        taskList.push({
          ...ct,
          report: r,
        });
      });
    });

    setTasks(taskList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Quick stats
  const activeTasksList = useMemo(() => tasks.filter((t) => !isTaskCompleted(t)), [tasks]);
  const completedTasksList = useMemo(() => tasks.filter((t) => isTaskCompleted(t)), [tasks]);

  const totalKgDiverted = useMemo(() => {
    return completedTasksList.reduce((sum, t) => {
      const directKg = Number(t.total_kg || 0);
      if (directKg > 0) return sum + directKg;
      if (Array.isArray(t.batches)) {
        const batchSum = t.batches.reduce((bSum: number, b: any) => bSum + (Number(b.kg) || 0), 0);
        return sum + batchSum;
      }
      return sum;
    }, 0);
  }, [completedTasksList]);

  const highPriorityActiveCount = useMemo(() => {
    return activeTasksList.filter(
      (t) => t.priority_band === "High" || Number(t.priority_score) >= 4
    ).length;
  }, [activeTasksList]);

  // Filtered & sorted tasks based on tab & filters
  const currentTabPool = activeTab === "active" ? activeTasksList : completedTasksList;

  const filteredTasks = useMemo(() => {
    return currentTabPool
      .filter((t) => {
        // Priority filter
        if (priorityFilter !== "all") {
          if (t.priority_band !== priorityFilter) return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const loc = String(t.report?.location_name || "").toLowerCase();
        const refNo = String(t.report?.reference_no || "").toLowerCase();
        const desc = String(t.report?.description || "").toLowerCase();
        const assignee = String(t.assigned_to || "").toLowerCase();
        const taskId = String(t.id || "").toLowerCase();

        return (
          loc.includes(q) ||
          refNo.includes(q) ||
          desc.includes(q) ||
          assignee.includes(q) ||
          taskId.includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === "priority_desc") {
          const scoreA = Number(a.priority_score) || (a.priority_band === "High" ? 5 : a.priority_band === "Medium" ? 3 : 1);
          const scoreB = Number(b.priority_score) || (b.priority_band === "High" ? 5 : b.priority_band === "Medium" ? 3 : 1);
          return scoreB - scoreA;
        }
        if (sortBy === "newest") {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        return 0;
      });
  }, [currentTabPool, priorityFilter, searchQuery, sortBy]);

  // Modal helpers
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
    setBeforePhoto(task.report?.photo_url || null);
    setAfterPhoto(null);
  };

  const addKg = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number) => {
    setter((prev) => {
      const next = Math.max(0, Math.round((Number(prev || 0) + delta) * 10) / 10);
      return next;
    });
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
      alert("Please record weighed mass in kg for at least one material category.");
      return;
    }

    setActionFeedback(null);

    const batches = [
      { category: "pet_bottles" as const, kg: Number(petKg) || 0 },
      { category: "flexible_packaging" as const, kg: Number(flexibleKg) || 0 },
      { category: "residual_waste" as const, kg: Number(residualKg) || 0 },
      { category: "silt" as const, kg: Number(siltKg) || 0 },
    ].filter((b) => b.kg > 0);

    const taskId = selectedTask.id;
    const taskLocation = selectedTask.report?.location_name || "Culvert Drainage";
    const finalKg = totalWeighedKg;

    startTransition(async () => {
      const res = await recordCollectionAction(
        taskId,
        batches,
        beforePhoto || undefined,
        afterPhoto || undefined
      );

      setActionFeedback(res);

      if (res.success) {
        // Optimistically mark completed in state
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  state: "Collected",
                  status: "Completed",
                  completed_at: new Date().toISOString(),
                  total_kg: finalKg,
                  batches,
                  before_photo_url: beforePhoto,
                  after_photo_url: afterPhoto,
                }
              : t
          )
        );

        // Show banner notification & switch to Completed tab
        setCompletionBanner({
          id: taskId.slice(0, 8),
          location: taskLocation,
          kg: finalKg,
        });
        setActiveTab("completed");

        // Reload data from backend
        await loadTasks();

        // Close modal after brief pause
        setTimeout(() => {
          setSelectedTask(null);
        }, 1200);
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-16 text-[#0F172A] flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-6">
        {/* Header with Title and Collector Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC] inline-flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#059669]" />
                <span>Field Collection & Weighing Hub</span>
              </span>
              <span className="text-xs text-[#64748B] font-semibold bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
                CDO Custody Chain
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Collector Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Dispatch teams to unblock drainage culverts, capture visual proof, and weigh segregated plastic & silt.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadTasks}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#30AFFF] ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ─── METRIC KPI SUMMARY CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Active Tasks */}
          <div
            onClick={() => setActiveTab("active")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-[#30AFFF]/10 border-[#30AFFF] shadow-xs"
                : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Active Queue
              </span>
              <Wrench className="w-4 h-4 text-[#30AFFF]" />
            </div>
            <div className="text-2xl font-black text-[#0F172A] mt-2">
              {activeTasksList.length}
            </div>
            <div className="text-[11px] font-medium text-[#64748B] mt-0.5">
              Pending cleanup & scale
            </div>
          </div>

          {/* Card 2: Completed Tasks */}
          <div
            onClick={() => setActiveTab("completed")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "completed"
                ? "bg-[#D8FFC5]/50 border-[#86EFAC] shadow-xs"
                : "bg-white border-[#E2E8F0] hover:border-[#94A3B8]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Completed
              </span>
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="text-2xl font-black text-[#059669] mt-2">
              {completedTasksList.length}
            </div>
            <div className="text-[11px] font-medium text-[#64748B] mt-0.5">
              Weighed & documented
            </div>
          </div>

          {/* Card 3: Total Diverted kg */}
          <div className="p-4 rounded-2xl border bg-white border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Mass Diverted
              </span>
              <Scale className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="text-2xl font-black text-[#0F172A] mt-2">
              {totalKgDiverted.toFixed(1)}{" "}
              <span className="text-sm font-bold text-[#64748B]">kg</span>
            </div>
            <div className="text-[11px] font-medium text-[#059669] mt-0.5 flex items-center gap-1">
              <span>Circular custody</span>
            </div>
          </div>

          {/* Card 4: Urgent High Priority */}
          <div
            onClick={() => {
              setActiveTab("active");
              setPriorityFilter("High");
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              highPriorityActiveCount > 0
                ? "bg-[#FEE2E2]/60 border-[#FCA5A5]"
                : "bg-white border-[#E2E8F0]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#991B1B] uppercase tracking-wider">
                Urgent High
              </span>
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            </div>
            <div className="text-2xl font-black text-[#DC2626] mt-2">
              {highPriorityActiveCount}
            </div>
            <div className="text-[11px] font-medium text-[#991B1B] mt-0.5">
              Severe blockage risk
            </div>
          </div>
        </div>

        {/* ─── SUCCESS CELEBRATION BANNER ─── */}
        {completionBanner && (
          <div className="p-4 bg-[#D8FFC5] border border-[#86EFAC] rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#86EFAC] flex items-center justify-center text-[#059669] shrink-0 font-bold">
                ✓
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-[#064E3B]">
                  Collection Recorded & Task Completed!
                </span>
                <span className="text-[11px] text-[#064E3B]/80 font-medium">
                  Task #{completionBanner.id} at {completionBanner.location} ({completionBanner.kg} kg weighed) moved to Completed tab.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompletionBanner(null)}
              className="p-1 rounded-lg text-[#064E3B]/70 hover:text-[#064E3B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── CONTROLS TOOLBAR: TABS + SEARCH + FILTERS ─── */}
        <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-3.5">
          {/* Top row: Tab pills + Search bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Segmented Control Pills */}
            <div className="inline-flex p-1 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0] shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("active")}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "active"
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <span>Active Tasks</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === "active"
                      ? "bg-white text-[#30AFFF]"
                      : "bg-[#CBD5E1] text-[#0F172A]"
                  }`}
                >
                  {activeTasksList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={`px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === "completed"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <span>Completed</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    activeTab === "completed"
                      ? "bg-white text-[#059669]"
                      : "bg-[#CBD5E1] text-[#0F172A]"
                  }`}
                >
                  {completedTasksList.length}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search street, culvert, ref #, or task ID..."
                className="w-full h-10 pl-9 pr-8 bg-[#F8FAFC] border border-[#CBD5E1] rounded-2xl text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Bottom row: Filter Chips & Sort selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F1F5F9]">
            {/* Priority filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[11px] font-bold text-[#64748B] mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#30AFFF]" />
                <span>Priority:</span>
              </span>

              {(["all", "High", "Medium", "Low"] as const).map((band) => {
                const isActive = priorityFilter === band;
                return (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setPriorityFilter(band)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? band === "High"
                          ? "bg-[#DC2626] text-white"
                          : band === "Medium"
                          ? "bg-[#D97706] text-white"
                          : band === "Low"
                          ? "bg-[#0284C7] text-white"
                          : "bg-[#0F172A] text-white"
                        : "bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]"
                    }`}
                  >
                    {band === "all" ? "All Priorities" : `${band} Priority`}
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[11px] font-bold text-[#0F172A] focus:outline-none cursor-pointer"
              >
                <option value="priority_desc">Highest Priority First</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── TASK CARDS LIST ─── */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="p-12 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#30AFFF] animate-spin" />
              <span className="text-sm font-bold text-[#475569]">
                Synchronizing task custody ledger...
              </span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] flex items-center justify-center">
                <Inbox className="w-7 h-7 text-[#94A3B8]" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-base font-bold text-[#0F172A]">
                  No {activeTab} tasks found
                </span>
                <p className="text-xs text-[#64748B]">
                  {searchQuery || priorityFilter !== "all"
                    ? "Try adjusting your search query or priority filters to see other tasks."
                    : activeTab === "active"
                    ? "All assigned culvert cleanup tasks have been completed and weighed!"
                    : "No completed tasks yet. Completed collections will be archived here."}
                </p>
              </div>
              {(searchQuery || priorityFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPriorityFilter("all");
                  }}
                  className="mt-2 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isHigh = t.priority_band === "High" || Number(t.priority_score) >= 4;
              const isMedium = t.priority_band === "Medium";
              const isDone = isTaskCompleted(t);
              const report = t.report;
              const hasPhoto = Boolean(report?.photo_url);

              // Extract completed batch details if present
              const totalKg = Number(t.total_kg) || 0;
              const batches = Array.isArray(t.batches) ? t.batches : [];

              return (
                <div
                  key={t.id}
                  className={`p-4 sm:p-5 bg-white border rounded-3xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isDone
                      ? "border-[#E2E8F0] bg-white/90"
                      : isHigh
                      ? "border-[#FCA5A5] hover:border-[#DC2626]"
                      : "border-[#E2E8F0] hover:border-[#30AFFF]"
                  }`}
                >
                  {/* Left: Thumbnail & Main Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Photo Thumbnail or Icon */}
                    {hasPhoto ? (
                      <div
                        onClick={() =>
                          setZoomPhoto({
                            url: report.photo_url,
                            title: report.location_name || "Culvert Obstruction",
                            subtitle: report.reference_no,
                          })
                        }
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-[#CBD5E1] shrink-0 cursor-pointer group bg-[#F1F5F9]"
                      >
                        <img
                          src={report.photo_url}
                          alt="Obstruction"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ZoomIn className="w-5 h-5 drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#D8FFC5] border border-[#86EFAC] flex items-center justify-center shrink-0">
                        <Wrench className="w-7 h-7 text-[#0F2E1B]" />
                      </div>
                    )}

                    {/* Metadata Content */}
                    <div className="flex flex-col min-w-0">
                      {/* Badge row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                          #{report?.reference_no || t.id.slice(0, 8)}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            isHigh
                              ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                              : isMedium
                              ? "bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]"
                              : "bg-[#E0F2FE] text-[#075985] border border-[#BAE6FD]"
                          }`}
                        >
                          {t.priority_band || "Standard"} Priority
                        </span>

                        <span className="text-[10px] font-bold text-[#64748B] bg-[#F8FAFC] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                          Score: {t.priority_score ?? 3}/5
                        </span>

                        {isDone && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#D8FFC5] text-[#064E3B] border border-[#86EFAC] inline-flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Completed & Weighed</span>
                          </span>
                        )}
                      </div>

                      {/* Location Name */}
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] mt-1 truncate">
                        {report?.location_name || "Culvert Drainage Point"}
                      </h3>

                      {/* Description / Notes snippet */}
                      {report?.description && (
                        <p className="text-xs text-[#475569] line-clamp-1 mt-0.5">
                          {report.description}
                        </p>
                      )}

                      {/* Assignee / Date */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-[#64748B]">
                        <span>
                          Assigned:{" "}
                          <strong className="text-[#0F172A]">
                            {t.assigned_to || "Maintenance Crew"}
                          </strong>
                        </span>
                        {t.completed_at && (
                          <span>
                            Completed:{" "}
                            <strong className="text-[#059669]">
                              {new Date(t.completed_at).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </strong>
                          </span>
                        )}
                      </div>

                      {/* Completed batch chips if completed */}
                      {isDone && (totalKg > 0 || batches.length > 0) && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-[#C4F7CA] text-[#064E3B] border border-[#86EFAC]">
                            ⚖️ {totalKg > 0 ? totalKg.toFixed(1) : "—"} kg Total
                          </span>
                          {batches.map((b: any, bIdx: number) => {
                            const label =
                              b.category === "pet_bottles"
                                ? "PET"
                                : b.category === "flexible_packaging"
                                ? "Flexible"
                                : b.category === "residual_waste"
                                ? "Residual"
                                : "Silt";
                            return (
                              <span
                                key={bIdx}
                                className="px-1.5 py-0.5 bg-[#F1F5F9] text-[#475569] rounded text-[10px] font-bold border border-[#E2E8F0]"
                              >
                                {label}: {b.kg}kg
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions / Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    {!isDone ? (
                      <button
                        type="button"
                        onClick={() => openTaskModal(t)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-2xl text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer min-h-[42px] flex items-center justify-center gap-2"
                      >
                        <Scale className="w-4 h-4" />
                        <span>Weigh & Evidence ⚖️</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {t.after_photo_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setZoomPhoto({
                                url: t.after_photo_url,
                                title: "After-Cleanup Proof",
                                subtitle: report?.location_name,
                              })
                            }
                            className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#059669]" />
                            <span>Proof Photo</span>
                          </button>
                        )}
                        <span className="px-3 py-1.5 bg-[#D8FFC5] text-[#064E3B] border border-[#86EFAC] rounded-xl text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Archived</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── COLLECTION & WEIGHING MODAL ─── */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl border border-[#CBD5E1] overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex flex-col min-w-0 pr-3">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-[#30AFFF] uppercase tracking-wider flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    <span>Task Execution & Scale Weighing</span>
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-[#0F172A] truncate">
                    {selectedTask.report?.location_name || "Assigned Culvert"}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">
                    Ref: #{selectedTask.report?.reference_no || selectedTask.id.slice(0, 8)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-2 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-white cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form
                action="javascript:void(0);"
                onSubmit={handleSubmitCollection}
                className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto"
              >
                {/* 1. Photo Evidence Section */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Photo Verification Evidence</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#64748B]">
                      Timestamped for MRF custody
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Before Photo */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#475569]">
                        1. Initial Clog Photo:
                      </span>
                      {beforePhoto ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-[#86EFAC] group bg-black/5">
                          <img
                            src={beforePhoto}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setBeforePhoto(null)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 cursor-pointer"
                            title="Retake Before Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => beforeCameraInputRef.current?.click()}
                            className="flex-1 py-2.5 bg-white border border-[#CBD5E1] hover:border-[#30AFFF] rounded-xl text-[11px] font-bold text-[#0F172A] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#30AFFF]" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => beforeFileInputRef.current?.click()}
                            className="p-2.5 bg-white border border-[#CBD5E1] hover:border-[#30AFFF] rounded-xl text-[#64748B] cursor-pointer"
                            title="Choose from Gallery"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* After Photo */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-bold text-[#475569]">
                        2. Cleared Culvert Photo:
                      </span>
                      {afterPhoto ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-[#86EFAC] group bg-black/5">
                          <img
                            src={afterPhoto}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setAfterPhoto(null)}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 cursor-pointer"
                            title="Retake After Photo"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => afterCameraInputRef.current?.click()}
                            className="flex-1 py-2.5 bg-white border border-[#CBD5E1] hover:border-[#059669] rounded-xl text-[11px] font-bold text-[#0F172A] flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#059669]" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => afterFileInputRef.current?.click()}
                            className="p-2.5 bg-white border border-[#CBD5E1] hover:border-[#059669] rounded-xl text-[#64748B] cursor-pointer"
                            title="Choose from Gallery"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Scale Weighing Inputs with Quick Increments */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Material Scale Readings (kg)</span>
                    </span>
                    <span className="text-xs font-black text-[#064E3B] bg-[#C4F7CA] px-3 py-1 rounded-full border border-[#86EFAC]">
                      Total: {totalWeighedKg.toFixed(2)} kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* PET Bottles */}
                    <div className="p-3 bg-[#E0F2FE]/40 border border-[#BAE6FD] rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0369A1] flex items-center gap-1">
                          <span>🍾 PET Bottles</span>
                        </span>
                        <span className="text-xs font-black text-[#0369A1]">
                          {petKg.toFixed(1)} kg
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={petKg || ""}
                        onChange={(e) => setPetKg(Math.max(0, Number(e.target.value)))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => addKg(setPetKg, 1)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +1kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setPetKg, 5)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +5kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setPetKg, 10)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +10kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setPetKg(0)}
                          className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-[#CBD5E1] rounded-lg text-[10px] font-bold"
                          title="Reset"
                        >
                          0
                        </button>
                      </div>
                    </div>

                    {/* Flexible Packaging */}
                    <div className="p-3 bg-[#E0F2FE]/40 border border-[#BAE6FD] rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#0369A1] flex items-center gap-1">
                          <span>🛍️ Flexible Bags</span>
                        </span>
                        <span className="text-xs font-black text-[#0369A1]">
                          {flexibleKg.toFixed(1)} kg
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={flexibleKg || ""}
                        onChange={(e) => setFlexibleKg(Math.max(0, Number(e.target.value)))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#0284C7]"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => addKg(setFlexibleKg, 1)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +1kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setFlexibleKg, 5)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +5kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setFlexibleKg, 10)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +10kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlexibleKg(0)}
                          className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-[#CBD5E1] rounded-lg text-[10px] font-bold"
                          title="Reset"
                        >
                          0
                        </button>
                      </div>
                    </div>

                    {/* Residual Waste */}
                    <div className="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#475569] flex items-center gap-1">
                          <span>🗑️ Residual Trash</span>
                        </span>
                        <span className="text-xs font-black text-[#475569]">
                          {residualKg.toFixed(1)} kg
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={residualKg || ""}
                        onChange={(e) => setResidualKg(Math.max(0, Number(e.target.value)))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#475569]"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => addKg(setResidualKg, 1)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +1kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setResidualKg, 5)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +5kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setResidualKg, 10)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +10kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setResidualKg(0)}
                          className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-[#CBD5E1] rounded-lg text-[10px] font-bold"
                          title="Reset"
                        >
                          0
                        </button>
                      </div>
                    </div>

                    {/* Silt & Sediment */}
                    <div className="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#475569] flex items-center gap-1">
                          <span>🪨 Silt / Mud</span>
                        </span>
                        <span className="text-xs font-black text-[#475569]">
                          {siltKg.toFixed(1)} kg
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={siltKg || ""}
                        onChange={(e) => setSiltKg(Math.max(0, Number(e.target.value)))}
                        placeholder="0.0"
                        className="w-full h-9 px-3 bg-white border border-[#CBD5E1] rounded-xl text-sm font-bold text-[#0F172A] focus:outline-none focus:border-[#475569]"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => addKg(setSiltKg, 1)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +1kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setSiltKg, 5)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +5kg
                        </button>
                        <button
                          type="button"
                          onClick={() => addKg(setSiltKg, 10)}
                          className="flex-1 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[10px] font-bold text-[#0F172A]"
                        >
                          +10kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setSiltKg(0)}
                          className="px-2 py-1 bg-white hover:bg-red-50 text-red-600 border border-[#CBD5E1] rounded-lg text-[10px] font-bold"
                          title="Reset"
                        >
                          0
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Designated Handover Recycler */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#475569] flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#30AFFF]" />
                    <span>Designated Handover Recycler Facility:</span>
                  </label>
                  <select
                    value={recipientOrg}
                    onChange={(e) => setRecipientOrg(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none cursor-pointer"
                  >
                    <option value="CDO Materials Recovery Facility">
                      CDO Materials Recovery Facility (Barangay Lapasan)
                    </option>
                    <option value="Green Loop Recycling Hub">
                      Green Loop Recycling Hub (Poblacion)
                    </option>
                    <option value="Northern Mindanao Plastic Recovery">
                      Northern Mindanao Plastic Recovery (Macabalan)
                    </option>
                  </select>
                </div>

                {/* Feedback Banner */}
                {actionFeedback && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                      actionFeedback.success
                        ? "bg-[#D8FFC5] text-[#064E3B] border-[#86EFAC]"
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
                  disabled={isPending || totalWeighedKg <= 0}
                  className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer min-h-[48px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Scale Weights & Archiving Task...</span>
                    </>
                  ) : (
                    <span>
                      Submit Collection & Move to Completed ({totalWeighedKg.toFixed(1)} kg)
                    </span>
                  )}
                </button>

                {/* Hidden native file inputs */}
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

        {/* ─── FULL PHOTO ZOOM PREVIEW MODAL ─── */}
        {zoomPhoto && (
          <div
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setZoomPhoto(null)}
          >
            <div
              className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex flex-col">
                  <h4 className="text-sm font-extrabold text-[#0F172A]">
                    {zoomPhoto.title}
                  </h4>
                  {zoomPhoto.subtitle && (
                    <span className="text-xs text-[#64748B] font-mono">
                      Ref: #{zoomPhoto.subtitle}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setZoomPhoto(null)}
                  className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#0F172A] flex items-center justify-center p-2 max-h-[75vh]">
                <img
                  src={zoomPhoto.url}
                  alt={zoomPhoto.title}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
