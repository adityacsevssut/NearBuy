"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { LogOut, LayoutTemplate, ClipboardList, Store as StoreIcon, Building2, UserCircle, ShieldCheck, Pencil, Trash2, Plus, Eye, EyeOff, CheckCircle2, Upload, Image as ImageIcon, RefreshCw, CheckCircle, AlertCircle, AlertTriangle, LayoutDashboard, Receipt, MessageSquare, Menu, X, IndianRupee, XCircle, Calendar, ArrowLeft, Sun, Moon, LifeBuoy, Undo2, Mail, Phone, MapPin, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import imageCompression from 'browser-image-compression';
import { quickBites, storeSubcategories } from "@/config/categories";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function VendorCard({ vendor, date, theme, accessToken, onAction }: any) {
  const [stats, setStats] = useState({ cod_amount: 0, online_amount: 0, online_on_delivery_amount: 0, delivered_count: 0, cancelled_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/managers/vendors/${vendor.id}/daily-stats?date=${date}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        if (res.ok && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [vendor.id, date, accessToken]);

  const totalPayment = Number(stats.online_amount) + Number(stats.online_on_delivery_amount);

  return (
    <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center">
      <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-3 border ${theme.border} group-hover:scale-105 transition-transform`}>
        <StoreIcon className={`w-6 h-6 ${theme.text}`} />
      </div>
      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-[15px] truncate w-full tracking-tight mb-1">{vendor.business_name || "Unnamed Shop"}</h4>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-full font-medium mb-5">
        Owner: <span className="text-gray-700 dark:text-gray-300">{vendor.first_name} {vendor.last_name}</span>
      </p>

      <div className="w-full grid grid-cols-3 gap-2 mt-auto">
        <button onClick={() => onAction("vendor_payment", vendor, stats)} className="flex flex-col items-center justify-center p-2.5 bg-green-50 dark:bg-green-500/10 hover:bg-green-100 dark:hover:bg-green-500/20 text-green-700 dark:text-green-400 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 border border-green-100 dark:border-green-500/20 shadow-sm">
          <IndianRupee className="w-4 h-4 mb-1.5" />
          {loading ? <RefreshCw className="w-3 h-3 animate-spin mb-0.5" /> : <span className="text-[13px] font-black leading-none">₹{totalPayment}</span>}
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 mt-1">Pay</span>
        </button>
        <button onClick={() => onAction("vendor_delivered", vendor, stats)} className="flex flex-col items-center justify-center p-2.5 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 border border-blue-100 dark:border-blue-500/20 shadow-sm">
          <CheckCircle className="w-4 h-4 mb-1.5" />
          {loading ? <RefreshCw className="w-3 h-3 animate-spin mb-0.5" /> : <span className="text-[13px] font-black leading-none">{stats.delivered_count}</span>}
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 mt-1">Delvd</span>
        </button>
        <button onClick={() => onAction("vendor_cancelled", vendor, stats)} className="flex flex-col items-center justify-center p-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 border border-red-100 dark:border-red-500/20 shadow-sm">
          <XCircle className="w-4 h-4 mb-1.5" />
          {loading ? <RefreshCw className="w-3 h-3 animate-spin mb-0.5" /> : <span className="text-[13px] font-black leading-none">{stats.cancelled_count}</span>}
          <span className="text-[8px] font-bold uppercase tracking-wider opacity-80 mt-1">Cancel</span>
        </button>
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const { user, logout, isLoggedIn, accessToken, isInitializing } = useAuth();
  const { theme: appTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "vendors" | "requests" | "frontend" | "orders" | "feedback" | "support" | "refunds" | "vendor_payment" | "vendor_delivered" | "vendor_cancelled" | "zyphcart_payments">("dashboard");
  const [selectedVendorForDetails, setSelectedVendorForDetails] = useState<any | null>(null);
  const [vendorDetailsData, setVendorDetailsData] = useState<any | null>(null);
  const [vendorDetailsLoading, setVendorDetailsLoading] = useState(false);
  
  const handleToggleAdvRefund = async (orderId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API}/api/managers/orders/${orderId}/adv-refund`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ adv_refund_processed: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Refund status updated");
        setVendorDetailsData((prev: any) => 
          prev ? prev.map((order: any) => 
            order.id === orderId ? { ...order, adv_refund_processed: !currentStatus } : order
          ) : prev
        );
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);
  const [editingReq, setEditingReq] = useState<any | null>(null);

  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Vendor management state
  const [dashboardDate, setDashboardDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [editVendorForm, setEditVendorForm] = useState({ firstName: "", lastName: "", email: "", mobile: "", newPassword: "" });
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Service Center ──────────────────────────────────────────────────────
  const [assignedCenter, setAssignedCenter] = useState<any>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "checking" | "inside" | "outside">("idle");
  const [allCenters, setAllCenters] = useState<any[]>([]);

  function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  async function checkGpsStatus() {
    if (allCenters.length === 0) return;
    setGpsStatus("checking");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      const isInAny = allCenters.some((c) =>
        haversine(lat, lon, parseFloat(String(c.latitude)), parseFloat(String(c.longitude))) <= parseFloat(String(c.radius_km))
      );
      setGpsStatus(isInAny ? "inside" : "outside");
    } catch {
      setGpsStatus("idle");
      toast.error("GPS unavailable. Please check permissions.");
    }
  }

  useEffect(() => {
    fetch(`${API}/api/public/service-centers`)
      .then((r) => r.json())
      .then((data) => {
        const centers = data.centers || [];
        setAllCenters(centers);
        if (user?.service_center_id) {
          const found = centers.find((c: any) => c.id === user.service_center_id);
          if (found) setAssignedCenter(found);
        }
      })
      .catch(() => {});
  }, [user?.service_center_id]);

  // Search states
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [cancelSearchQuery, setCancelSearchQuery] = useState("");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderDateQuery, setOrderDateQuery] = useState(() => new Date().toISOString().split('T')[0]);

  // Zyphcart Payments State
  const [zyphcartPaymentsDate, setZyphcartPaymentsDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [zyphcartPaymentsData, setZyphcartPaymentsData] = useState<any>(null);
  const [loadingZyphcartPayments, setLoadingZyphcartPayments] = useState(false);

  const fetchZyphcartPayments = async () => {
    setLoadingZyphcartPayments(true);
    try {
      const res = await fetch(`${API}/api/managers/zyphcart-payments?date=${zyphcartPaymentsDate}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setZyphcartPaymentsData(data.payments);
      } else {
        toast.error(data.error || "Failed to fetch payments");
      }
    } catch (err: any) {
      toast.error(err.message || "Error fetching zyphcart payments");
    } finally {
      setLoadingZyphcartPayments(false);
    }
  };

  useEffect(() => {
    if (view === "zyphcart_payments") {
      fetchZyphcartPayments();
    }
  }, [view, zyphcartPaymentsDate]);

  const handleVendorAction = async (actionView: "vendor_payment" | "vendor_delivered" | "vendor_cancelled", vendor: any, stats: any) => {
    setSelectedVendorForDetails(vendor);
    setView(actionView);
    if (actionView === "vendor_payment") {
      setVendorDetailsData(stats);
      return;
    }
    
    // For delivered or cancelled, fetch orders list
    setVendorDetailsLoading(true);
    try {
      const statusFilter = actionView === "vendor_delivered" ? "delivered" : "cancelled";
      const res = await fetch(`${API}/api/managers/vendors/${vendor.id}/orders?date=${dashboardDate}&status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setVendorDetailsData(data.orders || []);
      } else {
        toast.error(data.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setVendorDetailsLoading(false);
    }
  };

  // Manage Frontend state
  const [posterTheme, setPosterTheme] = useState<"light" | "dark">("light");
  const [currentPosters, setCurrentPosters] = useState<any[]>([]);
  const [editingPosterId, setEditingPosterId] = useState<number | null>(null);
  const [posterPreview, setPosterPreview] = useState<{ light: string | null; dark: string | null }>({ light: null, dark: null });
  const [posterFile, setPosterFile] = useState<{ light: File | null; dark: File | null }>({ light: null, dark: null });
  const [loadingPoster, setLoadingPoster] = useState(false);
  const [savingPoster, setSavingPoster] = useState(false);
  const [posterSaved, setPosterSaved] = useState(false);
  const [posterLink, setPosterLink] = useState("");

  const fetchCurrentPosters = async () => {
    setLoadingPoster(true);
    try {
      const mType = (user?.manager_type || "food").toLowerCase();
      const res = await fetch(`${API}/api/homepage-poster?type=${mType}`);
      const data = await res.json();
      if (data.posters) {
        setCurrentPosters(data.posters);
      } else {
        setCurrentPosters([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoadingPoster(false);
  };

  const handlePosterFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image must be under 20 MB");
        return;
      }
      
      try {
        let finalFile = file;
        // Only compress if larger than 1MB
        if (file.size > 1 * 1024 * 1024) {
          const toastId = toast.loading("Processing image...");
          try {
            const options = {
              maxSizeMB: 2,
              maxWidthOrHeight: 1920,
              useWebWorker: false // Disabling web worker fixes "taking too much time" and loading failures on some devices
            };
            finalFile = await imageCompression(file, options);
          } finally {
            toast.dismiss(toastId);
          }
        }
        
        setPosterFile(prev => ({ ...prev, [posterTheme]: finalFile }));
        const reader = new FileReader();
        reader.onload = () => setPosterPreview(prev => ({ ...prev, [posterTheme]: reader.result as string }));
        reader.readAsDataURL(finalFile);
        setPosterSaved(false);
      } catch (error) {
        console.error("Compression error:", error);
        toast.error("Failed to process image. Please try a different image.");
      }
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
      if (editingPosterId) {
        form.append("id", String(editingPosterId));
      }
      if (posterLink.trim()) {
        const mType = (user?.manager_type || "food").toLowerCase();
        const path = posterLink.trim().toLowerCase().replace(/\s+/g, '-');
        const prefix = mType === "store" ? "/store/category/" : "/food/dish/";
        form.append("link", `${prefix}${path}`);
      }
      const res = await fetch(`${API}/api/homepage-poster`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save poster");
      toast.success(`${posterTheme === 'dark' ? 'Dark' : 'Light'} poster published successfully!`);
      
      setPosterFile(prev => ({ ...prev, [posterTheme]: null }));
      setPosterSaved(true);
      fetchCurrentPosters();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSavingPoster(false);
  };

  const handleDeletePoster = async (id: number) => {
    if (!confirm("Are you sure you want to delete this poster pair?")) return;
    try {
      const res = await fetch(`${API}/api/homepage-poster/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        toast.success("Poster deleted successfully");
        fetchCurrentPosters();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete poster");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleAddNewPoster = () => {
    setEditingPosterId(null);
    setPosterPreview({ light: null, dark: null });
    setPosterFile({ light: null, dark: null });
    setPosterSaved(false);
    setPosterLink("");
  };

  const handleEditPoster = (poster: any) => {
    setEditingPosterId(poster.id);
    setPosterPreview({ light: poster.image_url, dark: poster.dark_image_url });
    setPosterFile({ light: null, dark: null });
    setPosterSaved(false);
    let rawLink = "";
    if (poster.link) {
      if (poster.link.includes("/food/dish/")) {
        rawLink = poster.link.split("/food/dish/")[1].replace(/-/g, " ");
      } else if (poster.link.includes("/store/category/")) {
        rawLink = poster.link.split("/store/category/")[1];
      }
    }
    setPosterLink(rawLink);
  };

  const availableOptions = useMemo(() => {
    const mType = (user?.manager_type || "food").toLowerCase();
    let allOptions: { value: string, label: string }[] = [];
    if (mType === "store") {
      Object.values(storeSubcategories).forEach(subList => {
        subList.forEach(s => allOptions.push({ value: s.id, label: s.label }));
      });
    } else {
      quickBites.forEach(q => allOptions.push({ value: q.label.toLowerCase(), label: q.label }));
    }
    
    const usedPaths = currentPosters.filter(p => p.id !== editingPosterId).map(p => {
      if (p.link) {
        if (mType === "store") return p.link.replace("/store/category/", "");
        return p.link.replace("/food/dish/", "");
      }
      return "";
    });

    return allOptions.filter(opt => !usedPaths.includes(opt.value.replace(/\s+/g, '-')));
  }, [user?.manager_type, currentPosters, editingPosterId]);

  const [updatingLink, setUpdatingLink] = useState(false);
  const handleUpdateLinkOnly = async () => {
    if (!editingPosterId) return;
    if (!posterLink.trim()) { toast.error("Please select a target routing"); return; }
    setUpdatingLink(true);
    try {
      const mType = (user?.manager_type || "food").toLowerCase();
      const path = posterLink.trim().toLowerCase().replace(/\s+/g, '-');
      const prefix = mType === "store" ? "/store/category/" : "/food/dish/";
      const link = `${prefix}${path}`;

      const res = await fetch(`${API}/api/homepage-poster/${editingPosterId}/link`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ link }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update link");
      toast.success("Poster routing updated successfully!");
      fetchCurrentPosters();
    } catch (err: any) {
      toast.error(err.message);
    }
    setUpdatingLink(false);
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

  const handleDeleteVendor = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Delete Vendor?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
              Are you sure you want to delete this vendor account? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 dark:hover:bg-[#2A2A3A] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`${API}/api/managers/vendor/${id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to delete");
                toast.success("Vendor deleted.");
                fetchVendors();
                fetchRequests();
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-red-500/20 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        border: "1px solid var(--toast-border, #fee2e2)",
        padding: "16px",
        borderRadius: "16px",
        background: "var(--toast-bg, #fff)",
        color: "var(--toast-text, #000)",
        maxWidth: "340px"
      },
      className: "dark:!bg-[#0D0D17] dark:!border-[#2A2A3A] dark:!text-white"
    });
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
      if (action === "approve") {
        fetchVendors();
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Delete Request?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
              Are you sure you want to delete this vendor request? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 dark:hover:bg-[#2A2A3A] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`${API}/api/vendor-requests/${id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to delete");
                toast.success("Vendor request deleted.");
                fetchRequests();
                fetchVendors();
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-red-500/20 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        border: "1px solid var(--toast-border, #fee2e2)",
        padding: "16px",
        borderRadius: "16px",
        background: "var(--toast-bg, #fff)",
        color: "var(--toast-text, #000)",
        maxWidth: "340px"
      },
      className: "dark:!bg-[#0D0D17] dark:!border-[#2A2A3A] dark:!text-white"
    });
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

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true);
    try {
      const res = await fetch(`${API}/api/managers/feedbacks`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (res.ok) setFeedbacks(data.feedbacks || []);
    } catch (err) { console.error(err); toast.error("Failed to load feedbacks"); }
    setLoadingFeedbacks(false);
  };

  const fetchSupportRequests = async () => {
    setLoadingSupport(true);
    try {
      const res = await fetch(`${API}/api/managers/support-requests`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (res.ok) setSupportRequests(data.supportRequests || []);
    } catch (err) { console.error(err); toast.error("Failed to load support requests"); }
    setLoadingSupport(false);
  };

  const fetchRefundRequests = async () => {
    setLoadingRefunds(true);
    try {
      const res = await fetch(`${API}/api/managers/refund-requests`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (res.ok) setRefundRequests(data.refundRequests || []);
    } catch (err) { console.error(err); toast.error("Failed to load refund requests"); }
    setLoadingRefunds(false);
  };

  const handleProcessRazorpay = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/managers/refund-requests/${id}/process-razorpay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Razorpay API failed. Try manual flow.");
        // Mark as api_failed locally so UI shows Manual button
        setRefundRequests(prev => prev.map(req => req.id === id ? { ...req, api_failed: true } : req));
        return;
      }
      toast.success(data.message);
      fetchRefundRequests();
    } catch (err: any) {
      toast.error("Network error. Try manual flow.");
      setRefundRequests(prev => prev.map(req => req.id === id ? { ...req, api_failed: true } : req));
    }
  };

  const handleUpdateRefundStatus = async (id: string, status: 'Approved' | 'Rejected' | 'Completed' | 'Awaiting UPI') => {
    let rejection_reason = "";
    if (status === 'Rejected') {
      const reason = window.prompt("Reason for Cancellation:");
      if (reason === null) return; // User cancelled prompt
      if (!reason.trim()) {
        toast.error("Rejection reason is required.");
        return;
      }
      rejection_reason = reason.trim();
    }
    
    try {
      const res = await fetch(`${API}/api/managers/refund-requests/${id}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}` 
        },
        body: JSON.stringify({ status, rejection_reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update refund status");
      toast.success(data.message);
      fetchRefundRequests();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteSupportRequest = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full shrink-0">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Delete Request?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
              Are you sure you want to delete this support request?
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 dark:hover:bg-[#2A2A3A] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`${API}/api/managers/support-requests/${id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to delete support request");
                toast.success("Support request deleted.");
                fetchSupportRequests();
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-red-500/20 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        border: "1px solid var(--toast-border, #fee2e2)",
        padding: "16px",
        borderRadius: "16px",
        background: "var(--toast-bg, #fff)",
        color: "var(--toast-text, #000)",
        maxWidth: "340px"
      },
      className: "dark:!bg-[#0D0D17] dark:!border-[#2A2A3A] dark:!text-white"
    });
  };

  const handleDeleteFeedback = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full shrink-0">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Delete Feedback?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
              Are you sure you want to delete this feedback? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 dark:hover:bg-[#2A2A3A] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`${API}/api/managers/feedbacks/${id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to delete feedback");
                toast.success("Feedback deleted.");
                fetchFeedbacks();
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-red-500/20 transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        border: "1px solid var(--toast-border, #fee2e2)",
        padding: "16px",
        borderRadius: "16px",
        background: "var(--toast-bg, #fff)",
        color: "var(--toast-text, #000)",
        maxWidth: "340px"
      },
      className: "dark:!bg-[#0D0D17] dark:!border-[#2A2A3A] dark:!text-white"
    });
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${API}/api/managers/orders`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
    } catch (err) { console.error(err); toast.error("Failed to load orders"); }
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (view === "requests" && accessToken) fetchRequests();
    if ((view === "vendors" || view === "dashboard") && accessToken) fetchVendors();
    if (view === "frontend" && accessToken) fetchCurrentPosters();
    if (view === "feedback" && accessToken) fetchFeedbacks();
    if (view === "orders" && accessToken) fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, accessToken]);

  useEffect(() => {
    if (isInitializing) return;
    if (!isLoggedIn || (user?.role !== "manager" && user?.role !== "admin")) {
      router.push("/");
    }
  }, [isLoggedIn, user, router, isInitializing]);

  if (isInitializing || !isLoggedIn || (user?.role !== "manager" && user?.role !== "admin")) {
    return <div className="min-h-screen bg-white dark:bg-[#151522]" />;
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
            ZC <span className={theme.text}>Partner</span>
          </span>
          <span className={`ml-2 text-[10px] font-bold ${theme.textDark} ${theme.bg} px-2 py-0.5 rounded-full uppercase tracking-widest border ${theme.border}`}>
            {user?.manager_type || "Manager"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-[#151522] text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 border border-gray-200 dark:border-[#2A2A3A] transition-colors"
          >
            {appTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-full">
            <UserCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{user?.email}</span>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 -mr-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );

  const ManagerSidebar = () => (
    <>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      <aside className={`w-64 bg-white dark:bg-[#0D0D17] border-l border-gray-200 dark:border-[#2A2A3A] flex flex-col h-screen fixed right-0 md:sticky top-0 shrink-0 z-[70] transition-transform duration-300 ease-in-out ${mobileSidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}>
        <div className="p-6 border-b border-gray-200 dark:border-[#2A2A3A]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center shadow-lg ${theme.shadow} shrink-0`}>
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-black text-gray-900 dark:text-gray-100 text-lg tracking-tight leading-none mt-1">
                  ZC <span className={theme.text}>Partner</span>
                </span>
                <span className={`inline-flex items-center self-start text-[9px] font-black ${theme.textDark} ${theme.bg} px-2 py-0.5 rounded border ${theme.border} uppercase tracking-widest`}>
                  {user?.manager_type || "Manager"}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 -mr-2 -mt-1 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

      <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <button onClick={() => { setView("dashboard"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "dashboard" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <LayoutDashboard className="w-5 h-5 shrink-0" /> <span className="truncate">Dashboard</span>
        </button>
        <button onClick={() => { setView("vendors"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "vendors" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <StoreIcon className="w-5 h-5 shrink-0" /> <span className="truncate">Manage Vendors</span>
        </button>
        <button onClick={() => { setView("frontend"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "frontend" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <LayoutTemplate className="w-5 h-5 shrink-0" /> <span className="truncate">Manage Frontend</span>
        </button>
        <button onClick={() => { setView("requests"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "requests" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <ClipboardList className="w-5 h-5 shrink-0" /> <span className="truncate">Vendor Requests</span>
        </button>
        <button onClick={() => { setView("orders"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "orders" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <Receipt className="w-5 h-5 shrink-0" /> <span className="truncate whitespace-nowrap">See Order and Payment</span>
        </button>
        <button onClick={() => { setView("feedback"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "feedback" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <MessageSquare className="w-5 h-5 shrink-0" /> <span className="truncate">Show Feedback</span>
        </button>
        <button onClick={() => { setView("support"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "support" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <LifeBuoy className="w-5 h-5 shrink-0" /> <span className="truncate">Support Request</span>
        </button>
        <button onClick={() => { setView("refunds"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "refunds" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <Undo2 className="w-5 h-5 shrink-0" /> <span className="truncate">Refund Requests</span>
        </button>
        <button onClick={() => { setView("zyphcart_payments"); setMobileSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${view === "zyphcart_payments" ? `${theme.bg} ${theme.textDark}` : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1F1F2E]"}`}>
          <IndianRupee className="w-5 h-5 shrink-0" /> <span className="truncate">Zyphcart Payments</span>
        </button>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#2A2A3A]">
        <div className="flex items-center gap-2 px-4 py-2 mb-2 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl">
          <UserCircle className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 truncate">{user?.email}</span>
        </div>
        <button onClick={() => { logout(); router.push("/"); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
    </>
  );

  const renderCategoryTable = (title: string, orders: any[]) => (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between items-end">
        {title}
        <span className="text-xs bg-gray-200 dark:bg-[#2A2A3A] px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{orders.length}</span>
      </h3>
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl p-6 text-center text-gray-400 text-sm shadow-sm">
          No orders in this category.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#151522] border-b border-gray-200 dark:border-[#2A2A3A]">
                <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">User Name</th>
                <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Payment Method</th>
                <th className="p-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A3A]">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#151522]/50">
                  <td className="p-3 font-mono text-xs font-bold text-gray-900 dark:text-gray-100">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="p-3 text-xs font-medium text-gray-700 dark:text-gray-300">{order.first_name} {order.last_name}</td>
                  <td className="p-3 text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">{order.payment_method?.replace(/_/g, ' ') || 'N/A'}</td>
                  <td className="p-3 text-xs font-black text-gray-900 dark:text-gray-100">₹{order.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 font-sans flex flex-col md:flex-row-reverse">
      {ManagerSidebar()}
      <div className="flex-1 flex flex-col min-w-0">
        <div>
          {ManagerNavbar()}
        </div>
        <main className="flex-1 w-full px-4 sm:px-8 py-8 max-w-5xl mx-auto">
        
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
              className="space-y-8"
            >
              {/* ── Service Center Status Widget ────────────────────────── */}
              <div className={`rounded-2xl border p-4 transition-all ${
                gpsStatus === "outside"
                  ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                  : gpsStatus === "inside"
                  ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30"
                  : "bg-white dark:bg-[#0D0D17] border-gray-200 dark:border-[#2A2A3A]"
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      gpsStatus === "outside" ? "bg-red-100 dark:bg-red-500/20"
                      : gpsStatus === "inside" ? "bg-green-100 dark:bg-green-500/20"
                      : theme.bg
                    }`}>
                      <Building2 className={`w-4 h-4 ${
                        gpsStatus === "outside" ? "text-red-500"
                        : gpsStatus === "inside" ? "text-green-500"
                        : theme.text
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Your Service Center</p>
                      {assignedCenter ? (
                        <>
                          <p className="font-black text-gray-900 dark:text-gray-100 text-[15px] leading-tight line-clamp-1">
                            {assignedCenter.landmark || assignedCenter.name}
                          </p>
                          {assignedCenter.landmark && (
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">{assignedCenter.name}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {assignedCenter.pincode && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.text} ${theme.bg} ${theme.border}`}>
                                PIN {assignedCenter.pincode}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-[#1F1F2E] px-2 py-0.5 rounded-full border border-gray-100 dark:border-[#2A2A3A]">
                              {parseFloat(String(assignedCenter.radius_km)).toFixed(1)} km radius
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          No service center assigned yet. Set one up to get started.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registered Shops */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                    <StoreIcon className="w-5 h-5 text-gray-400" /> Registered Shops
                  </h3>
                  <div className="flex items-center gap-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] px-3 py-1.5 rounded-xl shadow-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input 
                      type="date" 
                      value={dashboardDate}
                      onChange={(e) => setDashboardDate(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer dark:[color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <input
                    type="text"
                    placeholder="Search shops by name or owner..."
                    value={vendorSearchQuery}
                    onChange={(e) => setVendorSearchQuery(e.target.value)}
                    className="w-full sm:w-80 px-4 py-2.5 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm outline-none focus:border-orange-500 transition-colors shadow-sm placeholder:text-gray-400"
                  />
                </div>
                {loadingVendors ? (
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading shops...
                  </div>
                ) : vendors.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-8 text-center font-medium">
                    No shops registered in this division yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {vendors.filter((v: any) => (v.business_name || "").toLowerCase().includes(vendorSearchQuery.toLowerCase()) || (v.first_name || "").toLowerCase().includes(vendorSearchQuery.toLowerCase()) || (v.last_name || "").toLowerCase().includes(vendorSearchQuery.toLowerCase())).map((vendor: any) => (
                      <VendorCard 
                        key={vendor.id} 
                        vendor={vendor} 
                        date={dashboardDate} 
                        theme={theme} 
                        accessToken={accessToken} 
                        onAction={handleVendorAction} 
                      />
                    ))}
                  </div>
                )}
              </div>

            </motion.div>
          ) : view === "vendors" ? (
            <motion.div 
              key="vendors"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Manage Vendors</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Edit or remove active vendors in your division</p>
                </div>
                <button onClick={fetchVendors} className={`px-4 py-2 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm ${loadingVendors ? "opacity-50 pointer-events-none" : ""}`}>
                  {loadingVendors ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#151522] border-b border-gray-200 dark:border-[#2A2A3A]">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shop Name</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A3A]">
                      {loadingVendors ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-sm font-medium text-gray-500">Loading vendors...</td>
                        </tr>
                      ) : vendors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-sm font-medium text-gray-500">No vendors found.</td>
                        </tr>
                      ) : (
                        vendors.map((vendor: any) => (
                          <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-[#151522]/50 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">{vendor.business_name || "Unnamed"}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{vendor.vendor_type}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-700 dark:text-gray-300 text-sm">{vendor.first_name} {vendor.last_name}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{vendor.email}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{vendor.mobile}</div>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button 
                                onClick={() => openEditVendor(vendor)}
                                className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteVendor(vendor.id)}
                                className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{req.restaurant_name || req.owner_name}</h3>
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
                          <UserCircle className="w-4 h-4 text-gray-400" /> {req.owner_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#151522] px-3 py-2 rounded-lg">
                          <Mail className="w-4 h-4 text-gray-400" /> {req.owner_email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#151522] px-3 py-2 rounded-lg">
                          <Phone className="w-4 h-4 text-gray-400" /> {req.owner_mobile}
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

                      {req.status === "approved" && req.password && (
                        <div className="mt-2 flex items-center justify-center p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-900/30">
                          Approved & Active
                        </div>
                      )}
                    </div>
                  ))}
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
                      {type === "food" ? "Home (Food)" : "Store (Essentials)"}
                    </span>{" "}page.
                  </p>
                </div>
                <button
                  onClick={fetchCurrentPosters}
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
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Posters</p>
                  <button onClick={handleAddNewPoster} className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r ${theme.from} ${theme.to} shadow-sm`}>+ Add New Poster</button>
                </div>
                {loadingPoster ? (
                  <div className="h-48 bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl animate-pulse" />
                ) : currentPosters.length > 0 ? (
                  <div className="space-y-4">
                    {currentPosters.map((poster, idx) => (
                      <div key={poster.id || idx} className="relative w-full rounded-2xl overflow-hidden border border-gray-100 dark:border-[#2A2A3A] shadow-sm p-4 bg-gray-50 dark:bg-[#151522]">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-gray-500">Poster #{poster.id}</span>
                           <div className="flex gap-2">
                             <button onClick={() => handleEditPoster(poster)} className="text-blue-500 hover:text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded">Edit</button>
                             <button onClick={() => handleDeletePoster(poster.id)} className="text-red-500 hover:text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded">Delete</button>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 mb-1">LIGHT THEME</p>
                            {poster.image_url ? <img src={poster.image_url} alt="Light poster" className="w-full object-cover rounded max-h-32" /> : <div className="h-32 bg-gray-200 dark:bg-[#2A2A3A] rounded flex items-center justify-center text-xs text-gray-400">No Image</div>}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 mb-1">DARK THEME</p>
                            {poster.dark_image_url ? <img src={poster.dark_image_url} alt="Dark poster" className="w-full object-cover rounded max-h-32" /> : <div className="h-32 bg-gray-200 dark:bg-[#2A2A3A] rounded flex items-center justify-center text-xs text-gray-400">No Image</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`h-48 ${theme.bg} rounded-2xl border-2 border-dashed ${theme.border} flex flex-col items-center justify-center gap-3`}>
                    <ImageIcon className={`w-10 h-10 ${theme.text} opacity-40`} />
                    <p className="text-sm font-semibold text-gray-400">No posters uploaded yet</p>
                    <p className="text-xs text-gray-400">Upload one below to make it live</p>
                  </div>
                )}
              </div>

              {/* Upload new poster */}
              <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-3xl p-6 shadow-sm">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  {editingPosterId ? `Edit Poster #${editingPosterId} (${posterTheme === 'dark' ? 'Dark' : 'Light'})` : `Upload New Poster (${posterTheme === 'dark' ? 'Dark' : 'Light'})`}
                </p>

                {/* Drop zone */}
                <label
                  htmlFor="poster-upload"
                  className={`relative flex flex-col items-center justify-center w-full min-h-56 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                    posterPreview[posterTheme]
                      ? `border-transparent`
                      : `${theme.border} hover:border-opacity-60 ${theme.bg}`
                  }`}
                >
                  {posterPreview[posterTheme] ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={posterPreview[posterTheme] as string} alt="Preview" className="w-full rounded-2xl object-cover max-h-72" />
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

                {/* Dish Link Input */}
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Target Routing / Category</label>
                  <div className="flex gap-2">
                    <select
                      value={posterLink}
                      onChange={(e) => setPosterLink(e.target.value)}
                      className={`flex-1 border ${theme.border} rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-opacity-100 ${theme.bg} ${theme.textDark} transition-all`}
                    >
                      <option value="">-- Select Routing --</option>
                      {availableOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {editingPosterId && (
                      <button
                        onClick={handleUpdateLinkOnly}
                        disabled={updatingLink || !posterLink}
                        className={`px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${updatingLink || !posterLink ? "opacity-50 cursor-not-allowed" : ""} bg-gradient-to-r ${theme.from} ${theme.to} hover:opacity-90`}
                      >
                        {updatingLink ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Update Link Only"}
                      </button>
                    )}
                  </div>
                </div>

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
                  <p>The poster goes live instantly after publishing. Upload a new poster or edit an existing one above. Use high-resolution landscape images for the best result.</p>
                </div>
              </div>
            </motion.div>
          ) : view === "orders" ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Orders & Payments</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">Recent orders from {user?.manager_type} vendors</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <input
                    type="date"
                    value={orderDateQuery}
                    onChange={(e) => setOrderDateQuery(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm text-gray-700 dark:text-gray-300 dark:[color-scheme:dark]"
                  />
                  <input
                    type="text"
                    placeholder="Search Order ID..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2.5 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm placeholder:text-gray-400"
                  />
                  <button onClick={fetchOrders} className={`px-4 py-2.5 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm whitespace-nowrap ${loadingOrders ? "opacity-50 pointer-events-none" : ""}`}>
                    {loadingOrders ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>

              {orders.length === 0 && !loadingOrders ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center">
                  <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No orders found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] shadow-sm rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-[#151522] border-b border-gray-200 dark:border-[#2A2A3A]">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A3A]">
                      {orders.filter((order: any) => {
                        const matchesId = (order.id || "").toLowerCase().includes(orderSearchQuery.toLowerCase());
                        const orderDate = new Date(order.created_at);
                        const orderDateStr = !isNaN(orderDate.getTime()) ? orderDate.toISOString().split('T')[0] : "";
                        const matchesDate = orderDateQuery ? orderDateStr === orderDateQuery : true;
                        return matchesId && matchesDate;
                      }).map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#151522]/50 transition-colors">
                          <td className="p-4 font-mono text-sm text-gray-900 dark:text-gray-100 font-bold">#{order.id.slice(0, 8).toUpperCase()}</td>
                          <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{new Date(order.created_at).toLocaleString()}</td>
                          <td className="p-4 text-sm font-bold text-gray-900 dark:text-gray-100">{order.vendor_first_name} {order.vendor_last_name}</td>
                          <td className="p-4 text-sm font-black text-gray-900 dark:text-gray-100">₹{order.total_amount}</td>
                          <td className="p-4">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-gradient'}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ) : view === "feedback" ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">User Feedback</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">Feedback for {user?.manager_type} services</p>
                </div>
                <button onClick={fetchFeedbacks} className={`px-4 py-2 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm ${loadingFeedbacks ? "opacity-50 pointer-events-none" : ""}`}>
                  {loadingFeedbacks ? "Loading..." : "Refresh"}
                </button>
              </div>

              {feedbacks.length === 0 && !loadingFeedbacks ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No feedback received yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feedbacks.map((fb: any) => (
                    <div key={fb.id} className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-5 shadow-sm relative group">
                      <div className="flex justify-between items-start mb-3 pr-8">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100">{fb.first_name} {fb.last_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{fb.email}</p>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{new Date(fb.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteFeedback(fb.id)}
                        className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-100 dark:border-red-500/20"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {fb.rating && (
                        <div className="flex items-center gap-1 mb-3">
                          {[1,2,3,4,5].map(star => (
                            <svg key={star} className={`w-4 h-4 ${star <= fb.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-700"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#151522] p-3 rounded-xl border border-gray-100 dark:border-[#2A2A3A]">
                        "{fb.message}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === "support" ? (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Support Requests</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">Customer support tickets</p>
                </div>
                <button onClick={fetchSupportRequests} className={`px-4 py-2 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm ${loadingSupport ? "opacity-50 pointer-events-none" : ""}`}>
                  {loadingSupport ? "Loading..." : "Refresh"}
                </button>
              </div>

              {supportRequests.length === 0 && !loadingSupport ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center">
                  <LifeBuoy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No support requests received.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supportRequests.map((req: any) => (
                    <div key={req.id} className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-5 shadow-sm relative group">
                      <div className="flex justify-between items-start mb-3 pr-8">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100">{req.first_name} {req.last_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{req.user_email}</p>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteSupportRequest(req.id)}
                        className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-500/10 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-red-100 dark:border-red-500/20"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-blue-100 text-blue-700">
                          {req.contact_method}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-[#2A2A3A] dark:text-gray-300">
                          {req.contact_number}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-[#151522] p-3 rounded-xl border border-gray-100 dark:border-[#2A2A3A]">
                        "{req.issue}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === "refunds" ? (
            <motion.div
              key="refunds"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Refund Requests</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">Customer refund tickets</p>
                </div>
                <button onClick={fetchRefundRequests} className={`px-4 py-2 text-sm font-bold bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] shadow-sm ${loadingRefunds ? "opacity-50 pointer-events-none" : ""}`}>
                  {loadingRefunds ? "Loading..." : "Refresh"}
                </button>
              </div>

              {refundRequests.length === 0 && !loadingRefunds ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center">
                  <Undo2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No refund requests pending.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {refundRequests.map((req: any) => (
                    <div key={req.id} className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-5 shadow-sm flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-gray-100">{req.user_name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {req.email && req.email !== 'No contact provided' ? req.email : ''}
                            {req.email && req.email !== 'No contact provided' && req.user_mobile ? ' • ' : ''}
                            {req.user_mobile || (req.email === 'No contact provided' ? 'No contact provided' : '')}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-[#2A2A3A] text-gray-600 dark:text-gray-300 rounded font-mono">
                              Order: #{req.order_id?.slice(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded">
                              Amount: ₹{req.amount}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            req.status === 'Approved' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                            req.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                            req.status === 'UPI Provided' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' :
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {req.status === 'Pending' && (
                        <div className="flex flex-col gap-2 mt-4">
                          <div className="grid grid-cols-1 gap-2">
                            {req.api_failed ? (
                              <button 
                                onClick={() => handleUpdateRefundStatus(req.id, 'Awaiting UPI')}
                                className="w-full py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-500/20 rounded-xl text-xs font-bold transition-colors border border-orange-100 dark:border-orange-500/20 flex items-center justify-center gap-1"
                              >
                                Manual Refund (Request UPI)
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleProcessRazorpay(req.id)}
                                className="w-full py-2 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-xl text-xs font-bold transition-colors border border-green-100 dark:border-green-500/20 flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Refund
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => handleUpdateRefundStatus(req.id, 'Rejected')}
                            className="w-full py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl text-[10px] font-bold transition-colors border border-red-100 dark:border-red-500/20 flex items-center justify-center gap-1 mt-1"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}

                      {req.status === 'Rejected' && req.rejection_reason && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Reason for Cancellation</p>
                          <p className="text-sm font-medium text-red-700 dark:text-red-400">{req.rejection_reason}</p>
                        </div>
                      )}

                      {req.status === 'UPI Provided' && req.upi_id && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl">
                          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">User UPI ID</p>
                          <p className="text-sm font-mono font-bold text-purple-700 dark:text-purple-400 mb-3">{req.upi_id}</p>
                          <button 
                            onClick={() => handleUpdateRefundStatus(req.id, 'Completed')}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-purple-500/30 flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Refund Successful
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === "zyphcart_payments" ? (
            <motion.div key="zyphcart_payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Zyphcart Payments</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Platform fee and GST collected day-wise across all vendors</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={zyphcartPaymentsDate}
                    onChange={(e) => setZyphcartPaymentsDate(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all cursor-pointer shadow-sm"
                  />
                </div>
              </div>

              {loadingZyphcartPayments ? (
                <div className="p-10 text-center"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">PF (Delivered)</h3>
                    <p className="text-3xl font-black text-green-600 dark:text-green-500">₹{Number(zyphcartPaymentsData?.delivered_platform_fee || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">GST (Delivered)</h3>
                    <p className="text-3xl font-black text-gray-900 dark:text-gray-100">₹{Number(zyphcartPaymentsData?.delivered_gst || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">PF (Cancelled)</h3>
                    <p className="text-3xl font-black text-orange-gradient dark:text-orange-gradient">₹{Number(zyphcartPaymentsData?.cancelled_platform_fee || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">GST (Cancelled)</h3>
                    <p className="text-3xl font-black text-red-600 dark:text-red-500">₹{Number(zyphcartPaymentsData?.cancelled_gst || 0).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === "vendor_payment" && selectedVendorForDetails ? (
            <motion.div key="vendor_payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView("dashboard")} className="p-2 rounded-xl bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedVendorForDetails.business_name ? `${selectedVendorForDetails.business_name} Payments` : "Payments"}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Date: {new Date(dashboardDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cash On Delivery</h3>
                  <p className="text-3xl font-black text-gray-900 dark:text-gray-100">₹{vendorDetailsData?.cod_amount || 0}</p>
                </div>
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Online On Delivery</h3>
                  <p className="text-3xl font-black text-gray-900 dark:text-gray-100">₹{vendorDetailsData?.online_on_delivery_amount || 0}</p>
                </div>
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cancelled (Delivery Fee)</h3>
                  <p className="text-3xl font-black text-gray-900 dark:text-gray-100">₹{vendorDetailsData?.cancelled_delivery_fee || 0}</p>
                </div>
              </div>
            </motion.div>
          ) : view === "vendor_delivered" && selectedVendorForDetails ? (
            <motion.div key="vendor_delivered" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setView("dashboard")} className="p-2 rounded-xl bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedVendorForDetails.business_name ? `${selectedVendorForDetails.business_name} Delivered Orders` : "Delivered Orders"}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Date: {new Date(dashboardDate).toLocaleDateString()}</p>
                </div>
              </div>
              {vendorDetailsLoading ? (
                <div className="p-10 text-center"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></div>
              ) : vendorDetailsData?.length === 0 ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center text-gray-500 shadow-sm">No delivered orders found for this date.</div>
              ) : (
                <div className="space-y-4">
                  {renderCategoryTable("Cash On Delivery", vendorDetailsData?.filter((o: any) => o.payment_method?.toLowerCase().includes('cash') || o.payment_method?.toLowerCase() === 'cod') || [])}
                  {renderCategoryTable("Online On Delivery", vendorDetailsData?.filter((o: any) => o.payment_method?.toLowerCase().includes('online on delivery')) || [])}

                </div>
              )}
            </motion.div>
          ) : view === "vendor_cancelled" && selectedVendorForDetails ? (
            <motion.div key="vendor_cancelled" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => setView("dashboard")} className="p-2 rounded-xl bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" /></button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedVendorForDetails.business_name ? `${selectedVendorForDetails.business_name} Cancelled Orders` : "Cancelled Orders"}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Date: {new Date(dashboardDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by Order ID..."
                    value={cancelSearchQuery}
                    onChange={(e) => setCancelSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm outline-none focus:border-red-500 transition-colors shadow-sm placeholder:text-gray-400"
                  />
                </div>
              </div>
              {vendorDetailsLoading ? (
                <div className="p-10 text-center"><RefreshCw className="w-8 h-8 text-red-500 animate-spin mx-auto" /></div>
              ) : vendorDetailsData?.length === 0 ? (
                <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-10 text-center text-gray-500 shadow-sm">No cancelled orders found for this date.</div>
              ) : (
                <div className="space-y-6">
                  {/* Online On Delivery Cancelled Orders */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex justify-between items-end">
                      Online On Delivery
                      <span className="text-xs bg-gray-200 dark:bg-[#2A2A3A] px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                        {vendorDetailsData?.filter((o: any) => o.payment_method === 'online_on_delivery' && (o.id || "").toLowerCase().includes(cancelSearchQuery.toLowerCase())).length || 0}
                      </span>
                    </h3>
                    {vendorDetailsData?.filter((o: any) => o.payment_method === 'online_on_delivery' && (o.id || "").toLowerCase().includes(cancelSearchQuery.toLowerCase())).length === 0 ? (
                      <div className="bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl p-6 text-center text-gray-400 text-sm shadow-sm">
                        No cancelled orders in this category.
                      </div>
                    ) : (
                      <div className="overflow-x-auto bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl shadow-sm">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-[#151522] border-b border-gray-200 dark:border-[#2A2A3A]">
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Order ID</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">User Name</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Full Payment</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Advance Paid</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Remaining Paid</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Adv Refund</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Processed</th>
                              <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-[#2A2A3A]">
                            {vendorDetailsData?.filter((o: any) => o.payment_method === 'online_on_delivery' && (o.id || "").toLowerCase().includes(cancelSearchQuery.toLowerCase())).map((order: any) => {
                              const advancePaidAmount = parseFloat(order.platform_fee || "0") + parseFloat(order.delivery_charge || "0") + parseFloat(order.advance_fee || "0");
                              const isFullPaymentViaAdv = order.advance_paid && (parseFloat(order.total_amount || "0") - advancePaidAmount <= 0.01);
                              
                              return (
                              <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#151522]/50">
                                <td className="p-4 font-mono text-sm font-bold text-gray-900 dark:text-gray-100">#{order.id.slice(0, 8).toUpperCase()}</td>
                                <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">{order.first_name} {order.last_name}</td>
                                <td className="p-4 text-center">
                                  {isFullPaymentViaAdv ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 dark:text-[#2A2A3A] mx-auto" />}
                                </td>
                                <td className="p-4 text-center">
                                  {order.advance_paid && !isFullPaymentViaAdv ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 dark:text-[#2A2A3A] mx-auto" />}
                                </td>
                                <td className="p-4 text-center">
                                  {order.payment_status === 'paid' && !isFullPaymentViaAdv ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-300 dark:text-[#2A2A3A] mx-auto" />}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`font-bold ${order.advance_paid ? 'text-green-600 dark:text-green-500' : 'text-gray-400'}`}>
                                    ₹{order.advance_paid ? Number(order.advance_fee || 0).toFixed(2) : "0.00"}
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  {order.adv_refund_processed ? (
                                    <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 block w-max mx-auto text-center">Successfully Completed</span>
                                  ) : (
                                    <input 
                                      type="checkbox" 
                                      checked={!!order.adv_refund_processed}
                                      onChange={() => handleToggleAdvRefund(order.id, !!order.adv_refund_processed)}
                                      className="w-5 h-5 rounded border-gray-300 dark:border-[#2A2A3A] dark:bg-[#151522] text-orange-500 focus:ring-orange-500 cursor-pointer mx-auto block" 
                                    />
                                  )}
                                </td>
                                <td className="p-4"><span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase bg-red-100 text-red-700">Cancelled</span></td>
                              </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>


                </div>
              )}
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
                    className={`w-full border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-${type === 'store' ? 'blue' : 'orange'}-400 transition-all`}
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
            © 2026 ZyphCart Technologies · Partner Console
          </p>
          <div className="hidden sm:flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md border border-green-100">
              <ShieldCheck className="w-3 h-3" /> Secure Session
            </span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
