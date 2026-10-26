"use client";

import React, { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  FolderOpen,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Tag,
  ArrowRight,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CampusMap } from "@/components/map/CampusMap";
import { compressImage } from "@/lib/image-compress";
import { analyzeObstructionPhoto, type AIScanResult } from "@/lib/gemini";
import { submitReportAction } from "@/app/actions/operations";

const QUICK_LANDMARKS = [
  { name: "USTP Engineering Bldg Drain", lat: 8.4856, lng: 124.6562 },
  { name: "Science Complex Catch Basin", lat: 8.4862, lng: 124.6569 },
  { name: "Student Pavilion Drainage Canal", lat: 8.4851, lng: 124.6558 },
  { name: "Main Campus Gate Culvert", lat: 8.4849, lng: 124.6572 },
];

export default function ReportPage() {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 8.4858,
    lng: 124.6565,
  });
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("Campus Reporter");

  // AI Vision state
  const [isScanning, setIsScanning] = useState(false);
  const [aiResult, setAiResult] = useState<AIScanResult | null>(null);

  // Form submission state (Rule 1: Real Server Truth)
  const [isPending, startTransition] = useTransition();
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
    refNo?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle Photo Capture / Selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64 } = await compressImage(file);
      setPhotoBase64(base64);
      setSubmissionResult(null);

      // Trigger Gemini Multimodal Vision Scan
      setIsScanning(true);
      const scan = await analyzeObstructionPhoto(base64);
      setAiResult(scan);
      setIsScanning(false);

      if (scan.suggestedDescription && !description) {
        setDescription(scan.suggestedDescription);
      }
    } catch {
      setIsScanning(false);
      alert("Failed to process photo. Please try another image.");
    }
  };

  const handleRetake = () => {
    setPhotoBase64(null);
    setAiResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      alert("Please capture or upload a photo of the drainage obstruction.");
      return;
    }

    setSubmissionResult(null);

    const formData = new FormData();
    formData.append("locationName", locationName || "Campus Drainage Point");
    formData.append("latitude", coords.lat.toString());
    formData.append("longitude", coords.lng.toString());
    formData.append("description", description);
    formData.append("photoBase64", photoBase64);
    formData.append("reporterName", reporterName);
    formData.append(
      "aiCategories",
      JSON.stringify(aiResult?.detectedCategories || ["residual_waste"])
    );

    startTransition(async () => {
      const res = await submitReportAction(formData);
      if (res.success && res.data) {
        setSubmissionResult({
          success: true,
          message: res.message,
          refNo: (res.data as any).reference_no,
        });
      } else {
        setSubmissionResult({
          success: false,
          message: res.message || "Failed to submit report.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">
        {/* Minimal Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#92EEFF] text-[#0F172A] border border-[#30AFFF]">
              Step 1: Submit Report
            </span>
            <span className="text-xs text-[#64748B] font-medium">USTP Cagayan de Oro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Report Drainage Obstruction
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Capture drainage blockages with photo evidence. Multimodal AI categorizes materials for verified collection.
          </p>
        </div>

        <form action="javascript:void(0);" onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ─── 1. CAMERA / EVIDENCE CARD (Minimal Mobile Card Style) ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#30AFFF]" />
                <span>1. Photographic Evidence</span>
              </span>
              {photoBase64 && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1 text-xs font-bold text-[#64748B] hover:text-[#DC2626] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              )}
            </div>

            {!photoBase64 ? (
              <div className="w-full p-6 sm:p-8 border-2 border-dashed border-[#CBD5E1] hover:border-[#30AFFF] rounded-2xl flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#30AFFF]">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <span className="text-sm font-bold text-[#0F172A]">
                    Add Obstruction Photo
                  </span>
                  <span className="text-xs text-[#64748B] mt-0.5">
                    Capture with phone camera or select from image files
                  </span>
                </div>

                {/* Dual Options: Camera vs Files */}
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer min-h-[44px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer min-h-[44px]"
                  >
                    <FolderOpen className="w-4 h-4 text-[#475569]" />
                    <span>Files</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative w-full aspect-video max-h-80 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#0F172A]">
                  <img
                    src={photoBase64}
                    alt="Captured drainage obstruction"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#475569]" />
                      <span>Files</span>
                    </button>
                  </div>
                </div>

                {/* AI Detection Result Bar */}
                {isScanning && (
                  <div className="p-3 bg-[#92EEFF]/20 border border-[#92EEFF] rounded-xl flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                    <Loader2 className="w-4 h-4 animate-spin text-[#30AFFF]" />
                    <span>AI analyzing debris and materials...</span>
                  </div>
                )}

                {aiResult && !isScanning && (
                  <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                        <span>AI Detected Materials</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#059669] bg-[#C4F7CA] px-2 py-0.5 rounded-full">
                        {aiResult.confidenceNotes || "Vision Verified"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.detectedCategories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2.5 py-1 bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC] rounded-lg text-xs font-bold uppercase tracking-wider"
                        >
                          {cat.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden native inputs for dual access */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* ─── 2. LOCATION & QUICK LANDMARKS (Segmented Style) ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#30AFFF]" />
              <span>2. Campus Location</span>
            </span>

            {/* Quick Landmark Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#64748B]">
                Tap Nearby USTP Landmark:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_LANDMARKS.map((lm) => {
                  const isSelected = locationName === lm.name;
                  return (
                    <button
                      key={lm.name}
                      type="button"
                      onClick={() => {
                        setLocationName(lm.name);
                        setCoords({ lat: lm.lat, lng: lm.lng });
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#30AFFF] text-white border-[#127dc7] shadow-xs"
                          : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <span className="truncate">{lm.name}</span>
                      <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Location Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#475569]">
                Specific Culvert / Point Description:
              </label>
              <input
                type="text"
                placeholder="e.g., Near Gym entrance corner culvert"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
                className="w-full h-11 px-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all"
              />
            </div>

            {/* Interactive Campus Map Pin Picker */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B]">
                <span>Pin Coordinate:</span>
                <span className="font-mono text-[10px] text-[#30AFFF]">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </span>
              </div>
              <div className="h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-[#E2E8F0]">
                <CampusMap
                  selectable
                  selectedCoords={coords}
                  onLocationSelect={(newCoords: { lat: number; lng: number }) => setCoords(newCoords)}
                  className="h-full w-full rounded-2xl"
                />
              </div>
            </div>
          </div>

          {/* ─── 3. OBSERVATIONS & SEVERITY ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-3">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#30AFFF]" />
              <span>3. Observations & Notes</span>
            </span>

            <textarea
              rows={3}
              placeholder="Describe standing water depth, blockage cause, or overflowing debris..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-3.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all resize-none"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#475569]">
                Reporter Name / ID:
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                required
                className="w-full h-11 px-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* ─── STATUS BANNER (Rule 1: Real Server Truth) ─── */}
          {submissionResult && (
            <div
              className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
                submissionResult.success
                  ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                  : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                {submissionResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
                )}
                <span>{submissionResult.message}</span>
              </div>

              {submissionResult.refNo && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#86EFAC]/50 text-xs">
                  <div>
                    <span className="font-semibold">Tracking Reference: </span>
                    <span className="font-mono font-bold text-xs bg-white/80 px-2 py-0.5 rounded-md">
                      {submissionResult.refNo}
                    </span>
                  </div>
                  <Link
                    href="/map"
                    className="px-3 py-1.5 bg-[#064E3B] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#043327] transition-all"
                  >
                    <span>View Map</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isPending || isScanning}
            className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit</span>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
