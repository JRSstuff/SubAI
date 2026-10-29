"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Megaphone,
  ClipboardCheck,
  Wrench,
  Recycle,
  Crown,
  ChevronDown,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

const ROLES_META = [
  { id: "reporter", label: "Reporter", color: "bg-[#92EEFF] text-[#0F172A]", icon: Megaphone },
  { id: "reviewer", label: "Reviewer", color: "bg-[#30AFFF] text-white", icon: ClipboardCheck },
  { id: "collector", label: "Collector", color: "bg-[#D8FFC5] text-[#0F2E1B]", icon: Wrench },
  { id: "recycler", label: "Recycler", color: "bg-[#C4F7CA] text-[#064E3B]", icon: Recycle },
  { id: "admin", label: "Admin", color: "bg-[#0F172A] text-white", icon: Crown },
];

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // New User Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("subai123");
  const [newRole, setNewRole] = useState("reporter");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify Admin Session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          if (String(data.user.role).toLowerCase() === "admin") {
            loadUsers();
          }
        }
        setIsCheckingAuth(false);
      })
      .catch(() => setIsCheckingAuth(false));
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success && data.users) {
        setUsers(data.users);
      }
    } catch {
      setFeedback({ success: false, message: "Failed to load users list." });
    }
    setIsLoading(false);
  };

  const handleRoleChange = async (userId: string, newRoleValue: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_role", userId, newRole: newRoleValue }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: true, message: data.message });
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRoleValue } : u))
        );
      } else {
        setFeedback({ success: false, message: data.message });
      }
    } catch {
      setFeedback({ success: false, message: "Network error updating role." });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ success: true, message: data.message });
        setShowAddModal(false);
        setNewName("");
        setNewEmail("");
        loadUsers();
      } else {
        setFeedback({ success: false, message: data.message });
      }
    } catch {
      setFeedback({ success: false, message: "Failed to create user." });
    }
    setIsSubmitting(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#30AFFF]" />
      </div>
    );
  }

  // Unauthorized Barrier
  if (!currentUser || String(currentUser.role).toLowerCase() !== "admin") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-3xl border border-[#E2E8F0] shadow-lg text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A]">
              Administrator Access Required
            </h2>
            <p className="text-xs text-[#64748B]">
              Role assignment and administrative governance are restricted to system administrators. You are currently logged in as{" "}
              <strong className="text-[#0F172A] uppercase">{currentUser?.role || "GUEST"}</strong>.
            </p>
            <Link
              href={
                currentUser?.role === "reviewer"
                  ? "/review"
                  : currentUser?.role === "collector"
                  ? "/tasks"
                  : currentUser?.role === "recycler"
                  ? "/dashboard"
                  : "/report"
              }
              className="mt-2 px-6 py-2.5 bg-[#30AFFF] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#1f9eef] transition-all"
            >
              Return to Authorized Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      filterRole === "all" || String(u.role).toLowerCase() === filterRole;

    return matchesSearch && matchesRole;
  });

  const reporterCount = users.filter((u) => u.role === "reporter").length;
  const reviewerCount = users.filter((u) => u.role === "reviewer").length;
  const collectorCount = users.filter((u) => u.role === "collector").length;
  const recyclerCount = users.filter((u) => u.role === "recycler").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28 md:pb-12 text-[#0F172A] flex flex-col">
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 py-5 sm:py-8 flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F172A] text-white flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-[#92EEFF]" />
                System Governance
              </span>
              <span className="text-xs text-[#64748B] font-medium">RBAC Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A]">
              Role & Access Control
            </h1>
            <p className="text-xs sm:text-sm text-[#475569]">
              Assign authorized roles (Reporter, Reviewer, Collector, Recycler) and appoint new system administrators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadUsers}
              title="Refresh Users"
              className="p-2.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer min-h-[40px]"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#30AFFF]" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#30AFFF] hover:bg-[#1f9eef] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Personnel</span>
            </button>
          </div>
        </div>

        {/* ─── SUMMARY CARDS ROW (Using Palette Colors) ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Users
            </span>
            <span className="text-xl font-extrabold text-[#0F172A]">{users.length}</span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Reporters
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#0F172A]">{reporterCount}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#92EEFF]/30 text-[#0F172A]">
                Field
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Reviewers
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#30AFFF]">{reviewerCount}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#30AFFF]/15 text-[#30AFFF]">
                Triage
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Collectors
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#064E3B]">{collectorCount}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#D8FFC5] text-[#0F2E1B]">
                Weighing
              </span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Admins
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[#0F172A]">{adminCount}</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#C4F7CA] text-[#064E3B]">
                Control
              </span>
            </div>
          </div>
        </div>

        {/* ─── FEEDBACK TOAST BANNER ─── */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 text-xs font-bold transition-all ${
              feedback.success
                ? "bg-[#C4F7CA] text-[#064E3B] border-[#86EFAC]"
                : "bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline opacity-75 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ─── SEARCH & ROLE FILTER BAR ─── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search personnel by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white border border-[#E2E8F0] rounded-2xl text-xs font-medium text-[#0F172A] placeholder-[#94A3B8] focus:border-[#30AFFF] focus:outline-none shadow-xs transition-all"
            />
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {["all", "reporter", "reviewer", "collector", "recycler", "admin"].map((r) => {
              const isSelected = filterRole === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setFilterRole(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap uppercase min-h-[38px] ${
                    isSelected
                      ? "bg-[#30AFFF] text-white shadow-xs"
                      : "bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── USER LIST CARDS WITH 1-CLICK ROLE ASSIGNMENT ─── */}
        <div className="flex flex-col gap-2.5">
          {filteredUsers.length === 0 ? (
            <div className="p-10 bg-white border border-[#E2E8F0] rounded-3xl text-center flex flex-col items-center justify-center gap-2">
              <Users className="w-8 h-8 text-[#94A3B8]" />
              <span className="text-sm font-bold text-[#475569]">
                No personnel found matching the query.
              </span>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const currentRole = String(u.role).toLowerCase();
              const isSelf = u.id === currentUser?.id;

              return (
                <div
                  key={u.id}
                  className="p-4 bg-white border border-[#E2E8F0] hover:border-[#30AFFF] rounded-2xl shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#92EEFF]/30 border border-[#92EEFF] flex items-center justify-center shrink-0 font-bold text-sm text-[#0F172A]">
                      {u.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A] truncate">
                          {u.full_name}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#D8FFC5] text-[#064E3B]">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#64748B] truncate">{u.email}</span>
                    </div>
                  </div>

                  {/* Role Assignment Selector */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F1F5F9]">
                    <span className="text-[11px] font-bold text-[#64748B] hidden sm:inline">
                      Role:
                    </span>
                    <select
                      value={currentRole}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="h-9 px-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] focus:border-[#30AFFF] focus:outline-none cursor-pointer"
                    >
                      <option value="reporter">Community Reporter</option>
                      <option value="reviewer">Reviewer & Dispatch</option>
                      <option value="collector">Authorized Collector</option>
                      <option value="recycler">Partner Recycler</option>
                      <option value="admin">System Administrator</option>
                    </select>

                    {currentRole !== "admin" && (
                      <button
                        type="button"
                        onClick={() => handleRoleChange(u.id, "admin")}
                        title="Promote to Administrator"
                        className="px-2.5 py-2 bg-[#F1F5F9] hover:bg-[#C4F7CA] border border-[#E2E8F0] hover:border-[#86EFAC] text-[#0F172A] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Crown className="w-3.5 h-3.5 text-[#30AFFF]" />
                        <span className="hidden sm:inline">Make Admin</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ─── ADD PERSONNEL MODAL ─── */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col">
              <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#30AFFF]" />
                  <span className="text-sm font-extrabold text-[#0F172A]">
                    Add Authorized Personnel
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-5 flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#475569]">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#475569]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="user@subai.ph or @cdo.gov.ph"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#475569]">Initial Password</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#475569]">Assigned Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-11 px-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:border-[#30AFFF] focus:outline-none"
                  >
                    <option value="reporter">Community Reporter</option>
                    <option value="reviewer">Reviewer & Dispatch</option>
                    <option value="collector">Authorized Collector</option>
                    <option value="recycler">Partner Recycler</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 w-full h-11 bg-[#30AFFF] hover:bg-[#1f9eef] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Account</span>}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
