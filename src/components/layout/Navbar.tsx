"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FilePlus2,
  MapPin,
  ClipboardList,
  Wrench,
  BarChart3,
  CloudRain,
  LogOut,
  User,
} from "lucide-react";
import { getCurrentUserAction, handleLogoutAction } from "@/app/actions/auth";

interface NavbarProps {
  currentUser?: {
    username: string;
    role: string;
    email?: string;
  } | null;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { href: "/report", label: "Report", icon: FilePlus2 },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/review", label: "Review", icon: ClipboardList },
  { href: "/tasks", label: "Tasks", icon: Wrench },
  { href: "/dashboard", label: "Impact", icon: BarChart3 },
  { href: "/rain-bank", label: "Rain Bank", icon: CloudRain },
];

export function Navbar({ currentUser, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    if (!currentUser) {
      getCurrentUserAction().then((u) => {
        if (u) setUser(u);
      });
    } else {
      setUser(currentUser);
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    if (onLogout) onLogout();
    await handleLogoutAction();
    window.location.href = "/";
  };

  // If on login/register root, don't show the full nav header
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      {/* ─── DESKTOP HEADER (md:flex) ─── */}
      <header className="hidden md:flex sticky top-0 z-40 w-full h-16 bg-white border-b border-[#E2E8F0] px-6 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/report" className="relative w-36 h-9 shrink-0">
            <Image
              src="/TubigLoopLogoWithText.png"
              alt="TubigLoop"
              fill
              priority
              sizes="144px"
              className="object-contain object-left"
            />
          </Link>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#30AFFF] text-white shadow-sm"
                      : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
            <div className="w-7 h-7 rounded-lg bg-[#92EEFF] text-[#0F172A] flex items-center justify-center font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-[#0F172A] leading-tight truncate max-w-[130px]">
                {user?.username || "Campus Pilot User"}
              </span>
              <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
                {user?.role || "REPORTER"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title="Switch User / Sign Out"
            className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 hover:border-[#FCA5A5] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── MOBILE BOTTOM BAR (md:hidden) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-[#30AFFF] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-[#92EEFF]/30" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
