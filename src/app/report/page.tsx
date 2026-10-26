"use client";

import React, { useState, useTransition, useRef, useCallback } from "react";
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
  Plus,
  Check,
  X,
  Maximize2,
  Eye,
  Send,
  Leaf,
  Trash2,
  Layers,
  Package,
  Waves,
  Hammer,
  CircleDot,
  Droplets,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { CampusMap } from "@/components/map/CampusMap";
import { compressImage } from "@/lib/image-compress";
import { analyzeObstructionPhoto, type AIScanResult } from "@/lib/gemini";
import { submitReportAction } from "@/app/actions/operations";
import { reverseGeocodeCDO } from "@/lib/cdo-geocode";

const DEFAULT_CATEGORIES = [
  { id: "pet_bottles", label: "PET Bottles", icon: Layers },
  { id: "flexible_packaging", label: "Plastics / Sachets", icon: Package },
  { id: "silt", label: "Silt & Mud", icon: Waves },
  { id: "organic_debris", label: "Leaves & Wood", icon: Leaf },
  { id: "residual_waste", label: "Residual Waste", icon: Trash2 },
  { id: "construction_debris", label: "Rubble / Slabs", icon: Hammer },
];

const CLASSIFICATION_OPTIONS = [
  { name: "Curb Inlet", icon: CircleDot },
  { name: "Catch Basin", icon: Package },
  { name: "Open Canal", icon: Droplets },
  { name: "Culvert", icon: Waves },
  { name: "Creek Outfall", icon: ExternalLink },
];

const QUICK_NOTES = [
  "Standing water",
  "Overflowing",
  "Screen blocked",
  "High trash",
  "Foul odor",
];

export default function ReportPage() {
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);

  // CDO Location state - Pinning is REQUIRED
  const [isLocationPinned, setIsLocationPinned] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 8.4858,
    lng: 124.6565,
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Fullscreen map modal state
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [stagedCoords, setStagedCoords] = useState<{ lat: number; lng: number }>({
    lat: 8.4858,
    lng: 124.6565,
  });
  const [stagedAddress, setStagedAddress] = useState("");
  const [isStagedGeocoding, setIsStagedGeocoding] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Observations & Details state
  const [categories, setCategories] = useState<
    { id: string; label: string; custom?: boolean; icon?: any }[]
  >(DEFAULT_CATEGORIES);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["residual_waste"]);
  const [customMaterialInput, setCustomMaterialInput] = useState("");

  const [classification, setClassification] = useState("Curb Inlet");
  const [customClassification, setCustomClassification] = useState("");

  const [severity, setSeverity] = useState<"low" | "partial" | "substantial">("partial");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("CDO Reporter");

  // AI Vision state
  const [isScanning, setIsScanning] = useState(false);
  const [aiResult, setAiResult] = useState<AIScanResult | null>(null);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [scanCancelled, setScanCancelled] = useState(false);

  // Form submission & Google Pay-style celebration state
  const [isPending, startTransition] = useTransition();
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    message: string;
    refNo?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Auto-reverse geocode helper for small map
  const handleInlineLocationSelect = useCallback(async (newCoords: { lat: number; lng: number }) => {
    setCoords(newCoords);
    setIsLocationPinned(true);
    setIsGeocoding(true);
    try {
      const address = await reverseGeocodeCDO(newCoords.lat, newCoords.lng);
      if (address) {
        setLocationName(address);
      }
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Handle Fullscreen map open
  const openFullscreenMap = () => {
    setStagedCoords(coords);
    setStagedAddress(locationName || "Locating...");
    setIsFullscreenOpen(true);

    if (!locationName) {
      setIsStagedGeocoding(true);
      reverseGeocodeCDO(coords.lat, coords.lng)
        .then((addr) => {
          setStagedAddress(addr);
        })
        .finally(() => {
          setIsStagedGeocoding(false);
        });
    }
  };

  // Handle location change inside Fullscreen map (debounced reverse geocode)
  const handleFullscreenLocationSelect = useCallback((newCoords: { lat: number; lng: number }) => {
    setStagedCoords(newCoords);
    setIsStagedGeocoding(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const addr = await reverseGeocodeCDO(newCoords.lat, newCoords.lng);
        setStagedAddress(addr);
      } finally {
        setIsStagedGeocoding(false);
      }
    }, 280);
  }, []);

  // Pin button action: confirms coordinate and auto-detected street, then returns to menu
  const handlePinAndClose = () => {
    setCoords(stagedCoords);
    setIsLocationPinned(true);
    if (stagedAddress && stagedAddress !== "Locating...") {
      setLocationName(stagedAddress);
    }
    setIsFullscreenOpen(false);
  };

  // Toggle category
  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Add custom material
  const handleAddCustomMaterial = () => {
    const trimmed = customMaterialInput.trim();
    if (!trimmed) return;

    const id = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (!categories.some((c) => c.id === id)) {
      setCategories((prev) => [...prev, { id, label: trimmed, custom: true, icon: Tag }]);
    }
    if (!selectedCategories.includes(id)) {
      setSelectedCategories((prev) => [...prev, id]);
    }
    setCustomMaterialInput("");
  };

  // Remove custom material
  const handleRemoveCategory = (catId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    setSelectedCategories((prev) => prev.filter((id) => id !== catId));
  };

  // Handle Photo Capture / Selection
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { base64 } = await compressImage(file, 960, 960, 0.72);
      setPhotoBase64(base64);
      setSubmissionResult(null);
      setAiDismissed(false);
      setScanCancelled(false);

      setIsScanning(true);
      const scanPromise = analyzeObstructionPhoto(base64);

      scanPromise
        .then((scan) => {
          setIsScanning(false);
          setAiResult(scan);

          if (scan.success) {
            if (scan.detectedCategories && scan.detectedCategories.length > 0) {
              setSelectedCategories((prev) => {
                const merged = new Set([...prev, ...scan.detectedCategories]);
                return Array.from(merged);
              });
            }

            if (scan.obstructionSeverity) {
              setSeverity(scan.obstructionSeverity);
            }

            if (scan.suggestedDescription) {
              setDescription((prev) => (prev.trim() === "" ? scan.suggestedDescription : prev));
            }
          }
        })
        .catch(() => {
          setIsScanning(false);
        });
    } catch {
      setIsScanning(false);
      alert("Failed to process photo.");
    }
  };

  const handleRetake = () => {
    setPhotoBase64(null);
    setAiResult(null);
    setIsScanning(false);
    setAiDismissed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSkipScan = () => {
    setIsScanning(false);
    setScanCancelled(true);
  };

  const handleAppendAiText = () => {
    if (!aiResult?.suggestedDescription) return;
    setDescription((prev) =>
      prev.trim() ? `${prev.trim()} — ${aiResult.suggestedDescription}` : aiResult.suggestedDescription
    );
    setAiDismissed(true);
  };

  const handleReplaceWithAiText = () => {
    if (!aiResult?.suggestedDescription) return;
    setDescription(aiResult.suggestedDescription);
    setAiDismissed(true);
  };

  // Reset form to submit another report
  const handleResetForm = () => {
    setPhotoBase64(null);
    setIsLocationPinned(false);
    setLocationName("");
    setDescription("");
    setSelectedCategories(["residual_waste"]);
    setCustomClassification("");
    setClassification("Curb Inlet");
    setSeverity("partial");
    setAiResult(null);
    setSubmissionResult(null);
    setShowSuccessScreen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const activeClassification = customClassification.trim() || classification;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      alert("Please capture or upload a photo.");
      return;
    }

    if (!isLocationPinned) {
      alert("Please pin a location on the map.");
      openFullscreenMap();
      return;
    }

    setSubmissionResult(null);

    const formData = new FormData();
    formData.append("locationName", locationName || "Cagayan de Oro Point");
    formData.append("latitude", coords.lat.toString());
    formData.append("longitude", coords.lng.toString());
    formData.append("classification", activeClassification);
    formData.append("description", description);
    formData.append("severity", severity);
    formData.append("photoBase64", photoBase64);
    formData.append("reporterName", reporterName);
    formData.append(
      "aiCategories",
      JSON.stringify(
        selectedCategories.length > 0 ? selectedCategories : ["residual_waste"]
      )
    );

    startTransition(async () => {
      const res = await submitReportAction(formData);
      if (res.success && res.data) {
        setSubmissionResult({
          success: true,
          message: res.message,
          refNo: (res.data as any).reference_no,
        });

        // Trigger Google Pay-style celebration screen + haptic buzz
        setShowSuccessScreen(true);
        if (typeof window !== "undefined" && window.navigator?.vibrate) {
          window.navigator.vibrate([40, 60, 40]);
        }
      } else {
        setSubmissionResult({
          success: false,
          message: res.message || "Submission failed.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-3xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#92EEFF] text-[#0F172A] border border-[#30AFFF]">
              Step 1
            </span>
            <span className="text-xs text-[#64748B] font-medium">Cagayan de Oro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
            Report Obstruction
          </h1>
          <p className="text-xs sm:text-sm text-[#475569]">
            Capture drainage blockages across Cagayan de Oro for recovery.
          </p>
        </div>

        <form action="javascript:void(0);" onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* ─── 1. EVIDENCE ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#30AFFF]" />
                <span>1. Evidence</span>
              </span>
              {photoBase64 && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex items-center gap-1 text-xs font-bold text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake</span>
                </button>
              )}
            </div>

            {!photoBase64 ? (
              <div className="w-full p-6 sm:p-8 border-2 border-dashed border-[#CBD5E1] hover:border-[#30AFFF] rounded-2xl flex flex-col items-center justify-center gap-4 bg-[#F8FAFC]">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#30AFFF]">
                  <Camera className="w-7 h-7" />
                </div>
                <span className="text-sm font-bold text-[#0F172A]">
                  Add Photo
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] rounded-xl text-xs font-bold shadow-xs active:scale-95 cursor-pointer min-h-[44px]"
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
                    alt="Drainage obstruction"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white/95 hover:bg-white text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#475569]" />
                      <span>Files</span>
                    </button>
                  </div>
                </div>

                {isScanning && !scanCancelled && (
                  <div className="p-3 bg-[#92EEFF]/30 border border-[#30AFFF] rounded-xl flex items-center justify-between text-xs font-bold text-[#0F172A] animate-pulse">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#30AFFF]" />
                      <span>Scanning photo...</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSkipScan}
                      className="px-2.5 py-1 bg-white hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg text-[11px] font-bold text-[#475569] cursor-pointer"
                    >
                      Skip
                    </button>
                  </div>
                )}

                {aiResult && !isScanning && !scanCancelled && (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                        <span>Identified Materials</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#059669] bg-[#C4F7CA] px-2 py-0.5 rounded-full">
                        {aiResult.confidenceNotes || "Vision"}
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

          {/* ─── 2. LOCATION (REQUIRED PINNING) ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#30AFFF]" />
                <span>2. Location</span>
              </span>
              {isLocationPinned ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 bg-[#C4F7CA] text-[#064E3B] border border-[#86EFAC] rounded-full text-[11px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                  <span>Pinned</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5] rounded-full text-[11px] font-bold">
                  Required
                </span>
              )}
            </div>

            {/* If NOT pinned yet: Prompt user to pin */}
            {!isLocationPinned ? (
              <div className="w-full p-6 sm:p-7 border-2 border-dashed border-[#CBD5E1] hover:border-[#30AFFF] rounded-2xl flex flex-col items-center justify-center gap-3 bg-[#F8FAFC] transition-all">
                <div className="w-13 h-13 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#30AFFF]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-sm font-bold text-[#0F172A]">
                    Pin Drainage Location
                  </span>
                  <span className="text-xs text-[#64748B] mt-0.5">
                    Drop a marker on the map to set coordinates
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openFullscreenMap}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 cursor-pointer min-h-[44px] mt-1"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Pin Location</span>
                </button>
              </div>
            ) : (
              /* If PINNED: View pinned map preview with View / Change controls */
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                  <div className="flex items-center gap-1.5">
                    <span>Pin:</span>
                    <span className="font-mono text-[11px] text-[#30AFFF]">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openFullscreenMap}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={openFullscreenMap}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border border-[#CBD5E1] rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>Change</span>
                    </button>
                  </div>
                </div>

                {/* Map Preview */}
                <div
                  onClick={openFullscreenMap}
                  title="Click to view pinned location"
                  className="relative h-44 sm:h-48 w-full rounded-2xl overflow-hidden border border-[#E2E8F0] cursor-pointer group"
                >
                  <CampusMap
                    selectable
                    selectedCoords={coords}
                    onLocationSelect={handleInlineLocationSelect}
                    className="h-full w-full rounded-2xl pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3.5 py-2 bg-white/95 text-[#0F172A] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#30AFFF]" />
                      <span>View Map</span>
                    </span>
                  </div>
                </div>

                {/* Street or Area Text Input */}
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <span>Street or Area</span>
                      {isGeocoding && (
                        <Loader2 className="w-3 h-3 animate-spin text-[#30AFFF]" />
                      )}
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Osmeña St. canal, or Brgy. Bulua"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    required
                    className="w-full h-11 px-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── 3. DETAILS ─── */}
          <div className="bg-white p-5 rounded-3xl border border-[#E2E8F0] shadow-xs flex flex-col gap-4">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#30AFFF]" />
              <span>3. Details</span>
            </span>

            {/* Material Identification */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0F172A]">
                  Material Identification
                </label>
                <span className="text-[10px] text-[#64748B]">
                  {selectedCategories.length} selected
                </span>
              </div>

              {/* Badges Grid with Icons */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  const IconComp = cat.icon || Tag;
                  return (
                    <div
                      key={cat.id}
                      className="inline-flex items-center rounded-xl overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isChecked
                            ? "bg-[#D8FFC5] text-[#0F2E1B] border-[#86EFAC] shadow-xs"
                            : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 ${isChecked ? "text-[#059669]" : "text-[#64748B]"}`} />
                        <span>{cat.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                      </button>
                      {cat.custom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat.id)}
                          className="ml-1 p-1 text-[#94A3B8] hover:text-[#DC2626] cursor-pointer"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Material */}
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Add custom material (e.g. Styrofoam, tires)..."
                  value={customMaterialInput}
                  onChange={(e) => setCustomMaterialInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomMaterial();
                    }
                  }}
                  className="flex-1 h-10 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMaterial}
                  className="px-4 h-10 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Classification with Icons */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0F172A]">
                Classification
              </label>

              <div className="flex flex-wrap gap-1.5">
                {CLASSIFICATION_OPTIONS.map((item) => {
                  const isSelected = classification === item.name && !customClassification.trim();
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setClassification(item.name);
                        setCustomClassification("");
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#30AFFF] text-white border-[#127dc7] shadow-xs"
                          : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-[#64748B]"}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Classification Input */}
              <input
                type="text"
                placeholder="Or custom classification (e.g. Box Culvert, Trash Rack)..."
                value={customClassification}
                onChange={(e) => setCustomClassification(e.target.value)}
                className="w-full h-10 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none mt-1"
              />
            </div>

            {/* Severity */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0F172A]">
                Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "low", label: "Low", desc: "Minor debris" },
                    { id: "partial", label: "Partial", desc: "Slow drainage" },
                    { id: "substantial", label: "Substantial", desc: "Backed up" },
                  ] as const
                ).map((sev) => {
                  const isSelected = severity === sev.id;
                  return (
                    <button
                      key={sev.id}
                      type="button"
                      onClick={() => setSeverity(sev.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer min-h-[48px] ${
                        isSelected
                          ? sev.id === "substantial"
                            ? "bg-[#EF4444] text-white border-[#DC2626] shadow-xs"
                            : sev.id === "partial"
                            ? "bg-[#30AFFF] text-white border-[#127dc7] shadow-xs"
                            : "bg-[#10B981] text-white border-[#059669] shadow-xs"
                          : "bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <span className="text-xs font-extrabold">{sev.label}</span>
                      <span className={`text-[10px] ${isSelected ? "text-white/90" : "text-[#94A3B8]"}`}>
                        {sev.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#0F172A]">
                Description
              </label>

              {aiResult?.suggestedDescription &&
                !aiDismissed &&
                description.trim() !== "" &&
                description.trim() !== aiResult.suggestedDescription && (
                  <div className="p-3 bg-[#92EEFF]/25 border border-[#30AFFF] rounded-xl flex flex-col gap-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[#0F172A]">
                        <strong>AI:</strong> &ldquo;{aiResult.suggestedDescription}&rdquo;
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiDismissed(true)}
                        className="text-[#64748B] hover:text-[#0F172A] p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAppendAiText}
                        className="px-2.5 py-1 bg-[#30AFFF] text-white rounded-lg text-xs font-bold hover:bg-[#1f9eef] cursor-pointer"
                      >
                        Append
                      </button>
                      <button
                        type="button"
                        onClick={handleReplaceWithAiText}
                        className="px-2.5 py-1 bg-white border border-[#CBD5E1] text-[#0F172A] rounded-lg text-xs font-bold hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                )}

              <textarea
                rows={3}
                placeholder="Describe obstruction, flow, or debris..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full p-3.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:outline-none transition-all resize-none"
              />

              {/* Quick Note Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {QUICK_NOTES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => {
                      setDescription((prev) =>
                        prev.trim() ? `${prev.trim()}, ${chip}` : chip
                      );
                    }}
                    className="px-2 py-0.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] rounded-md text-[10px] font-medium cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Reporter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0F172A]">
                Reporter
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

          {/* ─── STATUS BANNER (for error fallback) ─── */}
          {submissionResult && !submissionResult.success && (
            <div className="p-4 rounded-2xl border flex items-center gap-2 bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5] text-xs sm:text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
              <span>{submissionResult.message}</span>
            </div>
          )}

          {/* ─── SATISFYING SUBMIT BUTTON ─── */}
          <button
            type="submit"
            disabled={isPending}
            className="group relative w-full h-14 bg-[#30AFFF] hover:bg-[#1f9eef] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-[#30AFFF]/25 cursor-pointer disabled:opacity-60 transition-all min-h-[56px]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting</span>
              </>
            ) : (
              <>
                <span>Submit</span>
                <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </main>

      {/* ─── FULLSCREEN MAP MODAL ─── */}
      {isFullscreenOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Top Bar */}
          <div className="w-full h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 flex items-center justify-between z-20 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreenOpen(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Exit</span>
            </button>

            {/* Live Detected Street Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full max-w-[200px] sm:max-w-md truncate">
              {isStagedGeocoding ? (
                <Loader2 className="w-3 h-3 animate-spin text-[#30AFFF] shrink-0" />
              ) : (
                <MapPin className="w-3 h-3 text-[#30AFFF] shrink-0" />
              )}
              <span className="text-[11px] font-bold text-[#0F172A] truncate">
                {stagedAddress || "Tap to pin"}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePinAndClose}
              className="flex items-center gap-1 px-4 py-1.5 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Pin</span>
            </button>
          </div>

          {/* Full-Screen Interactive Map Canvas */}
          <div className="flex-1 w-full relative">
            <CampusMap
              selectable
              selectedCoords={stagedCoords}
              onLocationSelect={handleFullscreenLocationSelect}
              className="h-full w-full rounded-none border-none shadow-none"
            />

            {/* Bottom Card: Street preview + Pin Action */}
            <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-10 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-[#E2E8F0] shadow-xl flex flex-col gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#64748B]">
                  Selected Location
                </span>
                <span className="text-sm font-bold text-[#0F172A] line-clamp-2">
                  {stagedAddress || "Tap anywhere on the map to pin"}
                </span>
                <span className="font-mono text-[10px] text-[#30AFFF] mt-0.5">
                  {stagedCoords.lat.toFixed(5)}, {stagedCoords.lng.toFixed(5)}
                </span>
              </div>

              <button
                type="button"
                onClick={handlePinAndClose}
                className="w-full h-11 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl font-bold text-xs shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>Pin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GOOGLE PAY-STYLE SATISFYING FULL-SCREEN SUCCESS MODAL ─── */}
      {showSuccessScreen && submissionResult?.success && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#C4F7CA] text-[#064E3B] animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
          {/* Top verified badge */}
          <div className="w-full max-w-sm flex items-center justify-center pt-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 rounded-full border border-[#86EFAC] text-xs font-extrabold text-[#064E3B] shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>TubigLoop Verified</span>
            </div>
          </div>

          {/* Central Pop-in Checkmark & Ripple */}
          <div className="flex flex-col items-center text-center my-auto py-6">
            <div className="relative flex items-center justify-center mb-6">
              {/* Pulsing satisfaction rings */}
              <div className="absolute w-44 h-44 rounded-full bg-[#D8FFC5] animate-ping opacity-50" />
              <div className="absolute w-36 h-36 rounded-full bg-[#D8FFC5] shadow-xs" />

              {/* Elevated circle with bold checkmark */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white shadow-xl flex items-center justify-center border-4 border-white">
                <Check className="w-12 h-12 text-[#059669] stroke-[3.5]" />
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#064E3B] tracking-tight">
              Submitted!
            </h2>
            <p className="text-xs sm:text-sm text-[#064E3B]/80 font-medium max-w-xs mt-1">
              Obstruction logged for priority clearing & recovery.
            </p>

            {/* Reference Badge */}
            {submissionResult.refNo && (
              <div className="mt-4 px-4 py-2 bg-white rounded-2xl border border-[#86EFAC] shadow-xs flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                  Reference
                </span>
                <span className="font-mono text-sm font-extrabold text-[#0F172A]">
                  {submissionResult.refNo}
                </span>
              </div>
            )}

            {/* Summary card */}
            <div className="w-full max-w-sm mt-5 bg-white rounded-2xl p-4 border border-[#86EFAC] shadow-xs flex flex-col gap-2 text-left">
              <div className="flex items-center justify-between text-xs font-bold text-[#64748B]">
                <span className="flex items-center gap-1 text-[#059669]">
                  <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Pinned Location</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D8FFC5] text-[#064E3B]">
                  {activeClassification}
                </span>
              </div>
              <span className="text-xs font-bold text-[#0F172A] line-clamp-1">
                {locationName || "Cagayan de Oro"}
              </span>
              <span className="font-mono text-[10px] text-[#64748B]">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="w-full max-w-sm flex flex-col gap-2.5 pb-2">
            <Link
              href="/map"
              className="w-full h-13 bg-[#064E3B] hover:bg-[#043327] active:scale-[0.98] text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>View Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full h-11 bg-white hover:bg-[#F8FAFC] active:scale-[0.98] text-[#064E3B] border border-[#86EFAC] rounded-2xl font-bold text-xs cursor-pointer shadow-xs transition-all"
            >
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
