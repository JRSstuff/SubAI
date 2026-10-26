"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ListFilter,
  Layers,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  Building,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CampusMap, type MapReportPin } from "@/components/map/CampusMap";
import { getReportsAction } from "@/app/actions/operations";

export default function MapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filterState, setFilterState] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

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

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      (r.location_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reference_no || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === "All") return true;
    if (filterState === "Verified") return r.review_state === "Verified";
    if (filterState === "Submitted") return r.review_state === "Submitted";
    if (filterState === "High") {
      const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
      return task?.priority_band === "High" || r.review_state === "Needs inspection";
    }
    return true;
  });

  const mapPins: MapReportPin[] = filteredReports.map((r) => {
    const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
    return {
      id: r.id,
      reference_no: r.reference_no,
      location_name: r.location_name,
      latitude: Number(r.latitude) || 8.4858,
      longitude: Number(r.longitude) || 124.6565,
      review_state: r.review_state,
      priority_band: task?.priority_band || "Medium",
      description: r.description,
      photo_url: r.photo_url,
    };
  });

  // Calculate quick stats
  const totalCount = reports.length;
  const verifiedCount = reports.filter((r) => r.review_state === "Verified").length;
  const submittedCount = reports.filter((r) => r.review_state === "Submitted").length;
  const highPriorityCount = reports.filter((r) => {
    const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
    return task?.priority_band === "High";
  }).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-4">
        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              CDO Drainage Map
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Visualizing active drainage blockages across Cagayan de Oro City.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadReports}
              title="Refresh reports"
              className="p-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#30AFFF]" : ""}`} />
            </button>

            {/* Segmented Switcher Pill (Inspired by Image 1 "Today | All") */}
            <div className="bg-[#F1F5F9] p-1 rounded-2xl flex border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  viewMode === "map"
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  viewMode === "list"
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* ─── SUMMARY CARDS ROW (Inspired by Reference Image 2 Top Cards) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Points
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#0F172A]">{totalCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#92EEFF]/30 text-[#0F172A]">
                Campus Wide
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              High Priority
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#DC2626]">{highPriorityCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FEE2E2] text-[#991B1B]">
                Immediate
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Verified
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#059669]">{verifiedCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#C4F7CA] text-[#064E3B]">
                Triaged
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Submitted
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#0F172A]">{submittedCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D8FFC5] text-[#0F2E1B]">
                Pending Review
              </span>
            </div>
          </div>
        </div>

        {/* ─── SEARCH & FILTER PILLS (Inspired by Reference Image 2) ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Pill Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search points, reference numbers, or debris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#E2E8F0] rounded-2xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:border-[#30AFFF] focus:outline-none shadow-xs transition-all"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5 pointer-events-none" />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {["All", "High", "Verified", "Submitted"].map((st) => {
              const isSelected = filterState === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterState(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[38px] ${
                    isSelected
                      ? "bg-[#30AFFF] text-white shadow-xs"
                      : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── MAIN CONTENT: MAP OR LIST ─── */}
        {viewMode === "map" ? (
          <div className="w-full h-[480px] sm:h-[580px] rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-sm relative bg-[#F1F5F9]">
            <CampusMap
              pins={mapPins}
              className="h-full w-full rounded-3xl"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filteredReports.length === 0 ? (
              <div className="p-10 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-2">
                <MapPin className="w-8 h-8 text-[#94A3B8]" />
                <span className="text-sm font-bold text-[#475569]">
                  No obstruction reports match your filter.
                </span>
              </div>
            ) : (
              filteredReports.map((r) => {
                const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
                const isHigh = task?.priority_band === "High";
                const isVerified = r.review_state === "Verified";

                return (
                  /* Clean Document Card (Inspired by Reference Images 1 & 2) */
                  <div
                    key={r.id}
                    className="p-4 bg-white border border-[#E2E8F0] hover:border-[#30AFFF] rounded-2xl shadow-xs transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Left Square Thumbnail / Icon Badge */}
                      <div className="w-12 h-12 rounded-xl bg-[#92EEFF]/30 border border-[#92EEFF] flex items-center justify-center shrink-0 overflow-hidden">
                        {r.photo_url ? (
                          <img
                            src={r.photo_url}
                            alt={r.location_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MapPin className="w-5 h-5 text-[#30AFFF]" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-[#0F172A] truncate">
                          {r.location_name || "Campus Drainage Point"}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                          <span className="font-mono text-[10px] font-semibold bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                            {r.reference_no}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate max-w-[200px]">{r.description}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isVerified
                            ? "bg-[#C4F7CA] text-[#064E3B]"
                            : isHigh
                            ? "bg-[#FEE2E2] text-[#991B1B]"
                            : "bg-[#D8FFC5] text-[#0F2E1B]"
                        }`}
                      >
                        {r.review_state}
                      </span>

                      <Link
                        href="/review"
                        className="p-2 bg-[#F8FAFC] hover:bg-[#30AFFF] text-[#64748B] hover:text-white rounded-xl border border-[#E2E8F0] hover:border-[#30AFFF] transition-all"
                        title="Triage & Dispatch"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
