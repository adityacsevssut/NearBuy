"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, LayoutTemplate, ClipboardList, Store as StoreIcon, Building2, UserCircle, ShieldCheck, Pencil, Trash2, Plus, Eye, EyeOff, CheckCircle2, Upload, Image as ImageIcon, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import FallbackImage from "@/components/FallbackImage";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function PartnerDashboard() {
  const { user, logout, isLoggedIn, accessToken } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "vendors" | "requests" | "frontend">("dashboard");
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [editingReq, setEditingReq] = useState<any | null>(null);

  // Vendor management state
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [vendorForm, setVendorForm] = useState({ businessName: "", ownerName: "", email: "", password: "", mobile: "" });
  const [submittingVendor, setSubmittingVendor] = useState(false);
  const [vendorCreated, setVendorCreated] = useState<any | null>(null);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [editVendorForm, setEditVendorForm] = useState({ firstName: "", lastName: "", email: "", mobile: "", newPassword: "" });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Manage Frontend state
  const [posterTheme, setPosterTheme] = useState<"light" | "dark">("light");
  const [currentPoster, setCurrentPoster] = useState<{ light: string | null; dark: string | null }>({ light: null, dark: null });
  const [posterPreview, setPosterPreview] = useState<{ light: string | null; dark: string | null }>({ light: null, dark: null });
  const [posterFile, setPosterFile] = useState<{ light: File | null; dark: File | null }>({ light: null, dark: null });
  const [loadingPoster, setLoadingPoster] = useState(false);
  const [savingPoster, setSavingPoster] = useState(false);
  const [posterSaved, setPosterSaved] = useState(false);

  const fetchCurrentPoster = async () => {
    setLoadingPoster(true);
    try {
      const mType = (user?.manager_type || "food").toLowerCase();
      const res = await fetch(`${API}/api/homepage-poster?type=${mType}`);
      const data = await res.json();
      if (data.poster) {
        setCurrentPoster({
          light: data.poster.image_url || null,
          dark: data.poster.dark_image_url || null
        });
        setPosterPreview({
          light: data.poster.image_url || null,
          dark: data.poster.dark_image_url || null
        });
      } else {
        setCurrentPoster({ light: null, dark: null });
        setPosterPreview({ light: null, dark: null });
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingPoster(false);
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Image must be under 8 MB");
        return;
      }
      setPosterFile(prev => ({ ...prev, [posterTheme]: file }));
      const reader = new FileReader();
      reader.onload = () => setPosterPreview(prev => ({ ...prev, [posterTheme]: reader.result as string }));
      reader.readAsDataURL(file);
      setPosterSaved(false);
    }
  };

  const handlePosterSave = async () => {
    const fileToSave = posterFile[posterTheme];
    if (!fileToSave) { toast.error("Please select an image first"); return; }
    setSavingPoster(true);
    try {
      const form = new FormData();
      form.append("image", fileToSave);
      form.append("theme", posterTheme);
      const res = await fetch(`${API}/api/homepage-poster`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save poster");
      toast.success(`${posterTheme === 'dark' ? 'Dark' : 'Light'} poster published successfully!`);
      
      const newUrl = posterTheme === 'dark' ? data.poster.dark_image_url : data.poster.image_url;
      setCurrentPoster(prev => ({ ...prev, [posterTheme]: newUrl }));
      setPosterFile(prev => ({ ...prev, [posterTheme]: null }));
      setPosterSaved(true);
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingPoster(false);
  };

  const fetchRequests = async () => {
    setLoadingReqs(true);
    try {
      const res = await fetch(`${API}/api/vendor-requests`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) setRequests(data.requests || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requests");
    }
    setLoadingReqs(false);
  };

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const res = await fetch(`${API}/api/managers/vendors`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) setVendors(data.vendors || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendors");
    }
    setLoadingVendors(false);
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVendor(true);
    try {
      const res = await fetch(`${API}/api/managers/vendor`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(vendorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create vendor");
      toast.success("Vendor account created!");
      setVendorCreated({ ...data.vendor, password: vendorForm.password });
      setVendorForm({ businessName: "", ownerName: "", email: "", password: "", mobile: "" });
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSubmittingVendor(false);
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor account? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/managers/vendor/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Vendor deleted.");
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openEditVendor = (v: any) => {
    setEditingVendor(v);
    setEditVendorForm({ firstName: v.first_name || "", lastName: v.last_name || "", email: v.email || "", mobile: v.mobile || "", newPassword: "" });
    setShowEditPassword(false);
  };

  const handleEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setSubmittingEdit(true);
    try {
      const body: any = {
        firstName: editVendorForm.firstName,
        lastName: editVendorForm.lastName,
        email: editVendorForm.email,
        mobile: editVendorForm.mobile,
      };
      if (editVendorForm.newPassword) body.password = editVendorForm.newPassword;
      const res = await fetch(`${API}/api/managers/vendor/${editingVendor.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vendor");
      toast.success("Vendor updated successfully!");
      setEditingVendor(null);
      fetchVendors();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSubmittingEdit(false);
  };

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`${API}/api/vendor-requests/${id}/${action}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);
      toast.success(data.message);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor request? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/api/vendor-requests/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Vendor request deleted.");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEditSave = async (id: string, updated: { owner_name: string; owner_email: string; owner_mobile: string }) => {
    try {
      const res = await fetch(`${API}/api/vendor-requests/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success("Vendor updated successfully.");
      setEditingReq(null);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (view === "requests" && accessToken) fetchRequests();
    if (view === "vendors" && accessToken) fetchVendors();
    if (view === "frontend" && accessToken) fetchCurrentPoster();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, accessToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn || (user?.role !== "manager" && user?.role !== "admin")) {
        router.push("/");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, router]);

  if (!isLoggedIn || (user?.role !== "manager" && user?.role !== "admin")) {
    return <div className="min-h-screen bg-gray-50 dark:bg-[#151522]" />;
  }

  // Determine dynamic theme colors based on manager type
  const type = user?.manager_type?.toLowerCase() || "food";
  
  const theme = type === "store" ? {
    text: "text-blue-500",
    bg: "bg-blue-50",
    bgHover: "hover:bg-blue-100",
    border: "border-blue-100",
    borderHover: "hover:border-blue-300",
    shadowHover: "hover:shadow-blue-500/10",
    from: "from-blue-500",
    to: "to-blue-600",
    shadow: "shadow-blue-500/20",
    textDark: "text-blue-600",
    btnText: "text-blue-600",
    btnTextHover: "hover:text-blue-700",
  } : type === "medicine" ? {
    text: "text-emerald-500",
    bg: "bg-emerald-50",
    bgHover: "hover:bg-emerald-100",
    border: "border-emerald-100",
    borderHover: "hover:border-emerald-300",
    shadowHover: "hover:shadow-emerald-500/10",
    from: "from-emerald-500",
    to: "to-emerald-600",
    shadow: "shadow-emerald-500/20",
    textDark: "text-emerald-600",
    btnText: "text-emerald-600",
    btnTextHover: "hover:text-emerald-700",
  } : {
    text: "text-orange-500",
    bg: "bg-orange-50",
    bgHover: "hover:bg-orange-100",
    border: "border-orange-100",
    borderHover: "hover:border-orange-300 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]",
    shadowHover: "hover:shadow-orange-500/10",
    from: "from-orange-500",
    to: "to-orange-600",
    shadow: "shadow-orange-500/20",
    textDark: "text-orange-600",
    btnText: "text-orange-600",
    btnTextHover: "hover:text-orange-700",
  };

  const ManagerNavbar = () => (
    <nav className="border-b border-gray-200 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17] sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center shadow-lg ${theme.shadow}`}>
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-gray-900 dark:text-gray-100 text-lg tracking-tight">
            NB <span className={theme.text}>Partner</span>
          </span>
          <span className={`ml-2 text-[10px] font-bold ${theme.textDark} ${theme.bg} px-2 py-0.5 rounded-full uppercase tracking-widest border ${theme.border}`}>
            {user?.manager_type || "Manager"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-full">
            <UserCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{user?.email}</span>
          </div>
          <button 
            onClick={() => { logout(); router.push("/"); }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all border border-red-100"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 font-sans flex flex-col">
      <ManagerNavbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Partner Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome back. Manage your division from here.</p>
          </div>
          
          {view !== "dashboard" && (
            <button 
              onClick={() => setView("dashboard")}
              className={`text-sm font-bold ${theme.btnText} ${theme.btnTextHover} px-4 py-2 rounded-xl ${theme.bg} ${theme.bgHover} transition-colors`}
            >
              Back to Dashboard
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {view === "dashboard" ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Button 1: Manage Frontend */}
              <button
                onClick={() => setView("frontend")}
                className={`flex flex-col items-start p-6 rounded-2xl bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <LayoutTemplate className="w-24 h-24" />
                </div>
                <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4 border ${theme.border}`}>
                  <LayoutTemplate className={`w-5 h-5 ${theme.text}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">Manage Frontend</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative z-10">
                  Upload and publish the promotional banner/poster shown on your category home page.
                </p>
              </button>

              {/* Button 2: Manage Vendor Requests */}
              <button 
                onClick={() => setView("requests")}
                className={`flex flex-col items-start p-6 rounded-2xl bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <ClipboardList className="w-24 h-24" />
                </div>
                <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4 border ${theme.border}`}>
                  <ClipboardList className={`w-5 h-5 ${theme.text}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">Vendor Requests</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative z-10">
                  Review and approve new vendor owner registration requests for your category.
                </p>
              </button>

              {/* Button 3: Manage Vendors */}
              <button 
                onClick={() => setView("vendors")}
                className={`flex flex-col items-start p-6 rounded-2xl bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <StoreIcon className="w-24 h-24" />
                </div>
                <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4 border ${theme.border} shadow-inner`}>
                  <StoreIcon className={`w-5 h-5 ${theme.text}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2">Manage Vendors</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed relative z-10">
                  Add new vendors manually, manage their credentials, and view their performance.
                </p>
              </button>
            </motion.div>
          ) : view === "vendors" ? (
            <motion.div
              key="vendors"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Create Vendor Form */}
              <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Vendor Account</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vendor will log in using these credentials via the <span className={`font-bold ${theme.textDark}`}>{user?.manager_type} Vendor Login</span></p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center border ${theme.border}`}>
                    <Plus className={`w-5 h-5 ${theme.text}`} />
                  </div>
                </div>

                {/* Success card after creation */}
                {vendorCreated && (
                  <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-black text-green-800 text-sm">Vendor Created Successfully!</p>
                        <p className="text-xs text-green-700 mt-1">Share these credentials with the vendor:</p>
                        <div className="mt-2 bg-white dark:bg-[#0D0D17] rounded-xl border border-green-200 p-3 space-y-1">
                          <p className="text-xs font-mono"><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-bold text-gray-900 dark:text-gray-100">{vendorCreated.email}</span></p>
                          <p className="text-xs font-mono"><span className="text-gray-500 dark:text-gray-400">Password:</span> <span className="font-bold text-gray-900 dark:text-gray-100">{vendorCreated.password}</span></p>
                          <p className="text-xs font-mono"><span className="text-gray-500 dark:text-gray-400">Type:</span> <span className={`font-bold ${theme.textDark} capitalize`}>{vendorCreated.manager_type}</span></p>
                        </div>
                      </div>
                      <button onClick={() => setVendorCreated(null)} className="text-green-400 hover:text-green-600 text-lg leading-none">&times;</button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Business / Shop Name *</label>
                    <input
                      required
                      placeholder="e.g. Sharma Dhaba"
                      value={vendorForm.businessName}
                      onChange={e => setVendorForm(f => ({ ...f, businessName: e.target.value }))}
                      className={`w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-${type === 'store' ? 'blue' : type === 'medicine' ? 'emerald' : 'orange'}-400 focus:ring-2 focus:ring-${type === 'store' ? 'blue' : type === 'medicine' ? 'emerald' : 'orange'}-100 transition-all`}
                    />
                  </div>

                  {/* Owner Name */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Owner / Contact Name *</label>
                    <input
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={vendorForm.ownerName}
                      onChange={e => setVendorForm(f => ({ ...f, ownerName: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Login Email *</label>
                    <input
                      required
                      type="email"
                      placeholder="vendor@example.com"
                      value={vendorForm.email}
                      onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                    />
                  </div>

                  {/* Mobile */}
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Mobile (Optional)</label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile number"
                      value={vendorForm.mobile}
                      onChange={e => setVendorForm(f => ({ ...f, mobile: e.target.value }))}
                      className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                    />
                  </div>

                  {/* Password */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Login Password *</label>
                    <div className="relative">
                      <input
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={vendorForm.password}
                        onChange={e => setVendorForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 pr-11 text-sm font-semibold outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Business Type (locked) */}
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">Business Type (Auto-assigned)</label>
                    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${theme.border} ${theme.bg}`}>
                      <StoreIcon className={`w-4 h-4 ${theme.text}`} />
                      <span className={`text-sm font-black ${theme.textDark} capitalize`}>{user?.manager_type || "food"}</span>
                      <span className="text-xs text-gray-400 font-medium ml-auto">Locked to your division</span>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingVendor}
                      className={`w-full py-3 bg-gradient-to-r ${theme.from} ${theme.to} text-white font-black rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    >
                      {submittingVendor ? "Creating Account..." : <><Plus className="w-4 h-4" /> Create Vendor Account</>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Vendors List */}
              <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Active Vendors</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{user?.manager_type} division — {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={fetchVendors} className={`px-4 py-2 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm ${loadingVendors ? "opacity-50 pointer-events-none" : ""}`}>
                    {loadingVendors ? "Loading..." : "Refresh"}
                  </button>
                </div>

                {vendors.length === 0 && !loadingVendors ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-[#151522] rounded-2xl border border-dashed border-gray-200 dark:border-[#2A2A3A]">
                    <StoreIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No vendors yet. Create one above!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendors.map(v => (
                      <div key={v.id} className={`flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A3A] hover:border-gray-200 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522]/50 hover:${theme.bg} transition-all group`}>
                        <div className={`w-10 h-10 rounded-xl ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0`}>
                          <span className={`font-black text-sm ${theme.textDark}`}>{v.first_name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{v.first_name} {v.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{v.email}</p>
                          {v.mobile && <p className="text-xs text-gray-400">{v.mobile}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-green-100 text-green-700 uppercase tracking-wider">Active</span>
                          <button
                            onClick={() => openEditVendor(v)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                            title="Edit vendor"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteVendor(v.id)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete vendor"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : view === "requests" ? (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vendor Requests</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending and processed partnership requests for {user?.manager_type} category</p>
                </div>
                <button onClick={fetchRequests} className={`px-4 py-2 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm ${loadingReqs ? "opacity-50 pointer-events-none" : ""}`}>
                  {loadingReqs ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {requests.length === 0 && !loadingReqs ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No vendor requests found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map(req => (
                    <div key={req.id} className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-5 hover:border-gray-300 transition-colors shadow-sm relative overflow-hidden">
                      {/* Status indicator line */}
                      <div className={`absolute top-0 left-0 w-full h-1 ${
                        req.status === 'approved' ? 'bg-green-500' : 
                        req.status === 'rejected' ? 'bg-red-500' : 
                        'bg-orange-400'
                      }`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{req.owner_name}</h3>
                            {req.status === 'approved' && (
                              <span className="flex items-center gap-1 text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{req.vendor_type} Partner</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                          req.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#151522] px-3 py-2 rounded-lg">
                          <UserCircle className="w-4 h-4 text-gray-400" /> {req.owner_email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#151522] px-3 py-2 rounded-lg">
                          <ShieldCheck className="w-4 h-4 text-gray-400" /> {req.owner_mobile}
                        </div>
                        {req.status === 'approved' && req.password && (
                          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 border-dashed">
                            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black">Credentials:</span> {req.password}
                          </div>
                        )}
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => handleAction(req.id, "approve")} className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors">
                            Approve
                          </button>
                          <button onClick={() => handleAction(req.id, "reject")} className="flex-1 py-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-xl transition-colors">
                            Reject
                          </button>
                        </div>
                      )}

                      {req.status === "approved" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => setEditingReq(req)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-xl transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-xl transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Modal */}
              {editingReq && (
                <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl p-6 w-full max-w-md">
                    <h3 className="font-black text-lg text-gray-900 dark:text-gray-100 mb-5">Edit Vendor Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Owner Name</label>
                        <input
                          className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                          defaultValue={editingReq.owner_name}
                          id="edit-owner-name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
                        <input
                          className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                          defaultValue={editingReq.owner_email}
                          id="edit-owner-email"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Mobile</label>
                        <input
                          className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                          defaultValue={editingReq.owner_mobile}
                          id="edit-owner-mobile"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setEditingReq(null)}
                        className="flex-1 py-2.5 border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleEditSave(editingReq.id, {
                          owner_name: (document.getElementById("edit-owner-name") as HTMLInputElement)?.value,
                          owner_email: (document.getElementById("edit-owner-email") as HTMLInputElement)?.value,
                          owner_mobile: (document.getElementById("edit-owner-mobile") as HTMLInputElement)?.value,
                        })}
                        className={`flex-1 py-2.5 bg-gradient-to-r ${theme.from} ${theme.to} text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90`}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === "frontend" ? (
            <motion.div
              key="frontend"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage Frontend Poster</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                    This image is shown as the promotional banner on the{" "}
                    <span className={`font-bold ${theme.textDark}`}>
                      {type === "food" ? "Home (Food)" : type === "medicine" ? "Medico" : "Store (Essentials)"}
                    </span>{" "}page.
                  </p>
                </div>
                <button
                  onClick={fetchCurrentPoster}
                  className={`p-2 rounded-xl ${theme.bg} border ${theme.border} ${theme.text} hover:opacity-80 transition-opacity`}
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingPoster ? "animate-spin" : ""}`} />
                </button>
              </div>

              {/* Theme Selector */}
              <div className="flex bg-gray-100 dark:bg-[#1F1F2E] p-1 rounded-xl w-fit shadow-inner">
                <button
                  onClick={() => setPosterTheme("light")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    posterTheme === "light" ? "bg-white dark:bg-[#2A2A3A] text-gray-900 dark:text-white shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Light Poster
                </button>
                <button
                  onClick={() => setPosterTheme("dark")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    posterTheme === "dark" ? "bg-white dark:bg-[#2A2A3A] text-gray-900 dark:text-white shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  Dark Poster
                </button>
              </div>

              {/* Current live poster */}
              <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-3xl p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Current {posterTheme === 'dark' ? 'Dark' : 'Light'} Poster</p>
                {loadingPoster ? (
                  <div className="h-48 bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl animate-pulse" />
                ) : currentPoster[posterTheme] ? (
                  <div className="relative w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-[#2A2A3A] shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <FallbackImage src={currentPoster[posterTheme] as string} alt="Current poster" className="w-full object-cover max-h-64" />
                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${theme.bg} border ${theme.border} text-[10px] font-black ${theme.textDark} uppercase tracking-widest shadow-sm`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </div>
                  </div>
                ) : (
                  <div className={`h-48 ${theme.bg} rounded-2xl border-2 border-dashed ${theme.border} flex flex-col items-center justify-center gap-3`}>
                    <ImageIcon className={`w-10 h-10 ${theme.text} opacity-40`} />
                    <p className="text-sm font-semibold text-gray-400">No {posterTheme} poster uploaded yet</p>
                    <p className="text-xs text-gray-400">Upload one below to make it live</p>
                  </div>
                )}
              </div>

              {/* Upload new poster */}
              <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-3xl p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Upload New {posterTheme === 'dark' ? 'Dark' : 'Light'} Poster</p>

                {/* Drop zone */}
                <label
                  htmlFor="poster-upload"
                  className={`relative flex flex-col items-center justify-center w-full min-h-56 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                    posterPreview[posterTheme] && posterPreview[posterTheme] !== currentPoster[posterTheme]
                      ? `border-transparent`
                      : `${theme.border} hover:border-opacity-60 ${theme.bg}`
                  }`}
                >
                  {posterPreview[posterTheme] && posterPreview[posterTheme] !== currentPoster[posterTheme] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <FallbackImage src={posterPreview[posterTheme] as string} alt="Preview" className="w-full rounded-2xl object-cover max-h-72" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                        <span className="text-white font-black text-sm bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                      </div>
                      <div className="absolute top-3 right-3 bg-white dark:bg-[#0D0D17]/90 text-xs font-bold text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full shadow">
                        Preview
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
                      <div className={`w-14 h-14 rounded-2xl ${theme.bg} border ${theme.border} flex items-center justify-center`}>
                        <Upload className={`w-6 h-6 ${theme.text}`} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">Drag & drop or click to upload</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP — max 8 MB</p>
                        <p className="text-xs text-gray-400">Recommended: 1200 × 400 px (landscape)</p>
                      </div>
                    </div>
                  )}
                  <input
                    id="poster-upload"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handlePosterFileChange}
                  />
                </label>

                {/* Info / status row */}
                {posterFile[posterTheme] && (
                  <div className={`mt-3 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl ${theme.bg} ${theme.textDark}`}>
                    <ImageIcon className="w-3.5 h-3.5" />
                    {posterFile[posterTheme]?.name} — {((posterFile[posterTheme]?.size || 0) / 1024).toFixed(0)} KB
                  </div>
                )}

                {/* Save button */}
                <button
                  onClick={handlePosterSave}
                  disabled={!posterFile[posterTheme] || savingPoster}
                  className={`mt-4 w-full py-3 rounded-xl font-black text-white text-sm transition-all flex items-center justify-center gap-2 ${
                    posterFile[posterTheme] && !savingPoster
                      ? `bg-gradient-to-r ${theme.from} ${theme.to} hover:opacity-90 shadow-lg ${theme.shadow} active:scale-[0.99]`
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {savingPoster ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Publishing…</>
                  ) : posterSaved ? (
                    <><CheckCircle className="w-4 h-4" /> Published!</>
                  ) : (
                    <><Upload className="w-4 h-4" /> Publish {posterTheme === 'dark' ? 'Dark' : 'Light'} Poster</>
                  )}
                </button>

                {/* Tip */}
                <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-[#151522] rounded-xl px-4 py-3 border border-gray-100 dark:border-[#2A2A3A]">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <p>The poster goes live instantly after publishing. Previous posters are overwritten. Use high-resolution landscape images for the best result.</p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </main>

      {/* Edit Vendor Modal — outside AnimatePresence so it overlays correctly */}
      {editingVendor && (
        <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-gray-100">Edit Vendor</h3>
                <p className="text-xs text-gray-400 mt-0.5">{editingVendor.email}</p>
              </div>
              <button onClick={() => setEditingVendor(null)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">&times;</button>
            </div>
            <form onSubmit={handleEditVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">First Name</label>
                  <input
                    required
                    value={editVendorForm.firstName}
                    onChange={e => setEditVendorForm(f => ({ ...f, firstName: e.target.value }))}
                    className={`w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-${type === 'store' ? 'blue' : type === 'medicine' ? 'emerald' : 'orange'}-400 transition-all`}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Last Name</label>
                  <input
                    value={editVendorForm.lastName}
                    onChange={e => setEditVendorForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-gray-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
                <input
                  required
                  type="email"
                  value={editVendorForm.email}
                  onChange={e => setEditVendorForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-gray-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Mobile</label>
                <input
                  type="tel"
                  value={editVendorForm.mobile}
                  onChange={e => setEditVendorForm(f => ({ ...f, mobile: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-gray-400 transition-all"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">New Password <span className="text-gray-300 font-normal normal-case">(leave blank to keep current)</span></label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editVendorForm.newPassword}
                    onChange={e => setEditVendorForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters"
                    className="w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2.5 pr-10 text-sm font-semibold outline-none focus:border-gray-400 transition-all"
                  />
                  <button type="button" onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-400">
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className={`flex-1 py-2.5 bg-gradient-to-r ${theme.from} ${theme.to} text-white rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-60`}
                >
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simple Footer */}
      <footer className="mt-auto py-5 border-t border-gray-200 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center sm:justify-between">
          <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            © 2026 NearBuy Technologies · Partner Console
          </p>
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md border border-green-100">
              <ShieldCheck className="w-3 h-3" /> Secure Session
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
