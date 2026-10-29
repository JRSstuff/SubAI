"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { AuthCard } from "@/components/auth/AuthCard";
import { Droplet, Recycle, Droplets } from "lucide-react";
import gsap from "gsap";

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const authStageRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Smooth GSAP Entrance Timeline
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        headerRef.current,
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 }
      )
        .fromTo(
          authStageRef.current,
          { y: 24, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.75 },
          "-=0.3"
        )
        .fromTo(
          footerRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.4"
        );
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <main
      ref={pageRef}
      className="min-h-screen w-full flex flex-col justify-between bg-transparent text-[#0F172A] relative overflow-x-hidden"
    >
      {/* TOP BRAND BAR with Ambient Hydro-Flow Accent */}
      <header
        ref={headerRef}
        className="relative w-full border-b border-[#E2E8F0] bg-white/90 backdrop-blur-md py-3.5 px-4 sm:px-8 flex items-center justify-between z-10 shadow-2xs"
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-36 sm:w-40 h-10">
            <Image
              src="/LogoWithText.png"
              alt="SubAI Brand"
              fill
              sizes="160px"
              priority
              className="object-contain object-left"
            />
          </div>
        </div>

        {/* Eco Hydro Indicator Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#D8FFC5]/50 text-[#064E3B] border border-[#10B981]/30 rounded-full text-[11px] font-bold shadow-2xs">
          <Droplets className="w-3.5 h-3.5 text-[#059669] animate-pulse" />
          <span>Active Urban Drainage &bull; Circular Recovery</span>
        </div>

        {/* Ambient bottom hydro-streamline */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#30AFFF]/60 to-transparent" />
      </header>

      {/* CENTRAL AUTHENTICATION STAGE */}
      <div
        ref={authStageRef}
        className="flex-1 flex items-center justify-center py-6 sm:py-10 px-4 relative z-10"
      >
        <div className="w-full flex items-center justify-center">
          <AuthCard />
        </div>
      </div>

      {/* BOTTOM AUDIT & COMPLIANCE FOOTER */}
      <footer
        ref={footerRef}
        className="w-full border-t border-[#E2E8F0] bg-white/90 backdrop-blur-md py-3 px-4 sm:px-8 text-center text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 z-10"
      >
        <div className="flex items-center justify-center gap-4 text-center">
          <span className="flex items-center gap-1.5 text-[#0F172A] font-medium">
            <Droplet className="w-3.5 h-3.5 text-[#30AFFF]" />
            Pure Water Logistics
          </span>
          <span className="flex items-center gap-1.5 text-[#0F172A] font-medium">
            <Recycle className="w-3.5 h-3.5 text-[#059669]" />
            Circular Chain-of-Custody
          </span>
        </div>
        <p className="text-[11px] text-center">
          SubAI Portal &bull; Physical handling by authorized maintenance personnel & partner recyclers.
        </p>
      </footer>
    </main>
  );
}
