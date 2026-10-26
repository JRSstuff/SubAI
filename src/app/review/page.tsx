"use client";

import React, { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  UserCheck,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  Clock,
  Filter,
  ArrowRight,
  X,
  Send,
  Building,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getReportsAction, triageReportAction } from "@/app/actions/operations";

export default function ReviewPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Submitted");
  const [isLoading, setIsLoading] = useState(true);

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
    const res = await getReportsAction();
    if (res.success && res.data) {
      setReports(res.data as any[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const openTriageModal = (report: any) => {
    setSelectedReport(report);
    setTriageFeedback(null);
    setReviewState(report.review_state === "Submitted" ? "Verified" : report.review_state);
    const task = report.cleanup_tasks?.[0] || report.cleanup_tasks;
    if (task) {
      setObstructionScore(task.obstruction_score ?? 1);
      setDisruptionScore(task.disruption_score ?? 1);
      if (task.assigned_to) setAssigneeName(task.assigned_to);
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
        }, 1000);
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
        {/* Minimal Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#30AFFF] text-white">
              Step 2 & 3: Triage & Dispatch
            </span>
            <span className="text-xs text-[#64748B] font-medium">Review Authority</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Verify drainage obstruction submissions, assign calculated priority scores (0–5), and dispatch collectors.
          </p>
        </div>

        {/* ─── SEGMENTED STATUS SWITCHER PILLS (Inspired by Image 1) ─── */}
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
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected ? "bg-white/25 text-white" : "bg-[#F1F5F9] text-[#64748B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── DOCUMENT CARDS LIST ─── */}
        <div className="flex flex-col gap-3">
          {filteredReports.length === 0 ? (
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

              return (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 bg-white border border-[#E2E8F0] hover:border-[#30AFFF] rounded-3xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Square Thumbnail */}
                    <div className="w-16 h-16 rounded-2xl bg-[#92EEFF]/30 border border-[#92EEFF] flex items-center justify-center shrink-0 overflow-hidden">
                      {r.photo_url ? (
                        <img
                          src={r.photo_url}
                          alt={r.location_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ClipboardCheck className="w-6 h-6 text-[#30AFFF]" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md">
                          {r.reference_no}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.review_state === "Verified"
                              ? "bg-[#C4F7CA] text-[#064E3B]"
                              : r.review_state === "Needs inspection"
                              ? "bg-[#92EEFF] text-[#0F172A]"
                              : "bg-[#D8FFC5] text-[#0F2E1B]"
                          }`}
                        >
                          {r.review_state}
                        </span>
                        {task && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isHigh
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : "bg-[#F1F5F9] text-[#475569]"
                            }`}
                          >
                            Score: {task.priority_score ?? calculatedScore} ({task.priority_band ?? "Med"})
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#0F172A] mt-1 truncate">
                        {r.location_name || "Campus Drainage Point"}
                      </h3>
                      <p className="text-xs text-[#64748B] line-clamp-1 mt-0.5">
                        {r.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    <div className="text-[11px] text-[#64748B]">
                      Reporter: <span className="font-semibold text-[#0F172A]">{r.reporter_name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openTriageModal(r)}
                      className="px-4 py-2 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
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

        {/* ─── TRIAGE MODAL ─── */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#30AFFF] uppercase tracking-wider">
                    Triage & Dispatch
                  </span>
                  <span className="text-sm font-extrabold text-[#0F172A] truncate">
                    {selectedReport.reference_no} &bull; {selectedReport.location_name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form action="javascript:void(0);" onSubmit={handleTriageSubmit} className="p-5 flex flex-col gap-4 overflow-y-auto">
                {/* Status Decision Buttons */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                    Verification State
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
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[40px] ${
                          reviewState === s.state
                            ? `${s.color} ring-2 ring-[#30AFFF] shadow-xs`
                            : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
                        }`}
                      >
                        {s.state}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority Matrix Calculator (0 to 5) */}
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A]">
                      Priority Band Calculation:
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                        calculatedBand === "High"
                          ? "bg-[#FEE2E2] text-[#DC2626]"
                          : calculatedBand === "Medium"
                          ? "bg-[#92EEFF] text-[#0F172A]"
                          : "bg-[#D8FFC5] text-[#064E3B]"
                      }`}
                    >
                      {calculatedBand} ({calculatedScore} / 5)
                    </span>
                  </div>

                  {/* Obstruction Score (0-3) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                      <span>Obstruction Level (0-3):</span>
                      <span className="font-bold text-[#0F172A]">{obstructionScore}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      value={obstructionScore}
                      onChange={(e) => setObstructionScore(Number(e.target.value))}
                      className="accent-[#30AFFF] cursor-pointer"
                    />
                  </div>

                  {/* Disruption Score (0-2) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                      <span>Disruption / Hazard Impact (0-2):</span>
                      <span className="font-bold text-[#0F172A]">{disruptionScore}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      value={disruptionScore}
                      onChange={(e) => setDisruptionScore(Number(e.target.value))}
                      className="accent-[#30AFFF] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Assignee Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569]">
                    Assign Cleanup Crew:
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

                {/* Target Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#475569]">
                    Target Completion Date:
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  />
                </div>

                {/* Feedback Banner */}
                {triageFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
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

                {/* Action Button: Dispatch */}
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching...</span>
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
