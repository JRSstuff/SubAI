"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  ShieldCheck,
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

  // Form field states (shared between desktop and mobile)
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
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center select-none">
      {/* ─────────────────────────────────────────────────────────────
          DESKTOP & TABLET VIEW: Sliding Dual-Panel Container (md:flex)
          Matches the reference curved overlay animation and color palette
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex relative w-[880px] lg:w-[920px] min-h-[580px] bg-white rounded-[36px] border border-[#E2E8F0] shadow-2xl overflow-hidden">
        {/* UNDERLYING LEFT PANEL: Registration Form */}
        <div
          className={`w-1/2 p-8 lg:p-10 flex flex-col justify-center bg-white z-0 transition-opacity duration-300 ${
            mode === "register" ? "opacity-100 pointer-events-auto" : "opacity-30 pointer-events-none"
          }`}
        >
          <div className="w-full max-w-[360px] mx-auto flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1 items-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Registration</h2>
              <p className="text-xs text-[#64748B] font-medium">
                Create your verified SubAI credentials
              </p>
            </div>

            {/* Role Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[#475569] uppercase tracking-wider text-center block">
                Authorized Account Role
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ROLES.map((r, idx) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  const isLast = idx === ROLES.length - 1;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      tabIndex={mode === "register" ? 0 : -1}
                      onClick={() => setRole(r.id)}
                      className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer min-h-[38px] ${
                        isLast ? "col-span-2 max-w-[210px] w-full mx-auto" : ""
                      } ${
                        isSelected
                          ? `${r.activeColor} shadow-xs ring-2 ring-[#30AFFF]`
                          : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-bold truncate text-center">{r.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Inputs */}
            <div className="flex flex-col gap-2.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  tabIndex={mode === "register" ? 0 : -1}
                  placeholder="Full Name / User ID"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegisterSubmit();
                  }}
                  disabled={isLoading || redirecting}
                  className="w-full h-11 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                />
                <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type="email"
                  tabIndex={mode === "register" ? 0 : -1}
                  placeholder="Email Address (e.g. user@tubigloop.ph)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegisterSubmit();
                  }}
                  disabled={isLoading || redirecting}
                  className="w-full h-11 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                />
                <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                  <Mail className="w-4 h-4" />
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  tabIndex={mode === "register" ? 0 : -1}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRegisterSubmit();
                  }}
                  disabled={isLoading || redirecting}
                  className="w-full h-11 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={mode === "register" ? 0 : -1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Server Status Feedback */}
            {serverResponse && mode === "register" && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold transition-all ${
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
                {serverResponse.success && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669]" />}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              tabIndex={mode === "register" ? 0 : -1}
              onClick={handleRegisterSubmit}
              disabled={isLoading || redirecting}
              className="w-full h-11 bg-[#30AFFF] hover:bg-[#1f9eef] active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading || redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* UNDERLYING RIGHT PANEL: Login Form */}
        <div
          className={`w-1/2 p-8 lg:p-10 flex flex-col justify-center bg-white z-0 transition-opacity duration-300 ${
            mode === "login" ? "opacity-100 pointer-events-auto" : "opacity-30 pointer-events-none"
          }`}
        >
          <div className="w-full max-w-[360px] mx-auto flex flex-col gap-4 text-center">
            <div className="flex flex-col gap-1 items-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Login</h2>
              <p className="text-xs text-[#64748B] font-medium">
                Enter your credentials to access operations
              </p>
            </div>

            {/* 1-Tap Quick Pilot Login */}
            <div className="flex flex-col gap-2 pb-1 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0] text-center">
              <div className="flex items-center justify-center gap-1.5 text-center">
                <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                <span className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider">
                  1-Tap Quick Pilot Login
                </span>
                <span className="text-[10px] text-[#64748B] lowercase font-medium bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                  instant test
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    tabIndex={mode === "login" ? 0 : -1}
                    onClick={() => handleQuickLogin(acc.email)}
                    disabled={isLoading || redirecting}
                    className="flex-1 min-w-[90px] py-1.5 px-2 bg-white hover:bg-[#92EEFF]/30 active:bg-[#92EEFF] border border-[#CBD5E1] hover:border-[#30AFFF] rounded-xl text-xs font-bold text-[#0F172A] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs min-h-[42px] text-center"
                  >
                    <span className="text-[#30AFFF] font-extrabold text-center block w-full text-[11px]">
                      {acc.label}
                    </span>
                    <span className="text-[9px] text-[#64748B] font-medium truncate w-full text-center block">
                      {acc.target}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Inputs */}
            <div className="flex flex-col gap-2.5">
              <div className="relative flex items-center">
                <input
                  type="text"
                  tabIndex={mode === "login" ? 0 : -1}
                  placeholder="Email or Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleManualLogin();
                  }}
                  disabled={isLoading || redirecting}
                  className="w-full h-11 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                />
                <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  tabIndex={mode === "login" ? 0 : -1}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleManualLogin();
                  }}
                  disabled={isLoading || redirecting}
                  className="w-full h-11 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  tabIndex={mode === "login" ? 0 : -1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#64748B] hover:text-[#0F172A] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Server Status Feedback */}
            {serverResponse && mode === "login" && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs font-bold transition-all ${
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
                {serverResponse.success && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669]" />}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              tabIndex={mode === "login" ? 0 : -1}
              onClick={handleManualLogin}
              disabled={isLoading || redirecting}
              className="w-full h-11 bg-[#30AFFF] hover:bg-[#1f9eef] active:scale-[0.99] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading || redirecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE CURVED SLIDING OVERLAY PANEL
            Slides smoothly left <-> right with morphing curved radius
            ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={false}
          animate={{
            x: mode === "login" ? "0%" : "100%",
            borderTopLeftRadius: mode === "login" ? "36px" : "160px",
            borderBottomLeftRadius: mode === "login" ? "36px" : "160px",
            borderTopRightRadius: mode === "login" ? "160px" : "36px",
            borderBottomRightRadius: mode === "login" ? "160px" : "36px",
          }}
          transition={{
            type: "spring",
            stiffness: 220,
            damping: 28,
            mass: 0.9,
          }}
          className="absolute top-0 left-0 w-1/2 h-full bg-[#30AFFF] text-white z-20 flex flex-col items-center justify-center p-8 lg:p-10 overflow-hidden shadow-2xl select-none"
        >
          {/* Eco badge badge at top */}
          <div className="absolute top-6 flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white border border-white/25">
            <ShieldCheck className="w-3.5 h-3.5 text-[#92EEFF]" />
            <span>Authorized Operations Terminal</span>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              /* Content shown when overlay is on the LEFT (prompting to Register) */
              <motion.div
                key="welcome-prompt"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-5 max-w-[300px]"
              >
                <div className="relative w-24 h-24 bg-white rounded-3xl p-3 shadow-md flex items-center justify-center border border-white/40">
                  <Image
                    src="/logo512x512.png"
                    alt="SubAI Logo"
                    width={80}
                    height={80}
                    priority
                    className="object-contain"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-center">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Hello, Welcome!
                  </h1>
                  <p className="text-sm font-medium text-white/95 leading-relaxed">
                    Don&apos;t have an account yet? Register to coordinate and report drainage points.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMode("register")}
                  className="w-44 h-11 border-2 border-white text-white hover:bg-white hover:text-[#30AFFF] font-bold text-sm rounded-full transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                >
                  Register
                </button>
              </motion.div>
            ) : (
              /* Content shown when overlay is on the RIGHT (prompting to Login - Matches user's example!) */
              <motion.div
                key="welcome-back-prompt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center gap-5 max-w-[300px]"
              >
                <div className="relative w-24 h-24 bg-white rounded-3xl p-3 shadow-md flex items-center justify-center border border-white/40">
                  <Image
                    src="/logo512x512.png"
                    alt="SubAI Logo"
                    width={80}
                    height={80}
                    priority
                    className="object-contain"
                  />
                </div>

                <div className="flex flex-col gap-1.5 text-center">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Welcome Back!
                  </h1>
                  <p className="text-sm font-medium text-white/95 leading-relaxed">
                    Already have an account? Sign in with your operational credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleMode("login")}
                  className="w-44 h-11 border-2 border-white text-white hover:bg-white hover:text-[#30AFFF] font-bold text-sm rounded-full transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
                >
                  Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE VIEW: Clean Native Touch Container (md:hidden)
          Curved top brand header + responsive centered card
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-md mx-auto md:hidden bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden select-none">
        {/* Mobile Header: Curved Brand Top */}
        <div className="bg-[#30AFFF] p-6 text-white text-center flex flex-col items-center justify-center rounded-b-[36px] shadow-sm">
          <div className="relative w-44 h-14 drop-shadow-sm mb-1 flex items-center justify-center">
            <Image
              src="/LogoWithText.png"
              alt="SubAI Logo"
              fill
              sizes="176px"
              priority
              className="object-contain"
            />
          </div>
          <p className="text-xs text-white/95 font-medium text-center max-w-xs mx-auto leading-relaxed">
            Urban Drainage & Circular Recovery Terminal
          </p>

          {/* Segmented Switcher Pill */}
          <div className="mt-4 inline-flex p-1 bg-black/15 rounded-2xl text-xs font-bold justify-center items-center">
            <button
              type="button"
              onClick={() => toggleMode("login")}
              className={`px-6 py-2 rounded-xl transition-all cursor-pointer min-h-[38px] text-center ${
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
              className={`px-6 py-2 rounded-xl transition-all cursor-pointer min-h-[38px] text-center ${
                mode === "register"
                  ? "bg-white text-[#30AFFF] shadow-sm"
                  : "text-white hover:text-white/80"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Mobile Body */}
        <div className="p-5 sm:p-7 flex flex-col gap-3.5">
          {/* Quick Pilot 1-Tap Entry (Login mode) */}
          {mode === "login" && (
            <div className="flex flex-col gap-2.5 pb-2 bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#E2E8F0] text-center">
              <div className="flex items-center justify-center gap-1.5 text-center">
                <Sparkles className="w-3.5 h-3.5 text-[#30AFFF]" />
                <span className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider">
                  1-Tap Quick Pilot Login
                </span>
                <span className="text-[10px] text-[#64748B] lowercase font-medium bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                  instant test
                </span>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    disabled={isLoading || redirecting}
                    className="flex-1 min-w-[95px] max-w-[130px] py-2 px-2 bg-white hover:bg-[#92EEFF]/30 active:bg-[#92EEFF] border border-[#CBD5E1] hover:border-[#30AFFF] rounded-xl text-xs font-bold text-[#0F172A] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-2xs min-h-[46px] text-center"
                  >
                    <span className="text-[#30AFFF] font-extrabold text-center block w-full">{acc.label}</span>
                    <span className="text-[9px] text-[#64748B] font-medium truncate w-full text-center block">
                      {acc.target}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role Selection (Register mode) */}
          {mode === "register" && (
            <div className="flex flex-col gap-2 text-center">
              <label className="text-[11px] font-extrabold text-[#475569] uppercase tracking-wider text-center block">
                Authorized Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r, idx) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  const isLast = idx === ROLES.length - 1;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-center transition-all cursor-pointer min-h-[46px] ${
                        isLast ? "col-span-2 max-w-[220px] w-full mx-auto" : ""
                      } ${
                        isSelected
                          ? `${r.activeColor} shadow-xs ring-2 ring-[#30AFFF]`
                          : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-bold truncate text-center">{r.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Username / Full Name */}
          <div className="relative flex items-center">
            <input
              type="text"
              autoComplete="username"
              placeholder={mode === "login" ? "Email or Username" : "Full Name / User ID"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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

          {/* Email (Register mode only) */}
          {mode === "register" && (
            <div className="relative flex items-center">
              <input
                type="email"
                autoComplete="email"
                placeholder="Email Address (e.g. user@tubigloop.ph)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRegisterSubmit();
                }}
                disabled={isLoading || redirecting}
                className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-2xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
              />
              <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                <Mail className="w-5 h-5" />
              </div>
            </div>
          )}

          {/* Password */}
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder={mode === "login" ? "Password" : "Password (min 6 characters)"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
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

          {/* Server Verified Status Banner */}
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
    </div>
  );
}
