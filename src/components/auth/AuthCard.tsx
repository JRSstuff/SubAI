"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Recycle,
  Wrench,
} from "lucide-react";
import { handleLoginAction, handleRegisterAction, type AuthResponse } from "@/app/actions/auth";

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Server response state (Rule 1: Real Server Truth)
  const [serverResponse, setServerResponse] = useState<AuthResponse | null>(null);

  // Form field states
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("Field Maintenance");

  // Clear server messages when switching tabs
  const toggleMode = (newMode: "login" | "register") => {
    setServerResponse(null);
    setMode(newMode);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerResponse(null);

    const formData = new FormData();
    formData.append("username", loginUsername);
    formData.append("password", loginPassword);

    startTransition(async () => {
      try {
        const res = await handleLoginAction(formData);
        setServerResponse(res);
      } catch (err: unknown) {
        setServerResponse({
          success: false,
          message: "Server Connection Error",
          error: err instanceof Error ? err.message : "Failed to connect to authentication server.",
        });
      }
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerResponse(null);

    const formData = new FormData();
    formData.append("username", registerUsername);
    formData.append("email", registerEmail);
    formData.append("password", registerPassword);
    formData.append("role", registerRole);

    startTransition(async () => {
      try {
        const res = await handleRegisterAction(formData);
        setServerResponse(res);
      } catch (err: unknown) {
        setServerResponse({
          success: false,
          message: "Server Connection Error",
          error: err instanceof Error ? err.message : "Failed to provision account on server.",
        });
      }
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-3 sm:p-6 select-none">
      {/* ─────────────────────────────────────────────────────────────
          DESKTOP & TABLET VIEW: Sliding Dual-Panel Container (md:flex)
          Matches the reference animation and curved overlay design
          ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex relative w-[880px] min-h-[580px] bg-white rounded-[36px] border border-[#E2E8F0] shadow-xl overflow-hidden">
        {/* UNDERLYING LEFT PANEL: Registration Form */}
        <div className="w-1/2 p-10 flex flex-col justify-center bg-white z-0">
          <div className="w-full max-w-[340px] mx-auto flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">Registration</h2>
              <p className="text-xs text-[#64748B] font-medium">
                Create your verified TubigLoop credentials
              </p>
            </div>

            {/* Role Selection Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                Select Operational Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegisterRole("Field Maintenance")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    registerRole === "Field Maintenance"
                      ? "bg-[#92EEFF] text-[#0F172A] border-[#30AFFF]"
                      : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5 text-[#30AFFF]" />
                  <span>Maintenance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterRole("Partner Recycler")}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    registerRole === "Partner Recycler"
                      ? "bg-[#D8FFC5] text-[#0F2E1B] border-[#10B981]"
                      : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]"
                  }`}
                >
                  <Recycle className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Recycler</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
              {/* Username Input Box */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Full Name / Operator ID"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  disabled={isPending}
                  className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
                <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                  <User className="w-5 h-5" />
                </div>
              </div>

              {/* Email Input Box */}
              <div className="relative flex items-center">
                <input
                  type="email"
                  placeholder="Official Email Address"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  disabled={isPending}
                  className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
                <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                  <Mail className="w-5 h-5" />
                </div>
              </div>

              {/* Password Input Box */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Secure Password (6+ characters)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  disabled={isPending}
                  className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Real Server Response Status Banner */}
              {serverResponse && mode === "register" && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium transition-all ${
                    serverResponse.success
                      ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                      : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                  }`}
                >
                  {serverResponse.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold">{serverResponse.message}</span>
                    {serverResponse.error && (
                      <span className="text-[11px] opacity-90 mt-0.5">{serverResponse.error}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 mt-2 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Contacting Server...</span>
                  </>
                ) : (
                  <span>Register Account</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* UNDERLYING RIGHT PANEL: Login Form */}
        <div className="w-1/2 p-10 flex flex-col justify-center bg-white z-0">
          <div className="w-full max-w-[340px] mx-auto flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold tracking-tight text-[#0F172A]">Login</h2>
              <p className="text-xs text-[#64748B] font-medium">
                Enter your credentials to access coordination terminal
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              {/* Username Input Box */}
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Username / Email"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  disabled={isPending}
                  className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
                <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                  <User className="w-5 h-5" />
                </div>
              </div>

              {/* Password Input Box */}
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={isPending}
                  className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => alert("Password reset service is coordinated via your network administrator.")}
                  className="text-xs font-semibold text-[#30AFFF] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Real Server Response Status Banner */}
              {serverResponse && mode === "login" && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium transition-all ${
                    serverResponse.success
                      ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                      : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                  }`}
                >
                  {serverResponse.success ? (
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col">
                    <span className="font-bold">{serverResponse.message}</span>
                    {serverResponse.user && (
                      <span className="text-[11px] opacity-90 mt-0.5">
                        Active Profile: {serverResponse.user.username} ({serverResponse.user.role})
                      </span>
                    )}
                    {serverResponse.error && (
                      <span className="text-[11px] opacity-90 mt-0.5">{serverResponse.error}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying with Server...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE CURVED SLIDING OVERLAY PANEL
            Slides smoothly left <-> right using Framer Motion
            ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={false}
          animate={{
            x: mode === "login" ? 0 : "100%",
            borderTopLeftRadius: mode === "login" ? "36px" : "140px",
            borderBottomLeftRadius: mode === "login" ? "36px" : "140px",
            borderTopRightRadius: mode === "login" ? "140px" : "36px",
            borderBottomRightRadius: mode === "login" ? "140px" : "36px",
          }}
          transition={{
            type: "spring",
            stiffness: 240,
            damping: 30,
            mass: 0.9,
          }}
          className="absolute top-0 left-0 w-1/2 h-full bg-[#30AFFF] text-white z-20 flex flex-col items-center justify-center p-10 overflow-hidden shadow-2xl"
        >
          {/* Subtle eco badge accent inside overlay */}
          <div className="absolute top-6 flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-[11px] font-semibold text-white border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#92EEFF]" />
            <span>Authorized Operations Only</span>
          </div>

          <AnimatePresence mode="wait">
            {mode === "login" ? (
              /* Content shown when overlay is on the LEFT (prompting to Register) */
              <motion.div
                key="welcome-prompt"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.28 }}
                className="flex flex-col items-center text-center gap-5 max-w-[280px]"
              >
                {/* Logo Image */}
                <div className="relative w-28 h-28 bg-white rounded-3xl p-3 shadow-md flex items-center justify-center border border-white/30">
                  <Image
                    src="/TubigLoopLogo150x150.png"
                    alt="TubigLoop Logo"
                    width={96}
                    height={96}
                    priority
                    className="object-contain"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Hello, Welcome!
                  </h1>
                  <p className="text-sm font-medium text-white/90">
                    Don&apos;t have an account?
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
              /* Content shown when overlay is on the RIGHT (prompting to Login) */
              <motion.div
                key="welcome-back-prompt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28 }}
                className="flex flex-col items-center text-center gap-5 max-w-[280px]"
              >
                {/* Logo Image */}
                <div className="relative w-28 h-28 bg-white rounded-3xl p-3 shadow-md flex items-center justify-center border border-white/30">
                  <Image
                    src="/TubigLoopLogo150x150.png"
                    alt="TubigLoop Logo"
                    width={96}
                    height={96}
                    priority
                    className="object-contain"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Welcome Back!
                  </h1>
                  <p className="text-sm font-medium text-white/90">
                    Already have an account?
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
          MOBILE PWA VIEW: Native-Feeling Touch Flow (md:hidden)
          Creative, clean, high-performance responsive interface
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full md:hidden flex flex-col bg-white rounded-3xl border border-[#E2E8F0] shadow-lg overflow-hidden">
        {/* Mobile Top Hero Header */}
        <div className="bg-[#30AFFF] text-white p-6 pb-8 flex flex-col items-center text-center rounded-b-[36px] relative shadow-sm">
          <div className="relative w-20 h-20 bg-white rounded-2xl p-2 shadow-sm mb-3 border border-white/30">
            <Image
              src="/TubigLoopLogo150x150.png"
              alt="TubigLoop Logo"
              width={64}
              height={64}
              priority
              className="object-contain mx-auto"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Hello, Welcome!" : "Welcome Back!"}
          </h1>
          <p className="text-xs text-white/90 mt-1 max-w-[260px]">
            {mode === "login"
              ? "Access field assignments, GPS routes, and evidence capture"
              : "Register as an authorized maintenance or recycling partner"}
          </p>

          {/* Segmented Switcher Pill */}
          <div className="mt-5 w-full max-w-[260px] bg-white/20 p-1 rounded-full flex border border-white/25">
            <button
              type="button"
              onClick={() => toggleMode("login")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-[#30AFFF] shadow-sm"
                  : "text-white hover:text-white/80"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode("register")}
              className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-[#30AFFF] shadow-sm"
                  : "text-white hover:text-white/80"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Mobile Form Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {mode === "login" ? (
              <motion.form
                key="mobile-login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit}
                className="flex flex-col gap-4"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Username / Email"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    disabled={isPending}
                    className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#64748B] p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => alert("Contact dispatcher or support to reset credentials.")}
                    className="text-xs font-semibold text-[#30AFFF]"
                  >
                    Forgot Password?
                  </button>
                </div>

                {serverResponse && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium transition-all ${
                      serverResponse.success
                        ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                        : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                    }`}
                  >
                    {serverResponse.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold">{serverResponse.message}</span>
                      {serverResponse.error && (
                        <span className="text-[11px] opacity-90 mt-0.5">{serverResponse.error}</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying with Server...</span>
                    </>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="mobile-register"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegisterSubmit}
                className="flex flex-col gap-3.5"
              >
                {/* Role selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterRole("Field Maintenance")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border ${
                      registerRole === "Field Maintenance"
                        ? "bg-[#92EEFF] text-[#0F172A] border-[#30AFFF]"
                        : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5 text-[#30AFFF]" />
                    <span>Maintenance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole("Partner Recycler")}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-semibold border ${
                      registerRole === "Partner Recycler"
                        ? "bg-[#D8FFC5] text-[#0F2E1B] border-[#10B981]"
                        : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]"
                    }`}
                  >
                    <Recycle className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Recycler</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    disabled={isPending}
                    className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                    <User className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    disabled={isPending}
                    className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <div className="absolute right-3.5 text-[#64748B] pointer-events-none">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (6+ chars)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isPending}
                    className="w-full h-12 pl-4 pr-11 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#30AFFF] focus:ring-2 focus:ring-[#92EEFF]/60 focus:outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#64748B] p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {serverResponse && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs font-medium transition-all ${
                      serverResponse.success
                        ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                        : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
                    }`}
                  >
                    {serverResponse.success ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold">{serverResponse.message}</span>
                      {serverResponse.error && (
                        <span className="text-[11px] opacity-90 mt-0.5">{serverResponse.error}</span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Contacting Server...</span>
                    </>
                  ) : (
                    <span>Register Account</span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
