"use client";

import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import MobileBottomNav from "@/components/MobileBottomNav";
import { 
  ArrowLeft, CreditCard, Bell, Heart, ShoppingBag, 
  MapPin, Calendar, Clock, Mail, MessageCircle, 
  QrCode, Globe, Percent, Star, Users, Trash2, LogOut, Pencil, User as UserIcon,
  ChevronRight, AlertTriangle, Code2, ChevronDown, Navigation, Plus
} from "lucide-react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";

const DEV_EMAIL = "nahakaditya344@gmail.com";

function AccountContent() {
  const { user, accessToken, logout, isLoggedIn } = useAuth();
  const { savedAddresses, removeSavedAddress, setIsLocationModalOpen, setLocation } = useLocationContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBlue = searchParams.get('theme') === 'blue';
  const [showAddresses, setShowAddresses] = useState(false);

  const theme = {
    gradient: isBlue ? "from-blue-500 to-blue-400" : "from-orange-500 to-orange-400",
    textPrimary: isBlue ? "text-blue-500" : "text-orange-500",
    avatarBg: isBlue ? "from-blue-100 to-blue-50" : "from-orange-100 to-orange-50",
    selection: isBlue ? "selection:bg-blue-200" : "selection:bg-orange-200",
    hoverBg: isBlue ? "group-hover:bg-blue-50" : "group-hover:bg-orange-50",
    hoverText: isBlue ? "group-hover:text-blue-500" : "group-hover:text-orange-500",
    dangerBorder: isBlue ? "border-blue-50" : "border-red-50",
    dangerText: isBlue ? "text-blue-500" : "text-red-500",
    dangerHoverBg: isBlue ? "hover:bg-blue-50/50" : "hover:bg-red-50/50",
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoggedIn) router.push("/");
    }, 100);
    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);

  const handleDeleteAccount = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 text-[15px]">Delete Account?</h3>
            <p className="text-sm text-gray-500 font-medium leading-tight mt-0.5">
              This action is permanent. All your data, orders, and saved items will be deleted immediately.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const toastId = toast.loading("Deleting account...");
              try {
                const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
                const res = await fetch(`${apiBase}/api/auth/me`, {
                  method: "DELETE",
                  headers: {
                    "Authorization": `Bearer ${accessToken}`
                  }
                });
                
                if (res.ok) {
                  toast.success("Account permanently deleted.", { id: toastId, duration: 3000 });
                  logout();
                  router.push("/");
                } else {
                  const data = await res.json();
                  toast.error(data.error || "Failed to delete account.", { id: toastId, duration: 3000 });
                }
              } catch (err) {
                toast.error("An error occurred. Please try again.", { id: toastId, duration: 3000 });
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
        border: "1px solid #fee2e2",
        padding: "16px",
        borderRadius: "16px",
        background: "#fff",
        maxWidth: "340px"
      },
    });
  };

  if (!isLoggedIn) return null;

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F9FA] pb-24 font-sans ${theme.selection}`}>
      
      <div className="hidden md:block mb-8">
        <Navbar />
      </div>

      {/* Dynamic Brand Header */}
      <div className={`bg-gradient-to-br ${theme.gradient} pt-6 pb-20 px-4 rounded-b-[40px] relative shadow-lg md:hidden`}>
        <div className="flex items-center justify-between text-white relative z-10 mb-2">
          <button onClick={() => router.back()} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-extrabold tracking-wide">My Profile</h1>
          <div className="w-9 h-9"></div> {/* Spacer */}
        </div>
        
        {/* Decorative background rings */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full border-[24px] border-white/10"></div>
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 rounded-full border-[16px] border-white/10"></div>
      </div>

      <div className="px-5 space-y-6 max-w-lg mx-auto md:pt-28 md:mt-0 -mt-14 relative z-20">
        
        {/* Floating Profile Card */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center border border-gray-50/50">
          <div className="relative">
            <div className={`w-16 h-16 bg-gradient-to-tr ${theme.avatarBg} rounded-2xl flex items-center justify-center border-2 border-white shadow-sm rotate-3`}>
              <span className={`text-2xl font-black ${theme.textPrimary} -rotate-3`}>
                {user?.firstName ? user.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <button className="absolute -bottom-2 -right-2 bg-gray-800 p-1.5 rounded-full border-2 border-white text-white hover:bg-black transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
          
          <div className="ml-5 flex-1">
            <h2 className="text-[19px] font-black text-gray-800 tracking-tight leading-tight">
              {user?.firstName || "NearBuy"} {user?.lastName || "User"}
            </h2>
            <p className="text-[13px] font-medium text-gray-400 mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex gap-3 justify-between">
          <ActionPill icon={CreditCard} label="Wallet" color="text-blue-500" bg="bg-blue-50" />
          <ActionPill icon={Bell} label="Alerts" color="text-purple-500" bg="bg-purple-50" />
          <ActionPill icon={Heart} label="Saved" color="text-rose-500" bg="bg-rose-50" />
        </div>

        {/* Section: Activity */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">My Activity</h3>
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden py-1">
            <ModernRow icon={ShoppingBag} label="Recently Ordered" theme={theme} onClick={() => router.push("/orders?history=true")} />
            
            {/* ── Saved Addresses — expandable ── */}
            <div>
              <button
                onClick={() => setShowAddresses((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
                    <MapPin className={`w-4 h-4 text-gray-500 ${theme.hoverText} transition-colors`} />
                  </div>
                  <div className="text-left">
                    <span className="text-[14.5px] font-bold text-gray-700 group-hover:text-gray-900">Saved Addresses</span>
                    {savedAddresses.length > 0 && (
                      <span className={`ml-2 text-[11px] font-black px-1.5 py-0.5 rounded-full ${isBlue ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}>
                        {savedAddresses.length}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${showAddresses ? "rotate-180" : ""}`} />
              </button>

              {/* Expanded list */}
              {showAddresses && (
                <div className="px-5 pb-4 space-y-2">
                  {savedAddresses.length === 0 ? (
                    <div className="text-center py-6">
                      <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-400">No saved addresses yet</p>
                      <button
                        onClick={() => setIsLocationModalOpen(true)}
                        className={`mt-3 text-xs font-bold ${theme.textPrimary} underline underline-offset-2`}
                      >
                        + Add Address
                      </button>
                    </div>
                  ) : (
                    savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => {
                          setLocation(
                            addr.name,
                            addr.pincode || "",
                            addr.landmark || "",
                            addr.latitude != null ? parseFloat(String(addr.latitude)) : undefined,
                            addr.longitude != null ? parseFloat(String(addr.longitude)) : undefined
                          );
                          toast.success(`📍 Switched to ${addr.landmark ? addr.landmark : addr.name}`);
                          router.push("/");
                        }}
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-orange-50/50 cursor-pointer rounded-2xl border border-gray-100 hover:border-orange-200 transition-all group"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isBlue ? "bg-blue-50" : "bg-orange-50"}`}>
                          <MapPin className={`w-4 h-4 ${theme.textPrimary}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black text-gray-800 leading-tight truncate">
                            {addr.landmark ? addr.landmark : addr.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {addr.pincode && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${isBlue ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                                PIN {addr.pincode}
                              </span>
                            )}
                            {(addr.full_address || addr.landmark) && (
                              <p className="text-[11px] text-gray-400 truncate">
                                {addr.landmark ? `${addr.name}, ` : ""}{(addr.full_address || "").split(",").slice(0, 2).join(",")}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await removeSavedAddress(addr.id);
                            toast.success("Address removed");
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-90 shrink-0"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => setIsLocationModalOpen(true)}
                      className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors mt-2`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-xs font-bold">Add New Address</span>
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Section: Help Center */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Help Center</h3>
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden py-1">
            <ModernRow icon={Mail} label="Contact Support" theme={theme} />
            <ModernRow icon={MessageCircle} label="Chat on WhatsApp" theme={theme} />
          </div>
        </div>

        {/* Section: Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Preferences & More</h3>
          <div className="bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden py-1">
            <ModernRow icon={Users} label="Invite Friends" theme={theme} />
            <ModernRow icon={Star} label="Rate NearBuy" theme={theme} />
            <ModernRow icon={Globe} label="App Language" theme={theme} />
          </div>
        </div>

        {/* Developer Section — only visible to dev */}
        {user?.email === DEV_EMAIL && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest px-2">⚡ Developer</h3>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-violet-100 overflow-hidden py-1">
              <Link
                href="/dev"
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-violet-100/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                    <Code2 className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <span className="text-[14.5px] font-bold text-gray-700 group-hover:text-gray-900">Dev Dashboard</span>
                    <p className="text-[11px] text-violet-400 font-medium">Manage managers & platform</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-300 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className={`bg-white rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border ${theme.dangerBorder} overflow-hidden mt-6`}>
          <button 
            onClick={() => { logout(); router.push("/"); }}
            className={`w-full flex items-center justify-center gap-2 px-4 py-4 ${theme.dangerText} font-bold ${theme.dangerHoverBg} transition-colors`}
          >
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>

        <div className="flex justify-center pb-6">
          <button 
            onClick={handleDeleteAccount}
            className="text-xs font-bold text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2 flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete My Account
          </button>
        </div>

      </div>

      <MobileBottomNav />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] pb-24"></div>}>
      <AccountContent />
    </Suspense>
  );
}

// Subcomponents for the unique design

function ActionPill({ icon: Icon, label, color, bg }: { icon: any, label: string, color: string, bg: string }) {
  return (
    <button className="flex-1 bg-white py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 transition-transform active:scale-95">
      <div className={`p-2 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-[11px] font-bold text-gray-600">{label}</span>
    </button>
  );
}

function ModernRow({ icon: Icon, label, onClick, theme }: { icon: any, label: string, onClick?: () => void, theme: any }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
          <Icon className={`w-4 h-4 text-gray-500 ${theme.hoverText} transition-colors`} />
        </div>
        <span className="text-[14.5px] font-bold text-gray-700 group-hover:text-gray-900">{label}</span>
      </div>
      <ChevronRight className={`w-4 h-4 text-gray-300 ${theme.hoverText} group-hover:translate-x-0.5 transition-all`} />
    </button>
  );
}
