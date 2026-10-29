"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1200 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          key="subai-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.45, ease: "easeInOut" } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] px-6 select-none"
        >
          {/* Subtle water-ripple animated backdrop indicator */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Water loop pulse rings */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-64 h-64 rounded-full border-2 border-[#92EEFF]"
            />
            <motion.div
              animate={{
                scale: [1, 1.28, 1],
                opacity: [0.1, 0.25, 0.1],
              }}
              transition={{
                duration: 2.2,
                delay: 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute w-80 h-80 rounded-full border border-[#30AFFF]"
            />

            {/* Central Logo Box */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10 flex flex-col items-center bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-md max-w-xs sm:max-w-sm"
            >
              <div className="relative w-64 h-24 sm:w-72 sm:h-28">
                <Image
                  src="/LogoWithText.png"
                  alt="SubAI - Urban Drainage Terminal"
                  fill
                  sizes="(max-width: 640px) 256px, 288px"
                  priority
                  className="object-contain"
                />
              </div>

              {/* Minimal Loading Tracker */}
              <div className="w-full mt-5 flex flex-col items-center gap-2">
                <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.1,
                      ease: "easeInOut",
                    }}
                    className="h-full w-1/2 bg-[#30AFFF] rounded-full"
                  />
                </div>
                <span className="text-xs font-medium text-[#475569] tracking-wider uppercase">
                  Loading portal...
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
