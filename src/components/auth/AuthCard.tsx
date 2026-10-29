"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Recycle,
  Wrench,
  Megaphone,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Crown,
} from "lucide-react";

const ROLES = [
  {
    id: "reporter",
    title: "Community Reporter",
    desc: "Spot & report drainage blocks",
    icon: Megaphone,
    activeColor: "bg-[#92EEFF] text-[#0F172A] border-[#30AFFF]",
  },
  {
    id: "reviewer",
    title: "Reviewer & Dispatch",
    desc: "Triage priority & assign tasks",
    icon: ClipboardCheck,
    activeColor: "bg-[#30AFFF] text-white border-[#127dc7]",
  },
  {
    id: "collector",
    title: "Authorized Collector",
    desc: "Weigh batches & photo evidence",
    icon: Wrench,
    activeColor: "bg-[#D8FFC5] text-[#0F2E1B] border-[#10B981]",
  },
  {
    id: "recycler",
    title: "Partner Recycler",
    desc: "Confirm custody & accept kg",
    icon: Recycle,
    activeColor: "bg-[#C4F7CA] text-[#064E3B] border-[#059669]",
  },
  {
    id: "admin",
    title: "System Administrator",
    desc: "Governance, RBAC & system audit",
    icon: Crown,
    activeColor: "bg-[#0F172A] text-white border-[#30AFFF]",
  },
];

const DEMO_ACCOUNTS = [
  { label: "Reporter", email: "reporter@tubigloop.edu", role: "reporter", target: "/report" },
  { label: "Reviewer", email: "reviewer@tubigloop.edu", role: "reviewer", target: "/review" },
  { label: "Collector", email: "collector@tubigloop.edu", role: "collector", target: "/tasks" },
  { label: "Recycler", email: "recycler@tubigloop.edu", role: "recycler", target: "/dashboard" },
  { label: "Admin", email: "admin@tubigloop.edu", role: "admin", target: "/admin" },
];

export function AuthCard() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Server response state
  const [serverResponse, setServerResponse] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Form field states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("reporter");

  // Clean any trailing /? from the address bar if previous native submission added it
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const toggleMode = (newMode: "login" | "register") => {
    setServerResponse(null);
    setMode(newMode);
  };

  const getDestination = (userRole?: string) => {
    const r = (userRole || "").toLowerCase();
    if (r === "admin") return "/admin";
    if (r === "reviewer") return "/review";
    if (r === "collector") return "/tasks";
    if (r === "recycler") return "/dashboard";
    return "/report";
  };

  const executeLogin = async (loginUser: string, loginPass: string) => {
    setIsLoading(true);
    setServerResponse(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });

      const data = await res.json();
      setServerResponse(data);

      if (data.success) {
        setRedirecting(true);
        const destination = getDestination(data.user?.role);
        // Instant client transition + hard fallback
        router.push(destination);
        setTimeout(() => {
          window.location.assign(destination);
        }, 150);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
      setServerResponse({
        success: false,
        message: "Unable to connect to login service. Please retry.",
      });
    }
  };

  const handleManualLogin = () => {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setServerResponse({ success: false, message: "Please enter your username or email." });
      return;
    }
    if (!password) {
      setServerResponse({ success: false, message: "Please enter your password." });
      return;
    }
    executeLogin(cleanUsername, password);
  };

  const handleQuickLogin = (demoEmail: string) => {
    setUsername(demoEmail);
    setPassword("tubigloop123");
    executeLogin(demoEmail, "tubigloop123");
  };

  const handleRegisterSubmit = async () => {
    setServerResponse(null);

    const cleanName = username.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 3) {
      setServerResponse({ success: false, message: "Name must be at least 3 characters." });
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setServerResponse({ success: false, message: "Please enter a valid email address." });
      return;
    }
    if (!password || password.length < 6) {
      setServerResponse({ success: false, message: "Password must be at least 6 characters." });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanName,
          email: cleanEmail,
          password: password,
          role: role,
        }),
      });

      const data = await res.json();
      setServerResponse(data);

      if (data.success) {
        setRedirecting(true);
        const destination = getDestination(data.user?.role || role);
        router.push(destination);
        setTimeout(() => {
          window.location.assign(destination);
        }, 150);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
      setServerResponse({
        success: false,
        message: "Unable to complete registration. Please retry.",
      });
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden select-none">
      {/* ─── HEADER: Curved Brand Card Top (Matching Reference Images) ─── */}
      <div className="bg-[#30AFFF] p-6 text-white text-center flex flex-col items-center rounded-b-[36px] shadow-sm">
        <div className="relative w-44 h-16 drop-shadow-sm mb-1">
          <Image
            src="/LogoWithText.png"
            alt="SubAI Logo"
            fill
            sizes="176px"
            priority
            className="object-contain"
          />
        </div>
        <p className="text-xs text-white/95 font-medium">
          Urban Drainage & Circular Recovery Terminal
        </p>

        {/* Segmented Switcher Pill */}
        <div className="mt-4 inline-flex p-1 bg-black/15 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => toggleMode("login")}
            className={`px-6 py-2 rounded-xl transition-all cursor-pointer min-h-[38px] ${
              mode === "login"
                ? "bg-white text-[#30AFFF] shadow-sm"
                : "text-white hover:text-white/80"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => toggleMode("register")}
            className={`px-6 py-2 rounded-xl transition-all cursor-pointer min-h-[38px] ${
              mode === "register"
                ? "bg-white text-[#30AFFF] shadow-sm"
                : "text-white hover:text-white/80"
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* ─── BODY: Pure Client Container (NO <form> TAG - Immune to Mobile GET /? Navigation) ─── */}
      <div className="p-5 sm:p-7 flex flex-col gap-3.5">
        {/* Quick Pilot 1-Tap Entry (When in Login Mode) */}
        {mode === "login" && (
          <div className="flex flex-col gap-2 pb-1 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#475569] flex items-center justify-between uppercase tracking-wider">
              <span className="flex items-center gap-1 text-[#0F172A]">
                <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                1-Tap Quick Pilot Login:
              </span>
              <span className="text-[10px] text-[#64748B] lowercase font-medium">instant test</span>
            </span>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email)}
                  disabled={isLoading || redirecting}
                  className="py-2 px-2.5 bg-white hover:bg-[#92EEFF]/30 active:bg-[#92EEFF] border border-[#CBD5E1] hover:border-[#30AFFF] rounded-xl text-xs font-bold text-[#0F172A] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs min-h-[46px]"
                >
                  <span className="text-[#30AFFF] font-extrabold">{acc.label}</span>
                  <span className="text-[9px] text-[#64748B] font-medium truncate w-full text-center">
                    {acc.target}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Role Selection (When in Register Mode) */}
        {mode === "register" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
              Authorized Account Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? `${r.activeColor} shadow-xs ring-2 ring-[#30AFFF]`
                        : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold truncate">{r.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Username / Full Name Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            id="auth-username"
            autoComplete="username"
            placeholder={mode === "login" ? "Email or Username" : "Full Name / Student ID"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (mode === "login") handleManualLogin();
                else handleRegisterSubmit();
              }
            }}
            disabled={isLoading || redirecting}
            className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
          />
          <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Email Input (Only in Register Mode) */}
        {mode === "register" && (
          <div className="relative flex items-center">
            <input
              type="email"
              id="auth-email"
              autoComplete="email"
              placeholder="Email Address (e.g. user@tubigloop.ph)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRegisterSubmit();
                }
              }}
              disabled={isLoading || redirecting}
              className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
            />
            <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
              <Mail className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Password Input */}
        <div className="relative flex items-center">
          <input
            type={showPassword ? "text" : "password"}
            id="auth-password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "login" ? "Password" : "Password (min 6 characters)"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (mode === "login") handleManualLogin();
                else handleRegisterSubmit();
              }
            }}
            disabled={isLoading || redirecting}
            className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Server Verified Status Banner (Rule 1: Real Authoritative OK) */}
        {serverResponse && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 text-xs font-bold transition-all ${
              serverResponse.success
                ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
            }`}
          >
            <div className="flex items-center gap-2">
              {serverResponse.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              )}
              <span>{serverResponse.message}</span>
            </div>
            {serverResponse.success && (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#064E3B]">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669]" />
                <span>Entering...</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            if (mode === "login") handleManualLogin();
            else handleRegisterSubmit();
          }}
          disabled={isLoading || redirecting}
          className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] active:scale-[0.99] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60 cursor-pointer min-h-[48px]"
        >
          {isLoading || redirecting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{redirecting ? "Entering..." : mode === "login" ? "Signing in..." : "Registering..."}</span>
            </>
          ) : (
            <>
              <span>{mode === "login" ? "Login" : "Register"}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
