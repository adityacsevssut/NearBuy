"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
  ChevronRight, Store, Pill, ShoppingBag, Shield, AlertTriangle,
  Mail, Lock, Tag, RefreshCw, UserCircle, LogOut, MapPin, Search, Navigation, Building2
} from "lucide-react";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';
import GooglePlacesSearch, { ResolvedGoogleAddress } from "@/components/GooglePlacesSearch";


const DevMap = dynamic(() => import('@/components/DevMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full min-h-[300px] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400 font-bold text-sm">Loading Map...</div> 
});

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

interface ServiceCenter {
  id: string;
  name: string;
  landmark: string | null;
  pincode: string;
  latitude: string;
  longitude: string;
  radius_km: string;
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
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Settings
  const [platformFee, setPlatformFee] = useState(5);
  const [gst, setGst] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Panels
  const [showPanel, setShowPanel] = useState(false);
  const [showCentersPanel, setShowCentersPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Manager Modal state
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Manager | null>(null);
  const [form, setForm] = useState<ManagerFormData>({ email: "", password: "", managerType: "" });
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Service Center Modal state
  const [centerModalOpen, setCenterModalOpen] = useState(false);
  const [centerPincode, setCenterPincode] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<any>(null);
  const [fallbackMapCenter, setFallbackMapCenter] = useState<{lat: number, lon: number, name: string} | null>(null);
  const [centerRadius, setCenterRadius] = useState("8.0");
  const [centerLandmark, setCenterLandmark] = useState("");
  const [savingCenter, setSavingCenter] = useState(false);

  // Guard: only the developer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn || user?.email !== DEV_EMAIL) {
        router.push("/");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, router]);

  async function fetchData() {
    setLoadingData(true);
    try {
      const [resM, resC, resS] = await Promise.all([
        fetch(`${API}/api/managers`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/api/service-centers`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/api/public/settings`)
      ]);
      const dataM = await resM.json();
      const dataC = await resC.json();
      const dataS = await resS.json();
      if (resM.ok) setManagers(dataM.managers || []);
      if (resC.ok) setCenters(dataC.centers || []);
      if (resS.ok) {
        if (dataS.platform_fee !== undefined) setPlatformFee(dataS.platform_fee);
        if (dataS.gst !== undefined) setGst(dataS.gst);
      }
    } catch {
      toast.error("Network error. Check your connection.");
    }
    setLoadingData(false);
  }

  useEffect(() => {
    if (isLoggedIn && user?.email === DEV_EMAIL) fetchData();
  }, [isLoggedIn, user, accessToken]);

  // ---- Manager Logic ----
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
        fetchData();
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
        fetchData();
      } else {
        toast.error(data.error || "Delete failed.");
      }
    } catch {
      toast.error("Network error.");
    }
    setDeleteConfirm(null);
  }

  // ---- Service Center Logic ----
  const handleSelectGoogleLocation = (addr: ResolvedGoogleAddress) => {
    setCenterPincode(addr.pincode);
    const center = {
      name: addr.name,
      pincode: addr.pincode,
      lat: addr.lat,
      lon: addr.lng,
      isExact: true,
      fullName: addr.fullAddress
    };
    setSelectedCenter(center);
    setFallbackMapCenter({ lat: addr.lat, lon: addr.lng, name: addr.name });
    toast.success("Location pinpointed accurately!", { id: "geo" });
  };

  async function handleSaveCenter() {
    if (!selectedCenter) return toast.error("Please select a location first.");
    
    // Client-side validations
    if (!selectedCenter.name || !selectedCenter.name.trim()) {
      return toast.error("Location name is required.");
    }
    
    if (!centerPincode || !centerPincode.trim()) {
      return toast.error("PIN code is required.");
    }
    
    const lat = parseFloat(selectedCenter.lat);
    const lon = parseFloat(selectedCenter.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return toast.error("Invalid coordinates. Please re-select the location.");
    }
    
    const radius = parseFloat(centerRadius);
    if (isNaN(radius) || radius <= 0) {
      return toast.error("Please enter a valid delivery radius.");
    }

    setSavingCenter(true);
    try {
      const payload = {
        name: selectedCenter.name,
        landmark: centerLandmark.trim() || undefined,
        pincode: centerPincode.trim(),
        latitude: lat,
        longitude: lon,
        radius_km: radius
      };
      
      const res = await fetch(`${API}/api/service-centers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success("Service Center added successfully!");
        setCenterModalOpen(false);
        setCenterPincode("");
        setCenterLandmark("");
        setSearchResults([]);
        setSelectedCenter(null);
        setFallbackMapCenter(null);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save center.");
      }
    } catch {
      toast.error("Network error.");
    }
    setSavingCenter(false);
  }
  
  async function handleToggleCenter(id: string, currentStatus: boolean) {
    try {
      const res = await fetch(`${API}/api/service-centers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Center ${!currentStatus ? 'activated' : 'deactivated'}.`);
        fetchData();
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Network error.");
    }
  }

  async function handleDeleteCenter(id: string) {
    if (!confirm("Are you sure you want to delete this service center?")) return;
    try {
      const res = await fetch(`${API}/api/service-centers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        toast.success("Service center removed successfully!");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete service center.");
      }
    } catch {
      toast.error("Network error.");
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch(`${API}/api/public/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform_fee: platformFee, gst })
      });
      if (res.ok) {
        toast.success("Global settings updated!");
      } else {
        toast.error("Failed to update settings.");
      }
    } catch {
      toast.error("Network error.");
    }
    setSavingSettings(false);
  }

  if (!isLoggedIn || user?.email !== DEV_EMAIL) return null;

  const stats = [
    { label: "Total Managers", value: managers.length, icon: Users, color: "from-violet-500 to-purple-600" },
    { label: "Service Centers", value: centers.length, icon: MapPin, color: "from-pink-500 to-rose-500" },
    { label: "Food Managers",  value: managers.filter(m => m.manager_type === "food").length,     icon: Store,      color: "from-orange-400 to-orange-500" },
    { label: "Med Managers",   value: managers.filter(m => m.manager_type === "medicine").length, icon: Pill,       color: "from-blue-400 to-blue-500" },
    { label: "Essential Managers", value: managers.filter(m => m.manager_type === "store").length, icon: ShoppingBag, color: "from-emerald-400 to-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-violet-600 to-purple-700 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-sm">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-[15px] text-white tracking-tight leading-tight">NearBuy Dev</span>
              <span className="text-[10px] font-semibold text-violet-100 uppercase tracking-widest leading-tight">Developer Console</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white">
              <UserCircle className="w-4 h-4 opacity-80" />
              <span className="text-xs font-bold max-w-[150px] truncate">{user?.email}</span>
            </div>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════ HERO HEADER ══════════════════ */}
      <div className="bg-white border-b border-gray-200 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-violet-100 text-violet-700 border border-violet-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">Root Access</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight mb-2">
                Platform Administration
              </h1>
              <p className="text-gray-500 text-sm font-medium">
                Welcome back, <span className="text-violet-600 font-bold">{user?.firstName}</span>. Manage administrative access and service locations.
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <button
                onClick={() => { setShowPanel(false); setShowSettingsPanel(false); setShowCentersPanel(!showCentersPanel); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm shrink-0 border ${showCentersPanel ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'}`}
              >
                <MapPin className="w-4 h-4" />
                Start Business Here
              </button>
              <button
                onClick={() => { setShowCentersPanel(false); setShowSettingsPanel(false); setShowPanel(!showPanel); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm shrink-0 border ${showPanel ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300'}`}
              >
                <Users className="w-4 h-4" />
                Manage Managers
              </button>
              <button
                onClick={() => { setShowPanel(false); setShowCentersPanel(false); setShowSettingsPanel(!showSettingsPanel); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm shrink-0 border ${showSettingsPanel ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-700 hover:border-amber-300'}`}
              >
                <Tag className="w-4 h-4" />
                Platform Fees
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 hover:border-violet-300 rounded-2xl p-5 shadow-sm hover:shadow-violet-500/10 transition-all group relative overflow-hidden"
            >
              <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${s.color} opacity-[0.08] rounded-full group-hover:scale-110 transition-transform`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-sm`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-black text-gray-900">{loadingData ? "—" : s.value}</p>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ══════════════════ SERVICE CENTERS PANEL ══════════════════ */}
      <AnimatePresence>
        {showCentersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto px-4 mb-12 overflow-hidden w-full"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Service Centers</h2>
                    <p className="text-xs text-gray-500 font-medium">{centers.length} operational zones active</p>
                  </div>
                </div>
                <button
                  onClick={() => { setCenterModalOpen(true); setSelectedCenter(null); setSearchResults([]); setCenterPincode(""); setCenterLandmark(""); setFallbackMapCenter(null); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 rounded-xl text-white text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Start Business Here</span>
                </button>
              </div>

              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                  <p className="text-gray-500 font-medium">Loading centers...</p>
                </div>
              ) : centers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-bold text-lg">No service centers</p>
                    <p className="text-gray-500 text-sm mt-1">Click "Start Business Here" to expand.</p>
                  </div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {centers.map((c) => (
                    <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-pink-300 transition-all shadow-sm relative overflow-hidden group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center border border-pink-100">
                            <Navigation className="w-4 h-4 text-pink-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 leading-tight">{c.name}</h3>
                            {c.landmark && <p className="text-xs font-bold text-pink-600 mt-0.5">{c.landmark}</p>}
                            <p className="text-xs text-gray-500 font-medium">PIN: {c.pincode}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="mt-4 bg-gray-50 rounded-xl p-3 border border-gray-100 flex justify-between items-center relative z-10">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Service Radius</p>
                          <p className="font-black text-gray-900">{parseFloat(c.radius_km).toFixed(1)} km</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => handleToggleCenter(c.id, c.is_active)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${c.is_active ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
                          >
                            {c.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => handleDeleteCenter(c.id)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 flex items-center justify-center"
                            title="Remove Center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Subdued map background element */}
                      <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                        <MapPin className="w-40 h-40" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ MANAGER PANEL ══════════════════ */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto px-4 mb-12 overflow-hidden w-full"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              {/* Panel header */}
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Manager Accounts</h2>
                    <p className="text-xs text-gray-500 font-medium">{managers.length} total managers on the platform</p>
                  </div>
                </div>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-white text-sm font-bold shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Manager</span>
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
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-gray-900 font-bold text-lg">No managers yet</p>
                    <p className="text-gray-500 text-sm mt-1">Click "Add Manager" to get started</p>
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
                        className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-11 h-11 ${meta.bg} rounded-xl flex items-center justify-center border border-current border-opacity-20`}>
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.bg} ${meta.color} border border-current border-opacity-20`}>
                            {meta.label}
                          </span>
                        </div>

                        <div className="mb-4">
                          <p className="font-bold text-gray-900 text-[15px] truncate">
                            {m.first_name} {m.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">{m.email}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-semibold tracking-wide uppercase">
                            Added {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-200 rounded-xl text-xs font-bold text-gray-600 hover:text-violet-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(m.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-xs font-bold text-gray-600 hover:text-red-600 transition-colors"
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

      {/* ══════════════════ SETTINGS PANEL ══════════════════ */}
      <AnimatePresence>
        {showSettingsPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-6xl mx-auto px-4 mb-12 overflow-hidden w-full"
          >
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Platform Pricing Configuration</h2>
                  <p className="text-xs text-gray-500 font-medium">Manage global Platform Fee and GST for all carts</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Platform Fee (₹)</label>
                  <input
                    type="number"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-black text-gray-900 outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Fixed amount charged per order</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">GST (₹)</label>
                  <input
                    type="number"
                    value={gst}
                    onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 font-black text-gray-900 outline-none transition-all"
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Fixed GST applied to all orders instead of Delivery Fee</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold shadow-md active:scale-95 transition-all flex items-center gap-2"
                >
                  {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════ MODALS ══════════════════ */}
      
      {/* Service Center Modal - Large Map View */}
      <AnimatePresence>
        {centerModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCenterModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-100 shadow-sm border border-pink-200">
                    <MapPin className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">Start Business Here</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Plot Your Next Center</p>
                  </div>
                </div>
                <button onClick={() => setCenterModalOpen(false)} className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar">
                {/* Left Panel: Search and List */}
                <div className="w-full md:w-1/3 bg-white border-b md:border-b-0 md:border-r border-gray-100 p-5 flex flex-col md:h-full md:overflow-y-auto custom-scrollbar shrink-0">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search Location</label>
                  <div className="mb-4">
                    <GooglePlacesSearch 
                      onSelect={handleSelectGoogleLocation} 
                      placeholder="Search by Name or PIN Code..." 
                    />
                  </div>

                  {selectedCenter ? (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Selected Place</p>
                      </div>
                      
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="p-4 border rounded-xl bg-pink-50 border-pink-400 shadow-sm transition-all relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <MapPin className="w-16 h-16 text-pink-700" />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-start justify-between">
                              <div>
                                 <p className="text-lg font-black text-pink-700 mb-1 leading-tight">{selectedCenter.name}</p>
                                 <span className="inline-block bg-white text-pink-600 px-2 py-0.5 rounded text-xs font-bold border border-pink-100 shadow-sm mb-2">
                                   PIN: {centerPincode || "Not found"}
                                 </span>
                                <p className="text-xs text-gray-600 font-medium leading-relaxed">{selectedCenter.fullName}</p>
                                <p className="text-[10px] text-pink-500/80 font-bold mt-2 uppercase tracking-widest">
                                  {selectedCenter.lat.toFixed(5)}, {selectedCenter.lon.toFixed(5)}
                                </p>
                              </div>
                              <Check className="w-5 h-5 text-pink-600 shrink-0" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 px-4">
                      <MapPin className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm font-bold text-gray-500">Search an area name or PIN code to create an operational zone</p>
                    </div>
                  )}

                </div>

                {/* Right Panel: Map + Config */}
                <div className="w-full md:w-2/3 bg-gray-50 flex flex-col md:h-full md:overflow-hidden shrink-0">

                  {/* Map */}
                  <div className="relative bg-gray-100 w-full" style={{ height: "300px", minHeight: "300px", flexShrink: 0 }}>
                    {fallbackMapCenter ? (
                      <div className="absolute inset-2 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden">
                        <DevMap lat={fallbackMapCenter.lat} lon={fallbackMapCenter.lon} title={fallbackMapCenter.name} />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                          <Navigation className="w-4 h-4" /> Map Preview
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom configuration bar */}
                  {selectedCenter && (
                    <div className="bg-white border-t border-gray-200 p-5 flex flex-col sm:flex-row flex-wrap gap-4 items-end shadow-lg relative z-20 md:shrink-0">
                      <div className="flex-1 w-full min-w-[160px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Center Landmark / Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                          <input 
                            type="text"
                            value={centerLandmark}
                            onChange={(e) => setCenterLandmark(e.target.value)}
                            placeholder="E.g. Pulaha Hall, VSSUT Campus"
                            className="w-full pl-10 pr-4 py-3 bg-pink-50/50 border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl outline-none font-medium text-gray-900 transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex-1 w-full min-w-[140px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pincode</label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                          <input 
                            type="text"
                            value={centerPincode}
                            onChange={(e) => setCenterPincode(e.target.value)}
                            placeholder="Enter Pincode"
                            className="w-full pl-10 pr-4 py-3 bg-pink-50/50 border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl outline-none font-black text-gray-900 transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex-1 w-full min-w-[140px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Radius (km)</label>
                        <div className="relative">
                          <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                          <input 
                            type="number"
                            min="1"
                            step="0.5"
                            value={centerRadius}
                            onChange={(e) => setCenterRadius(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-pink-50/50 border border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl outline-none font-black text-gray-900 transition-all"
                          />
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleSaveCenter}
                        disabled={savingCenter}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-xl font-bold shadow-md shadow-pink-500/25 active:scale-95 transition-all"
                      >
                        {savingCenter ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Start Serving</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Manager Modal */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="relative bg-white border border-gray-100 rounded-3xl w-full max-w-[420px] shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${modalMode === "add" ? "bg-emerald-100" : "bg-violet-100"}`}>
                    {modalMode === "add" ? <Plus className="w-5 h-5 text-emerald-600" /> : <Pencil className="w-5 h-5 text-violet-600" />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-[16px]">{modalMode === "add" ? "Add New Manager" : "Edit Manager"}</h3>
                    <p className="text-xs text-gray-500 font-medium">{modalMode === "add" ? "Create a new manager account" : `Editing ${editTarget?.email}`}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    placeholder="Email address"
                    className="w-full bg-white border border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={modalMode === "add"}
                    placeholder={modalMode === "edit" ? "New password (leave blank to keep)" : "Password (min 8 chars)"}
                    minLength={modalMode === "add" ? 8 : undefined}
                    className="w-full bg-white border border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3.5 pl-11 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Manager Type */}
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                  <select
                    value={form.managerType}
                    onChange={(e) => setForm({ ...form, managerType: e.target.value as any })}
                    required
                    className="w-full bg-white border border-gray-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-gray-900 outline-none transition-all appearance-none cursor-pointer"
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-white font-bold shadow-lg shadow-violet-500/20 hover:-translate-y-0.5 active:scale-98 transition-all mt-2"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white border border-red-100 rounded-3xl p-6 w-full max-w-[360px] shadow-2xl"
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-[16px]">Delete Manager?</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">This will permanently delete this manager account and all associated data.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-400">
            © 2026 NearBuy Technologies · Developer Console
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-purple-600`} />
            <span className={`text-[10px] font-black uppercase tracking-widest text-violet-600`}>
              Internal Access
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
