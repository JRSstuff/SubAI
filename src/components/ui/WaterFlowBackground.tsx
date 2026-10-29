"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export function WaterFlowBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stream1Ref = useRef<SVGGElement>(null);
  const stream2Ref = useRef<SVGGElement>(null);
  const stream3Ref = useRef<SVGGElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Continuous smooth horizontal water currents (Streamlines)
      if (stream1Ref.current) {
        gsap.to(stream1Ref.current, {
          x: "-=600",
          duration: 22,
          ease: "none",
          repeat: -1,
        });
      }

      if (stream2Ref.current) {
        gsap.to(stream2Ref.current, {
          x: "+=600",
          duration: 28,
          ease: "none",
          repeat: -1,
        });
      }

      if (stream3Ref.current) {
        gsap.to(stream3Ref.current, {
          x: "-=450",
          y: "+=12",
          duration: 18,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      }

      // 2. Animate floating eco-droplets & circulation particles
      if (particlesRef.current) {
        const particles = particlesRef.current.children;
        Array.from(particles).forEach((p, idx) => {
          const duration = 8 + (idx % 5) * 2;
          const delay = (idx % 4) * 1.2;
          const yDist = 60 + (idx % 4) * 30;
          const xDist = 15 + (idx % 3) * 10;

          gsap.to(p, {
            y: `-=${yDist}`,
            x: idx % 2 === 0 ? `+=${xDist}` : `-=${xDist}`,
            rotation: (idx % 2 === 0 ? 1 : -1) * 25,
            opacity: 0.38,
            duration: duration,
            delay: delay,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
      }

      // 3. Ambient interactive mouse hydro-glow (smooth lag follow)
      if (glowRef.current) {
        const xTo = gsap.quickTo(glowRef.current, "x", { duration: 0.8, ease: "power2.out" });
        const yTo = gsap.quickTo(glowRef.current, "y", { duration: 0.8, ease: "power2.out" });

        const handlePointerMove = (e: PointerEvent) => {
          xTo(e.clientX - 160);
          yTo(e.clientY - 160);
        };

        window.addEventListener("pointermove", handlePointerMove, { passive: true });
        return () => window.removeEventListener("pointermove", handlePointerMove);
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* ─── INTERACTIVE HYDRO-AURA (Subtle cursor follower) ─── */}
      <div
        ref={glowRef}
        className="hidden sm:block absolute w-80 h-80 rounded-full opacity-35 blur-3xl pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(146, 238, 255, 0.45) 0%, rgba(48, 175, 255, 0.15) 40%, transparent 70%)",
          transform: "translate3d(-999px, -999px, 0)",
        }}
      />

      {/* ─── SVG STREAMLINES & WATER WAVE CURRENTS ─── */}
      <svg
        className="absolute w-[200vw] h-full -left-[50vw] top-0 opacity-70"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 2400 1000"
      >
        <defs>
          {/* Linear gradient along stream ribbon */}
          <linearGradient id="streamGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#30AFFF" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#92EEFF" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#30AFFF" stopOpacity="0.04" />
          </linearGradient>

          <linearGradient id="streamGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#D8FFC5" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#C4F7CA" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#92EEFF" stopOpacity="0.06" />
          </linearGradient>

          <linearGradient id="streamGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#30AFFF" stopOpacity="0.03" />
            <stop offset="70%" stopColor="#92EEFF" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#30AFFF" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Streamline Layer 1: Sky Blue Deep Current */}
        <g ref={stream1Ref}>
          <path
            d="M0,280 C300,340 600,220 900,280 C1200,340 1500,220 1800,280 C2100,340 2400,220 2700,280 C3000,340 3300,220 3600,280 L3600,380 C3300,320 3000,440 2700,380 C2400,320 2100,440 1800,380 C1500,320 1200,440 900,380 C600,320 300,440 0,380 Z"
            fill="url(#streamGrad1)"
          />
        </g>

        {/* Streamline Layer 2: Eco Mint Circulation Loop */}
        <g ref={stream2Ref}>
          <path
            d="M0,640 C350,580 700,700 1050,640 C1400,580 1750,700 2100,640 C2450,580 2800,700 3150,640 C3500,580 3850,700 4200,640 L4200,740 C3850,800 3500,680 3150,740 C2800,800 2450,680 2100,740 C1750,800 1400,680 1050,740 C700,800 350,680 0,740 Z"
            fill="url(#streamGrad2)"
          />
        </g>

        {/* Streamline Layer 3: Cyan Surface Tributary */}
        <g ref={stream3Ref}>
          <path
            d="M0,450 Q450,390 900,460 T1800,450 T2700,460 T3600,450"
            fill="none"
            stroke="url(#streamGrad3)"
            strokeWidth="3.5"
            strokeDasharray="16 8"
            opacity="0.65"
          />
          <path
            d="M0,520 Q480,570 960,510 T1920,530 T2880,510 T3840,530"
            fill="none"
            stroke="url(#streamGrad1)"
            strokeWidth="2.5"
            strokeDasharray="12 12"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* ─── FLOATING ECO-DROPLETS & CIRCULATION NODES ─── */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden">
        {/* Droplet 1 (Top Left) */}
        <div
          className="absolute top-[18%] left-[8%] w-4 h-4 rounded-full bg-[#92EEFF]/30 border border-[#30AFFF]/30 shadow-xs backdrop-blur-2xs opacity-20"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 2 (Mid Left) */}
        <div
          className="absolute top-[46%] left-[14%] w-6 h-6 rounded-full bg-[#D8FFC5]/30 border border-[#10B981]/30 shadow-xs backdrop-blur-2xs opacity-25"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 3 (Bottom Left) */}
        <div
          className="absolute top-[78%] left-[6%] w-3.5 h-3.5 rounded-full bg-[#30AFFF]/25 border border-[#30AFFF]/40 shadow-xs opacity-20"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 4 (Top Center) */}
        <div
          className="absolute top-[12%] left-[48%] w-5 h-5 rounded-full bg-[#92EEFF]/35 border border-[#30AFFF]/35 shadow-xs opacity-25"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 5 (Top Right) */}
        <div
          className="absolute top-[22%] right-[12%] w-4 h-4 rounded-full bg-[#C4F7CA]/30 border border-[#059669]/30 shadow-xs opacity-25"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 6 (Mid Right) */}
        <div
          className="absolute top-[52%] right-[8%] w-7 h-7 rounded-full bg-[#92EEFF]/25 border border-[#30AFFF]/30 shadow-xs backdrop-blur-2xs opacity-20"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 7 (Bottom Right) */}
        <div
          className="absolute top-[82%] right-[16%] w-5 h-5 rounded-full bg-[#D8FFC5]/35 border border-[#10B981]/35 shadow-xs opacity-25"
          style={{ willChange: "transform, opacity" }}
        />

        {/* Droplet 8 (Bottom Center) */}
        <div
          className="absolute top-[88%] left-[42%] w-3 h-3 rounded-full bg-[#30AFFF]/30 border border-[#30AFFF]/40 shadow-xs opacity-20"
          style={{ willChange: "transform, opacity" }}
        />
      </div>
    </div>
  );
}
