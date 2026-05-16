"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, ChevronDown, Search, ShoppingCart, X, Store, Package, LogOut, Code2,
  CreditCard, Bell, Heart, ShoppingBag, Calendar, Clock, Mail, MessageCircle, 
  QrCode, Globe, Percent, Star, Users, Trash2, Pencil, ChevronRight
} from "lucide-react";
import LoginModal from "./LoginModal";
import { useAuth } from "@/context/AuthContext";

const DEV_EMAIL = "nahakaditya344@gmail.com";

export default function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, logout } = useAuth();
  const cartCount = 3;
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const isEssentials = pathname === "/essentials";
  
  const theme = {
    gradient: isEssentials ? "from-blue-500 to-blue-400" : "from-orange-500 to-orange-400",
    textPrimary: isEssentials ? "text-blue-500" : "text-orange-500",
    avatarBg: isEssentials ? "from-blue-100 to-blue-50" : "from-orange-100 to-orange-50",
    selection: isEssentials ? "selection:bg-blue-200" : "selection:bg-orange-200",
    hoverBg: isEssentials ? "group-hover:bg-blue-50" : "group-hover:bg-orange-50",
    hoverText: isEssentials ? "group-hover:text-blue-500" : "group-hover:text-orange-500",
    dangerBorder: isEssentials ? "border-blue-50" : "border-red-50",
    dangerText: isEssentials ? "text-blue-500" : "text-red-500",
    dangerHoverBg: isEssentials ? "hover:bg-blue-50/50" : "hover:bg-red-50/50",
  };

  const primaryText = theme.textPrimary;
  const primaryHoverText = theme.hoverText;
  const primaryBorder = isEssentials ? "border-blue-400" : "border-orange-400";
  const primaryBorderHover = isEssentials ? "hover:border-blue-400" : "hover:border-orange-400";
  const primaryBg = isEssentials ? "bg-blue-500" : "bg-orange-500";

  const suggestions = [
    "🍛 Biryani near VSSUT",
    "📄 Lab Manual printing",
    "⚡ USB-C Charger",
    "🥤 Late Night Maggi",
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
          <div className="flex items-center -skew-x-6 pr-1">
            <span className={`font-black text-3xl tracking-tighter drop-shadow-sm transition-colors ${primaryText} ${primaryHoverText}`}>
              N
            </span>
            <span className="text-gray-900 font-black text-3xl tracking-tighter -ml-1.5 drop-shadow-sm group-hover:text-gray-700 transition-colors">
              B
            </span>
          </div>
          <span className="font-black text-xl tracking-tight hidden lg:block">
            <span className={primaryText}>Near</span>
            <span className="text-gray-900">Buy</span>
          </span>
          <span className={`lg:hidden font-black text-xl tracking-tight ${primaryText} -ml-1`}>
            {isEssentials ? "Store" : "Food"}
          </span>
        </Link>

        {/* ── App Mode Toggle (Food vs Essentials) ── */}
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200/50 flex-shrink-0">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${
              !isEssentials
                ? "bg-white text-orange-600 shadow-sm border border-gray-200/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <Store className="w-4 h-4" />
            <span className="hidden sm:block">Food Delivery</span>
            <span className="sm:hidden">Food</span>
          </Link>
          <Link
            href="/essentials"
            className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${
              isEssentials
                ? "bg-white text-blue-600 shadow-sm border border-gray-200/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:block">Essentials</span>
            <span className="sm:hidden">Store</span>
          </Link>
        </div>

        {/* ── Universal Search ── */}
        <div className="relative flex-1 hidden md:block max-w-md">
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border
              transition-all duration-300 bg-gray-50 ${
              searchFocused
                ? `${primaryBorder} shadow-[0_0_0_3px_rgba(16,185,129,0.1)]`
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Search
              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                searchFocused ? primaryText : "text-gray-400"
              }`}
            />
            <input
              id="search-bar"
              suppressHydrationWarning
              type="text"
              placeholder={isEssentials ? "Search for notebooks, chargers..." : "Search for Biryani, Pizza..."}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none h-6"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700 transition-colors" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {searchFocused && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl p-2
                  border border-gray-200 shadow-xl z-50"
              >
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                  Quick Searches
                </p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600
                      hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Action Icons ── */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            id="location-picker"
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full
              border border-gray-200 ${primaryBorderHover} bg-gray-50
              transition-all duration-200 group mr-2`}
          >
            <MapPin className={`w-3.5 h-3.5 ${primaryText}`} />
            <span className="text-gray-800 font-semibold text-xs tracking-tight">
              Pulaha Hostel
            </span>
            <ChevronDown className={`w-3 h-3 text-gray-400 ${isEssentials ? 'group-hover:text-blue-500' : 'group-hover:text-orange-500'} transition-colors`} />
          </button>

          <button
            id="cart-btn"
            className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
          >
            <ShoppingCart className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
            {cartCount > 0 && (
              <span className={`absolute top-1 right-1 w-4 h-4 ${primaryBg} rounded-full
                text-white text-[10px] font-black flex items-center justify-center`}>
                {cartCount}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <div className="relative ml-2 hidden md:block" ref={userMenuRef}>
              <button
                id="user-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${primaryBg}`}>
                  {user?.firstName ? user.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm font-semibold text-gray-700">{user?.firstName || user?.email?.split('@')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 bg-[#F8F9FA] rounded-[32px] shadow-[0_16px_60px_rgba(0,0,0,0.1)] border border-gray-100 w-[340px] z-50 overflow-hidden max-h-[85vh] overflow-y-auto custom-scrollbar"
                  >
                    {/* Header bg matches mobile */}
                    <div className={`bg-gradient-to-br ${theme.gradient} pt-5 pb-16 px-4 relative`}>
                      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 rounded-full border-[20px] border-white/10"></div>
                      <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-28 h-28 rounded-full border-[12px] border-white/10"></div>
                    </div>

                    <div className="px-4 space-y-5 -mt-12 relative z-20 pb-5">
                      {/* Floating Profile Card */}
                      <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center border border-gray-50/50">
                        <div className="relative">
                          <div className={`w-14 h-14 bg-gradient-to-tr ${theme.avatarBg} rounded-2xl flex items-center justify-center border-2 border-white shadow-sm rotate-3`}>
                            <span className={`text-xl font-black ${theme.textPrimary} -rotate-3`}>
                              {user?.firstName ? user.firstName[0].toUpperCase() : user?.email?.[0].toUpperCase()}
                            </span>
                          </div>
                          <button className="absolute -bottom-2 -right-2 bg-gray-800 p-1 rounded-full border-2 border-white text-white hover:bg-black transition-colors">
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        
                        <div className="ml-4 flex-1 min-w-0">
                          <h2 className="text-[17px] font-black text-gray-800 tracking-tight leading-tight truncate">
                            {user?.firstName || "NearBuy"} {user?.lastName || "User"}
                          </h2>
                          <p className="text-[12px] font-medium text-gray-400 mt-0.5 truncate">{user?.email}</p>
                        </div>
                      </div>

                      {/* Action Pills */}
                      <div className="flex gap-2 justify-between">
                        <ActionPill icon={CreditCard} label="Wallet" color="text-blue-500" bg="bg-blue-50" />
                        <ActionPill icon={Bell} label="Alerts" color="text-purple-500" bg="bg-purple-50" />
                        <ActionPill icon={Heart} label="Saved" color="text-rose-500" bg="bg-rose-50" />
                      </div>

                      {/* Section: Activity */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">My Activity</h3>
                        <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden py-1">
                          <ModernRow icon={ShoppingBag} label="Purchase History" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={MapPin} label="Saved Addresses" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={Calendar} label="Active Subscriptions" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={Clock} label="Buy Again" theme={theme} onClick={() => setUserMenuOpen(false)} />
                        </div>
                      </div>

                      {/* Section: Help Center */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Help Center</h3>
                        <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden py-1">
                          <ModernRow icon={Mail} label="Contact Support" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={MessageCircle} label="Chat on WhatsApp" theme={theme} onClick={() => setUserMenuOpen(false)} />
                        </div>
                      </div>

                      {/* Section: Settings */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Preferences & More</h3>
                        <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-gray-100/50 overflow-hidden py-1">
                          <ModernRow icon={QrCode} label="My QR Code" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={Percent} label="Exclusive Offers" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={Users} label="Invite Friends" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={Star} label="Rate NearBuy" theme={theme} onClick={() => setUserMenuOpen(false)} />
                          <ModernRow icon={Globe} label="App Language" theme={theme} onClick={() => setUserMenuOpen(false)} />
                        </div>
                      </div>

                      {/* Developer Section */}
                      {user?.email === DEV_EMAIL && (
                        <div className="space-y-2">
                          <h3 className="text-[10px] font-black text-violet-400 uppercase tracking-widest px-2">⚡ Developer</h3>
                          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-violet-100 overflow-hidden py-1">
                            <Link
                              href="/dev"
                              onClick={() => setUserMenuOpen(false)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-100/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                                  <Code2 className="w-4 h-4 text-violet-600" />
                                </div>
                                <div>
                                  <span className="text-[13.5px] font-bold text-gray-700 group-hover:text-gray-900 block leading-tight">Dev Dashboard</span>
                                  <span className="text-[10px] text-violet-400 font-medium leading-tight">Manage managers & platform</span>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-violet-300 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Danger Zone */}
                      <div className={`bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border ${theme.dangerBorder} overflow-hidden`}>
                        <button 
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${theme.dangerText} font-bold ${theme.dangerHoverBg} transition-colors`}
                        >
                          <LogOut className="w-4 h-4" /> Log Out
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              id="login-signup-btn"
              onClick={() => setIsLoginModalOpen(true)}
              className={`hidden sm:flex items-center ml-2 px-5 py-1.5 rounded-full text-sm text-white font-bold shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 ${primaryBg}`}
            >
              Login
            </button>
          )}
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} isEssentials={isEssentials} />
    </nav>
  );
}

// Subcomponents matching the mobile Account Page style
function ActionPill({ icon: Icon, label, color, bg }: { icon: any, label: string, color: string, bg: string }) {
  return (
    <button className="flex-1 bg-white py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 transition-transform active:scale-95">
      <div className={`p-2 rounded-xl ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-[10px] font-bold text-gray-600">{label}</span>
    </button>
  );
}

function ModernRow({ icon: Icon, label, onClick, theme }: { icon: any, label: string, onClick?: () => void, theme: any }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/80 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
          <Icon className={`w-4 h-4 text-gray-500 ${theme.hoverText} transition-colors`} />
        </div>
        <span className="text-[13.5px] font-bold text-gray-700 group-hover:text-gray-900">{label}</span>
      </div>
      <ChevronRight className={`w-3.5 h-3.5 text-gray-300 ${theme.hoverText} group-hover:translate-x-0.5 transition-all`} />
    </button>
  );
}
