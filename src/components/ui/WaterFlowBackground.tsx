"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export function WaterFlowBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wave1Ref = useRef<SVGPathElement>(null);
  const wave2Ref = useRef<SVGPathElement>(null);
  const wave3Ref = useRef<SVGPathElement>(null);
  const bubbleContainerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  useEffect(() => {
    // 1. Interactive Click/Tap Water Ripple Effect
    const handleClick = (e: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      if (clientX === 0 && clientY === 0) return;

      const newRipple: ClickRipple = {
        id: Date.now() + Math.random(),
        x: clientX,
        y: clientY,
      };

      setRipples((prev) => [...prev.slice(-6), newRipple]);

      // Remove after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener("pointerdown", handleClick, { passive: true });

    // 2. GreenSock (GSAP) Wave & Bubble Physics
    const ctx = gsap.context(() => {
      // Wave 1: Rapid Surface Wave (Duration 6s)
      if (wave1Ref.current) {
        gsap.to(wave1Ref.current, {
          x: -600,
          duration: 6,
          ease: "none",
          repeat: -1,
        });
      }

      // Wave 2: Counter Fluid Wave (Duration 9s)
      if (wave2Ref.current) {
        gsap.to(wave2Ref.current, {
          x: 600,
          duration: 9,
          ease: "none",
          repeat: -1,
        });
      }

      // Wave 3: Deep Rolling Swell (Duration 12s)
      if (wave3Ref.current) {
        gsap.to(wave3Ref.current, {
          x: -450,
          duration: 12,
          ease: "none",
          repeat: -1,
        });
      }

      // Animate Floating Eco Hydro-Bubbles
      if (bubbleContainerRef.current) {
        const bubbles = bubbleContainerRef.current.children;
        Array.from(bubbles).forEach((b, i) => {
          const duration = 5 + (i % 4) * 2;
          const yRange = 80 + (i % 3) * 40;
          const xRange = 25 + (i % 4) * 15;

          gsap.to(b, {
            y: `-=${yRange}`,
            x: i % 2 === 0 ? `+=${xRange}` : `-=${xRange}`,
            scale: "+=0.18",
            duration: duration,
            delay: i * 0.4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        });
      }
    }, containerRef);

    return () => {
      window.removeEventListener("pointerdown", handleClick);
      ctx.revert();
    };
  }, []);

  return (
    <>
      {/* ─── INTERACTIVE WATER RIPPLES ON TAP/CLICK (Elevated to z-50 so they display over all UI!) ─── */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden select-none">
        {ripples.map((r) => (
          <span
            key={r.id}
            className="absolute rounded-full border-2 border-[#30AFFF] pointer-events-none animate-ripple-expand"
            style={{
              left: r.x - 40,
              top: r.y - 40,
              width: 80,
              height: 80,
              boxShadow: "0 0 24px rgba(48, 175, 255, 0.7), inset 0 0 16px rgba(146, 238, 255, 0.6)",
            }}
          />
        ))}
      </div>

      <div
        ref={containerRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      >
        {/* ─── TOP AMBIENT HYDRO MIST ─── */}
        <div
          className="absolute top-0 left-0 right-0 h-44 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(ellipse at 50% -20%, rgba(146, 238, 255, 0.45) 0%, rgba(48, 175, 255, 0.15) 50%, transparent 80%)",
          }}
        />

        {/* ─── DIAGONAL FLOWING WATER STREAMLINES (Central Grid) ─── */}
        <svg
          className="absolute inset-0 w-full h-full opacity-45 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="streamCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#30AFFF" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#92EEFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#30AFFF" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="streamMint" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D8FFC5" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#C4F7CA" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#92EEFF" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Diagonal Aqueduct Stream 1 */}
          <path
            d="M -100 200 C 300 250, 600 150, 1000 300 C 1400 450, 1800 350, 2200 450"
            fill="none"
            stroke="url(#streamCyan)"
            strokeWidth="3"
            strokeDasharray="16 10"
            className="animate-[dash_20s_linear_infinite]"
          />

          {/* Diagonal Aqueduct Stream 2 */}
          <path
            d="M -100 650 C 400 580, 900 720, 1400 600 C 1800 500, 2200 620, 2600 550"
            fill="none"
            stroke="url(#streamMint)"
            strokeWidth="3.5"
            strokeDasharray="20 12"
            className="animate-[dash_25s_linear_infinite]"
          />
        </svg>

        {/* ─── VIBRANT FLOATING GLOSSY ECO-BUBBLES ─── */}
        <div ref={bubbleContainerRef} className="absolute inset-0 pointer-events-none">
          {/* Bubble 1 */}
          <div
            className="absolute top-[20%] left-[8%] w-8 h-8 rounded-full border border-white/80 shadow-[0_0_15px_rgba(48,175,255,0.45)] flex items-center justify-center opacity-85"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(146,238,255,0.65) 45%, rgba(48,175,255,0.4) 80%)",
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white/90 -mt-2 -ml-2" />
          </div>

          {/* Bubble 2 */}
          <div
            className="absolute top-[48%] left-[12%] w-11 h-11 rounded-full border border-white/80 shadow-[0_0_18px_rgba(16,185,129,0.35)] flex items-center justify-center opacity-80"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(216,255,197,0.7) 45%, rgba(16,185,129,0.35) 80%)",
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white/95 -mt-3 -ml-3" />
          </div>

          {/* Bubble 3 */}
          <div
            className="absolute top-[72%] left-[6%] w-6 h-6 rounded-full border border-white/80 shadow-[0_0_12px_rgba(48,175,255,0.4)] opacity-75"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(146,238,255,0.7) 60%, rgba(48,175,255,0.4) 100%)",
            }}
          />

          {/* Bubble 4 */}
          <div
            className="absolute top-[15%] right-[10%] w-10 h-10 rounded-full border border-white/80 shadow-[0_0_16px_rgba(48,175,255,0.4)] flex items-center justify-center opacity-80"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9) 0%, rgba(146,238,255,0.65) 50%, rgba(48,175,255,0.4) 85%)",
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white/90 -mt-2.5 -ml-2.5" />
          </div>

          {/* Bubble 5 */}
          <div
            className="absolute top-[55%] right-[14%] w-7 h-7 rounded-full border border-white/80 shadow-[0_0_14px_rgba(5,150,105,0.35)] opacity-85"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(196,247,202,0.75) 50%, rgba(5,150,105,0.35) 90%)",
            }}
          />

          {/* Bubble 6 */}
          <div
            className="absolute top-[80%] right-[8%] w-12 h-12 rounded-full border border-white/80 shadow-[0_0_20px_rgba(48,175,255,0.4)] flex items-center justify-center opacity-80"
            style={{
              background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(146,238,255,0.7) 50%, rgba(48,175,255,0.45) 85%)",
            }}
          >
            <div className="w-3 h-3 rounded-full bg-white/95 -mt-3.5 -ml-3.5" />
          </div>
        </div>

        {/* ─── BOTTOM ROLLING LIQUID WATER WAVES (GSAP Powered) ─── */}
        <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-64 pointer-events-none overflow-hidden">
          <svg
            className="absolute bottom-0 left-0 w-[4000px] h-full"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            viewBox="0 0 4000 300"
          >
            {/* Wave Layer 3: Deep Aqua Mint Back Wave */}
            <path
              ref={wave3Ref}
              d="M 0 140 Q 150 90, 300 140 T 600 140 T 900 140 T 1200 140 T 1500 140 T 1800 140 T 2100 140 T 2400 140 T 2700 140 T 3000 140 T 3300 140 T 3600 140 T 3900 140 T 4200 140 L 4200 300 L 0 300 Z"
              fill="#D8FFC5"
              opacity="0.65"
            />

            {/* Wave Layer 2: Soft Cyan Middle Wave */}
            <path
              ref={wave2Ref}
              d="M -600 160 Q -450 100, -300 160 T 0 160 T 300 160 T 600 160 T 900 160 T 1200 160 T 1500 160 T 1800 160 T 2100 160 T 2400 160 T 2700 160 T 3000 160 T 3300 160 T 3600 160 L 3600 300 L -600 300 Z"
              fill="#92EEFF"
              opacity="0.75"
            />

            {/* Wave Layer 1: SubAI Sky Blue Front Rolling Wave */}
            <path
              ref={wave1Ref}
              d="M 0 190 Q 150 130, 300 190 T 600 190 T 900 190 T 1200 190 T 1500 190 T 1800 190 T 2100 190 T 2400 190 T 2700 190 T 3000 190 T 3300 190 T 3600 190 T 3900 190 T 4200 190 L 4200 300 L 0 300 Z"
              fill="#30AFFF"
              opacity="0.85"
            />
          </svg>

          {/* Froth / Sparkle Foam Crest */}
          <div className="absolute bottom-20 sm:bottom-28 left-0 right-0 h-1.5 bg-linear-to-r from-transparent via-white to-transparent blur-[1px] opacity-80" />
        </div>
      </div>
    </>
  );
}
