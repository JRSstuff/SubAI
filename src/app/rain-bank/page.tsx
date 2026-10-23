"use client";

import React, { useState } from "react";
import {
  CloudRain,
  Building2,
  Droplets,
  Gauge,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface RoofPreset {
  name: string;
  area: number;
  description: string;
}

interface RainPreset {
  name: string;
  rainfall: number;
  description: string;
}

const ROOF_PRESETS: RoofPreset[] = [
  { name: "Science Complex", area: 350, description: "Compact laboratory roof" },
  { name: "Engineering Bldg 1", area: 750, description: "Multi-wing classroom facility" },
  { name: "University Gymnasium", area: 1800, description: "Large-span arch roof structure" },
  { name: "Admin Pavilion", area: 450, description: "Central administrative building" },
];

const RAIN_PRESETS: RainPreset[] = [
  { name: "Brief Shower", rainfall: 5, description: "Light afternoon rain" },
  { name: "Moderate Rain", rainfall: 20, description: "Typical tropical downpour (1 hr)" },
  { name: "Heavy Storm", rainfall: 45, description: "Sustained monsoon rain (4 hrs)" },
  { name: "Typhoon Event", rainfall: 85, description: "PAGASA Orange warning level" },
];

const SURFACE_TYPES = [
  { label: "Corrugated Metal / G.I. Sheet", efficiency: 0.85, note: "Smooth runoff, low absorption" },
  { label: "Reinforced Concrete Roof Deck", efficiency: 0.75, note: "Slight ponding and evaporative loss" },
  { label: "Clay Tile / Terracotta", efficiency: 0.80, note: "Moderate porous absorption" },
  { label: "Green Roof / Vegetation", efficiency: 0.50, note: "High moisture retention and transpiration" },
];

export default function RainBankPage() {
  // Calculator state
  const [roofArea, setRoofArea] = useState<number>(750);
  const [rainfallMm, setRainfallMm] = useState<number>(25);
  const [efficiency, setEfficiency] = useState<number>(0.85);
  const [tankCapacity, setTankCapacity] = useState<number>(15000);
  const [currentVolume, setCurrentVolume] = useState<number>(3500);
  const [dailyDemand, setDailyDemand] = useState<number>(1200);

  // Mathematical Calculations:
  // Formula: Yield (L) = Area (m²) * Rainfall (mm) * Efficiency
  // Note: 1 m² * 1 mm = 1 Liter of water
  const theoreticalYield = Math.round(roofArea * rainfallMm * efficiency);
  const availableTankSpace = Math.max(0, tankCapacity - currentVolume);
  const capturedVolume = Math.min(theoreticalYield, availableTankSpace);
  const overflowVolume = Math.max(0, theoreticalYield - availableTankSpace);
  const postStormTotal = currentVolume + capturedVolume;
  const fullnessPercent = Math.min(100, Math.round((postStormTotal / tankCapacity) * 100));
  const preFullnessPercent = Math.min(100, Math.round((currentVolume / tankCapacity) * 100));
  const addedFullnessPercent = Math.min(100 - preFullnessPercent, Math.round((capturedVolume / tankCapacity) * 100));

  // Days of campus supply provided
  const daysOfReserve = dailyDemand > 0 ? (postStormTotal / dailyDemand).toFixed(1) : "0";
  // Estimated municipal water cost avoided (₱35 per m³ / 1,000L = ₱0.035 per L)
  const costAvoidancePhp = (capturedVolume * 0.035).toFixed(2);

  const handleReset = () => {
    setRoofArea(750);
    setRainfallMm(25);
    setEfficiency(0.85);
    setTankCapacity(15000);
    setCurrentVolume(3500);
    setDailyDemand(1200);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header with Title and Mode Disclaimer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#92EEFF] text-[#0F172A] text-xs font-black rounded-md tracking-wider uppercase">
                Campus Hydrology
              </span>
              <span className="px-2.5 py-0.5 bg-[#D8FFC5] text-[#0F172A] text-xs font-black rounded-md tracking-wider uppercase border border-[#C4F7CA]">
                Planning Tool
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight">
              Rain Bank Capacity Calculator
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Simulate rainwater retention yield, campus reservoir buffer, and non-potable substitution.
            </p>
          </div>

          <button
            onClick={handleReset}
            className="self-start md:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-[#CBD5E1] rounded-xl hover:bg-[#F1F5F9] transition-all text-[#475569] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* ─── MANDATORY GRAND PLAN DISCLAIMER ─── */}
        <div className="p-4 mb-6 bg-white border-2 border-[#30AFFF] rounded-2xl shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#92EEFF] rounded-xl text-[#0F172A] shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-[#0F172A]" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2 font-black text-sm text-[#0F172A]">
                <span>ESTIMATED ENGINEERING MODEL ONLY</span>
                <span className="text-[10px] bg-[#E2E8F0] px-2 py-0.5 rounded font-bold uppercase text-[#475569]">
                  Grand Plan Rule §5
                </span>
              </div>
              <p className="text-[#475569] mt-1 leading-relaxed">
                This simulator uses hydrological runoff formulas (
                <code className="px-1.5 py-0.5 bg-[#F1F5F9] rounded font-mono font-bold text-[#0F172A]">
                  V = Area × Rainfall × Efficiency
                </code>
                ) for campus facilities infrastructure planning. Because these are simulated engineering projections,
                they are <strong>strictly excluded</strong> from TubigLoop’s verified circular mass balance totals to prevent false impact accounting.
              </p>
            </div>
          </div>
        </div>

        {/* ─── MAIN 2-COLUMN GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Parameter Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Catchment Roof Area */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#30AFFF]" />
                  Catchment Roof Area (m²)
                </label>
                <span className="text-base font-black px-3 py-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] text-[#0F172A]">
                  {roofArea.toLocaleString()} m²
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="3000"
                step="25"
                value={roofArea}
                onChange={(e) => setRoofArea(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#30AFFF]"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {ROOF_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setRoofArea(preset.area)}
                    className={`p-2 text-left rounded-xl border text-xs transition-all ${
                      roofArea === preset.area
                        ? "bg-[#92EEFF]/30 border-[#30AFFF] font-bold text-[#0F172A]"
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white"
                    }`}
                  >
                    <div className="truncate font-bold">{preset.name}</div>
                    <div className="text-[10px] text-[#64748B]">{preset.area} m²</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Rainfall Event */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-[#30AFFF]" />
                  Rainfall Event Depth (mm)
                </label>
                <span className="text-base font-black px-3 py-1 bg-[#F1F5F9] rounded-lg border border-[#E2E8F0] text-[#0F172A]">
                  {rainfallMm} mm
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="120"
                step="1"
                value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#30AFFF]"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {RAIN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setRainfallMm(preset.rainfall)}
                    className={`p-2 text-left rounded-xl border text-xs transition-all ${
                      rainfallMm === preset.rainfall
                        ? "bg-[#92EEFF]/30 border-[#30AFFF] font-bold text-[#0F172A]"
                        : "bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:bg-white"
                    }`}
                  >
                    <div className="truncate font-bold">{preset.name}</div>
                    <div className="text-[10px] text-[#64748B]">{preset.rainfall} mm</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Roof Surface Material & Efficiency */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-2xl shadow-sm space-y-3">
              <label className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#30AFFF]" />
                Roof Catchment Surface & Efficiency Factor (e)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SURFACE_TYPES.map((surface) => (
                  <button
                    key={surface.label}
                    type="button"
                    onClick={() => setEfficiency(surface.efficiency)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      efficiency === surface.efficiency
                        ? "bg-[#D8FFC5]/50 border-[#C4F7CA] font-bold shadow-sm"
                        : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A]">{surface.label}</span>
                      <span className="text-xs font-mono font-black text-[#0F172A] px-1.5 py-0.5 bg-white rounded border border-[#CBD5E1]">
                        {surface.efficiency}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">{surface.note}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Tank Parameters */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#30AFFF]" />
                Storage Tank & Usage Parameters
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Tank Capacity</span>
                    <span className="font-mono text-[#0F172A]">{tankCapacity.toLocaleString()} L</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="50000"
                    step="1000"
                    value={tankCapacity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTankCapacity(val);
                      if (currentVolume > val) setCurrentVolume(val);
                    }}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#30AFFF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Pre-Storm Level</span>
                    <span className="font-mono text-[#0F172A]">{currentVolume.toLocaleString()} L</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={tankCapacity}
                    step="500"
                    value={currentVolume}
                    onChange={(e) => setCurrentVolume(Number(e.target.value))}
                    className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#30AFFF]"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Daily Campus Non-Potable Demand (Washrooms & Grounds)</span>
                  <span className="font-mono text-[#0F172A]">{dailyDemand.toLocaleString()} L / day</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="5000"
                  step="100"
                  value={dailyDemand}
                  onChange={(e) => setDailyDemand(Number(e.target.value))}
                  className="w-full h-2 bg-[#E2E8F0] rounded-lg appearance-none cursor-pointer accent-[#30AFFF]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Simulation Output & Tank Visual (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Tank Gauge Card */}
            <div className="p-6 bg-white border border-[#CBD5E1] rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#0F172A]">
                  Simulated Tank Status
                </h3>
                <span className="text-xs font-black px-2.5 py-1 bg-[#D8FFC5] border border-[#C4F7CA] text-[#0F172A] rounded-lg">
                  {fullnessPercent}% Full
                </span>
              </div>

              {/* Progress Stack Bar */}
              <div className="space-y-2">
                <div className="h-9 w-full bg-[#E2E8F0] rounded-xl overflow-hidden flex p-1 gap-1 border border-[#CBD5E1]">
                  {/* Pre-storm water */}
                  {preFullnessPercent > 0 && (
                    <div
                      style={{ width: `${preFullnessPercent}%` }}
                      className="h-full bg-[#30AFFF] rounded-lg flex items-center justify-center text-[10px] font-black text-white px-1 truncate transition-all duration-300"
                      title={`Initial Level: ${currentVolume.toLocaleString()} L`}
                    >
                      Pre-Storm
                    </div>
                  )}
                  {/* Newly captured water */}
                  {addedFullnessPercent > 0 && (
                    <div
                      style={{ width: `${addedFullnessPercent}%` }}
                      className="h-full bg-[#92EEFF] rounded-lg flex items-center justify-center text-[10px] font-black text-[#0F172A] px-1 truncate transition-all duration-300"
                      title={`New Inflow: +${capturedVolume.toLocaleString()} L`}
                    >
                      +New Inflow
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                  <span>0 L</span>
                  <span>Target: {postStormTotal.toLocaleString()} L</span>
                  <span>{tankCapacity.toLocaleString()} L Max</span>
                </div>
              </div>

              {/* Overflow warning banner if any */}
              {overflowVolume > 0 && (
                <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl flex items-center gap-2.5 text-xs text-[#92400E]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>Storm Overflow:</strong> {overflowVolume.toLocaleString()} L will bypass to the primary drainage network as tank reaches capacity.
                  </span>
                </div>
              )}

              {/* Metric Breakdown Table */}
              <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0] py-1 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#64748B]">Theoretical Rain Catchment</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {theoreticalYield.toLocaleString()} L
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#64748B]">Available Reservoir Airspace</span>
                  <span className="font-mono font-bold text-[#0F172A]">
                    {availableTankSpace.toLocaleString()} L
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between bg-[#F8FAFC] px-2 -mx-2 rounded">
                  <span className="font-bold text-[#0F172A]">Actual Water Stored from Event</span>
                  <span className="font-mono font-black text-[#30AFFF] text-sm">
                    +{capturedVolume.toLocaleString()} L
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-[#64748B]">Post-Storm Total Stored</span>
                  <span className="font-mono font-black text-[#0F172A]">
                    {postStormTotal.toLocaleString()} L
                  </span>
                </div>
              </div>

              {/* Key Impact Cards */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-bold">
                    <Calendar className="w-3.5 h-3.5 text-[#30AFFF]" />
                    Campus Reserve
                  </div>
                  <div className="mt-1 text-xl font-black text-[#0F172A]">
                    {daysOfReserve}{" "}
                    <span className="text-xs font-semibold text-[#64748B]">days</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-0.5">
                    @ {dailyDemand.toLocaleString()} L/day demand
                  </p>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-bold">
                    <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                    Est. Cost Avoided
                  </div>
                  <div className="mt-1 text-xl font-black text-[#0F172A]">
                    ₱{costAvoidancePhp}
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-0.5">
                    At ₱35 / m³ municipal utility
                  </p>
                </div>
              </div>
            </div>

            {/* Pitch & Competition Value Note */}
            <div className="p-5 bg-white border border-[#CBD5E1] rounded-2xl shadow-sm text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#0F172A]">
                <Sparkles className="w-4 h-4 text-[#30AFFF]" />
                CEIW 2026 Presentation Context
              </div>
              <p className="text-[#64748B] leading-relaxed">
                By pairing <strong>active drainage clearing</strong> with <strong>roof rainwater harvesting models</strong>,
                TubigLoop shows higher education institutions how unobstructed runoff can be diverted into productive non-potable reserves
                rather than overwhelming campus drainage channels during Cagayan de Oro peak monsoon events.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
