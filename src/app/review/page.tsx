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
        }, 1200);
      }
    });
  };

  const filteredReports = reports.filter((r) => {
    if (activeTab === "All") return true;
    return r.review_state === activeTab;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#30AFFF] text-white">
              Step 2 & 3: Review & Dispatch
            </span>
            <span className="text-xs text-[#64748B] font-medium">Campus Maintenance Reviewer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Triage & Assignment Queue
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Verify drainage submissions, calculate transparent 0–5 priority scores, and assign authorized collectors.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E2E8F0]">
          {["Submitted", "Needs inspection", "Verified", "Duplicate", "All"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#30AFFF] text-white shadow-xs"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              }`}
            >
              {tab} ({reports.filter((r) => (tab === "All" ? true : r.review_state === tab)).length})
            </button>
          ))}
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="w-full p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#30AFFF]" />
            <span className="text-xs font-semibold text-[#64748B]">Loading queue...</span>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-[#E2E8F0] flex flex-col items-center gap-2">
            <ClipboardCheck className="w-8 h-8 text-[#10B981]" />
            <span className="font-bold text-base text-[#0F172A]">No reports in this category</span>
            <span className="text-xs text-[#64748B]">All submitted reports have been addressed.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0]">
                    {report.photo_url ? (
                      <img
                        src={report.photo_url}
                        alt="Obstruction preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#64748B]">
                        No photo attached
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-white/95 backdrop-blur-xs font-mono font-bold text-[11px] rounded-lg text-[#0F172A] shadow-xs">
                      {report.reference_no}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#30AFFF] uppercase tracking-wider">
                      {report.location_name}
                    </span>
                    <p className="text-xs text-[#475569] line-clamp-2">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                  <span className="text-[11px] text-[#64748B]">
                    By {report.reporter_name || "Campus User"}
                  </span>
                  <button
                    type="button"
                    onClick={() => openTriageModal(report)}
                    className="px-3 py-1.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    Triage & Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── TRIAGE MODAL ─── */}
        {selectedReport && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#64748B]">
                    {selectedReport.reference_no}
                  </span>
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    Triage Drainage Report
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1 rounded-xl text-[#64748B] hover:text-[#0F172A]"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleTriageSubmit} className="flex flex-col gap-4">
                {/* Decision Select */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#475569] uppercase">
                    Verification Decision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: "Verified", label: "Verify & Dispatch", color: "bg-[#D8FFC5] border-[#86EFAC] text-[#064E3B]" },
                      { val: "Needs inspection", label: "Needs Inspection", color: "bg-[#FEF08A] border-[#FDE047] text-[#854D0E]" },
                      { val: "Duplicate", label: "Mark Duplicate", color: "bg-[#F1F5F9] border-[#CBD5E1] text-[#475569]" },
                      { val: "Rejected", label: "Reject Report", color: "bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]" },
                    ].map((dec) => (
                      <button
                        key={dec.val}
                        type="button"
                        onClick={() => setReviewState(dec.val as any)}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          reviewState === dec.val
                            ? dec.color + " shadow-xs ring-2 ring-[#30AFFF]"
                            : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
                        }`}
                      >
                        {dec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparent Priority Score Calculator (0-5) */}
                {reviewState === "Verified" && (
                  <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">
                        Transparent Priority Calculation
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          calculatedBand === "High"
                            ? "bg-[#EF4444] text-white"
                            : calculatedBand === "Medium"
                            ? "bg-[#30AFFF] text-white"
                            : "bg-[#10B981] text-white"
                        }`}
                      >
                        Score: {calculatedScore}/5 ({calculatedBand})
                      </span>
                    </div>

                    {/* Obstruction Input (0 to 2) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#475569] font-medium">
                        Observed Obstruction (0 to 2 pts):
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { score: 0, label: "0: Little/None" },
                          { score: 1, label: "1: Partial" },
                          { score: 2, label: "2: Substantial" },
                        ].map((o) => (
                          <button
                            key={o.score}
                            type="button"
                            onClick={() => setObstructionScore(o.score)}
                            className={`py-1.5 rounded-lg text-xs font-bold border ${
                              obstructionScore === o.score
                                ? "bg-[#30AFFF] text-white border-[#127dc7]"
                                : "bg-white text-[#64748B] border-[#E2E8F0]"
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Disruption Input (0 to 2) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-[#475569] font-medium">
                        Disruption to Campus Use (0 to 2 pts):
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { score: 0, label: "0: None" },
                          { score: 1, label: "1: Walkway" },
                          { score: 2, label: "2: Main Route" },
                        ].map((d) => (
                          <button
                            key={d.score}
                            type="button"
                            onClick={() => setDisruptionScore(d.score)}
                            className={`py-1.5 rounded-lg text-xs font-bold border ${
                              disruptionScore === d.score
                                ? "bg-[#30AFFF] text-white border-[#127dc7]"
                                : "bg-white text-[#64748B] border-[#E2E8F0]"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Assignee & Target Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="text-[11px] text-[#475569] font-medium">
                          Assign Authorized Personnel:
                        </label>
                        <input
                          type="text"
                          value={assigneeName}
                          onChange={(e) => setAssigneeName(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#475569] font-medium">
                          Target Resolution Date:
                        </label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full h-9 px-3 bg-white border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#475569]">
                    Reviewer Notes / Instructions:
                  </label>
                  <input
                    type="text"
                    placeholder="Clear silt and recover PET containers for partner handover."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full h-11 px-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A]"
                  />
                </div>

                {triageFeedback && (
                  <div
                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                      triageFeedback.success
                        ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                        : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                    }`}
                  >
                    {triageFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                    )}
                    <span>{triageFeedback.message}</span>
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
                      <span>Saving Decision...</span>
                    </>
                  ) : (
                    <span>Commit Triage & Dispatch Task</span>
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
