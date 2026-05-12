"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Search, ShoppingCart, X, Store, Package, LogOut, UserCircle } from "lucide-react";
import LoginModal from "./LoginModal";
import { useAuth } from "@/context/AuthContext";

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
  
  const primaryText = isEssentials ? "text-blue-500" : "text-orange-500";
  const primaryHoverText = isEssentials ? "group-hover:text-blue-400" : "group-hover:text-orange-400";
  const primaryBorder = isEssentials ? "border-blue-400" : "border-orange-400";
  const primaryBorderHover = isEssentials ? "hover:border-blue-400" : "hover:border-orange-400";
  const primaryBg = isEssentials ? "bg-blue-500" : "bg-orange-500";
  const btnClass = isEssentials ? "btn-blue" : "btn-orange";

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
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 w-52 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                      <p className="text-sm font-bold text-gray-800">{user?.firstName || "User"} {user?.lastName || ""}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
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
