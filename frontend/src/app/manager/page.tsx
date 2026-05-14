"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, LayoutTemplate, ClipboardList, Store as StoreIcon, Building2, UserCircle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PartnerDashboard() {
  const { user, logout, isLoggedIn } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "vendors">("dashboard");

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
          
          {view === "vendors" && (
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
              <button className={`flex flex-col items-start p-6 rounded-2xl bg-white border border-gray-200 ${theme.borderHover} hover:shadow-xl ${theme.shadowHover} transition-all group text-left relative overflow-hidden`}>
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
          ) : (
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
          )}
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
