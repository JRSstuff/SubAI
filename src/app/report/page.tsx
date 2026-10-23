"use client";

import React, { useState, useTransition, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  UploadCloud,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  Tag,
  ArrowRight,
  ShieldCheck,
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
  const [photoStats, setPhotoStats] = useState<{ orig: number; comp: number } | null>(null);

  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 8.4858,
    lng: 124.6565,
  });
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("Campus Reporter");

  // AI Scan state
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

  // Handle Photo Capture / Selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64, originalSizeKb, compressedSizeKb } = await compressImage(file);
      setPhotoBase64(base64);
      setPhotoStats({ orig: originalSizeKb, comp: compressedSizeKb });
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
    setPhotoStats(null);
    setAiResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#92EEFF] text-[#0F172A] border border-[#30AFFF]">
              Step 1: Submit Report
            </span>
            <span className="text-xs text-[#64748B] font-medium">CEIW 2026 Campus Pilot</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Report Drainage Obstruction
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Snap a photo of clogged drains or waste accumulation. Gemini AI assists with material categorization.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* ─── 1. CAMERA / PHOTO BOX ─── */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#30AFFF]" />
                <span>1. Photographic Evidence</span>
              </label>
              {photoStats && (
                <span className="text-[11px] font-semibold text-[#059669] bg-[#D8FFC5] px-2 py-0.5 rounded-md">
                  Compressed: {photoStats.orig}KB &rarr; {photoStats.comp}KB
                </span>
              )}
            </div>

            {!photoBase64 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-56 sm:h-64 border-2 border-dashed border-[#CBD5E1] hover:border-[#30AFFF] rounded-2xl flex flex-col items-center justify-center gap-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#30AFFF]">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <span className="text-sm font-bold text-[#0F172A]">
                    Tap to Open Camera or Upload Image
                  </span>
                  <span className="text-xs text-[#64748B] mt-0.5">
                    Hardware back-camera priority &bull; Automatic optimization
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative w-full aspect-video sm:aspect-[16/9] max-h-80 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-black">
                  <img
                    src={photoBase64}
                    alt="Captured drainage obstruction"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                </div>

                {/* Gemini AI Scan Status Box */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#30AFFF]" />
                      <span className="text-xs font-bold text-[#0F172A]">
                        Gemini AI Multimodal Assessment
                      </span>
                    </div>
                    {isScanning && (
                      <div className="flex items-center gap-1.5 text-xs text-[#30AFFF] font-semibold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing photo...</span>
                      </div>
                    )}
                  </div>

                  {aiResult && !isScanning && (
                    <div className="flex flex-col gap-2 pt-1 border-t border-[#E2E8F0]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[#475569]">
                          Detected Materials:
                        </span>
                        {aiResult.detectedCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2.5 py-1 bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC] rounded-lg text-xs font-bold capitalize flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3 text-[#059669]" />
                            {cat.replace("_", " ")}
                          </span>
                        ))}
                        <span className="px-2.5 py-1 bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] rounded-lg text-xs font-bold capitalize">
                          Blockage: {aiResult.obstructionSeverity}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] italic">
                        &ldquo;{aiResult.confidenceNotes}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* ─── 2. LOCATION & MAP BOX ─── */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4">
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#30AFFF]" />
              <span>2. Campus Location & Pin</span>
            </label>

            {/* Quick Landmark Chips */}
            <div className="flex flex-wrap gap-2">
              {QUICK_LANDMARKS.map((lm) => (
                <button
                  key={lm.name}
                  type="button"
                  onClick={() => {
                    setLocationName(lm.name);
                    setCoords({ lat: lm.lat, lng: lm.lng });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    locationName === lm.name
                      ? "bg-[#92EEFF] text-[#0F172A] border-[#30AFFF]"
                      : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {lm.name}
                </button>
              ))}
            </div>

            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Enter specific spot (e.g. Near West Building Drainage)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                required
                className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all"
              />
              <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            {/* Interactive Campus Map */}
            <CampusMap
              selectable
              selectedCoords={coords}
              onLocationSelect={(c) => setCoords(c)}
              className="h-64 sm:h-72 w-full rounded-2xl"
            />
            <div className="flex justify-between items-center text-[11px] text-[#64748B] px-1 font-mono">
              <span>Latitude: {coords.lat}</span>
              <span>Longitude: {coords.lng}</span>
            </div>
          </div>

          {/* ─── 3. DESCRIPTION & REPORTER ─── */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E2E8F0] shadow-sm flex flex-col gap-4">
            <label className="text-xs font-bold text-[#475569] uppercase tracking-wider">
              3. Observation Notes & Reporter Name
            </label>

            <textarea
              rows={3}
              placeholder="Describe what is visible (e.g. Plastic bottles piled up, slowing water flow during rains)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all resize-none"
            />

            <input
              type="text"
              placeholder="Your Name or Campus Role"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              className="w-full h-11 px-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all"
            />
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
              <div className="flex items-center gap-2 font-bold text-sm">
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
                    <span className="font-mono font-bold text-sm bg-white/70 px-2.5 py-1 rounded-md">
                      {submissionResult.refNo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/map"
                      className="px-3.5 py-1.5 bg-[#064E3B] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-[#043327] transition-all"
                    >
                      <span>View on Campus Map</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isScanning}
            className="w-full h-13 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying and Saving Report...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                <span>Submit Verified Campus Report</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
