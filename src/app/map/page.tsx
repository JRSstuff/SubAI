"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  MapPin,
  RefreshCw,
  Search,
  X,
  Eye,
  Filter,
  Layers,
  ListFilter,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CampusMap, type MapReportPin } from "@/components/map/CampusMap";
import { getReportsAction } from "@/app/actions/operations";

export default function MapPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filterState, setFilterState] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"explorer" | "fullmap" | "list">("explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPin, setSelectedPin] = useState<MapReportPin | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

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

  const mapPins: MapReportPin[] = useMemo(() => {
    return filteredReports.map((r) => {
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
  }, [filteredReports]);

  // Metric counters
  const totalCount = reports.length;
  const verifiedCount = reports.filter((r) => r.review_state === "Verified").length;
  const submittedCount = reports.filter((r) => r.review_state === "Submitted").length;
  const highPriorityCount = reports.filter((r) => {
    const task = r.cleanup_tasks?.[0] || r.cleanup_tasks;
    return task?.priority_band === "High";
  }).length;

  // Render the floating selected details card on the map
  const renderSelectedPinOverlay = () => {
    if (!selectedPin) return null;
    const isHigh = selectedPin.priority_band === "High";
    const isMedium = selectedPin.priority_band === "Medium";

    return (
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-30 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-[#CBD5E1] shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] font-bold bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                #{selectedPin.reference_no}
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
                {selectedPin.priority_band || "Medium"} Priority
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#C4F7CA] text-[#064E3B] border border-[#86EFAC]">
                {selectedPin.review_state}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-[#0F172A] mt-1 truncate">
              {selectedPin.location_name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setSelectedPin(null)}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl border border-[#CBD5E1] cursor-pointer shrink-0"
            title="Dismiss Details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content: Photo + Full Description */}
        <div className="flex items-start gap-3">
          {selectedPin.photo_url ? (
            <div
              onClick={() =>
                setPreviewPhoto({
                  url: selectedPin.photo_url!,
                  title: selectedPin.location_name,
                })
              }
              className="w-20 h-20 rounded-2xl overflow-hidden border border-[#CBD5E1] shrink-0 bg-[#0F172A] cursor-pointer relative group"
              title="Click to zoom photo"
            >
              <img
                src={selectedPin.photo_url}
                alt={selectedPin.location_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center shrink-0">
              <MapPin className="w-8 h-8 text-[#94A3B8]" />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <span className="text-[10px] font-extrabold text-[#475569] uppercase tracking-wider">
              Drainage Obstruction Details:
            </span>
            <div className="text-xs font-semibold text-[#0F172A] leading-relaxed bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] mt-1 max-h-24 overflow-y-auto">
              {selectedPin.description || "No description provided."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#F1F5F9]">
          <span className="font-mono text-[10px]">
            📍 {selectedPin.latitude.toFixed(5)}, {selectedPin.longitude.toFixed(5)}
          </span>
          {selectedPin.photo_url && (
            <button
              type="button"
              onClick={() =>
                setPreviewPhoto({
                  url: selectedPin.photo_url!,
                  title: selectedPin.location_name,
                })
              }
              className="text-[#30AFFF] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Photo</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-transparent pb-28 md:pb-12 text-[#0F172A] flex flex-col font-sans">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-4">
        {/* Header with Title and View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              CDO Drainage Map
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Visualizing active drainage blockages and culvert conditions across Cagayan de Oro City.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadReports}
              disabled={isLoading}
              title="Refresh reports"
              className="p-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-[#475569] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 text-[#30AFFF] ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* View Mode Switcher */}
            <div className="bg-[#F1F5F9] p-1 rounded-2xl flex border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setViewMode("explorer")}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                  viewMode === "explorer"
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Explorer</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("fullmap")}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                  viewMode === "fullmap"
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map Only</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 4 SUMMARY STAT CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Points
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#0F172A]">{totalCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#92EEFF]/30 text-[#0F172A]">
                City Wide
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
                Confirmed
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Intake Queue
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#0F172A]">{submittedCount}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D8FFC5] text-[#0F2E1B]">
                Pending
              </span>
            </div>
          </div>
        </div>

        {/* ─── SEARCH & FILTER TOOLBAR ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by street name, landmark, or ref #..."
              className="w-full h-10 pl-9 pr-8 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all"
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

          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[11px] font-bold text-[#64748B] mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-[#30AFFF]" />
              <span>Status:</span>
            </span>
            {["All", "Verified", "Submitted", "High"].map((st) => {
              const isSelected = filterState === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterState(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[36px] ${
                    isSelected
                      ? "bg-[#30AFFF] text-white shadow-xs"
                      : "bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── MAIN CONTENT: EXPLORER, FULL MAP, OR LIST ─── */}
        {viewMode === "explorer" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Interactive Map (7 cols on lg, 8 cols on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 h-[380px] sm:h-[480px] lg:h-[620px] rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-sm relative bg-[#F1F5F9]">
              <CampusMap
                pins={mapPins}
                focusedPinId={selectedPin?.id || null}
                onPinSelect={(pin) => setSelectedPin(pin)}
                className="h-full w-full rounded-3xl"
              />

              {/* Selected Pin Details Overlay Card */}
              {renderSelectedPinOverlay()}
            </div>

            {/* Side Feed: Streets & Blockages Currently in View */}
            <div className="lg:col-span-5 xl:col-span-4 h-auto lg:h-[620px] bg-white rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between shrink-0">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#30AFFF]" />
                    <h2 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                      Streets & Blockages
                    </h2>
                  </div>
                  <span className="text-[10px] text-[#64748B]">
                    Showing {mapPins.length} culvert location{mapPins.length === 1 ? "" : "s"}
                  </span>
                </div>

                {selectedPin && (
                  <button
                    type="button"
                    onClick={() => setSelectedPin(null)}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-bold border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-white transition-all cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Scrollable Street Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#F1F5F9] max-h-[500px] lg:max-h-none">
                {mapPins.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center gap-2 text-[#94A3B8]">
                    <MapPin className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-bold text-[#64748B]">No points match your search</span>
                    <span className="text-[10px] text-[#94A3B8]">Try clearing your search or status filter</span>
                  </div>
                ) : (
                  mapPins.map((pin) => {
                    const isSelected = selectedPin?.id === pin.id;
                    const isHigh = pin.priority_band === "High";

                    return (
                      <div
                        key={pin.id}
                        onClick={() => setSelectedPin((prev) => (prev?.id === pin.id ? null : pin))}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                          isSelected
                            ? "bg-[#92EEFF]/15 border-[#30AFFF] shadow-xs ring-2 ring-[#30AFFF]/20"
                            : "bg-white border-[#E2E8F0] hover:border-[#30AFFF]/60 hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {/* Photo Thumbnail */}
                        <div
                          onClick={(e) => {
                            if (pin.photo_url) {
                              e.stopPropagation();
                              setPreviewPhoto({ url: pin.photo_url, title: pin.location_name });
                            }
                          }}
                          title={pin.photo_url ? "Click to view photo" : undefined}
                          className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#CBD5E1] bg-[#F1F5F9] flex items-center justify-center relative group"
                        >
                          {pin.photo_url ? (
                            <>
                              <img
                                src={pin.photo_url}
                                alt={pin.location_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                            </>
                          ) : (
                            <MapPin className="w-6 h-6 text-[#94A3B8]" />
                          )}
                        </div>

                        {/* Street & Description Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold">
                              <span className="font-mono text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                                #{pin.reference_no}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full ${
                                  pin.review_state === "Verified"
                                    ? "bg-[#C4F7CA] text-[#064E3B]"
                                    : isHigh
                                    ? "bg-[#FEE2E2] text-[#991B1B]"
                                    : "bg-[#D8FFC5] text-[#0F2E1B]"
                                }`}
                              >
                                {pin.review_state}
                              </span>
                            </div>

                            {/* Street / Location Name */}
                            <h3
                              className="text-xs font-extrabold text-[#0F172A] truncate mt-1"
                              title={pin.location_name}
                            >
                              {pin.location_name}
                            </h3>

                            {/* Prominent Full Description */}
                            <p className="text-[11px] text-[#334155] font-semibold mt-1 leading-snug bg-[#F8FAFC] p-1.5 rounded-lg border border-[#E2E8F0]">
                              {pin.description || "No description provided."}
                            </p>
                          </div>

                          {/* Coordinates / Pin Trigger */}
                          <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-1.5 pt-1.5 border-t border-[#F1F5F9]">
                            <span className="font-mono truncate">
                              📍 {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                            </span>
                            <span className="text-[#30AFFF] font-extrabold shrink-0">
                              View on Map &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : viewMode === "fullmap" ? (
          <div className="w-full h-[520px] sm:h-[640px] rounded-3xl overflow-hidden border border-[#E2E8F0] shadow-sm relative bg-[#F1F5F9]">
            <CampusMap
              pins={mapPins}
              focusedPinId={selectedPin?.id || null}
              onPinSelect={(pin) => setSelectedPin(pin)}
              className="h-full w-full rounded-3xl"
            />
            {/* Selected Pin Details Overlay Card in fullmap mode */}
            {renderSelectedPinOverlay()}
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

                return (
                  <div
                    key={r.id}
                    className="p-4 bg-white border border-[#E2E8F0] hover:border-[#30AFFF] rounded-2xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Photo Thumbnail */}
                      <div
                        onClick={() => r.photo_url && setPreviewPhoto({ url: r.photo_url, title: r.location_name })}
                        title={r.photo_url ? "Click to view photo" : undefined}
                        className={`w-14 h-14 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center shrink-0 overflow-hidden ${
                          r.photo_url ? "cursor-pointer hover:opacity-85 transition-opacity" : ""
                        }`}
                      >
                        {r.photo_url ? (
                          <img
                            src={r.photo_url}
                            alt={r.location_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <MapPin className="w-6 h-6 text-[#94A3B8]" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <span className="font-mono text-[10px] font-bold bg-[#F1F5F9] px-1.5 py-0.5 rounded border border-[#E2E8F0]">
                            #{r.reference_no}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              isHigh ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#92EEFF]/30 text-[#0F172A]"
                            }`}
                          >
                            {task?.priority_band || "Standard"} Priority
                          </span>
                          <span className="text-[10px] font-bold text-[#059669]">
                            {r.review_state}
                          </span>
                        </div>

                        <span className="text-sm font-extrabold text-[#0F172A] mt-1 truncate">
                          {r.location_name || "Drainage Point"}
                        </span>

                        {/* Full Description in List view */}
                        <p className="text-xs text-[#334155] font-semibold mt-1 bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
                          {r.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                      {r.photo_url && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhoto({ url: r.photo_url, title: r.location_name })}
                          className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#92EEFF]/30 text-[#0F172A] rounded-xl border border-[#CBD5E1] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          title="View Photo Evidence"
                        >
                          <Eye className="w-4 h-4 text-[#30AFFF]" />
                          <span>View Photo</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ─── FULL PHOTO LIGHTBOX MODAL ─── */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-4 flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-sm font-bold text-[#0F172A] truncate">
                {previewPhoto.title || "Drainage Photo Evidence"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
