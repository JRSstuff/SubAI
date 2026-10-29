"use client";

import React, { useEffect, useState, useTransition, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  Clock,
  ArrowRight,
  X,
  Eye,
  MapPin,
  Tag,
  Building2,
  UserCheck,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getReportsAction, triageReportAction } from "@/app/actions/operations";

export default function ReviewPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string; desc: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Submitted");
  const [isLoading, setIsLoading] = useState(true);

  // Photo Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Triage modal state
  const [reviewState, setReviewState] = useState<
    "Verified" | "Needs inspection" | "Rejected" | "Duplicate"
  >("Verified");
  const [obstructionScore, setObstructionScore] = useState(1);
  const [disruptionScore, setDisruptionScore] = useState(1);
  const [assigneeName, setAssigneeName] = useState("Facilities Operations Team 1");
  const [targetDate, setTargetDate] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const [isPending, startTransition] = useTransition();
  const [triageFeedback, setTriageFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const apiRes = await fetch("/api/reports");
      if (apiRes.ok) {
        const json = await apiRes.json();
        if (Array.isArray(json?.data)) {
          setReports(json.data);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // fallback
    }

    try {
      const res = await getReportsAction();
      if (res?.success && Array.isArray(res?.data)) {
        setReports(res.data as any[]);
      }
    } catch (err) {
      console.warn("Could not load reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openPhotoPreview = (photo: { url: string; title: string; desc: string }) => {
    setPreviewPhoto(photo);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(Number((prev - 0.5).toFixed(1)), 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleSetZoomPreset = (level: number) => {
    setZoomLevel(level);
    if (level === 1) setPanOffset({ x: 0, y: 0 });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomLevel <= 1 || e.touches.length === 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX - panOffset.x,
      y: e.touches[0].clientY - panOffset.y,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1 || e.touches.length === 0) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleTap = () => {
    setZoomLevel((prev) => {
      if (prev === 1) return 2;
      setPanOffset({ x: 0, y: 0 });
      return 1;
    });
  };

  const openTriageModal = (report: any) => {
    setSelectedReport(report);
    setTriageFeedback(null);
    setReviewState(report.review_state === "Submitted" ? "Verified" : report.review_state);
    const task = report.cleanup_tasks?.[0] || report.cleanup_tasks;
    if (task) {
      setObstructionScore(task.obstruction_score ?? 1);
      setDisruptionScore(task.disruption_score ?? 1);
      if (task.assigned_to) setAssigneeName(task.assigned_to);
      if (task.target_date) setTargetDate(task.target_date.split("T")[0]);
    }
  };

  const calculatedScore = obstructionScore + disruptionScore;
  const calculatedBand =
    calculatedScore <= 1 ? "Low" : calculatedScore >= 4 ? "High" : "Medium";

  const handleTriageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setTriageFeedback(null);

    startTransition(async () => {
      const res = await triageReportAction(
        selectedReport.id,
        reviewState,
        obstructionScore,
        disruptionScore,
        assigneeName,
        targetDate,
        reviewNotes
      );
      setTriageFeedback(res);
      if (res.success) {
        await loadReports();
        setTimeout(() => {
          setSelectedReport(null);
        }, 800);
      }
    });
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab === "All") return true;
    return r.review_state === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#30AFFF] text-white">
              Triage & Dispatch
            </span>
            <span className="text-xs text-[#64748B] font-medium">Review Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Inspect photographic evidence, assess drainage obstruction scores, and dispatch cleanup crews.
          </p>
        </div>

        {/* ─── STATUS SWITCHER PILLS ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {["Submitted", "Verified", "Needs inspection", "Rejected", "All"].map((tab) => {
            const isSelected = activeTab === tab;
            const count = reports.filter((r) => (tab === "All" ? true : r.review_state === tab)).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 min-h-[40px] ${
                  isSelected
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]"
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white/25 text-white" : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── QUEUE CARDS LIST ─── */}
        <div className="flex flex-col gap-3.5">
          {isLoading ? (
            <div className="p-12 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#30AFFF]" />
              <span className="text-xs font-bold text-[#64748B]">Loading queue...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-10 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-2">
              <ClipboardCheck className="w-8 h-8 text-[#94A3B8]" />
              <span className="text-sm font-bold text-[#475569]">
                No reports found under "{activeTab}".
              </span>
            </div>
          ) : (
            filteredReports.map((r) => {
              const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
              const isHigh = task?.priority_band === "High";
              const categories = r.ai_analyses?.[0]?.suggested_categories || [];

              return (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 bg-white border border-[#E2E8F0] hover:border-[#30AFFF] rounded-3xl shadow-xs transition-all flex flex-col gap-3.5"
                >
                  {/* Top Metadata Badges (Responsive Wrap) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F1F5F9] pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold bg-[#F1F5F9] text-[#0F172A] px-2.5 py-1 rounded-lg">
                        {r.reference_no}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          r.review_state === "Verified"
                            ? "bg-[#C4F7CA] text-[#064E3B] border border-[#86EFAC]"
                            : r.review_state === "Needs inspection"
                            ? "bg-[#92EEFF] text-[#0F172A] border border-[#30AFFF]"
                            : r.review_state === "Rejected"
                            ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                            : "bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC]"
                        }`}
                      >
                        {r.review_state}
                      </span>
                      {task && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isHigh
                              ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"
                              : "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                          }`}
                        >
                          Score: {task.priority_score ?? calculatedScore} ({task.priority_band ?? "Med"})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#64748B] font-medium flex items-center gap-1">
                      <span>Reporter:</span>
                      <strong className="text-[#0F172A] font-bold">{r.reporter_name}</strong>
                    </div>
                  </div>

                  {/* Middle: Photo Preview + Un-truncated Description */}
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Photo Box with Click to View */}
                    <div className="relative w-full sm:w-44 h-40 sm:h-32 rounded-2xl bg-[#0F172A] border border-[#E2E8F0] shrink-0 overflow-hidden group">
                      {r.photo_url ? (
                        <>
                          <img
                            src={r.photo_url}
                            alt={r.location_name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              openPhotoPreview({
                                url: r.photo_url,
                                title: `${r.reference_no} • ${r.location_name}`,
                                desc: r.description,
                              })
                            }
                            title="Inspect Photo"
                            className="absolute inset-0 bg-black/35 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            <span className="px-3 py-1.5 bg-white/95 text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-[#30AFFF]" />
                              <span>View</span>
                            </span>
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#94A3B8] gap-1">
                          <ClipboardCheck className="w-6 h-6" />
                          <span className="text-[10px]">No Photo</span>
                        </div>
                      )}
                    </div>

                    {/* Full Description & Location Details */}
                    <div className="flex flex-col flex-1 min-w-0 gap-1.5 w-full">
                      <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] break-words">
                        {r.location_name || "Cagayan de Oro Point"}
                      </h3>

                      {r.latitude && r.longitude && (
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                          <MapPin className="w-3.5 h-3.5 text-[#30AFFF] shrink-0" />
                          <span className="font-mono text-[11px] text-[#30AFFF] font-bold">
                            {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)}
                          </span>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-[#334155] leading-relaxed break-words mt-0.5">
                        {r.description || "No description provided."}
                      </p>

                      {categories.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {categories.map((cat: string) => (
                            <span
                              key={cat}
                              className="px-2 py-0.5 bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC] rounded-md text-[10px] font-bold uppercase tracking-wider"
                            >
                              {cat.replace("_", " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F1F5F9]">
                    {r.photo_url && (
                      <button
                        type="button"
                        onClick={() =>
                          openPhotoPreview({
                            url: r.photo_url,
                            title: `${r.reference_no} • ${r.location_name}`,
                            desc: r.description,
                          })
                        }
                        className="px-3.5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#30AFFF]" />
                        <span>View</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openTriageModal(r)}
                      className="px-5 py-2 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                    >
                      <span>Triage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── FULL-SCREEN PHOTO INSPECTOR WITH ADJUSTABLE ZOOM & PAN ─── */}
        {previewPhoto && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between text-white pb-3 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="text-xs sm:text-sm font-bold truncate max-w-xs sm:max-w-md">
                  {previewPhoto.title}
                </span>
                {zoomLevel > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#30AFFF] text-white text-[10px] font-bold flex items-center gap-1 shrink-0">
                    <Move className="w-3 h-3" />
                    <span>Drag to pan</span>
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            {/* Interactive Zoomable / Pannable Image Canvas */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDoubleClick={handleDoubleTap}
              className={`flex-1 flex items-center justify-center relative overflow-hidden my-auto py-2 ${
                zoomLevel > 1
                  ? isDragging
                    ? "cursor-grabbing"
                    : "cursor-grab"
                  : "cursor-zoom-in"
              }`}
            >
              <img
                src={previewPhoto.url}
                alt="Obstruction evidence"
                draggable={false}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transition: isDragging ? "none" : "transform 0.15s ease-out",
                  maxHeight: "72vh",
                  maxWidth: "92vw",
                }}
                className="object-contain rounded-2xl shadow-2xl select-none pointer-events-auto"
              />
            </div>

            {/* Floating Zoom & Scale Controls Bar */}
            <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl">
                {/* Zoom Out Button */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  title="Zoom Out"
                  className="p-2 bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white rounded-xl transition-all cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Quick Zoom Presets */}
                {[1, 1.5, 2, 3].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSetZoomPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      zoomLevel === preset
                        ? "bg-[#30AFFF] text-white shadow-xs"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {preset}x
                  </button>
                ))}

                {/* Zoom In Button */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3.5}
                  title="Zoom In"
                  className="p-2 bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white rounded-xl transition-all cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={handleResetZoom}
                  title="Reset Zoom"
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Bottom Description Callout */}
              {previewPhoto.desc && (
                <div className="w-full bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-white/15 text-white text-left">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#92EEFF] block">
                    Description
                  </span>
                  <p className="text-xs sm:text-sm text-white/95 leading-relaxed break-words mt-0.5 line-clamp-2">
                    {previewPhoto.desc}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TRIAGE & DISPATCH MODAL ─── */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-[11px] font-extrabold text-[#30AFFF] uppercase tracking-wider">
                    Triage & Dispatch
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-[#0F172A] truncate">
                    {selectedReport.reference_no} &bull; {selectedReport.location_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form action="javascript:void(0);" onSubmit={handleTriageSubmit} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
                {/* 1. Evidence Inspection in Triage with Zoom Capability */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0F172A]">
                      Photographic Evidence
                    </label>
                    {selectedReport.photo_url && (
                      <button
                        type="button"
                        onClick={() =>
                          openPhotoPreview({
                            url: selectedReport.photo_url,
                            title: `${selectedReport.reference_no} • ${selectedReport.location_name}`,
                            desc: selectedReport.description,
                          })
                        }
                        className="text-xs font-bold text-[#30AFFF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    )}
                  </div>

                  {selectedReport.photo_url ? (
                    <div
                      onClick={() =>
                        openPhotoPreview({
                          url: selectedReport.photo_url,
                          title: `${selectedReport.reference_no} • ${selectedReport.location_name}`,
                          desc: selectedReport.description,
                        })
                      }
                      className="relative w-full aspect-video sm:h-52 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#0F172A] cursor-pointer group"
                    >
                      <img
                        src={selectedReport.photo_url}
                        alt={selectedReport.location_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3.5 py-1.5 bg-white/95 text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                          <ZoomIn className="w-3.5 h-3.5 text-[#30AFFF]" />
                          <span>Zoom & Inspect</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-center text-xs text-[#64748B] font-medium">
                      No photographic evidence attached to this report.
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-1 text-left">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                      Obstruction Description
                    </span>
                    <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed break-words font-medium">
                      {selectedReport.description || "No description provided."}
                    </p>
                  </div>
                </div>

                {/* 2. Verification State Decision */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#0F172A]">
                    Verification Status
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { state: "Verified", color: "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]" },
                      { state: "Needs inspection", color: "bg-[#92EEFF] text-[#0F172A] border-[#30AFFF]" },
                      { state: "Rejected", color: "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]" },
                      { state: "Duplicate", color: "bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]" },
                    ].map((s) => (
                      <button
                        key={s.state}
                        type="button"
                        onClick={() => setReviewState(s.state as any)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                          reviewState === s.state
                            ? `${s.color} ring-2 ring-[#30AFFF] shadow-xs`
                            : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        {s.state}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Priority Matrix (0 to 5) */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">
                      Priority Calculation
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        calculatedBand === "High"
                          ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]"
                          : calculatedBand === "Medium"
                          ? "bg-[#92EEFF] text-[#0F172A] border border-[#30AFFF]"
                          : "bg-[#D8FFC5] text-[#064E3B] border border-[#86EFAC]"
                      }`}
                    >
                      {calculatedBand} ({calculatedScore} / 5)
                    </span>
                  </div>

                  {/* Obstruction Score (0-3) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-[#475569]">
                      <span>Obstruction Level (0–3):</span>
                      <strong className="text-[#0F172A] font-extrabold">{obstructionScore}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      value={obstructionScore}
                      onChange={(e) => setObstructionScore(Number(e.target.value))}
                      className="accent-[#30AFFF] cursor-pointer h-2 bg-[#E2E8F0] rounded-lg"
                    />
                  </div>

                  {/* Disruption Score (0-2) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-[#475569]">
                      <span>Disruption / Hazard Impact (0–2):</span>
                      <strong className="text-[#0F172A] font-extrabold">{disruptionScore}</strong>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      value={disruptionScore}
                      onChange={(e) => setDisruptionScore(Number(e.target.value))}
                      className="accent-[#30AFFF] cursor-pointer h-2 bg-[#E2E8F0] rounded-lg"
                    />
                  </div>
                </div>

                {/* 4. Assign Crew */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">
                    Assign Cleanup Crew
                  </label>
                  <select
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  >
                    <option value="Facilities Operations Team 1">Facilities Operations Team 1</option>
                    <option value="Drainage Maintenance Squad">Drainage Maintenance Squad</option>
                    <option value="Student Eco-Volunteer Crew">Student Eco-Volunteer Crew</option>
                    <option value="Partner Recycler Logistics">Partner Recycler Logistics</option>
                  </select>
                </div>

                {/* 5. Target Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">
                    Target Completion Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  />
                </div>

                {/* 6. Review Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">
                    Review Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instructions for cleanup crew..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none resize-none"
                  />
                </div>

                {/* Feedback Banner */}
                {triageFeedback && (
                  <div
                    className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                      triageFeedback.success
                        ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                        : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                    }`}
                  >
                    {triageFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
                    )}
                    <span>{triageFeedback.message}</span>
                  </div>
                )}

                {/* Dispatch Button */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-13 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer min-h-[52px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching</span>
                    </>
                  ) : (
                    <span>Dispatch</span>
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
