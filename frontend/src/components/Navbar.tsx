"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
import LocationModal from "./LocationModal";
import { useNotifications } from "@/context/NotificationContext";

const DEV_EMAIL = "nahakaditya344@gmail.com";

export default function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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

  const getDomain = () => {
    if (pathname.startsWith('/medicine')) return 'medicine';
    if (pathname.startsWith('/store')) return 'store';
    if (pathname.startsWith('/hotels')) return 'hotels';
    return 'food'; // Default fallback
  };

  const domain = getDomain();
  const isStore = domain === 'store';
  const isMedicine = domain === 'medicine';
  const isHotels = domain === 'hotels';
  const isFood = domain === 'food';
  const baseUrl = `/${domain}`;
  
  
  

  const theme = {
    gradient: isStore ? "from-blue-500 to-blue-400" : isMedicine ? "from-emerald-500 to-emerald-400" : "from-orange-500 to-orange-400",
    textPrimary: isStore ? "text-blue-500" : isMedicine ? "text-emerald-500" : "text-orange-500",
    avatarBg: isStore ? "from-blue-100 to-blue-50" : isMedicine ? "from-emerald-100 to-emerald-50" : "from-orange-100 to-orange-50",
    selection: isStore ? "selection:bg-blue-200" : isMedicine ? "selection:bg-emerald-200" : "selection:bg-orange-200",
    hoverBg: isStore ? "group-hover:bg-blue-50" : isMedicine ? "group-hover:bg-emerald-50" : "group-hover:bg-orange-50",
    hoverText: isStore ? "group-hover:text-blue-500" : isMedicine ? "group-hover:text-emerald-500" : "group-hover:text-orange-500",
    dangerBorder: isStore ? "border-blue-50" : isMedicine ? "border-emerald-50" : "border-red-50",
    dangerText: isStore ? "text-blue-500" : isMedicine ? "text-emerald-500" : "text-red-500",
    dangerHoverBg: isStore ? "hover:bg-blue-50/50" : isMedicine ? "hover:bg-emerald-50/50" : "hover:bg-red-50/50",
  };

  const primaryText = theme.textPrimary;
  const primaryBg = isStore ? "bg-blue-500" : isMedicine ? "bg-emerald-500" : "bg-orange-500";

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
    { href: "/medicine", label: "Medico", icon: Pill, activeColor: "text-emerald-600", activeBg: "bg-emerald-50", isActive: isMedicine },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 backdrop-blur-md shadow-sm ${
        isStore ? "bg-blue-500/95" : isMedicine ? "bg-emerald-500/95" : "bg-orange-500/95"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 md:gap-4 relative">

        {/* ── Hamburger (Mobile only) ── */}
        <div className="flex items-center flex-shrink-0 md:hidden" ref={mobileMenuRef}>
          <button
            id="hamburger-btn"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            aria-label="Open menu"
            className="flex items-center justify-center w-11 h-11 -ml-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm transition-all duration-300 active:scale-95 group"
          >
            {mobileMenuOpen
              ? <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
              : <Menu className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />
            }
          </button>
        </div>

        {/* ── Logo ── */}
        <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center flex-shrink-0">
          <Link href="/" className="flex items-baseline gap-1 md:gap-1.5 group">

            {/* Text */}
            <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-tight">
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
              isFood
                ? `bg-white text-orange-600 shadow-sm`
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
            }`}
          >
            <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:block">Food Delivery</span>
            <span className="sm:hidden">Food</span>
          </Link>
          <button
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 opacity-60 cursor-not-allowed text-gray-500`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:block">Essentials (Soon)</span>
            <span className="sm:hidden">Store</span>
          </button>
          <button
            className={`flex items-center gap-1 md:gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs md:text-sm font-bold transition-all duration-300 opacity-60 cursor-not-allowed text-gray-500`}
          >
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:block">Medico (Soon)</span>
            <span className="sm:hidden">Medico</span>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all text-sm font-bold backdrop-blur-md hover:-translate-y-0.5 shadow-sm active:scale-95 duration-200"
          >
            <Heart className="w-4 h-4 fill-white text-white" />
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all text-sm font-bold backdrop-blur-md hover:-translate-y-0.5 shadow-sm active:scale-95 duration-200"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
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
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] border border-gray-200 z-50 rounded-sm"
                >
                  {/* Notif Header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                    <div>
                      <p className="text-gray-900 font-bold text-sm tracking-wide">Notifications</p>
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={() => markAllAsRead()} className="text-gray-500 hover:text-gray-800 text-xs font-semibold transition-colors underline underline-offset-2">
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Notif List */}
                  <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 text-sm font-medium">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="relative overflow-hidden w-full border-b border-gray-100 last:border-0 bg-red-50">
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
                            className={`relative w-full z-10 flex items-center transition-colors ${!notif.is_read ? 'bg-gray-50/80' : 'bg-white hover:bg-gray-50'}`}
                          >
                            <button
                              onClick={() => { if (!notif.is_read) markAsRead(notif.id); }}
                              className="flex-1 min-w-0 flex items-start gap-3 px-4 py-3.5 text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-[13px] truncate ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.is_read && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className={`text-[12px] mt-1 leading-snug line-clamp-2 ${!notif.is_read ? 'text-gray-700' : 'text-gray-500'}`}>
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
                  router.push('/account');
                }
              }}
              className="hidden md:flex items-center gap-2 ml-1 px-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 group-hover:bg-gray-200 transition-colors`}>
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-bold text-gray-700">Account</span>
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
            className="fixed top-16 left-0 right-0 bottom-0 w-full bg-[#F8F9FA] z-[99] pt-10 px-5 pb-6 overflow-y-auto"
          >
            <div className="flex flex-wrap gap-4 max-w-sm mx-auto w-full pb-10 justify-center">
              {/* Food Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
                className="w-[calc(50%-8px)] aspect-square bg-orange-500 rounded-3xl p-4 shadow-xl relative overflow-hidden active:scale-95 transition-transform flex flex-col justify-end"
                onClick={() => { router.push("/"); setMobileMenuOpen(false); }}
              >
                <div className="absolute top-2 right-2 p-2 opacity-20 pointer-events-none">
                  <UtensilsCrossed className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-xl font-black text-white relative z-10 leading-tight">Food</h2>
                <p className="text-xs font-bold text-white/80 mt-1 relative z-10">Order Now</p>
              </motion.div>

              {/* Store Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
                className="w-[calc(50%-8px)] aspect-square bg-blue-500 rounded-3xl p-4 shadow-xl relative overflow-hidden transition-transform flex flex-col justify-end opacity-60 cursor-not-allowed"
              >
                <div className="absolute top-2 right-2 p-2 opacity-20 pointer-events-none">
                  <Package className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-xl font-black text-white relative z-10 leading-tight">Store</h2>
                <p className="text-xs font-bold text-white/80 mt-1 relative z-10">Coming Soon</p>
              </motion.div>

              {/* Medico Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.25, ease: [0.25, 1, 0.5, 1] }}
                className="w-[calc(50%-8px)] aspect-square bg-emerald-500 rounded-3xl p-4 shadow-xl relative overflow-hidden transition-transform flex flex-col justify-end opacity-60 cursor-not-allowed"
              >
                <div className="absolute top-2 right-2 p-2 opacity-20 pointer-events-none">
                  <Pill className="w-16 h-16 text-white" />
                </div>
                <h2 className="text-xl font-black text-white relative z-10 leading-tight">Medico</h2>
                <p className="text-xs font-bold text-white/80 mt-1 relative z-10">Coming Soon</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LocationModal />
    </>
  );
}

// Subcomponents matching the mobile Account Page style
function ActionPill({ icon: Icon, label, color, bg, onClick }: { icon: any, label: string, color: string, bg: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 bg-white py-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-gray-50 transition-transform active:scale-95">
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
