"use client";

import React from "react";
import Image from "next/image";
import { AuthCard } from "@/components/auth/AuthCard";
import { Droplet, Recycle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] text-[#0F172A] relative overflow-x-hidden">
      {/* TOP BRAND BAR (Centered, Clean, No Status Pills) */}
      <header className="w-full border-b border-[#E2E8F0] bg-white py-3.5 px-4 sm:px-8 flex items-center justify-center z-10 text-center shadow-2xs">
        <div className="flex items-center justify-center text-center">
          <div className="relative w-40 h-10">
            <Image
              src="/LogoWithText.png"
              alt="SubAI Brand"
              fill
              sizes="160px"
              priority
              className="object-contain"
            />
          </div>
        </div>
      </header>

      {/* CENTRAL AUTHENTICATION STAGE */}
      <div className="flex-1 flex items-center justify-center py-6 sm:py-10 px-4">
        <div className="w-full flex items-center justify-center">
          <AuthCard />
        </div>
      </div>

      {/* BOTTOM AUDIT & COMPLIANCE FOOTER */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-3 px-4 sm:px-8 text-center text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
        <div className="flex items-center justify-center gap-4 text-center">
          <span className="flex items-center gap-1 text-[#0F172A] font-medium">
            <Droplet className="w-3.5 h-3.5 text-[#30AFFF]" />
            Pure Water Logistics
          </span>
          <span className="flex items-center gap-1 text-[#0F172A] font-medium">
            <Recycle className="w-3.5 h-3.5 text-[#059669]" />
            Circular Chain-of-Custody
          </span>
        </div>
        <p className="text-[11px] text-center">
          TubigLoop Portal &bull; Physical handling by authorized maintenance personnel & partner recyclers.
        </p>
      </footer>
    </main>
  );
}
