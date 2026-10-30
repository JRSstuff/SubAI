"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Zap,
  Camera,
  WifiOff,
  X,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalledConfirmed, setIsInstalledConfirmed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker for PWA compliance and offline support
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 2. Detect if already running in standalone / installed PWA mode
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");

      if (isStandalone) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) return;

    // 3. Detect iOS platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
    setIsIos(isIosDevice);

    // 4. Capture beforeinstallprompt event (Android / Chromium / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setIsInstalledConfirmed(true);
      setTimeout(() => setIsInstalledConfirmed(false), 4000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Check if user dismissed the prompt
    const dismissedTime = localStorage.getItem("subai_pwa_dismissed_at");
    const isSuppressed = localStorage.getItem("subai_pwa_suppress");

    if (!dismissedTime && !isSuppressed) {
      // Show prompt after a slight 2s delay so the initial screen loads seamlessly
      const timer = setTimeout(() => {
        if (!checkInstalled()) {
          setShowPrompt(true);
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setShowPrompt(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Installation prompt error:", err);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      setShowDesktopGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIosGuide(false);
    setShowDesktopGuide(false);
    localStorage.setItem("subai_pwa_dismissed_at", Date.now().toString());
  };

  // If already running in installed standalone app mode, render nothing
  if (isInstalled && !isInstalledConfirmed) return null;

  return (
    <>
      {/* ─── SUCCESS TOAST WHEN INSTALLED ─── */}
      <AnimatePresence>
        {isInstalledConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#30AFFF]/40 select-none"
          >
            <CheckCircle2 className="w-5 h-5 text-[#30AFFF]" />
            <span className="text-xs font-bold">SubAI installed successfully! Launching native environment.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN PWA OPTIMIZATION PROMPT BANNER ─── */}
      <AnimatePresence>
        {showPrompt && !showIosGuide && !showDesktopGuide && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white rounded-3xl border border-[#CBD5E1] shadow-2xl p-5 select-none overflow-hidden"
          >
            {/* Header / Pill & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#92EEFF]/30 text-[#0F172A] border border-[#30AFFF]/40 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                <span>Performance Optimization</span>
              </div>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                title="Dismiss for now"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App Identification */}
            <div className="flex items-center gap-3.5 mt-3.5">
              <div className="relative w-13 h-13 rounded-2xl bg-[#F8FAFC] p-1.5 border border-[#E2E8F0] shadow-2xs shrink-0 flex items-center justify-center">
                <Image
                  src="/logo512x512.png"
                  alt="SubAI App Icon"
                  width={44}
                  height={44}
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-extrabold text-[#0F172A] leading-tight">
                  Install SubAI Application
                </h3>
                <p className="text-xs text-[#64748B] font-medium leading-relaxed mt-0.5">
                  Install to your home screen for full hardware acceleration & offline drainage dispatch.
                </p>
              </div>
            </div>

            {/* Feature Optimization Badges */}
            <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-[#F1F5F9]">
              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <Zap className="w-4 h-4 text-[#30AFFF] mb-1" />
                <span className="text-[10px] font-bold text-[#0F172A]">Instant Boot</span>
                <span className="text-[9px] text-[#64748B]">Zero lag</span>
              </div>

              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <Camera className="w-4 h-4 text-[#059669] mb-1" />
                <span className="text-[10px] font-bold text-[#0F172A]">Full Screen</span>
                <span className="text-[9px] text-[#64748B]">No URL bars</span>
              </div>

              <div className="flex flex-col items-center text-center p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <WifiOff className="w-4 h-4 text-[#30AFFF] mb-1" />
                <span className="text-[10px] font-bold text-[#0F172A]">Offline Mode</span>
                <span className="text-[9px] text-[#64748B]">Typhoon ready</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 h-11 bg-[#30AFFF] hover:bg-[#1f9eef] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install Application</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="h-11 px-4 text-[#64748B] hover:text-[#0F172A] font-semibold text-xs rounded-xl hover:bg-[#F1F5F9] transition-all cursor-pointer"
              >
                Maybe Later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── IOS STEP-BY-STEP INSTALL GUIDE SHEET ─── */}
      <AnimatePresence>
        {showIosGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-[#E2E8F0]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                  <ShieldCheck className="w-4 h-4 text-[#30AFFF]" />
                  <span>iOS Safari Installation</span>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="relative w-16 h-16 rounded-2xl bg-[#F8FAFC] p-2 border border-[#E2E8F0] shadow-sm mb-1">
                  <Image
                    src="/logo512x512.png"
                    alt="SubAI Icon"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <h4 className="text-base font-extrabold text-[#0F172A]">Add SubAI to Home Screen</h4>
                <p className="text-xs text-[#64748B]">Follow 3 quick steps in Safari to enable standalone mode:</p>
              </div>

              <div className="flex flex-col gap-2.5 text-left bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0]">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#30AFFF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs text-[#0F172A]">
                    Tap the <strong className="inline-flex items-center gap-1 text-[#30AFFF] font-bold"><Share className="w-3.5 h-3.5" /> Share</strong> button in Safari toolbar.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#30AFFF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs text-[#0F172A]">
                    Scroll down and tap <strong className="inline-flex items-center gap-1 text-[#0F172A] font-bold"><PlusSquare className="w-3.5 h-3.5 text-[#30AFFF]" /> Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#30AFFF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="text-xs text-[#0F172A]">
                    Tap <strong className="text-[#30AFFF] font-bold">Add</strong> at top right to launch with zero browser overhead!
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full h-11 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Got It</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DESKTOP BROWSER GUIDE MODAL (Chrome / Edge / Firefox) ─── */}
      <AnimatePresence>
        {showDesktopGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center border border-[#E2E8F0]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#0F172A]">Desktop App Installation</span>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="relative w-16 h-16 rounded-2xl bg-[#F8FAFC] p-2 border border-[#E2E8F0] shadow-sm mb-1">
                  <Image
                    src="/logo512x512.png"
                    alt="SubAI Icon"
                    width={56}
                    height={56}
                    className="object-contain"
                  />
                </div>
                <h4 className="text-base font-extrabold text-[#0F172A]">Install to Desktop Terminal</h4>
                <p className="text-xs text-[#64748B]">Click the Install icon in your browser address bar:</p>
              </div>

              <div className="flex flex-col gap-2.5 text-left bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0]">
                <div className="text-xs text-[#0F172A] leading-relaxed">
                  Look for the <strong className="text-[#30AFFF]">Install SubAI</strong> icon <Download className="inline w-3.5 h-3.5 text-[#30AFFF]" /> located on the right side of your browser URL bar, or click your browser menu (⋮) &rarr; <strong>Install SubAI</strong>.
                </div>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="w-full h-11 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Understood</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
