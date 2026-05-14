"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
  ChevronRight, Store, Pill, ShoppingBag, Shield, AlertTriangle,
  Mail, Lock, Tag, RefreshCw, ArrowLeft, LayoutDashboard, LogOut
} from "lucide-react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";

const DEV_EMAIL = "nahakaditya344@gmail.com";
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const TYPE_META: Record<string, { label: string; icon: any; color: string; bg: string; ring: string }> = {
  food:     { label: "Food",     icon: Store,      color: "text-orange-600", bg: "bg-orange-100", ring: "ring-orange-400" },
  medicine: { label: "Medicine", icon: Pill,       color: "text-blue-600",   bg: "bg-blue-100",   ring: "ring-blue-400" },
  store:    { label: "Store",    icon: ShoppingBag, color: "text-violet-600", bg: "bg-violet-100", ring: "ring-violet-400" },
};

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  manager_type: string;
  is_active: boolean;
  created_at: string;
}

interface ManagerFormData {
  email: string;
  password: string;
  managerType: "food" | "medicine" | "store" | "";
}

export default function DevDashboard() {
  const { user, isLoggedIn, accessToken, logout } = useAuth();
  const router = useRouter();

  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  // Modal state
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Manager | null>(null);
  const [form, setForm] = useState<ManagerFormData>({ email: "", password: "", managerType: "" });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Guard: only the developer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn || user?.email !== DEV_EMAIL) {
        router.push("/");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, router]);

  async function fetchManagers() {
    setLoadingData(true);
    try {
      const res = await fetch(`${API}/api/managers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) setManagers(data.managers || []);
      else toast.error(data.error || "Failed to load managers.");
    } catch {
      toast.error("Network error. Check your connection.");
    }
    setLoadingData(false);
  }

  useEffect(() => {
    if (isLoggedIn && user?.email === DEV_EMAIL) fetchManagers();
  }, [isLoggedIn, user, accessToken]);

  function openAdd() {
    setForm({ email: "", password: "", managerType: "" });
    setEditTarget(null);
    setModalMode("add");
    setShowPass(false);
  }

  function openEdit(m: Manager) {
    setForm({ email: m.email, password: "", managerType: (m.manager_type as any) || "" });
    setEditTarget(m);
    setModalMode("edit");
    setShowPass(false);
  }

  function closeModal() {
    setModalMode(null);
    setEditTarget(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.managerType) return toast.error("Please select a manager type.");
    setSubmitting(true);

    const payload: any = { email: form.email, managerType: form.managerType };
    if (form.password) payload.password = form.password;
    if (modalMode === "add") payload.password = form.password;

    const url = modalMode === "add" ? `${API}/api/managers` : `${API}/api/managers/${editTarget?.id}`;
    const method = modalMode === "add" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(modalMode === "add" ? "Manager created! ✅" : "Manager updated! ✅");
        closeModal();
        fetchManagers();
      } else {
        toast.error(data.error || "Action failed.");
      }
    } catch {
      toast.error("Network error.");
    }
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`${API}/api/managers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Manager deleted.");
        setManagers((prev) => prev.filter((m) => m.id !== id));
      } else {
        toast.error(data.error || "Delete failed.");
      }
    } catch {
      toast.error("Network error.");
    }
    setDeleteConfirm(null);
  }

  if (!isLoggedIn || user?.email !== DEV_EMAIL) return null;

  const stats = [
    { label: "Total Managers", value: managers.length, icon: Users, color: "from-violet-500 to-purple-600" },
    { label: "Food Managers",  value: managers.filter(m => m.manager_type === "food").length,     icon: Store,      color: "from-orange-400 to-red-500" },
    { label: "Med Managers",   value: managers.filter(m => m.manager_type === "medicine").length, icon: Pill,       color: "from-blue-400 to-cyan-500" },
    { label: "Store Managers", value: managers.filter(m => m.manager_type === "store").length,    icon: ShoppingBag, color: "from-emerald-400 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <div className="relative pt-24 pb-16 px-4 overflow-hidden">
        {/* Animated BG grid */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDBoNnY2aC02di02em0xMi0xMmg2djZoLTZ2LTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-60" />

        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-1/4 w-56 h-56 bg-purple-600/15 rounded-full blur-3xl" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 border border-violet-500/30 rounded-full">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-bold text-violet-300 tracking-widest uppercase">Developer Console</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-3">
                <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                  NearBuy
                </span>{" "}
                <span className="text-white">Dev Dashboard</span>
              </h1>
              <p className="text-gray-400 text-lg font-medium">
                Welcome back, <span className="text-violet-300 font-bold">{user.firstName}</span>. Manage your platform managers here.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/60 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-all text-sm font-bold"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
              <button
                onClick={() => setShowPanel(!showPanel)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-white font-bold shadow-lg shadow-violet-500/25 hover:-translate-y-0.5 transition-all text-sm"
              >
                <Users className="w-4 h-4" />
                Manage Managers
                <ChevronRight className={`w-4 h-4 transition-transform ${showPanel ? "rotate-90" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-gray-900/60 border border-gray-800 rounded-2xl p-5 overflow-hidden"
            >
              <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${s.color} opacity-10 rounded-full blur-xl`} />
              <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-black text-white">{loadingData ? "—" : s.value}</p>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Manager Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto px-4 mb-12 overflow-hidden"
          >
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6">
              {/* Panel header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 border border-violet-500/30 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Manager Accounts</h2>
                    <p className="text-xs text-gray-500 font-medium">{managers.length} total managers on the platform</p>
                  </div>
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add New Manager
                </button>
              </div>

              {/* Manager list */}
              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-gray-500 font-medium">Loading managers...</p>
                </div>
              ) : managers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 font-bold text-lg">No managers yet</p>
                    <p className="text-gray-600 text-sm mt-1">Click "Add New Manager" to get started</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {managers.map((m) => {
                    const meta = TYPE_META[m.manager_type] || TYPE_META["store"];
                    const Icon = meta.icon;
                    return (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-5 group hover:border-gray-600 transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 ${meta.bg} rounded-xl flex items-center justify-center ring-2 ${meta.ring}/30`}>
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                          </div>
                          <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${meta.bg} ${meta.color} border border-current/20`}>
                            {meta.label}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="font-bold text-white text-[15px] truncate">
                            {m.first_name} {m.last_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate mt-0.5 font-medium">{m.email}</p>
                          <p className="text-[11px] text-gray-600 mt-1 font-medium">
                            Added {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700/60 hover:bg-violet-500/20 border border-gray-600 hover:border-violet-500/40 rounded-xl text-xs font-bold text-gray-300 hover:text-violet-300 transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(m.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-700/60 hover:bg-red-500/20 border border-gray-600 hover:border-red-500/40 rounded-xl text-xs font-bold text-gray-300 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modalMode === "add" ? "bg-emerald-500/20" : "bg-violet-500/20"}`}>
                    {modalMode === "add" ? <Plus className="w-5 h-5 text-emerald-400" /> : <Pencil className="w-5 h-5 text-violet-400" />}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-[16px]">{modalMode === "add" ? "Add New Manager" : "Edit Manager"}</h3>
                    <p className="text-xs text-gray-500 font-medium">{modalMode === "add" ? "Create a new manager account" : `Editing ${editTarget?.email}`}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="Email address"
                    className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder-gray-500 outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={modalMode === "add"}
                    placeholder={modalMode === "edit" ? "New password (leave blank to keep)" : "Password (min 8 chars)"}
                    minLength={modalMode === "add" ? 8 : undefined}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3.5 pl-11 pr-11 text-sm text-white placeholder-gray-500 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Manager Type */}
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />
                  <select
                    value={form.managerType}
                    onChange={(e) => setForm({ ...form, managerType: e.target.value as any })}
                    required
                    className="w-full bg-gray-800 border border-gray-700 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select manager type…</option>
                    <option value="food">🍽️  Food</option>
                    <option value="medicine">💊  Medicine</option>
                    <option value="store">🛍️  Store</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white font-bold shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 active:scale-98 transition-all"
                >
                  {submitting
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <><Check className="w-4 h-4" /> {modalMode === "add" ? "Create Manager" : "Save Changes"}</>
                  }
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-gray-900 border border-red-900/50 rounded-2xl p-6 w-full max-w-[360px] shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-[16px]">Delete Manager?</h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">This will permanently delete this manager account and all associated data.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-sm font-bold text-gray-300 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simple Dev Footer */}
      <footer className="mt-auto border-t border-gray-800/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <p className="text-[11px] text-gray-600 font-medium text-center">
            © 2026 NearBuy Technologies · Developer Console · Internal use only
          </p>
        </div>
      </footer>
    </div>
  );
}
