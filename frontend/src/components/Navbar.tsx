"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ChevronDown, Search, ShoppingCart, X, Store, Package, LogOut, Code2,
  CreditCard, Bell, Heart, ShoppingBag, Calendar, Clock, Mail, MessageCircle,
  QrCode, Globe, Percent, Star, Users, Trash2, Pencil, ChevronRight, Menu,
  UtensilsCrossed, Pill, User as UserIcon
} from "lucide-react";
import LoginModal from "./LoginModal";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { useCart } from "@/context/CartContext";
import { useNotifications } from "@/context/NotificationContext";

const DEV_EMAIL = "nahakaditya344@gmail.com";

export default function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEssentialsModal, setShowEssentialsModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, isLoggedIn, logout, openLoginModal } = useAuth();
  const { locationName, landmark, pincode, setIsLocationModalOpen, activeCenter } = useLocationContext();
  const { restaurantCount: cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  // App Modules state
  const [enableFood, setEnableFood] = useState(true);
  const [enableStore, setEnableStore] = useState(true); // Force enabled for this branch

  useEffect(() => {
    async function fetchSettings() {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${API}/api/public/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data.enable_food !== undefined) setEnableFood(data.enable_food);
          if (data.enable_store !== undefined) setEnableStore(data.enable_store);
        }
      } catch (e) {
        // Silent catch
      }
    }
    fetchSettings();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && (!mobileOverlayRef.current || !mobileOverlayRef.current.contains(event.target as Node))) {
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

  useEffect(() => {
    const handleOpenEssentials = () => setShowEssentialsModal(true);
    window.addEventListener('openEssentialsModal', handleOpenEssentials);
    return () => {
      window.removeEventListener('openEssentialsModal', handleOpenEssentials);
    };
  }, []);

  const getDomain = () => {
    const currentPath = typeof window !== "undefined" ? window.location.href : (pathname || "");
    if (currentPath.toLowerCase().includes('/store') || currentPath.toLowerCase().includes('theme=blue') || currentPath.toLowerCase().includes('/essentials')) return 'store';
    if (currentPath.toLowerCase().includes('/hotels') || currentPath.toLowerCase().includes('theme=purple')) return 'hotels';
    return 'food'; // Default fallback
  };

  const domain = getDomain();
  const isStore = domain === 'store';
  const isHotels = domain === 'hotels';
  const isFood = domain === 'food';
  const baseUrl = `/${domain}`;




  const theme = {
    gradient: isStore ? "from-blue-500 to-blue-400" : "from-orange-500 to-orange-400",
    textPrimary: isStore ? "text-blue-500" : "text-orange-500",
    avatarBg: isStore ? "from-blue-100 to-blue-50" : "from-orange-100 to-orange-50",
    selection: isStore ? "selection:bg-blue-200" : "selection:bg-orange-200",
    hoverBg: isStore ? "group-hover:bg-blue-50" : "group-hover:bg-orange-50",
    hoverText: isStore ? "group-hover:text-blue-500" : "group-hover:text-orange-500",
    dangerBorder: isStore ? "border-blue-50" : "border-red-50",
    dangerText: isStore ? "text-blue-500" : "text-red-500",
    dangerHoverBg: isStore ? "hover:bg-blue-50/50" : "hover:bg-red-50/50",
  };

  const primaryText = theme.textPrimary;
  const primaryBg = isStore ? "bg-blue-500" : "bg-orange-500";

  const suggestions = [
    "🍛 Biryani near VSSUT",
    "📄 Lab Manual printing",
    "⚡ USB-C Charger",
    "🥤 Late Night Maggi",
  ];

  // Notifications from context
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const navPages = [
    { href: "/", label: "Food", icon: UtensilsCrossed, activeColor: "text-orange-600", activeBg: "bg-orange-50", isActive: isFood },
    { href: "/store", label: "Store", icon: Package, activeColor: "text-blue-600", activeBg: "bg-blue-50", isActive: isStore },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 backdrop-blur-md bg-white dark:bg-[#0D0D17]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4 relative">

          {/* ── Hamburger (Mobile only) ── */}
          <div className="flex items-center flex-shrink-0 md:hidden" ref={mobileMenuRef}>
            <button
              id="hamburger-btn"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Open menu"
              className="flex items-center justify-center w-11 h-11 -ml-2 rounded-2xl bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A]/60 shadow-sm transition-all duration-300 active:scale-95 group"
            >
              {mobileMenuOpen
                ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:rotate-90 transition-transform duration-300" />
                : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300" />
              }
            </button>
          </div>

          {/* ── Logo ── */}
          <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center flex-shrink-0">
            <Link href="/" className="flex items-baseline gap-1 md:gap-1.5 group">

              {/* Simple NB Logo */}
              <div className="flex items-baseline mr-1.5 md:mr-2 transition-transform duration-300 group-hover:scale-105 -skew-x-12">
                <span className={`relative z-10 font-black text-3xl sm:text-4xl md:text-5xl ${primaryText} tracking-tighter drop-shadow-sm`}>N</span>
                <span className="relative z-0 font-black text-3xl sm:text-4xl md:text-5xl text-gray-900 dark:text-gray-100 tracking-tighter drop-shadow-sm -ml-0.5">B</span>
              </div>

              {/* Text */}
              <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-tight flex items-baseline">
                <span className={`${primaryText} drop-shadow-sm`}>Near</span>
                <span className="relative text-gray-900 dark:text-gray-100 drop-shadow-sm">
                  Buy
                  <svg className={`absolute -bottom-3 sm:-bottom-3.5 -left-1 w-[120%] h-3 sm:h-3.5 ${primaryText}`} viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M 4,8 Q 40,-2 100,12 Q 40,6 4,16 A 4,4 0 0,1 4,8 Z" fill="currentColor" />
                  </svg>
                </span>
              </span>
            </Link>
          </div>

          {/* ── App Mode Toggle (Desktop only) ── */}
          <div className="hidden md:flex bg-gray-100 dark:bg-[#1F1F2E] p-1 rounded-xl flex-shrink-0 border border-gray-200 dark:border-[#2A2A3A]/50">
            <button
              onClick={() => enableFood ? router.push("/") : setShowEssentialsModal(true)}
              className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${isFood
                ? `bg-white dark:bg-[#0D0D17] text-orange-600 shadow-sm`
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 hover:bg-gray-200/50"
                }`}
            >
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:block">Food Delivery{!enableFood && " (Soon)"}</span>
              <span className="sm:hidden">Food</span>
            </button>
            <button
              onClick={() => enableStore ? router.push("/store") : setShowEssentialsModal(true)}
              className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${isStore
                ? `bg-white dark:bg-[#0D0D17] text-blue-600 shadow-sm`
                : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 hover:bg-gray-200/50"
                }`}
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:block">Essentials{!enableStore && " (Soon)"}</span>
              <span className="sm:hidden">Store</span>
            </button>

          </div>

          {/* ── Desktop Quick Links ── */}
          <div className="hidden md:flex items-center gap-3 ml-6">
            <Link
              href={`${baseUrl}/wishlist`}
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  openLoginModal();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#151522] hover:bg-gray-100 dark:hover:bg-[#1F1F2E] border border-gray-200 dark:border-[#2A2A3A]/60 text-gray-700 dark:text-gray-300 transition-all text-sm font-bold shadow-sm active:scale-95 duration-200"
            >
              <Heart className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>Wishlist</span>
            </Link>
            <button
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  openLoginModal();
                } else {
                  router.push(`${baseUrl}/orders`);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#151522] hover:bg-gray-100 dark:hover:bg-[#1F1F2E] border border-gray-200 dark:border-[#2A2A3A]/60 text-gray-700 dark:text-gray-300 transition-all text-sm font-bold shadow-sm active:scale-95 duration-200"
            >
              <ShoppingBag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span>My Orders</span>
            </button>
          </div>

          {/* ── Action Icons ── */}
          <div className="flex items-center gap-1 md:gap-2 shrink ml-auto md:ml-0 min-w-0">

            {/* Cart – hidden on mobile (lives in hamburger) */}
            <Link
              href={`${baseUrl}/cart`}
              id="cart-btn"
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  openLoginModal();
                }
              }}
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1F1F2E] transition-colors group hidden md:flex"
            >
              <ShoppingCart className="w-[22px] h-[22px] text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 transition-colors" />
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
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1F1F2E] transition-colors group"
              >
                <Bell className="w-[22px] h-[22px] text-gray-800 dark:text-gray-200 group-hover:text-black dark:text-white transition-colors fill-current" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#0D0D17] shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200 dark:border-[#2A2A3A] z-50 rounded-sm"
                  >
                    {/* Notif Header */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522]/50">
                      <div>
                        <p className="text-gray-900 dark:text-gray-100 font-bold text-sm tracking-wide">Notifications</p>
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={() => markAllAsRead()} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 text-xs font-semibold transition-colors underline underline-offset-2">
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notif List */}
                    <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">No notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className="relative overflow-hidden w-full border-b border-gray-100 dark:border-[#2A2A3A] last:border-0 bg-red-50">
                            {/* Background Delete Action (Revealed on swipe right) */}
                            <div className="absolute inset-y-0 left-0 flex items-center px-6 text-red-500 font-bold text-xs uppercase tracking-wider">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </div>

                            {/* Foreground Notification Card */}
                            <motion.div
                              drag="x"
                              dragConstraints={{ left: 0, right: 0 }}
                              dragElastic={{ left: 0, right: 0.8 }}
                              onDragEnd={(event, info) => {
                                if (info.offset.x > 80) {
                                  deleteNotification(notif.id);
                                }
                              }}
                              className={`relative w-full z-10 flex items-center transition-colors ${!notif.is_read ? 'bg-gray-50 dark:bg-[#151522]/80' : 'bg-white dark:bg-[#0D0D17] hover:bg-gray-50 dark:hover:bg-[#151522]'}`}
                            >
                              <button
                                onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                                className="flex-1 min-w-0 flex items-start gap-3 px-4 py-3.5 text-left"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className={`text-[13px] truncate ${!notif.is_read ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-semibold text-gray-600 dark:text-gray-400'}`}>
                                      {notif.title}
                                    </p>
                                    {!notif.is_read && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className={`text-[12px] mt-1 leading-snug line-clamp-2 ${!notif.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                    {new Date(notif.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </button>
                            </motion.div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Account Button (Desktop) */}
            {isLoggedIn ? (
              <button
                onClick={() => {
                  if (pathname === '/account') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    const themeQuery = isStore ? '?theme=blue' : isHotels ? '?theme=purple' : '?theme=orange';
                    router.push(`/account${themeQuery}`);
                  }
                }}
                className="hidden md:flex items-center gap-2 ml-1 px-3 py-1.5 rounded-full border border-gray-200 dark:border-[#2A2A3A] hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-[#151522] transition-all duration-200 group"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#1F1F2E] group-hover:bg-gray-200 transition-colors`}>
                  <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Account</span>
              </button>
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

      {/* ── Mobile Full-Screen CardNav Menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileOverlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-16 left-0 right-0 bottom-0 w-full bg-[#F8F9FA] dark:bg-[#0D0D17] z-[99] pt-10 px-5 pb-6 overflow-y-auto"
          >
            <div className="flex flex-wrap gap-4 max-w-sm mx-auto w-full pb-10 justify-center">
              {/* Food Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
                className="w-[calc(50%-8px)] aspect-square bg-orange-500 rounded-3xl p-4 shadow-xl relative overflow-hidden active:scale-95 transition-transform flex flex-col justify-end cursor-pointer"
                onClick={() => {
                  if (enableFood) router.push("/");
                  else setShowEssentialsModal(true); // Can use a generic coming soon
                  setMobileMenuOpen(false);
                }}
              >
                <div className="absolute top-2 right-2 p-2 opacity-20 pointer-events-none">
                  <UtensilsCrossed className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-xl font-black text-white relative z-10 leading-tight">Food</h2>
                <p className="text-xs font-bold text-white/80 mt-1 relative z-10">{enableFood ? "Order Now" : "Coming Soon"}</p>
              </motion.div>

              {/* Store Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
                className="w-[calc(50%-8px)] aspect-square bg-blue-500 rounded-3xl p-4 shadow-xl relative overflow-hidden active:scale-95 transition-transform flex flex-col justify-end cursor-pointer"
                onClick={() => {
                  if (enableStore) router.push("/store");
                  else setShowEssentialsModal(true);
                  setMobileMenuOpen(false);
                }}
              >
                <div className="absolute top-2 right-2 p-2 opacity-20 pointer-events-none">
                  <Package className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-xl font-black text-white relative z-10 leading-tight">Essentials</h2>
                <p className="text-xs font-bold text-white/80 mt-1 relative z-10">{enableStore ? "Order Now" : "Coming Soon"}</p>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEssentialsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEssentialsModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[90vw] sm:max-w-md bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center overflow-hidden z-10"
            >
              <div className="flex items-center justify-center mb-4 font-black text-2xl sm:text-3xl tracking-tight">
                <div className="flex items-baseline -skew-x-12 mr-2">
                  <span className="text-blue-600 drop-shadow-sm">N</span>
                  <span className="text-black dark:text-white drop-shadow-sm -ml-0.5">B</span>
                </div>
                <div className="flex items-baseline">
                  <span className="text-blue-600 drop-shadow-sm">Near</span>
                  <span className="relative text-black dark:text-white drop-shadow-sm">
                    Buy
                    <svg className="absolute -bottom-3 sm:-bottom-3.5 -left-1 w-[120%] h-3 sm:h-3.5 text-blue-600" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path d="M 4,8 Q 40,-2 100,12 Q 40,6 4,16 A 4,4 0 0,1 4,8 Z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="relative w-full max-w-[240px] aspect-square mb-6">
                <Image
                  src="/essentials-soon.png"
                  alt="Essentials Coming Soon"
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
                Coming Soon
              </h2>

              <button
                onClick={() => setShowEssentialsModal(false)}
                className="flex items-center justify-center px-8 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold text-sm transition-all transform hover:scale-105 hover:shadow-lg active:scale-95 shadow-blue-500/25"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// Subcomponents matching the mobile Account Page style
function ActionPill({ icon: Icon, label, color, bg, onClick }: { icon: any, label: string, color: string, bg: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 bg-white dark:bg-[#0D0D17] py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 dark:border-[#1F1F2E] transition-transform active:scale-95">
      <div className={`p-2 rounded-xl ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">{label}</span>
    </button>
  );
}

function ModernRow({ icon: Icon, label, onClick, theme }: { icon: any, label: string, onClick?: () => void, theme: any }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#151522]/80 transition-colors group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl bg-gray-50 dark:bg-[#151522] flex items-center justify-center ${theme.hoverBg} ${theme.hoverText} transition-colors`}>
          <Icon className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${theme.hoverText} transition-colors`} />
        </div>
        <span className="text-[13.5px] font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100">{label}</span>
      </div>
      <ChevronRight className={`w-3.5 h-3.5 text-gray-300 ${theme.hoverText} group-hover:translate-x-0.5 transition-all`} />
    </button>
  );
}
