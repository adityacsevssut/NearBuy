"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
  ChevronRight, Store, Pill, ShoppingBag, Shield, AlertTriangle,
  Mail, Lock, Tag, RefreshCw, UserCircle, LogOut, MapPin, Search, Navigation
} from "lucide-react";
import toast from "react-hot-toast";
import dynamic from 'next/dynamic';

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
  
  // Panels
  const [showPanel, setShowPanel] = useState(false);
  const [showCentersPanel, setShowCentersPanel] = useState(false);

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
      const [resM, resC] = await Promise.all([
        fetch(`${API}/api/managers`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        fetch(`${API}/api/service-centers`, { headers: { Authorization: `Bearer ${accessToken}` } })
      ]);
      const dataM = await resM.json();
      const dataC = await resC.json();
      if (resM.ok) setManagers(dataM.managers || []);
      if (resC.ok) setCenters(dataC.centers || []);
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
  async function handleSearchPincode() {
    if (!centerPincode) return toast.error("Enter a PIN code");
    setSearchingLocation(true);
    setFallbackMapCenter(null);
    setSelectedCenter(null);
    
    try {
      // 1. Get fallback Map Coordinates for this PIN code from Nominatim
      let fLat = "20.5937", fLon = "78.9629";
      try {
        const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${centerPincode}&countrycodes=IN&format=json`);
        const nomData = await nomRes.json();
        if (nomData && nomData.length > 0) {
          fLat = nomData[0].lat;
          fLon = nomData[0].lon;
          setFallbackMapCenter({ lat: parseFloat(fLat), lon: parseFloat(fLon), name: `PIN: ${centerPincode}` });
        }
      } catch (err) {
        console.warn("Nominatim fallback failed");
      }

      // 2. Fetch all exact localities/Post Offices for this PIN code from Indian Post API
      const res = await fetch(`https://api.postalpincode.in/pincode/${centerPincode}`);
      const data = await res.json();
      
      if (data && data[0] && data[0].Status === "Success") {
        const offices = data[0].PostOffice;
        const formatted = offices.map((o: any) => ({
          name: o.Name,
          district: o.District,
          state: o.State,
          pincode: o.Pincode,
          lat: fLat,
          lon: fLon,
          isExact: false,
          fullName: `${o.Name}, ${o.District}, ${o.State}`
        }));
        setSearchResults(formatted);
      } else {
        toast.error("No specific localities found for this PIN code.");
        setSearchResults([]);
      }
    } catch (err) {
      toast.error("Failed to fetch location data.");
    }
    setSearchingLocation(false);
  }

  async function handleSelectLocality(loc: any) {
    setSelectedCenter(loc);
    toast.loading("Finding exact location on map...", { id: "geo" });
    try {
      // Fetch exact lat/lon for the specific locality chosen
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.name + ", " + loc.district)}&countrycodes=IN&format=json`);
      const data = await res.json();
      if (data && data.length > 0) {
        const exactLat = parseFloat(data[0].lat);
        const exactLon = parseFloat(data[0].lon);
        
        setSelectedCenter({
          ...loc,
          lat: exactLat,
          lon: exactLon,
          isExact: true
        });
        setFallbackMapCenter({ lat: exactLat, lon: exactLon, name: loc.name });
        toast.success("Location pinpointed accurately!", { id: "geo" });
      } else {
        toast.error("Exact coordinates not found, using generic PIN center.", { id: "geo" });
        setFallbackMapCenter({ lat: parseFloat(loc.lat), lon: parseFloat(loc.lon), name: loc.name });
      }
    } catch {
      toast.dismiss("geo");
    }
  }

  async function handleSaveCenter() {
    if (!selectedCenter) return toast.error("Please select a location first.");
    setSavingCenter(true);
    try {
      const payload = {
        name: selectedCenter.name,
        pincode: centerPincode,
        latitude: parseFloat(selectedCenter.lat),
        longitude: parseFloat(selectedCenter.lon),
        radius_km: parseFloat(centerRadius)
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

  if (!isLoggedIn || user?.email !== DEV_EMAIL) return null;

  const stats = [
    { label: "Total Managers", value: managers.length, icon: Users, color: "from-violet-500 to-purple-600" },
    { label: "Service Centers", value: centers.length, icon: MapPin, color: "from-pink-500 to-rose-500" },
    { label: "Food Managers",  value: managers.filter(m => m.manager_type === "food").length,     icon: Store,      color: "from-orange-400 to-orange-500" },
    { label: "Med Managers",   value: managers.filter(m => m.manager_type === "medicine").length, icon: Pill,       color: "from-blue-400 to-blue-500" },
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
                onClick={() => { setShowPanel(false); setShowCentersPanel(!showCentersPanel); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm shrink-0 border ${showCentersPanel ? 'bg-pink-50 border-pink-200 text-pink-700' : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'}`}
              >
                <MapPin className="w-4 h-4" />
                Start Business Here
              </button>
              <button
                onClick={() => { setShowCentersPanel(false); setShowPanel(!showPanel); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all text-sm shrink-0 border ${showPanel ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300'}`}
              >
                <Users className="w-4 h-4" />
                Manage Managers
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
                  onClick={() => { setCenterModalOpen(true); setSelectedCenter(null); setSearchResults([]); setCenterPincode(""); setFallbackMapCenter(null); }}
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

              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Left Panel: Search and List */}
                <div className="w-full md:w-1/3 bg-white border-r border-gray-100 p-5 flex flex-col h-full overflow-y-auto custom-scrollbar">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Search PIN Code</label>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="e.g. 768018" 
                        value={centerPincode}
                        onChange={(e) => setCenterPincode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 text-sm font-bold text-gray-900 transition-all"
                      />
                    </div>
                    <button 
                      onClick={handleSearchPincode}
                      disabled={searchingLocation}
                      className="px-5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors shadow-md active:scale-95 flex items-center justify-center"
                    >
                      {searchingLocation ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Find'}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Central Place</p>
                        <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{searchResults.length} found</span>
                      </div>
                      
                      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        {searchResults.map((loc: any, idx) => {
                          const isSelected = selectedCenter?.name === loc.name;
                          return (
                            <div 
                              key={idx} 
                              onClick={() => handleSelectLocality(loc)}
                              className={`p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-pink-50 border-pink-400 shadow-sm' : 'bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'}`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className={`text-sm font-black ${isSelected ? 'text-pink-700' : 'text-gray-900'}`}>{loc.name}</p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-1 font-medium">{loc.district}, {loc.state}</p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-pink-600 shrink-0" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!searchResults.length && !searchingLocation && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 px-4">
                      <MapPin className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm font-bold text-gray-500">Enter a PIN code to reveal operational zones</p>
                    </div>
                  )}
                </div>

                {/* Right Panel: Map and Confirmation */}
                <div className="w-full md:w-2/3 bg-gray-50 flex flex-col h-full relative">
                  {fallbackMapCenter ? (
                    <div className="flex-1 relative p-2">
                      <div className="w-full h-full bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative">
                         <DevMap lat={fallbackMapCenter.lat} lon={fallbackMapCenter.lon} title={fallbackMapCenter.name} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                       <p className="text-gray-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                         <Navigation className="w-4 h-4" /> Map Preview
                       </p>
                    </div>
                  )}

                  {/* Bottom configuration bar */}
                  {selectedCenter && (
                    <div className="bg-white border-t border-gray-200 p-5 shrink-0 flex flex-col sm:flex-row gap-4 items-end shadow-lg relative z-20">
                      <div className="flex-1 w-full">
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
