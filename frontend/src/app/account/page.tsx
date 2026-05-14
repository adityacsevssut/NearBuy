"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import { 
  ArrowLeft, CreditCard, Bell, Heart, ShoppingBag, 
  MapPin, Calendar, Clock, Mail, MessageCircle, 
  QrCode, Globe, Percent, Star, Users, Trash2, LogOut, Pencil, User as UserIcon,
  ChevronRight, AlertTriangle
} from "lucide-react";
import toast from "react-hot-toast";

function AccountContent() {
  const { user, accessToken, logout, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBlue = searchParams.get('theme') === 'blue';

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
                  toast.success("Account permanently deleted.", { id: toastId });
                  logout();
                  router.push("/");
                } else {
                  const data = await res.json();
                  toast.error(data.error || "Failed to delete account.", { id: toastId });
                }
              } catch (err) {
                toast.error("An error occurred. Please try again.", { id: toastId });
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
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F9FA] pb-24 md:hidden font-sans ${theme.selection}`}>
      
      {/* Dynamic Brand Header */}
      <div className={`bg-gradient-to-br ${theme.gradient} pt-6 pb-20 px-4 rounded-b-[40px] relative shadow-lg`}>
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

      <div className="px-5 space-y-6 max-w-lg mx-auto -mt-14 relative z-20">
        
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
            <ModernRow icon={ShoppingBag} label="Purchase History" theme={theme} />
            <ModernRow icon={MapPin} label="Saved Addresses" theme={theme} />
            <ModernRow icon={Calendar} label="Active Subscriptions" theme={theme} />
            <ModernRow icon={Clock} label="Buy Again" theme={theme} />
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
            <ModernRow icon={QrCode} label="My QR Code" theme={theme} />
            <ModernRow icon={Percent} label="Exclusive Offers" theme={theme} />
            <ModernRow icon={Users} label="Invite Friends" theme={theme} />
            <ModernRow icon={Star} label="Rate NearBuy" theme={theme} />
            <ModernRow icon={Globe} label="App Language" theme={theme} />
          </div>
        </div>

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
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] pb-24 md:hidden"></div>}>
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
