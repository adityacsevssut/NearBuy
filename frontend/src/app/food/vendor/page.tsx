"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  LogOut, Store, ShoppingBag, LayoutTemplate,
  Utensils, MessageSquare, UserCircle, ChevronRight,
  Pill, Package, TrendingUp, Star, Boxes, MapPin, ChevronDown, CheckCircle, Save, PhoneCall, CalendarDays, Menu, X
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocationContext } from "@/context/LocationContext";
import ManageFrontPageModal from "./ManageFrontPageModal";
import ManageLocationRangeModal from "./ManageLocationRangeModal";
import ManageFoodsModal from "./ManageFoodsModal";
import ManageContactDetailsModal from "./ManageContactDetailsModal";

// ─────────────────────────────────────────────────────────────────────────────
// Theme map: food → orange, store → blue
// ─────────────────────────────────────────────────────────────────────────────
const THEMES = {
  food: {
    pageBg:       "bg-gray-50 dark:bg-[#151522]",
    navBg:        "bg-gradient-to-r from-orange-500 to-orange-600",
    navText:      "text-white",
    navSubtext:   "text-orange-100",
    navBadge:     "bg-white/20 dark:bg-[#0D0D17]/20 text-white border-white/30",
    navEmail:     "bg-white/20 dark:bg-[#0D0D17]/15 border-white/20 text-white",
    navLogout:    "bg-white/20 dark:bg-[#0D0D17]/15 hover:bg-white/30 dark:hover:bg-[#0D0D17]/25 text-white border-white/20",
    cardBorder:   "border-orange-200 hover:border-orange-400",
    cardShadow:   "hover:shadow-orange-500/15",
    iconBg:       "bg-orange-100",
    iconColor:    "text-orange-500",
    accent:       "text-orange-600",
    accentLight:  "text-orange-500",
    badge:        "bg-orange-100 text-orange-700 border-orange-200",
    footerText:   "text-orange-600",
    label:        "Food",
    typeIcon:     Utensils,
    gradFrom:     "from-orange-500",
    gradTo:       "to-orange-600",
  },
  store: {
    pageBg:       "bg-gray-50 dark:bg-[#151522]",
    navBg:        "bg-gradient-to-r from-blue-500 to-blue-700",
    navText:      "text-white",
    navSubtext:   "text-blue-100",
    navBadge:     "bg-white/20 dark:bg-[#0D0D17]/20 text-white border-white/30",
    navEmail:     "bg-white/20 dark:bg-[#0D0D17]/15 border-white/20 text-white",
    navLogout:    "bg-white/20 dark:bg-[#0D0D17]/15 hover:bg-white/30 dark:hover:bg-[#0D0D17]/25 text-white border-white/20",
    cardBorder:   "border-blue-200 hover:border-blue-400",
    cardShadow:   "hover:shadow-blue-500/15",
    iconBg:       "bg-blue-100",
    iconColor:    "text-blue-500",
    accent:       "text-blue-600",
    accentLight:  "text-blue-500",
    badge:        "bg-blue-100 text-blue-700 border-blue-200",
    footerText:   "text-blue-600",
    label:        "Store",
    typeIcon:     Boxes,
    gradFrom:     "from-blue-500",
    gradTo:       "to-blue-700",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function VendorDashboard() {
  const { user, logout, isLoggedIn, accessToken, isInitializing } = useAuth();
  const { locationName, landmark, pincode, setIsLocationModalOpen } = useLocationContext();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isFrontPageOpen, setIsFrontPageOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isFoodsOpen, setIsFoodsOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [isOpenToggle, setIsOpenToggle] = useState(true);
  const [vendorStats, setVendorStats] = useState({ todaysOrders: 0, avgRating: 0, totalRevenue: 0 });
  const [dynamicOpen, setDynamicOpen] = useState<boolean | null>(null);
  const [timingSummary, setTimingSummary] = useState<string | null>(null);
  const [opensIn, setOpensIn] = useState<string | null>(null);

  // Default to today in IST (UTC+5:30)
  const getTodayIST = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 330);
    return now.toISOString().split("T")[0];
  };
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/vendor-profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setProfile(data.profile);
          setIsOpenToggle(data.profile.is_open ?? false);
          setDynamicOpen(data.profile.dynamic_open ?? null);
          setTimingSummary(data.profile.timing_summary || null);
          setOpensIn(data.profile.opens_in || null);
        }
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  const fetchStats = async (date?: string) => {
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const d = date || selectedDate;
      const res = await fetch(`${API}/api/orders/vendor/stats?date=${d}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorStats(data);
      }
    } catch (err) {
      console.error("Failed to load stats", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      fetchProfile();
      fetchStats(selectedDate);
    }
  }, [isLoggedIn, accessToken]);

  // Refetch stats whenever selectedDate changes
  useEffect(() => {
    if (isLoggedIn && accessToken) {
      fetchStats(selectedDate);
    }
  }, [selectedDate]);

  const handleToggleOpenClosed = async () => {
    const nextState = !isOpenToggle;
    setIsOpenToggle(nextState);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const form = new FormData();
      form.append("is_open", String(nextState));

      const res = await fetch(`${API}/api/vendor-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error("Failed to toggle status", err);
      setIsOpenToggle(!nextState);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  // Auth guard — only vendors / admins
  useEffect(() => {
    if (!mounted || isInitializing) return;
    const timer = setTimeout(() => {
      if (!isLoggedIn || (user?.role !== "vendor" && user?.role !== "admin")) {
        router.push("/");
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user, router, mounted, isInitializing]);

  if (!mounted || isInitializing || !isLoggedIn || (user?.role !== "vendor" && user?.role !== "admin")) {
    return <div className="min-h-screen bg-white dark:bg-[#0D0D17]" />;
  }

  // Resolve theme
  const vType = (user?.manager_type || "food").toLowerCase() as keyof typeof THEMES;
  const t = THEMES[vType] ?? THEMES.food;
  const TypeIcon = t.typeIcon;

  // Restaurant display name
  const restaurantName = profile?.restaurant_name || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "My Shop";

  // ── 4 Feature Cards ──────────────────────────────────────────────────────
  const cards = [
    {
      id: "orders",
      title: "Orders",
      description:
        "View and manage all incoming customer orders. Accept, prepare, or mark them delivered.",
      icon: ShoppingBag,
      cardIconBg: "bg-amber-50",
      cardIconColor: "text-amber-500",
      badge: "Live",
      badgeBg: "bg-amber-100 text-amber-700 border-amber-200",
    },
    {
      id: "storefront",
      title: "Manage Front Page",
      description:
        "Customise how your shop appears to customers — banner, timings, offers, and description.",
      icon: LayoutTemplate,
      cardIconBg: t.iconBg,
      cardIconColor: t.iconColor,
      badge: "Storefront",
      badgeBg: t.badge,
    },
    {
      id: "range-payment",
      title: "Manage Location & Range",
      description:
        "Define your delivery zone limits, GPS coordinates tracking, and maximum range in kilometers.",
      icon: MapPin,
      cardIconBg: "bg-blue-50",
      cardIconColor: "text-blue-500",
      badge: "Zone limits",
      badgeBg: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      id: "foods",
      title: "Manage Foods",
      description:
        "Add, edit, or remove items from your menu. Update prices, photos and availability.",
      icon: Utensils,
      cardIconBg: "bg-green-50",
      cardIconColor: "text-green-500",
      badge: "Menu",
      badgeBg: "bg-green-100 text-green-700 border-green-200",
    },
    {
      id: "contact",
      title: "Contact Details",
      description:
        "Save your owner and delivery boy contact numbers to help customers reach out easily.",
      icon: PhoneCall,
      cardIconBg: "bg-teal-50",
      cardIconColor: "text-teal-500",
      badge: "Support",
      badgeBg: "bg-teal-100 text-teal-700 border-teal-200",
    },
    {
      id: "feedbacks",
      title: "Feedbacks",
      description:
        "Read customer reviews and ratings. Gain insights to improve your service and quality.",
      icon: MessageSquare,
      cardIconBg: "bg-purple-50",
      cardIconColor: "text-purple-500",
      badge: "Reviews",
      badgeBg: "bg-purple-100 text-purple-700 border-purple-200",
    },
  ];

  // ── Quick stats ─────────────────────────────────────────────
  const isToday = selectedDate === getTodayIST();
  const stats = [
    { id: "todays_orders", label: isToday ? "Today's Orders" : "Orders", value: vendorStats.todaysOrders.toString(), icon: ShoppingBag },
    { id: "avg_rating", label: "Avg. Rating", value: vendorStats.avgRating > 0 ? vendorStats.avgRating.toFixed(1) : "—", icon: Star },
    { id: "total_revenue", label: "Revenue", value: `₹${vendorStats.totalRevenue.toFixed(0)}`, icon: TrendingUp },
  ];

  return (
    <div className={`min-h-screen ${t.pageBg} flex flex-col font-sans`}>

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav className={`sticky top-0 z-50 ${t.navBg} shadow-lg`}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* Left: Icon + Restaurant name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 dark:bg-[#0D0D17]/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-black text-[15px] tracking-tight ${t.navText} leading-tight max-w-[170px] sm:max-w-xs truncate`}>
                {restaurantName}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-widest leading-tight ${t.navSubtext}`}>
                Vendor Portal
              </span>
            </div>
            <span className={`hidden sm:inline text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-widest ${t.navBadge} ml-1`}>
              {t.label}
            </span>
          </div>

          {/* Right: Email chip + logout + mobile menu */}
          <div className="flex items-center gap-2.5">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm ${t.navEmail}`}>
              <UserCircle className="w-4 h-4 opacity-80" />
              <span className="text-xs font-bold max-w-[150px] truncate">{user?.email}</span>
            </div>
            <button
              onClick={() => { logout(); router.push("/"); }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border backdrop-blur-sm transition-all ${t.navLogout}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* ══════════════════ LOCATION TRACKING BAR ══════════════════ */}
      <div className="bg-white dark:bg-[#0D0D17] border-b border-gray-100 dark:border-[#2A2A3A] shadow-sm z-40 relative">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <button
            suppressHydrationWarning
            onClick={() => setIsLocationModalOpen(true)}
            className="flex items-center justify-between w-full sm:max-w-md px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522] hover:bg-gray-100 dark:hover:bg-[#1F1F2E] transition-colors hover:border-gray-400 group"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MapPin className={`w-5 h-5 ${t.iconColor} shrink-0 group-hover:scale-110 transition-transform`} />
              <div className="flex flex-col text-left overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-gray-900 dark:text-gray-100 text-[15px] tracking-tight leading-none truncate">
                    Vendor Location Tracing
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-gray-600 dark:text-gray-400 transition-colors" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-tight truncate mt-0.5">
                  {landmark || locationName}{pincode ? ` · ${pincode}` : ''}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ══════════════════ HERO — clean white with colored accent ══════════════════ */}
      <div className="bg-white dark:bg-[#0D0D17] border-b border-gray-100 dark:border-[#2A2A3A] relative">
        {/* Thin colored top accent stripe */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${t.gradFrom} ${t.gradTo}`} />

        <div className="max-w-6xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3 mb-1"
            >
              <div className={`w-9 h-9 rounded-xl ${t.iconBg} flex items-center justify-center`}>
                <TypeIcon className={`w-4.5 h-4.5 ${t.iconColor}`} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
                  Welcome back! 👋
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Managing <span className={`font-black ${t.accent}`}>{restaurantName}</span>
                </p>
              </div>
            </motion.div>

            {/* Shop status toggle switch */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-col gap-2 self-start md:self-center"
            >
              {/* Main toggle row */}
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] px-4 py-2.5 rounded-2xl shadow-sm">
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Shop Status</span>
                  <span className={`text-[13px] font-black mt-1 ${
                    !isOpenToggle ? 'text-red-500'
                    : dynamicOpen === false ? 'text-orange-500'
                    : 'text-green-600'
                  }`}>
                    {!isOpenToggle
                      ? 'Closed / Offline'
                      : dynamicOpen === false
                      ? 'Outside Hours'
                      : 'Accepting Orders'
                    }
                  </span>
                </div>
                <button
                  onClick={handleToggleOpenClosed}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none flex items-center ${
                    isOpenToggle ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white dark:bg-[#0D0D17] shadow-md transform transition-transform duration-300 ${
                      isOpenToggle ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {/* Timing summary chip */}
              {timingSummary && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
                  isOpenToggle && dynamicOpen
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                    : isOpenToggle && dynamicOpen === false
                    ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400'
                    : 'bg-gray-50 dark:bg-[#151522] border-gray-200 dark:border-[#2A2A3A] text-gray-500'
                }`}>
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[180px]">{timingSummary}</span>
                  {isOpenToggle && dynamicOpen === false && opensIn && (
                    <span className="ml-1 font-black text-orange-500">· Opens in {opensIn}</span>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Stats header + date picker */}
          <div className="mt-5 flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Performance Stats</p>
            <div className="flex items-center gap-2">
              {!isToday && (
                <button
                  onClick={() => setSelectedDate(getTodayIST())}
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${t.badge} transition-all hover:opacity-80`}
                >
                  ↩ Today
                </button>
              )}
              {/* Styled date picker button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (dateInputRef.current && 'showPicker' in HTMLInputElement.prototype) {
                    try {
                      dateInputRef.current.showPicker();
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all shadow-sm select-none
                  ${isToday
                    ? `bg-white dark:bg-[#0D0D17] border-gray-200 dark:border-[#2A2A3A] hover:border-orange-300`
                    : `${t.iconBg} border-orange-300`
                  }`}
              >
                <CalendarDays className={`w-3.5 h-3.5 ${t.iconColor} shrink-0`} />
                <span className={`text-xs font-black ${isToday ? 'text-gray-700 dark:text-gray-200' : t.iconColor}`}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </span>
                <input
                  ref={dateInputRef}
                  id="stats-date-picker"
                  type="date"
                  value={selectedDate}
                  max={getTodayIST()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute bottom-0 left-1/2 w-0 h-0 opacity-0 pointer-events-none"
                />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                onClick={() => {
                  if (s.id === "todays_orders") router.push("/food/vendor/todays-orders");
                }}
                className={`rounded-2xl border border-gray-100 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522] px-3 py-3 flex flex-col items-center text-center gap-1 shadow-sm ${s.id === "todays_orders" ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1F1F2E] transition-colors" : ""}`}
              >
                <div className={`w-8 h-8 rounded-xl ${t.iconBg} flex items-center justify-center mb-0.5`}>
                  <s.icon className={`w-4 h-4 ${t.iconColor}`} />
                </div>
                <p className="text-xl font-black text-gray-900 dark:text-gray-100 leading-none">{s.value}</p>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════════════ MOBILE SIDEBAR ══════════════════ */}
      {/* Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 z-[70] h-full w-[80vw] max-w-[320px] bg-white dark:bg-[#0D0D17] shadow-2xl flex flex-col md:hidden transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className={`flex items-center justify-between px-5 py-4 bg-gradient-to-r ${t.gradFrom} ${t.gradTo} shrink-0`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <TypeIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-white leading-none truncate max-w-[150px]">{restaurantName}</p>
              <p className="text-[10px] font-semibold text-white/70 uppercase tracking-widest">Quick Actions</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Sidebar items — all non-orders cards */}
        <div className="flex-1 overflow-y-auto py-3">
          {cards
            .filter(card => card.id !== "orders")
            .map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => {
                    setIsSidebarOpen(false);
                    if (card.id === "storefront") setIsFrontPageOpen(true);
                    else if (card.id === "range-payment") setIsRangeModalOpen(true);
                    else if (card.id === "foods") setIsFoodsOpen(true);
                    else if (card.id === "contact") setIsContactModalOpen(true);
                    else if (card.id === "feedbacks") router.push("/food/vendor/feedbacks");
                  }}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors text-left group border-b border-gray-100 dark:border-[#1A1A2A] last:border-0"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-2xl ${card.cardIconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${card.cardIconColor}`} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-gray-100 leading-tight">{card.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5 line-clamp-1">{card.description}</p>
                  </div>
                  {/* Badge + arrow */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${card.badgeBg}`}>
                      {card.badge}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-300 group-hover:${t.iconColor} group-hover:translate-x-0.5 transition-all`} />
                  </div>
                </button>
              );
            })}
        </div>

        {/* Sidebar footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#2A2A3A] shrink-0">
          <button
            onClick={() => { setIsSidebarOpen(false); logout(); router.push("/"); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A2A3A] text-xs font-black text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* ══════════════════ MAIN CARDS ══════════════════ */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-xs font-black uppercase tracking-widest ${t.accent} mb-5`}
        >
          Dashboard
        </motion.p>

        {/* Mobile: only Orders card + a "More" button to open sidebar */}
        <div className="md:hidden space-y-4">
          {cards
            .filter(card => card.id === "orders")
            .map((card) => {
              const Icon = card.icon;
              return (
                <motion.button
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.18 }}
                  onClick={() => router.push("/food/vendor/orders")}
                  className={`w-full group text-left flex flex-col p-6 bg-white dark:bg-[#0D0D17] rounded-3xl border ${t.cardBorder} hover:shadow-xl ${t.cardShadow} transition-all duration-300 relative overflow-hidden cursor-pointer`}
                >
                  <div className="absolute top-0 right-0 p-5 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity pointer-events-none select-none">
                    <Icon className="w-24 h-24 text-gray-900 dark:text-gray-100" />
                  </div>
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl ${card.cardIconBg} flex items-center justify-center shadow-sm`}>
                      <Icon className={`w-5 h-5 ${card.cardIconColor}`} />
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${card.badgeBg}`}>{card.badge}</span>
                  </div>
                  <div className="relative z-10 flex-1">
                    <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100 mb-1.5 tracking-tight">{card.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{card.description}</p>
                  </div>
                  <div className="relative z-10 mt-5 flex items-center gap-1">
                    <span className={`text-xs font-black ${t.accentLight} uppercase tracking-wider`}>Open</span>
                    <ChevronRight className={`w-4 h-4 ${t.accentLight} group-hover:translate-x-1 transition-transform duration-200`} />
                  </div>
                  <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${t.gradFrom} ${t.gradTo} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                </motion.button>
              );
            })}

          {/* Mobile: "More Options" button to open sidebar */}
          <motion.button
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.26 }}
            onClick={() => setIsSidebarOpen(true)}
            className={`w-full flex items-center justify-between p-5 bg-white dark:bg-[#0D0D17] rounded-3xl border ${t.cardBorder} hover:shadow-lg transition-all duration-300 cursor-pointer group`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${t.iconBg} flex items-center justify-center shadow-sm`}>
                <Menu className={`w-5 h-5 ${t.iconColor}`} />
              </div>
              <div className="text-left">
                <p className="font-black text-[15px] text-gray-900 dark:text-gray-100 leading-tight">More Options</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Front page, location, menu, contacts & feedback</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${t.accentLight} group-hover:translate-x-1 transition-transform duration-200 shrink-0`} />
          </motion.button>
        </div>

        {/* Desktop: full grid with all cards */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.18 + i * 0.07 }}
                onClick={() => {
                  if (card.id === "storefront") setIsFrontPageOpen(true);
                  else if (card.id === "range-payment") setIsRangeModalOpen(true);
                  else if (card.id === "foods") setIsFoodsOpen(true);
                  else if (card.id === "contact") setIsContactModalOpen(true);
                  else if (card.id === "orders") router.push("/food/vendor/orders");
                  else if (card.id === "feedbacks") router.push("/food/vendor/feedbacks");
                }}
                className={`group text-left flex flex-col p-6 bg-white dark:bg-[#0D0D17] rounded-3xl border ${t.cardBorder} hover:shadow-xl ${t.cardShadow} transition-all duration-300 relative overflow-hidden cursor-pointer`}
              >
                <div className="absolute top-0 right-0 p-5 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity pointer-events-none select-none">
                  <Icon className="w-24 h-24 text-gray-900 dark:text-gray-100" />
                </div>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-2xl ${card.cardIconBg} flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-5 h-5 ${card.cardIconColor}`} />
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${card.badgeBg}`}>
                    {card.badge}
                  </span>
                </div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-[17px] font-black text-gray-900 dark:text-gray-100 mb-1.5 tracking-tight">{card.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{card.description}</p>
                </div>
                <div className="relative z-10 mt-5 flex items-center gap-1">
                  <span className={`text-xs font-black ${t.accentLight} uppercase tracking-wider`}>Open</span>
                  <ChevronRight className={`w-4 h-4 ${t.accentLight} group-hover:translate-x-1 transition-transform duration-200`} />
                </div>
                <div className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r ${t.gradFrom} ${t.gradTo} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </motion.button>
            );
          })}
        </div>
      </main>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="mt-auto py-5 border-t border-gray-200 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17]">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-400">
            © 2026 ZyphCart Technologies · Vendor Console
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-br ${t.gradFrom} ${t.gradTo}`} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${t.footerText}`}>
              {t.label} Division
            </span>
          </div>
        </div>
      </footer>

      {/* ══════════════════ MODALS ══════════════════ */}
      {mounted && (
        <>
          <ManageFrontPageModal 
            isOpen={isFrontPageOpen} 
            onClose={() => {
              setIsFrontPageOpen(false);
              fetchProfile();
            }} 
            vendorType={vType}
          />
          <ManageLocationRangeModal
            isOpen={isRangeModalOpen}
            onClose={() => {
              setIsRangeModalOpen(false);
              fetchProfile();
            }}
            profile={profile}
          />
          <ManageFoodsModal
            isOpen={isFoodsOpen}
            onClose={() => setIsFoodsOpen(false)}
            vendorType={vType}
            onOpenFrontPage={() => setIsFrontPageOpen(true)}
          />
          <ManageContactDetailsModal
            isOpen={isContactModalOpen}
            onClose={() => {
              setIsContactModalOpen(false);
              fetchProfile();
            }}
            profile={profile}
            vendorType={vType}
          />
        </>
      )}
    </div>
  );
}
