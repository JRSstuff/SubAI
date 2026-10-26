"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Scale,
  Recycle,
  Layers,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { getMassBalanceMetricsAction } from "@/app/actions/operations";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>({
    totalCollectedKg: 0,
    acceptedForRecyclingKg: 0,
    awaitingHandoverKg: 0,
    residualKg: 0,
    siltKg: 0,
    petBottlesKg: 0,
    flexiblePackagingKg: 0,
    verifiedReportsCount: 0,
    totalReportsCount: 0,
  });
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = async () => {
    setIsLoading(true);
    const res = await getMassBalanceMetricsAction();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const displayMetrics = isDemoMode
    ? {
        totalCollectedKg: 12.0,
        acceptedForRecyclingKg: 4.0,
        awaitingHandoverKg: 1.0,
        residualKg: 4.0,
        siltKg: 3.0,
        petBottlesKg: 5.0,
        flexiblePackagingKg: 0.0,
        verifiedReportsCount: 3,
        totalReportsCount: 5,
      }
    : metrics;

  const handleExportData = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            project: "TubigLoop CDO",
            campus: "USTP Cagayan de Oro",
            exportedAt: new Date().toISOString(),
            datasetType: isDemoMode ? "demo_worked_example" : "live_pilot",
            massBalanceMetrics: displayMetrics,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `tubigloop_audit_metrics_${isDemoMode ? "demo" : "pilot"}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-5">
        {/* Minimal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C4F7CA] text-[#064E3B] border border-[#86EFAC]">
                Step 6 & 7: Verified Circular Impact
              </span>
              <span className="text-xs text-[#64748B] font-medium">Chain-of-Custody</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Impact Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Reconciling mass balance physics and circular custody receipts across USTP campus drainage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Segmented Switcher Pill: Live vs Demo */}
            <div className="bg-[#F1F5F9] p-1 rounded-2xl flex border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setIsDemoMode(false)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  !isDemoMode
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Live Pilot
              </button>
              <button
                type="button"
                onClick={() => setIsDemoMode(true)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                  isDemoMode
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Grand Plan Demo
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="px-3.5 py-2 bg-white border border-[#CBD5E1] hover:border-[#30AFFF] text-[#0F172A] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-[#30AFFF]" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ─── 4 CORE METRIC CARDS (Using Exact 4 Palette Colors) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Primary Blue #30AFFF */}
          <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Total Collected
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#30AFFF] text-white flex items-center justify-center">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {Number(displayMetrics.totalCollectedKg || 0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[10px] font-semibold text-[#30AFFF]">
              Campus culvert extraction
            </span>
          </div>

          {/* 2. Loop Green #C4F7CA */}
          <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Accepted Recycled
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#C4F7CA] text-[#064E3B] flex items-center justify-center">
                <Recycle className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#064E3B]">
                {Number(displayMetrics.acceptedForRecyclingKg || 0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[10px] font-semibold text-[#059669]">
              Verified custody handovers
            </span>
          </div>

          {/* 3. Aqua Clear #92EEFF */}
          <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Awaiting Handover
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#92EEFF] text-[#0F172A] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {Number(displayMetrics.awaitingHandoverKg || 0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[10px] font-semibold text-[#0284C7]">
              Stored at campus station
            </span>
          </div>

          {/* 4. Eco Mint #D8FFC5 */}
          <div className="bg-white p-4 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                Residual & Silt
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#D8FFC5] text-[#0F2E1B] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {(Number(displayMetrics.residualKg || 0) + Number(displayMetrics.siltKg || 0)).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[10px] font-semibold text-[#10B981]">
              Safe campus disposal
            </span>
          </div>
        </div>

        {/* ─── MASS BALANCE EQUATION RECONCILIATION CARD ─── */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#30AFFF]" />
              <span>Mass Balance Conservation Verification</span>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D8FFC5] text-[#0F2E1B]">
              W_total = W_recycled + W_residual
            </span>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-xs text-[#64748B] font-semibold">Total Weighed Mass:</span>
              <p className="text-xl font-extrabold text-[#0F172A]">
                {Number(displayMetrics.totalCollectedKg || 0).toFixed(1)} kg
              </p>
            </div>
            <span className="text-xl font-bold text-[#64748B]">=</span>
            <div>
              <span className="text-xs text-[#059669] font-semibold">Accepted + Awaiting (Recyclable):</span>
              <p className="text-xl font-extrabold text-[#059669]">
                {(Number(displayMetrics.acceptedForRecyclingKg || 0) + Number(displayMetrics.awaitingHandoverKg || 0)).toFixed(1)} kg
              </p>
            </div>
            <span className="text-xl font-bold text-[#64748B]">+</span>
            <div>
              <span className="text-xs text-[#64748B] font-semibold">Residual & Silt Waste:</span>
              <p className="text-xl font-extrabold text-[#475569]">
                {(Number(displayMetrics.residualKg || 0) + Number(displayMetrics.siltKg || 0)).toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        {/* ─── DETAILED MATERIAL CATEGORY BREAKDOWN ─── */}
        <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
          <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-[#30AFFF]" />
            <span>Material Breakdown & Sourcing</span>
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-[#92EEFF]/20 border border-[#92EEFF] rounded-2xl flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#0F172A]">PET Bottles</span>
              <span className="text-lg font-extrabold text-[#30AFFF]">
                {Number(displayMetrics.petBottlesKg || 0).toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">Rigid beverage containers</span>
            </div>

            <div className="p-3 bg-[#92EEFF]/20 border border-[#92EEFF] rounded-2xl flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#0F172A]">Flexible Film</span>
              <span className="text-lg font-extrabold text-[#30AFFF]">
                {Number(displayMetrics.flexiblePackagingKg || 0).toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">Bags & wrappers</span>
            </div>

            <div className="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#475569]">Residual Waste</span>
              <span className="text-lg font-extrabold text-[#0F172A]">
                {Number(displayMetrics.residualKg || 0).toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">Non-recyclable debris</span>
            </div>

            <div className="p-3 bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#475569]">Silt & Mud</span>
              <span className="text-lg font-extrabold text-[#0F172A]">
                {Number(displayMetrics.siltKg || 0).toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">Dredged culvert sediment</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
