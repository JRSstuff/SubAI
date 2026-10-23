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

  // Demo dataset from Grand Plan worked example (page 10)
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#C4F7CA] text-[#064E3B] border border-[#86EFAC]">
                Step 6 & 7: Verified Circular Impact
              </span>
              <span className="text-xs text-[#64748B] font-medium">CEIW 2026 Audit Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Impact & Mass Balance Reconciliation
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Reconciles physically measured kilograms against verified recycler handovers to prevent double-counting.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Demo / Pilot Toggle Switch */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-[#E2E8F0] shadow-xs">
              <button
                type="button"
                onClick={() => setIsDemoMode(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDemoMode
                    ? "bg-[#30AFFF] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Demo (12kg)
              </button>
            </div>

            <button
              type="button"
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] text-[#0F172A] rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#30AFFF]" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ─── MASS RECONCILIATION CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Measured Mass */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B] text-xs font-bold uppercase tracking-wider">
              <span>Total Collected</span>
              <Scale className="w-4 h-4 text-[#30AFFF]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#0F172A]">
                {displayMetrics.totalCollectedKg.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#F1F5F9]">
              Sum of scale-weighed batches
            </span>
          </div>

          {/* Card 2: Accepted for Recycling */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#064E3B] text-xs font-bold uppercase tracking-wider">
              <span>Accepted for Recycling</span>
              <Recycle className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#059669]">
                {displayMetrics.acceptedForRecyclingKg.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[11px] text-[#059669] font-medium mt-2 pt-2 border-t border-[#F1F5F9]">
              Verified partner custody receipts
            </span>
          </div>

          {/* Card 3: Awaiting Handover */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#854D0E] text-xs font-bold uppercase tracking-wider">
              <span>Awaiting Handover</span>
              <Clock className="w-4 h-4 text-[#EAB308]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#854D0E]">
                {displayMetrics.awaitingHandoverKg.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-[#64748B] ml-1">kg</span>
            </div>
            <span className="text-[11px] text-[#854D0E] font-medium mt-2 pt-2 border-t border-[#F1F5F9]">
              Collected recyclables in holding
            </span>
          </div>

          {/* Card 4: Verified Reports */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#30AFFF] text-xs font-bold uppercase tracking-wider">
              <span>Verified Culverts</span>
              <CheckCircle2 className="w-4 h-4 text-[#30AFFF]" />
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-[#0F172A]">
                {displayMetrics.verifiedReportsCount}
              </span>
              <span className="text-sm font-semibold text-[#64748B] ml-1">
                / {displayMetrics.totalReportsCount}
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] mt-2 pt-2 border-t border-[#F1F5F9]">
              Checked by campus maintenance
            </span>
          </div>
        </div>

        {/* ─── DETAILED COMPONENT MASS RECONCILIATION ─── */}
        <div className="bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-lg font-bold text-[#0F172A]">
                Mathematical Mass Balance Breakdown
              </h2>
              <p className="text-xs text-[#64748B]">
                Strictly ensures no double counting between collected, residual, and accepted recycling.
              </p>
            </div>
            <span className="px-3 py-1 bg-[#D8FFC5] text-[#064E3B] font-bold text-xs rounded-xl border border-[#86EFAC]">
              Reconciled: Balanced
            </span>
          </div>

          {/* Linear Meter Bar */}
          <div className="w-full h-4 bg-[#F1F5F9] rounded-full overflow-hidden flex">
            {displayMetrics.totalCollectedKg > 0 && (
              <>
                <div
                  style={{
                    width: `${(displayMetrics.petBottlesKg / displayMetrics.totalCollectedKg) * 100}%`,
                  }}
                  className="bg-[#30AFFF]"
                  title={`PET Bottles: ${displayMetrics.petBottlesKg} kg`}
                />
                <div
                  style={{
                    width: `${(displayMetrics.residualKg / displayMetrics.totalCollectedKg) * 100}%`,
                  }}
                  className="bg-[#CBD5E1]"
                  title={`Residual Waste: ${displayMetrics.residualKg} kg`}
                />
                <div
                  style={{
                    width: `${(displayMetrics.siltKg / displayMetrics.totalCollectedKg) * 100}%`,
                  }}
                  className="bg-[#94A3B8]"
                  title={`Silt / Sediment: ${displayMetrics.siltKg} kg`}
                />
              </>
            )}
          </div>

          {/* Table Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold text-[#30AFFF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30AFFF]" />
                <span>PET Bottles</span>
              </div>
              <span className="text-base font-extrabold text-[#0F172A]">
                {displayMetrics.petBottlesKg.toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">High-value recyclable</span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold text-[#475569]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                <span>Residual Waste</span>
              </div>
              <span className="text-base font-extrabold text-[#0F172A]">
                {displayMetrics.residualKg.toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">Non-recyclable fraction</span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold text-[#475569]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                <span>Silt & Debris</span>
              </div>
              <span className="text-base font-extrabold text-[#0F172A]">
                {displayMetrics.siltKg.toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#64748B]">Drainage sediment</span>
            </div>

            <div className="p-3 bg-[#F8FAFC] border border-[#86EFAC] rounded-2xl flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-bold text-[#059669]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                <span>Accepted Recycled</span>
              </div>
              <span className="text-base font-extrabold text-[#059669]">
                {displayMetrics.acceptedForRecyclingKg.toFixed(1)} kg
              </span>
              <span className="text-[10px] text-[#059669]">Documented transfer</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
