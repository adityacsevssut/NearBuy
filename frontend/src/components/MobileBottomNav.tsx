"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, ClipboardList, User, LogIn, Heart, ShoppingBag, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If at top, always show
      if (currentScrollY < 20) {
        setIsVisible(true);
        lastScrollY = currentScrollY;
        return;
      }
      
      // Hide whenever actively scrolling
      if (Math.abs(currentScrollY - lastScrollY) > 5) {
        setIsVisible(false);
      }
      
      lastScrollY = currentScrollY;

      // Show again when scrolling stops
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 400); 
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
  
  const getDomain = () => {
    const currentPath = typeof window !== "undefined" ? window.location.href : (pathname || "");
    if (currentPath.toLowerCase().includes('/store') || currentPath.toLowerCase().includes('theme=blue')) return 'store';
    if (currentPath.toLowerCase().includes('/hotels') || currentPath.toLowerCase().includes('theme=purple')) return 'hotels';
    return 'food'; // Default fallback
  };

  const domain = getDomain();
  const isStore = domain === 'store';
  const isHotels = domain === 'hotels';
  const isFood = domain === 'food';

  const activeBg = isStore ? "bg-blue-50/70 dark:bg-transparent" : isHotels ? "bg-purple-50/70 dark:bg-transparent" : "bg-orange-50/70 dark:bg-transparent";
  const activeText = isStore ? "text-blue-600" : isHotels ? "text-purple-600" : "text-orange-600";
  const cartBtnBg = isStore ? "bg-blue-600" : isHotels ? "bg-purple-600" : "bg-orange-600";
  const cartBtnHover = isStore ? "hover:bg-blue-700" : isHotels ? "hover:bg-purple-700" : "hover:bg-orange-700";
  const cartShadow = isStore ? "shadow-[0_8px_20px_rgba(37,99,235,0.3)]" : isHotels ? "shadow-[0_8px_20px_rgba(147,51,234,0.3)]" : "shadow-[0_8px_20px_rgba(234,88,12,0.3)]";
  const badgeColor = isStore ? "bg-blue-500" : isHotels ? "bg-purple-500" : "bg-orange-500";

  const { isLoggedIn, openLoginModal } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount(domain);

  const baseUrl = isFood ? "/food/user" : `/${domain}`;

  const tabs = [
    { id: "mobile-nav-home", label: "Home", icon: Home, href: baseUrl },
    { id: "mobile-nav-wishlist", label: "Wishlist", icon: Heart, href: `${baseUrl}/wishlist` },
    { id: "mobile-nav-orders", label: "Orders", icon: ClipboardList, href: `${baseUrl}/orders` },
    { 
      id: "mobile-nav-auth", 
      label: isLoggedIn ? "Account" : "Login", 
      icon: isLoggedIn ? User : LogIn, 
      href: isLoggedIn ? `/account?theme=${isStore ? 'blue' : isHotels ? 'purple' : 'orange'}` : "#" 
    },
  ];

  return (
    <>
      <div 
        className={`fixed bottom-4 left-3 right-3 z-50 md:hidden flex items-end gap-3 pointer-events-none pb-safe transition-all duration-500 ease-in-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-[120%] opacity-0"
        }`}
      >
        {/* Main Nav */}
        <nav
          id="mobile-bottom-nav"
          className="flex-1 h-[68px] bg-white/95 dark:bg-[#05050A]/95 backdrop-blur-xl border border-gray-100 dark:border-[#2A2A3A] shadow-[0_8px_25px_rgba(0,0,0,0.08)] rounded-[2.5rem] pointer-events-auto transition-colors duration-300"
        >
          <div className="flex items-center justify-around px-2 h-full">
            {tabs.map((tab) => {
              const { id, label, icon: Icon, href } = tab;
              const cleanHref = href.split('?')[0];
              const active = id === "mobile-nav-home"
                ? pathname === cleanHref
                : pathname.startsWith(cleanHref) && cleanHref !== "#";
              
              const handleClick = (e: React.MouseEvent) => {
                if (!isLoggedIn && (id === "mobile-nav-auth" || id === "mobile-nav-wishlist" || id === "mobile-nav-orders")) {
                  e.preventDefault();
                  openLoginModal();
                }
              };

              return (
                <Link
                  key={id}
                  id={id}
                  href={href}
                  onClick={handleClick}
                  className={`flex flex-col items-center gap-1.5 flex-1 py-1.5 mx-1 rounded-full transition-all duration-300 group cursor-pointer relative ${
                    active 
                      ? `${activeBg} ${activeText} scale-105` 
                      : "text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151522]/50"
                  }`}
                >
                  <div
                    className={`p-0.5 rounded-xl transition-all duration-300 relative ${
                      active ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"
                    }`}
                  >
                    <Icon
                      className={`w-[24px] h-[24px] transition-colors duration-300 ${active ? "stroke-[2.5px]" : "stroke-[2px]"}`}
                    />
                  </div>
                  <span
                    className={`text-[11px] tracking-tight transition-all duration-300 ${active ? "font-black" : "font-semibold"}`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Cart Button */}
        <Link
          href={`${baseUrl}/cart`}
          onClick={(e) => {
            if (!isLoggedIn) {
              e.preventDefault();
              openLoginModal();
            }
          }}
          className={`pointer-events-auto w-[68px] h-[68px] flex items-center justify-center shrink-0 rounded-full text-white ${cartBtnBg} ${cartBtnHover} ${cartShadow} transition-all duration-300 active:scale-95`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 stroke-[2px]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-white text-black text-[11px] font-bold w-[22px] h-[22px] flex items-center justify-center rounded-full shadow-sm">
                {cartCount}
              </span>
            )}
          </div>
        </Link>
      </div>
    </>
  );
}
