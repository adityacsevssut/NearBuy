"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ChevronDown, Search, ShoppingCart, X, Store, Package, LogOut, Code2,
  CreditCard, Bell, Heart, ShoppingBag, Calendar, Clock, Mail, MessageCircle,
  QrCode, Globe, Percent, Star, Users, Trash2, Pencil, ChevronRight, Menu,
  UtensilsCrossed, Pill
} from "lucide-react";
import LoginModal from "./LoginModal";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { useCart } from "@/context/CartContext";
import LocationModal from "./LocationModal";

const DEV_EMAIL = "nahakaditya344@gmail.com";

export default function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, logout, openLoginModal } = useAuth();
  const { locationName, setIsLocationModalOpen } = useLocationContext();
  const { restaurantCount: cartCount } = useCart();
  const pathname = usePathname();

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isEssentials = pathname === "/essentials" || pathname.startsWith("/essentials/");
  const isMedico = pathname === "/medico" || pathname.startsWith("/medico/");

  const theme = {
    gradient: isEssentials ? "from-blue-500 to-blue-400" : isMedico ? "from-emerald-500 to-emerald-400" : "from-orange-500 to-orange-400",
    textPrimary: isEssentials ? "text-blue-500" : isMedico ? "text-emerald-500" : "text-orange-500",
    avatarBg: isEssentials ? "from-blue-100 to-blue-50" : isMedico ? "from-emerald-100 to-emerald-50" : "from-orange-100 to-orange-50",
    selection: isEssentials ? "selection:bg-blue-200" : isMedico ? "selection:bg-emerald-200" : "selection:bg-orange-200",
    hoverBg: isEssentials ? "group-hover:bg-blue-50" : isMedico ? "group-hover:bg-emerald-50" : "group-hover:bg-orange-50",
    hoverText: isEssentials ? "group-hover:text-blue-500" : isMedico ? "group-hover:text-emerald-500" : "group-hover:text-orange-500",
    dangerBorder: isEssentials ? "border-blue-50" : isMedico ? "border-emerald-50" : "border-red-50",
    dangerText: isEssentials ? "text-blue-500" : isMedico ? "text-emerald-500" : "text-red-500",
    dangerHoverBg: isEssentials ? "hover:bg-blue-50/50" : isMedico ? "hover:bg-emerald-50/50" : "hover:bg-red-50/50",
  };

  const primaryText = theme.textPrimary;
  const primaryBg = isEssentials ? "bg-blue-500" : isMedico ? "bg-emerald-500" : "bg-orange-500";

  const suggestions = [
    "🍛 Biryani near VSSUT",
    "📄 Lab Manual printing",
    "⚡ USB-C Charger",
    "🥤 Late Night Maggi",
  ];

  // Sample notifications
  const notifications = [
    { id: 1, title: "Order Delivered!", body: "Your Biryani order has been delivered.", time: "2m ago", read: false, icon: "🎉" },
    { id: 2, title: "Flash Sale 🔥", body: "50% off on essentials for the next 1 hour!", time: "15m ago", read: false, icon: "⚡" },
    { id: 3, title: "New Store Nearby", body: "QuickMart just joined NearBuy near you.", time: "1h ago", read: true, icon: "🏪" },
    { id: 4, title: "Medico Discount", body: "Get 20% off on all medicines today.", time: "3h ago", read: true, icon: "💊" },
  ];
  const unreadCount = notifications.filter(n => !n.read).length;

  const navPages = [
    { href: "/", label: "Food", icon: UtensilsCrossed, activeColor: "text-orange-600", activeBg: "bg-orange-50", isActive: !isEssentials && !isMedico },
    { href: "/essentials", label: "Store", icon: Package, activeColor: "text-blue-600", activeBg: "bg-blue-50", isActive: isEssentials },
    { href: "/medico", label: "Medico", icon: Pill, activeColor: "text-emerald-600", activeBg: "bg-emerald-50", isActive: isMedico },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 backdrop-blur-md shadow-sm ${
        isEssentials ? "bg-blue-500/95" : isMedico ? "bg-emerald-500/95" : "bg-orange-500/95"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4 relative">

        {/* ── Hamburger (Mobile only) ── */}
        <div className="flex items-center flex-shrink-0 md:hidden" ref={mobileMenuRef}>
          <button
            id="hamburger-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Open menu"
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen
              ? <X className="w-6 h-6 text-gray-800" />
              : <Menu className="w-6 h-6 text-gray-800" />
            }
          </button>

          {/* ── Mobile Dropdown Menu ── */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-0 top-full mt-3 w-[260px] bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100/80 overflow-hidden z-50 p-2"
              >
                <div className="space-y-1">
                  {/* Page Links */}
                  {navPages.map(({ href, label, icon: Icon, activeColor, activeBg, isActive }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? `${activeBg} ${activeColor}`
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isActive ? `${activeBg}` : "bg-gray-100 group-hover:bg-gray-200"
                      }`}>
                        <Icon className={`w-4.5 h-4.5 ${isActive ? activeColor : "text-gray-500 group-hover:text-gray-700"}`} />
                      </div>
                      <span className="font-bold text-sm">{label}</span>
                      {isActive && (
                        <span className={`ml-auto text-[10px] font-black uppercase tracking-wider ${activeColor} opacity-70`}>
                          Active
                        </span>
                      )}
                    </Link>
                  ))}

                  {/* Divider */}
                  <div className="border-t border-gray-100 my-1" />

                  {/* Cart Button */}
                  <Link
                    href="/cart"
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center relative transition-colors">
                      <ShoppingCart className="w-4.5 h-4.5 text-gray-500 group-hover:text-gray-700" />
                      {cartCount > 0 && (
                        <span className={`absolute -top-1 -right-1 w-4 h-4 ${primaryBg} rounded-full text-white text-[9px] font-black flex items-center justify-center`}>
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm">Cart</span>
                    {cartCount > 0 && (
                      <span className={`ml-auto text-[11px] font-black ${primaryText}`}>
                        {cartCount} item{cartCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Logo ── */}
        <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center flex-shrink-0">
          <Link href="/" className="flex items-center group">
            <span className="font-black text-2xl md:text-3xl tracking-tight">
              <span className="text-white drop-shadow-sm">Near</span>
              <span className="text-black drop-shadow-sm">Buy</span>
            </span>
          </Link>
        </div>

        {/* ── App Mode Toggle (Desktop only) ── */}
        <div className="hidden md:flex bg-gray-100 p-1 rounded-xl flex-shrink-0 border border-gray-200/50">
          <Link
            href="/"
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${
              !isEssentials && !isMedico
                ? `bg-white text-orange-600 shadow-sm`
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
            }`}
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:block">Food Delivery</span>
            <span className="sm:hidden">Food</span>
          </Link>
          <Link
            href="/essentials"
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${
              isEssentials
                ? `bg-white text-blue-600 shadow-sm`
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:block">Essentials</span>
            <span className="sm:hidden">Store</span>
          </Link>
          <Link
            href="/medico"
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${
              isMedico
                ? `bg-white text-emerald-600 shadow-sm`
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
            }`}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:block">Medico</span>
            <span className="sm:hidden">Medico</span>
          </Link>
        </div>

        {/* ── Universal Search ── */}
        <div className="relative flex-1 hidden md:block max-w-md ml-4">
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border
              transition-all duration-300 bg-gray-50 ${
              searchFocused
                ? `${isEssentials ? 'border-blue-400 ring-2 ring-blue-100' : isMedico ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-orange-400 ring-2 ring-orange-100'} bg-white`
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Search
              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                searchFocused ? (isEssentials ? 'text-blue-500' : isMedico ? 'text-emerald-500' : 'text-orange-500') : "text-gray-400"
              }`}
            />
            <input
              id="search-bar"
              suppressHydrationWarning
              type="text"
              placeholder={isEssentials ? "Search for notebooks, chargers..." : isMedico ? "Search for medicines..." : "Search for Biryani, Pizza..."}
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
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-auto md:ml-0">
          <button
            id="location-picker"
            onClick={() => setIsLocationModalOpen(true)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full
              border border-gray-200 hover:bg-gray-50 bg-white text-gray-700
              transition-all duration-200 group max-w-[200px]`}
          >
            <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="font-semibold text-xs tracking-tight truncate">
              {locationName}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />
          </button>

          {/* Cart – hidden on mobile (lives in hamburger) */}
          <Link
            href="/cart"
            id="cart-btn"
            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors group hidden md:flex"
          >
            <ShoppingCart className="w-[22px] h-[22px] text-gray-700 group-hover:text-gray-900 transition-colors" />
            {cartCount > 0 && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full
                ${primaryBg} text-white text-[10px] font-black flex items-center justify-center shadow-sm`}>
                {cartCount}
              </span>
            )}
          </Link>

          {/* ── Notification Bell ── */}
          <div className="relative" ref={notifRef}>
            <button
              id="notification-btn"
              onClick={() => setNotifOpen(prev => !prev)}
              aria-label="Notifications"
              className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <Bell className="w-[22px] h-[22px] text-gray-800 group-hover:text-black transition-colors fill-current" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                >
                  {/* Notif Header */}
                  <div className={`bg-gradient-to-r ${theme.gradient} px-4 py-3 flex items-center justify-between`}>
                    <div>
                      <p className="text-white font-black text-sm">Notifications</p>
                      <p className="text-white/70 text-[11px] font-medium">{unreadCount} unread</p>
                    </div>
                    <button className="text-white/80 hover:text-white text-xs font-bold underline underline-offset-2 transition-colors">
                      Mark all read
                    </button>
                  </div>

                  {/* Notif List */}
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        className={`w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors ${!notif.read ? 'bg-orange-50/30' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${!notif.read ? 'bg-orange-100' : 'bg-gray-100'}`}>
                          {notif.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[13px] font-bold truncate ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${primaryBg}`} />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{notif.body}</p>
                          <p className="text-[10px] text-gray-300 mt-1 font-semibold">{notif.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-gray-100 text-center">
                    <button className={`text-xs font-bold ${primaryText} hover:opacity-70 transition-opacity`}>
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu (Desktop) */}
          {isLoggedIn ? (
            <div className="relative ml-1 hidden md:block" ref={userMenuRef}>
              <button
                id="user-avatar-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr ${theme.avatarBg} ${primaryText} text-xs font-bold`}>
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
              onClick={openLoginModal}
              className={`hidden sm:flex items-center ml-2 px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 text-white ${primaryBg}`}
            >
              Login
            </button>
          )}
        </div>
      </div>
      </nav>
      <LocationModal />
    </>
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
