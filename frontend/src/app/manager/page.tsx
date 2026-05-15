"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, LayoutTemplate, ClipboardList, Store as StoreIcon, Building2, UserCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function PartnerDashboard() {
  const { user, logout, isLoggedIn, accessToken } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "vendors" | "requests">("dashboard");
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

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

  useEffect(() => {
    if (view === "requests" && accessToken) {
      fetchRequests();
    }
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
    return <div className="min-h-screen bg-gray-50" />;
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
    borderHover: "hover:border-orange-300",
    shadowHover: "hover:shadow-orange-500/10",
    from: "from-orange-500",
    to: "to-orange-600",
    shadow: "shadow-orange-500/20",
    textDark: "text-orange-600",
    btnText: "text-orange-600",
    btnTextHover: "hover:text-orange-700",
  };

  const ManagerNavbar = () => (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center shadow-lg ${theme.shadow}`}>
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-gray-900 text-lg tracking-tight">
            NB <span className={theme.text}>Partner</span>
          </span>
          <span className={`ml-2 text-[10px] font-bold ${theme.textDark} ${theme.bg} px-2 py-0.5 rounded-full uppercase tracking-widest border ${theme.border}`}>
            {user?.manager_type || "Manager"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
            <UserCircle className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-600">{user?.email}</span>
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
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col">
      <ManagerNavbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Partner Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Welcome back. Manage your division from here.</p>
          </div>
          
          {view !== "dashboard" && (
            <button 
              onClick={() => setView("dashboard")}
              className={`text-sm font-bold ${theme.btnText} ${theme.btnTextHover} px-4 py-2 rounded-xl ${theme.bg} ${theme.bgHover} transition-colors`}
            >
              ← Back to Dashboard
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
              <button className={`flex flex-col items-start p-6 rounded-2xl bg-white border border-gray-200 ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <LayoutTemplate className="w-24 h-24" />
                </div>
                <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4 border ${theme.border}`}>
                  <LayoutTemplate className={`w-5 h-5 ${theme.text}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Manage Frontend</h3>
                <p className="text-sm text-gray-500 leading-relaxed relative z-10">
                  Customize the look, banners, and categories of your frontend platform page.
                </p>
              </button>

              {/* Button 2: Manage Vendor Requests */}
              <button 
                onClick={() => setView("requests")}
                className={`flex flex-col items-start p-6 rounded-2xl bg-white border border-gray-200 ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <ClipboardList className="w-24 h-24" />
                </div>
                <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4 border ${theme.border}`}>
                  <ClipboardList className={`w-5 h-5 ${theme.text}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Vendor Requests</h3>
                <p className="text-sm text-gray-500 leading-relaxed relative z-10">
                  Review and approve new vendor owner registration requests for your category.
                </p>
              </button>

              {/* Button 3: Manage Vendors */}
              <button 
                onClick={() => setView("vendors")}
                className={`flex flex-col items-start p-6 rounded-2xl bg-white border border-gray-200 ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-5 transition-opacity">
                  <StoreIcon className="w-24 h-24" />
                </div>
                <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center mb-4 border ${theme.border} shadow-inner`}>
                  <StoreIcon className={`w-5 h-5 ${theme.text}`} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">Manage Vendors</h3>
                <p className="text-sm text-gray-500 leading-relaxed relative z-10">
                  Add new vendors manually, manage their credentials, and view their performance.
                </p>
              </button>
            </motion.div>
          ) : view === "vendors" ? (
            <motion.div 
              key="vendors"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
            >
              <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add New Vendor</h2>
                    <p className="text-xs text-gray-500 mt-1">Register a new vendor owner for the {user?.manager_type} category</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${theme.bg} flex items-center justify-center border ${theme.border}`}>
                    <StoreIcon className={`w-5 h-5 ${theme.text}`} />
                  </div>
                </div>

                {/* This will be designed in the next step */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-10 text-center border-dashed">
                  <StoreIcon className="w-8 h-8 text-gray-400 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-gray-600 font-medium">Vendor Registration Form Placeholder</p>
                  <p className="text-xs text-gray-500 mt-1">Ready to design the form in the next step.</p>
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
                  <h2 className="text-xl font-bold text-gray-900">Vendor Requests</h2>
                  <p className="text-xs text-gray-500 mt-1">Pending and processed partnership requests for {user?.manager_type} category</p>
                </div>
                <button onClick={fetchRequests} className={`px-4 py-2 text-sm font-bold bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm ${loadingReqs ? "opacity-50 pointer-events-none" : ""}`}>
                  {loadingReqs ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {requests.length === 0 && !loadingReqs ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No vendor requests found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {requests.map(req => (
                    <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors shadow-sm relative overflow-hidden">
                      {/* Status indicator line */}
                      <div className={`absolute top-0 left-0 w-full h-1 ${
                        req.status === 'approved' ? 'bg-green-500' : 
                        req.status === 'rejected' ? 'bg-red-500' : 
                        'bg-orange-400'
                      }`} />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{req.owner_name}</h3>
                            {req.status === 'approved' && (
                              <span className="flex items-center gap-1 text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-tighter">
                                <ShieldCheck className="w-2.5 h-2.5" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 capitalize">{req.vendor_type} Partner</p>
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
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          <UserCircle className="w-4 h-4 text-gray-400" /> {req.owner_email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
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
                          <button onClick={() => handleAction(req.id, "reject")} className="flex-1 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 text-sm font-bold rounded-xl transition-colors">
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

      </main>

      {/* Simple Footer */}
      <footer className="mt-auto py-5 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-center sm:justify-between">
          <p className="text-[11px] font-medium text-gray-500">
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
