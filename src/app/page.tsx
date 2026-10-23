"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { AuthCard } from "@/components/auth/AuthCard";
import { Droplet, Recycle } from "lucide-react";

export default function Home() {
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <main className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] text-[#0F172A] relative overflow-x-hidden">
      {/* INITIAL SPLASH SCREEN (Shown during load) */}
      {!hasLoaded && (
        <SplashScreen onComplete={() => setHasLoaded(true)} minDuration={1100} />
      )}

      {/* TOP BRAND BAR */}
      <header className="w-full border-b border-[#E2E8F0] bg-white py-3 px-4 sm:px-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-36 h-10">
            <Image
              src="/TubigLoopLogoWithText.png"
              alt="TubigLoop Brand"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC] rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span>Loop Node Online</span>
          </div>
        </div>
      </header>

      {/* CENTRAL AUTHENTICATION STAGE */}
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10 px-4">
        {hasLoaded && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex items-center justify-center"
          >
            <AuthCard />
          </motion.div>
        )}
      </div>

      {/* BOTTOM AUDIT & COMPLIANCE FOOTER */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-3 px-4 sm:px-8 text-center text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-[#0F172A] font-medium">
            <Droplet className="w-3.5 h-3.5 text-[#30AFFF]" />
            Pure Water Logistics
          </span>
          <span className="flex items-center gap-1 text-[#0F172A] font-medium">
            <Recycle className="w-3.5 h-3.5 text-[#059669]" />
            Circular Chain-of-Custody
          </span>
        </div>
        <p className="text-[11px]">
          TubigLoop Portal &bull; Physical handling by authorized maintenance personnel & partner recyclers.
        </p>
      </footer>
    </main>
  );
}
