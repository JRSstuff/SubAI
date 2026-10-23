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
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CampusMap, type MapReportPin } from "@/components/map/CampusMap";
import { getReportsAction } from "@/app/actions/operations";

export default function MapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filterState, setFilterState] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">
        {/* Header with Title and Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Campus Drainage Map
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Visualizing active drainage blockages across USTP CDO campus grounds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadReports}
              title="Refresh reports"
              className="p-2.5 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#30AFFF]" : ""}`} />
            </button>

            {/* View Mode Toggle */}
            <div className="bg-white border border-[#E2E8F0] p-1 rounded-xl flex shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "map"
                    ? "bg-[#30AFFF] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "list"
                    ? "bg-[#30AFFF] text-white"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[#64748B] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          {["All", "Submitted", "Verified", "High"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterState(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                filterState === st
                  ? "bg-[#92EEFF] text-[#0F172A] border-[#30AFFF]"
                  : "bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
              }`}
            >
              {st === "High" ? "High Priority Obstructions" : st}
            </button>
          ))}
          <span className="text-xs text-[#64748B] ml-auto font-medium">
            Showing {filteredReports.length} locations
          </span>
        </div>

        {/* ─── MAP VIEW ─── */}
        {viewMode === "map" && (
          <div className="flex flex-col gap-4">
            <CampusMap pins={mapPins} className="h-[520px] w-full rounded-3xl" />
            
            {/* Map Legend */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                  <span className="font-semibold text-[#0F172A]">High Obstruction</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#30AFFF]"></span>
                  <span className="font-semibold text-[#0F172A]">Medium / Under Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                  <span className="font-semibold text-[#0F172A]">Verified / Cleaned</span>
                </div>
              </div>
              <span className="text-[11px] text-[#64748B]">
                Click pins to view obstruction photo and reference details
              </span>
            </div>
          </div>
        )}

        {/* ─── LIST VIEW ─── */}
        {viewMode === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-3xl border border-[#E2E8F0] flex flex-col items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
                <span className="text-base font-bold text-[#0F172A]">No drainage reports found</span>
                <span className="text-xs text-[#64748B]">All campus culverts are currently unobstructed.</span>
                <Link
                  href="/report"
                  className="mt-2 px-4 py-2 bg-[#30AFFF] text-white text-xs font-bold rounded-xl"
                >
                  Report
                </Link>
              </div>
            ) : (
              filteredReports.map((r) => {
                const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
                return (
                  <div
                    key={r.id}
                    className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#64748B]">
                          {r.reference_no}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            r.review_state === "Verified"
                              ? "bg-[#D8FFC5] text-[#064E3B] border border-[#86EFAC]"
                              : r.review_state === "Needs inspection"
                              ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                              : "bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                          }`}
                        >
                          {r.review_state}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#0F172A] leading-snug">
                        {r.location_name}
                      </h3>
                      <p className="text-xs text-[#475569] line-clamp-2">
                        {r.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9] text-xs">
                      <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <Link
                        href="/review"
                        className="flex items-center gap-1 text-xs font-bold text-[#30AFFF] hover:underline"
                      >
                        <span>Triage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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
