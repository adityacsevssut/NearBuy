"use client";

import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState } from "react";
import Link from "next/link";
import MobileBottomNav from "@/components/MobileBottomNav";
import { 
  ArrowLeft, CreditCard, Bell, Heart, ShoppingBag, ShoppingCart, Utensils,
  MapPin, Calendar, Clock, Mail, MessageCircle, Phone,
  QrCode, Globe, Percent, Star, Users, Trash2, LogOut, Pencil, User as UserIcon,
  ChevronRight, AlertTriangle, Code2, ChevronDown, Navigation, Plus, X, Check, Moon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import toast from "react-hot-toast";

const DEV_EMAIL = "nahakaditya344@gmail.com";

function AccountContent() {
  const { user, accessToken, logout, isLoggedIn, updateUser } = useAuth();
  const { savedAddresses, removeSavedAddress, setIsLocationModalOpen, setLocation } = useLocationContext();
  const { theme: appTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeParam = searchParams.get('theme') || 'orange';
  const isBlue = themeParam === 'blue';
  const isPurple = themeParam === 'purple';
  const domain = isBlue ? 'store' : isPurple ? 'hotels' : 'food';
  const [showAddresses, setShowAddresses] = useState(false);
  const [instagramLink, setInstagramLink] = useState("https://instagram.com/");
  const [supportEmail, setSupportEmail] = useState("manager@nearbuy.com");
  
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [appLanguage, setAppLanguage] = useState("English");
  
  // Rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName })
      });
      if (res.ok) {
        updateUser({ firstName: editFirstName, lastName: editLastName });
        setIsEditingProfile(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
    setSavingProfile(false);
  };

  const [orderStats, setOrderStats] = useState({ total: 0, received: 0 });

  useEffect(() => {
    async function fetchStats() {
      if (!isLoggedIn || !accessToken) return;
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${apiBase}/api/orders/stats`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOrderStats({ total: data.totalOrders, received: data.receivedOrders });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchStats();
  }, [isLoggedIn, accessToken]);

  const theme = {
    gradient: isBlue ? "from-blue-500 to-blue-400" : "from-orange-500 to-orange-400",
    textPrimary: isBlue ? "text-blue-500" : "text-orange-500",
    avatarBg: isBlue ? "from-blue-100 to-blue-50 dark:from-blue-500/20 dark:to-blue-500/10" : "from-orange-100 to-orange-50 dark:from-orange-500/20 dark:to-orange-500/10",
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

  useEffect(() => {
    async function fetchSettings() {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${apiBase}/api/public/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.instagram_link) setInstagramLink(data.instagram_link);
          if (data.food_email) setSupportEmail(data.food_email); // Defaulting to food manager for account page
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    }
    fetchSettings();
  }, []);

  const handleDeleteAccount = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Delete Account?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
              This action is permanent. All your data, orders, and saved items will be deleted immediately.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
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

  const handleToggleNotifications = async () => {
    if (!user) return;
    const previousStatus = user.notifications_enabled ?? true;
    const newStatus = !previousStatus;
    
    // Optimistic UI update for instant feedback
    updateUser({ notifications_enabled: newStatus });
    
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/api/auth/me/notifications`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ enabled: newStatus })
      });
      if (res.ok) {
        toast.success(newStatus ? "Notifications enabled!" : "Notifications paused.");
      } else {
        updateUser({ notifications_enabled: previousStatus });
        toast.error("Failed to update notification settings.");
      }
    } catch (err) {
      updateUser({ notifications_enabled: previousStatus });
      toast.error("Network error.");
    }
  };

  const handleRatingSubmit = async () => {
    if (ratingValue < 1 || ratingValue > 5) {
      toast.error("Please select a rating from 1 to 5.");
      return;
    }
    setSubmittingRating(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${apiBase}/api/auth/rate-app`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ rating: ratingValue })
      });
      if (res.ok) {
        toast.success("Thanks for giving rating!");
        setShowRatingModal(false);
      } else {
        toast.error("Failed to submit rating. Please try again.");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    }
    setSubmittingRating(false);
  };

  const handleInvite = async () => {
    const inviteText = "Hey! I'm inviting you to join NearBuy, an awesome app where you can get food from your nearest kitchens and groceries from your local market places delivered fast right to your doorstep!";
    const inviteUrl = window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join NearBuy",
          text: inviteText,
          url: inviteUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${inviteText} ${inviteUrl}`);
        toast.success("Invite link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link.");
      }
    }
  };

  if (!isLoggedIn) return null;

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8F9FA] dark:bg-[#0D0D17] pb-24 font-sans ${theme.selection}`}>
      
      <div className="hidden md:block mb-8">
        <Navbar />
      </div>

      {/* Dynamic Brand Header */}
      <div className={`bg-gradient-to-br ${theme.gradient} pt-6 pb-20 px-4 rounded-b-[40px] relative shadow-lg md:hidden`}>
        <div className="flex items-center justify-between text-white relative z-10 mb-2">
          <button onClick={() => router.back()} className="p-2 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 rounded-full backdrop-blur-md transition-colors">
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
        
        {/* Back to Home Button for PC */}
        <div className="hidden md:flex">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522] rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Floating Profile Card */}
        <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center border border-gray-50 dark:border-[#1F1F2E]/50">
          <div className="relative shrink-0">
            <div className={`w-16 h-16 bg-gradient-to-tr ${theme.avatarBg} rounded-2xl flex items-center justify-center border-2 border-white dark:border-[#2A2A3A] shadow-sm rotate-3`}>
              <span className={`text-2xl font-black ${theme.textPrimary} -rotate-3`}>
                {user?.firstName ? user.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
              </span>
            </div>
            {!isEditingProfile && (
              <button 
                onClick={() => {
                  setEditFirstName(user?.firstName || "");
                  setEditLastName(user?.lastName || "");
                  setIsEditingProfile(true);
                }} 
                className="absolute -bottom-2 -right-2 bg-gray-800 dark:bg-[#1F1F2E] p-1.5 rounded-full border-2 border-white dark:border-[#2A2A3A] text-white hover:bg-black transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="ml-5 flex-1 min-w-0">
            {isEditingProfile ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={editFirstName} 
                    onChange={e => setEditFirstName(e.target.value)} 
                    placeholder="First Name" 
                    className="w-full text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                  <input 
                    type="text" 
                    value={editLastName} 
                    onChange={e => setEditLastName(e.target.value)} 
                    placeholder="Last Name" 
                    className="w-full text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={savingProfile || (!editFirstName.trim() && !editLastName.trim())} 
                    className="text-xs font-bold bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-black disabled:opacity-50"
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </button>
                  <button 
                    onClick={() => setIsEditingProfile(false)} 
                    disabled={savingProfile}
                    className="text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 px-2 py-1.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[19px] font-black text-gray-800 dark:text-gray-200 tracking-tight leading-tight truncate">
                  {user?.firstName || "NearBuy"} {user?.lastName || "User"}
                </h2>
                <p className="text-[13px] font-medium text-gray-400 mt-0.5 truncate">{user?.email}</p>
              </>
            )}
          </div>
        </div>



        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
          
          {/* Cart Button */}
          <button
            onClick={() => router.push(`/${domain}/cart`)}
            className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm
              p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
              hover:shadow-md hover:-translate-y-0.5 hover:bg-orange-50 dark:hover:bg-orange-500/5 hover:border-orange-200/80 dark:hover:border-orange-500/20
              transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-orange-50 dark:bg-orange-500/10 border-2 border-orange-500 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center
                group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 group-hover:border-orange-300 dark:group-hover:border-orange-500/40 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </div>
            <div className="w-full">
              <p className="font-black text-[15px] sm:text-[16px] text-gray-900 dark:text-gray-100 leading-tight capitalize">{domain} Cart</p>
            </div>
          </button>

          {/* Wishlist Button */}
          <button
            onClick={() => router.push(`/${domain}/wishlist`)}
            className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm
              p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
              hover:shadow-md hover:-translate-y-0.5 hover:bg-rose-50 dark:hover:bg-rose-500/5 hover:border-rose-200/80 dark:hover:border-rose-500/20
              transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-rose-50 dark:bg-rose-500/10 border-2 border-rose-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 transition-colors">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div className="w-7 h-7 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 flex items-center justify-center
                group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 group-hover:border-rose-300 dark:group-hover:border-rose-500/40 transition-colors shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-rose-400 group-hover:text-rose-600 transition-colors" />
              </div>
            </div>
            <div className="w-full">
              <p className="font-black text-[15px] sm:text-[16px] text-gray-900 dark:text-gray-100 leading-tight">Wishlist</p>
            </div>
          </button>

          {/* Browse Restaurant Button */}
          <button
            onClick={() => router.push(`/${domain}`)}
            className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm
              p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
              hover:shadow-md hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:border-blue-200/80 dark:hover:border-blue-500/20
              transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-blue-50 dark:bg-blue-500/10 border-2 border-blue-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                <Utensils className="w-5 h-5 text-blue-500" />
              </div>
              <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center
                group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:border-blue-300 dark:group-hover:border-blue-500/40 transition-colors shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            <div className="w-full">
              <p className="font-black text-[15px] sm:text-[16px] text-gray-900 dark:text-gray-100 leading-tight capitalize">Browse {domain}</p>
            </div>
          </button>

          {/* Your Orders Button */}
          <button
            onClick={() => router.push(`/${domain}/orders?history=true`)}
            className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm
              p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
              hover:shadow-md hover:-translate-y-0.5 hover:bg-purple-50 dark:hover:bg-purple-500/5 hover:border-purple-200/80 dark:hover:border-purple-500/20
              transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-purple-50 dark:bg-purple-500/10 border-2 border-purple-500 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors">
                <ShoppingBag className="w-5 h-5 text-purple-500" />
              </div>
              <div className="w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center
                group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 group-hover:border-purple-300 dark:group-hover:border-purple-500/40 transition-colors shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </div>
            <div className="w-full">
              <p className="font-black text-[15px] sm:text-[16px] text-gray-900 dark:text-gray-100 leading-tight">Your Orders</p>
            </div>
          </button>

        </div>

        {/* Section: Activity */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Saved Information</h3>
          <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-[#2A2A3A]/50 overflow-hidden py-1">
            <ModernRow icon={ShoppingBag} label="Recently Ordered" theme={theme} onClick={() => router.push(`/${domain}/orders?history=true`)} />
            
            {/* ── Saved Addresses — expandable ── */}
            <div>
              <button
                onClick={() => setShowAddresses((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:bg-[#0D0D17] dark:hover:bg-[#151522]/80 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
                    <MapPin className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${theme.hoverText} transition-colors`} />
                  </div>
                  <div className="text-left">
                    <span className="text-[14.5px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-gray-100">Saved Addresses</span>
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
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] hover:bg-orange-50/50 cursor-pointer rounded-2xl border border-gray-100 dark:border-[#2A2A3A] hover:border-orange-200 transition-all group"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isBlue ? "bg-blue-50" : "bg-orange-50"}`}>
                          <MapPin className={`w-4 h-4 ${theme.textPrimary}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-black text-gray-800 dark:text-gray-200 leading-tight line-clamp-2 pr-2">
                            {addr.landmark ? addr.landmark : addr.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {addr.pincode && (
                              <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2 py-0.5 rounded-full border ${isBlue ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-orange-50 text-orange-600 border-orange-100"}`}>
                                PIN {addr.pincode}
                              </span>
                            )}
                            {(addr.full_address || addr.landmark) && (
                              <p className="text-[11px] text-gray-400 line-clamp-1 flex-1 min-w-[120px]">
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
                      className={`w-full py-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-[#0D0D17] dark:hover:bg-[#151522] hover:border-gray-400 transition-colors mt-2`}
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
          <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-[#2A2A3A]/50 overflow-hidden py-1">
            <ModernRow icon={Globe} label="Contact Us here" onClick={() => window.open(instagramLink, '_blank')} theme={theme} />
            <ModernRow icon={Mail} label="Need Help ? Facing Issues ?" onClick={() => window.location.href = `mailto:${supportEmail}?subject=Facing%20Issue`} theme={theme} />
          </div>
        </div>

        {/* Section: Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-2">Preferences & More</h3>
          <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100 dark:border-[#2A2A3A]/50 overflow-hidden py-1">
            
            {/* Notification Toggle Row */}
            <div className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:bg-[#0D0D17] dark:hover:bg-[#151522]/80 transition-colors group border-b border-gray-50 dark:border-[#1F1F2E]/50">
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
                  <Bell className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${theme.hoverText} transition-colors`} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[14.5px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-gray-100">Push Notifications</span>
                </div>
              </div>
              <button 
                onClick={handleToggleNotifications}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1 focus:outline-none ${
                  (user?.notifications_enabled ?? true) ? (isBlue ? "bg-blue-500" : "bg-orange-500") : "bg-gray-200"
                }`}
              >
                <div 
                  className={`w-4 h-4 bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-full shadow-md transform transition-transform duration-300 ${
                    (user?.notifications_enabled ?? true) ? "translate-x-6" : "translate-x-0"
                  }`} 
                />
              </button>
            </div>

            {/* Theme Toggle Row */}
            <div className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:bg-[#0D0D17] dark:hover:bg-[#151522]/80 transition-colors group border-b border-gray-50 dark:border-[#1F1F2E]/50">
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
                  <Moon className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${theme.hoverText} transition-colors`} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[14.5px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-gray-100">Dark Mode</span>
                </div>
              </div>
              <button 
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center px-1 focus:outline-none ${
                  appTheme === "dark" ? (isBlue ? "bg-blue-500" : "bg-orange-500") : "bg-gray-200"
                }`}
              >
                <div 
                  className={`w-4 h-4 bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-full shadow-md transform transition-transform duration-300 ${
                    appTheme === "dark" ? "translate-x-6" : "translate-x-0"
                  }`} 
                />
              </button>
            </div>

            <ModernRow icon={Users} label="Invite Friends" onClick={handleInvite} theme={theme} />
            <ModernRow icon={Star} label="Rate NearBuy" onClick={() => setShowRatingModal(true)} theme={theme} />
            <ModernRow icon={Globe} label="App Language" value={appLanguage} onClick={() => setShowLanguageModal(true)} theme={theme} />
          </div>
        </div>

        {/* Developer Section — only visible to dev */}
        {user?.email === DEV_EMAIL && (
          <div className="space-y-3">
            <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest px-2">⚡ Developer</h3>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-violet-100 dark:border-violet-500/20 overflow-hidden py-1">
              <Link
                href="/dev"
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-violet-100/50 dark:hover:bg-violet-500/5 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-500/30 transition-colors">
                    <Code2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <span className="text-[14.5px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-gray-100">Dev Dashboard</span>
                    <p className="text-[11px] text-violet-400 font-medium">Manage managers & platform</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-300 dark:text-violet-500/50 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className={`bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border ${theme.dangerBorder} overflow-hidden mt-6`}>
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

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRatingModal(false)} />
          <div className="relative bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl shadow-2xl w-full max-w-sm p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRatingModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 bg-gradient-to-tr ${theme.avatarBg}`}>
                <Star className={`w-8 h-8 ${theme.textPrimary}`} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Rate NearBuy</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">How much do you love using our app?</p>
            </div>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRatingValue(star)}
                  className={`p-2 transition-all duration-200 hover:scale-110 active:scale-95 ${ratingValue >= star ? theme.textPrimary : 'text-gray-300'}`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>

            <button
              onClick={handleRatingSubmit}
              disabled={ratingValue === 0 || submittingRating}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center bg-gradient-to-r ${theme.gradient} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submittingRating ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </div>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLanguageModal(false)} />
          <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowLanguageModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F2E] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Globe className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Select Language</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">Choose your preferred app language</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setAppLanguage("English");
                  setShowLanguageModal(false);
                  toast.success("Language set to English");
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  appLanguage === "English" 
                    ? `border-blue-500 bg-blue-50` 
                    : "border-gray-100 dark:border-[#2A2A3A] hover:border-gray-200 dark:border-[#2A2A3A]"
                }`}
              >
                <span className={`font-bold ${appLanguage === "English" ? "text-blue-700" : "text-gray-700 dark:text-gray-300"}`}>English</span>
                {appLanguage === "English" && <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D0D17] pb-24"></div>}>
      <AccountContent />
    </Suspense>
  );
}

// Subcomponents for the unique design

function ActionPill({ icon: Icon, label, color, bg }: { icon: any, label: string, color: string, bg: string }) {
  return (
    <button className="flex-1 bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] py-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 dark:border-[#1F1F2E] transition-transform active:scale-95">
      <div className={`p-2 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400">{label}</span>
    </button>
  );
}

function ModernRow({ icon: Icon, label, value, onClick, theme }: { icon: any, label: string, value?: string, onClick?: () => void, theme: any }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:bg-[#0D0D17] dark:hover:bg-[#151522]/80 transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`w-9 h-9 rounded-xl bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#151522] flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
          <Icon className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${theme.hoverText} transition-colors`} />
        </div>
        <span className="text-[14.5px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 dark:group-hover:text-gray-100">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[13px] font-bold text-gray-400">{value}</span>}
        <ChevronRight className={`w-4 h-4 text-gray-300 ${theme.hoverText} group-hover:translate-x-0.5 transition-all`} />
      </div>
    </button>
  );
}
