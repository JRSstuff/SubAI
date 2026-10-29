"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Camera,
  MapPin,
  ClipboardList,
  Wrench,
  BarChart3,
  CloudRain,
  LogOut,
  User,
  ShieldCheck,
  Crown,
  FileText,
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

const ALL_NAV_ITEMS = [
  { href: "/report", label: "Report", icon: Camera, roles: ["reporter", "admin"] },
  { href: "/map", label: "Map", icon: MapPin, roles: ["reporter", "reviewer", "collector", "recycler", "admin"] },
  { href: "/review", label: "Review", icon: ClipboardList, roles: ["reviewer", "admin"] },
  { href: "/tasks", label: "Tasks", icon: Wrench, roles: ["collector", "recycler", "admin"] },
  { href: "/dashboard", label: "Impact", icon: BarChart3, roles: ["reviewer", "recycler", "admin"] },
  { href: "/rain-bank", label: "Rain Bank", icon: CloudRain, roles: ["admin"] },
  { href: "/admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
];

const ROLE_PERMITTED_ROUTES: Record<string, string[]> = {
  reporter: ["/report", "/map"],
  reviewer: ["/review", "/map", "/dashboard"],
  collector: ["/tasks", "/map"],
  recycler: ["/dashboard", "/tasks", "/map"],
  admin: ["/admin", "/report", "/map", "/review", "/tasks", "/dashboard", "/rain-bank"],
};

const ROLE_HOME_ROUTE: Record<string, string> = {
  reporter: "/report",
  reviewer: "/review",
  collector: "/tasks",
  recycler: "/dashboard",
  admin: "/admin",
};

export function Navbar({ currentUser, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(currentUser || null);

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      return;
    }

    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        } else {
          getCurrentUserAction()
            .then((u) => {
              if (isMounted && u) setUser(u);
            })
            .catch(() => {
              // Silently ignore network/action failure
            });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        getCurrentUserAction()
          .then((u) => {
            if (isMounted && u) setUser(u);
          })
          .catch(() => {
            // Silently ignore network/action failure
          });
      });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Role Boundary Protection: Check if user has permission for the active path
  useEffect(() => {
    if (!user || pathname === "/") return;
    const roleKey = String(user.role || "reporter").toLowerCase();
    const permitted = ROLE_PERMITTED_ROUTES[roleKey] || ["/report", "/map"];

    const isAllowed = permitted.some((route) => pathname.startsWith(route));
    if (!isAllowed) {
      const fallback = ROLE_HOME_ROUTE[roleKey] || "/report";
      router.replace(fallback);
    }
  }, [user, pathname, router]);

  const handleSignOut = async () => {
    if (onLogout) onLogout();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    try {
      await handleLogoutAction();
    } catch {
      // ignore
    }
    window.location.href = "/";
  };

  if (pathname === "/") {
    return null;
  }

  const roleKey = String(user?.role || "reporter").toLowerCase();

  // Filter navigation items permitted for this specific role
  const allowedNavItems = ALL_NAV_ITEMS.filter((item) =>
    item.roles.includes(roleKey)
  );

  // Setup symmetrical items for mobile floating nav (Guarantees Camera FAB is dead-centered!)
  let mobileLeftItems: typeof ALL_NAV_ITEMS = [];
  let mobileRightItems: typeof ALL_NAV_ITEMS = [];
  let centerAction = { href: "/report", label: "Report", icon: Camera };

  if (roleKey === "reporter") {
    mobileLeftItems = [{ href: "/map", label: "Map", icon: MapPin, roles: ["reporter"] }];
    centerAction = { href: "/report", label: "Report", icon: Camera };
    mobileRightItems = [{ href: "/map", label: "Reports", icon: FileText, roles: ["reporter"] }];
  } else if (roleKey === "reviewer") {
    mobileLeftItems = [{ href: "/map", label: "Map", icon: MapPin, roles: ["reviewer"] }];
    centerAction = { href: "/review", label: "Review", icon: ClipboardList };
    mobileRightItems = [{ href: "/dashboard", label: "Impact", icon: BarChart3, roles: ["reviewer"] }];
  } else if (roleKey === "collector") {
    mobileLeftItems = [{ href: "/map", label: "Map", icon: MapPin, roles: ["collector"] }];
    centerAction = { href: "/tasks", label: "Tasks", icon: Wrench };
    mobileRightItems = [{ href: "/tasks", label: "Weigh", icon: Camera, roles: ["collector"] }];
  } else if (roleKey === "recycler") {
    mobileLeftItems = [{ href: "/map", label: "Map", icon: MapPin, roles: ["recycler"] }];
    centerAction = { href: "/dashboard", label: "Impact", icon: BarChart3 };
    mobileRightItems = [{ href: "/tasks", label: "Batches", icon: Wrench, roles: ["recycler"] }];
  } else {
    // Admin: 2 on left, Camera in center, 2 on right (Dead-centered 5 items)
    mobileLeftItems = [
      { href: "/map", label: "Map", icon: MapPin, roles: ["admin"] },
      { href: "/review", label: "Review", icon: ClipboardList, roles: ["admin"] },
    ];
    centerAction = { href: "/report", label: "Report", icon: Camera };
    mobileRightItems = [
      { href: "/tasks", label: "Tasks", icon: Wrench, roles: ["admin"] },
      { href: "/admin", label: "Admin", icon: ShieldCheck, roles: ["admin"] },
    ];
  }

  const CenterIcon = centerAction.icon;
  const isCenterActive = pathname === centerAction.href;

  return (
    <>
      {/* ─── DESKTOP HEADER (md:flex) ─── */}
      <header className="hidden md:flex sticky top-0 z-40 w-full h-16 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-6 items-center justify-between relative">
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-linear-to-r from-[#30AFFF]/20 via-[#92EEFF] to-[#30AFFF]/20 water-shimmer pointer-events-none" />
        <div className="flex items-center gap-6">
          <Link href={ROLE_HOME_ROUTE[roleKey] || "/report"} className="relative w-36 h-9 shrink-0">
            <Image
              src="/LogoWithText.png"
              alt="SubAI"
              fill
              priority
              sizes="144px"
              className="object-contain object-left"
            />
          </Link>

          {/* Role-Restricted Desktop Navigation Bar */}
          <nav className="flex items-center gap-1.5">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#30AFFF] text-white shadow-xs"
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
              {roleKey === "admin" ? (
                <Crown className="w-3.5 h-3.5 text-[#0F172A]" />
              ) : (
                <User className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="font-bold text-[#0F172A] leading-tight truncate max-w-[130px]">
                {user?.username || "SubAI User"}
              </span>
              <span className="text-[10px] text-[#30AFFF] font-extrabold uppercase tracking-wider">
                {user?.role || "REPORTER"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2]/50 hover:border-[#FCA5A5] transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── MOBILE MINIMAL TOP APP BAR (md:hidden) ─── */}
      <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 flex items-center justify-between relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-linear-to-r from-[#30AFFF]/20 via-[#92EEFF] to-[#30AFFF]/20 water-shimmer pointer-events-none" />
        <Link href={ROLE_HOME_ROUTE[roleKey] || "/report"} className="relative w-28 h-7 shrink-0">
          <Image
            src="/LogoWithText.png"
            alt="SubAI"
            fill
            priority
            sizes="112px"
            className="object-contain object-left"
          />
        </Link>

        <div className="flex items-center gap-2">
          {/* Authorized Role Pill (Color Palette) */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#D8FFC5] text-[#0F2E1B] border border-[#86EFAC] rounded-full text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="uppercase">{user?.role || "REPORTER"}</span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded-xl border border-[#CBD5E1] text-[#64748B] hover:text-[#DC2626] transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ─── MOBILE FLOATING CAPSULE BAR (md:hidden) ─── */}
      {/* 100% Theme Color Palette ONLY - ZERO Black Container - Perfectly Centered Camera FAB */}
      <nav className="md:hidden fixed bottom-3 left-4 right-4 z-40 max-w-sm mx-auto bg-white/95 backdrop-blur-md rounded-full py-1.5 px-3 flex items-center shadow-2xl border-2 border-[#92EEFF]/40 text-[#0F172A]">
        {/* Left Side Items (flex-1 guarantees equal width on left) */}
        <div className="flex-1 flex items-center justify-around">
          {mobileLeftItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "text-[#30AFFF] font-bold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? "bg-[#92EEFF]/30 text-[#30AFFF]" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Center: Prominent Elevated Circular Action FAB (100% Mathematically Centered) */}
        <div className="shrink-0 relative -top-5 flex items-center justify-center mx-1">
          <div className="absolute -inset-1 rounded-full bg-[#92EEFF]/60 animate-ping opacity-40 pointer-events-none" />
          <Link
            href={centerAction.href}
            className={`w-14 h-14 rounded-full bg-[#30AFFF] text-white flex items-center justify-center shadow-lg shadow-[#30AFFF]/40 border-4 border-white active:scale-95 transition-all cursor-pointer ${
              isCenterActive ? "ring-3 ring-[#92EEFF]" : ""
            }`}
            title={centerAction.label}
          >
            <CenterIcon className="w-6 h-6 text-white stroke-[2.3]" />
          </Link>
        </div>

        {/* Right Side Items (flex-1 guarantees equal width on right) */}
        <div className="flex-1 flex items-center justify-around">
          {mobileRightItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={`${item.href}-${idx}`}
                href={item.href}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                  isActive
                    ? "text-[#30AFFF] font-bold"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isActive ? "bg-[#92EEFF]/30 text-[#30AFFF]" : ""
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
