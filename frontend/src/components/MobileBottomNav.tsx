"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Search, ClipboardList, User, LogIn, Heart, ShoppingCart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  
  const getDomain = () => {

    if (pathname.startsWith('/store')) return 'store';
    if (pathname.startsWith('/hotels')) return 'hotels';
    return 'food'; // Default fallback
  };

  const domain = getDomain();
  const isStore = domain === 'store';
  const isHotels = domain === 'hotels';
  const isFood = domain === 'food';

  const activeBg = isStore ? "bg-blue-50/70 dark:bg-transparent" : isHotels ? "bg-purple-50/70 dark:bg-transparent" : "bg-orange-50/70 dark:bg-transparent";
  const activeText = isStore ? "text-blue-600" : isHotels ? "text-purple-600" : "text-orange-600";
  const badgeColor = isStore ? "bg-blue-500" : isHotels ? "bg-purple-500" : "bg-orange-500";

  const { isLoggedIn, openLoginModal } = useAuth();
  const { getCartCount } = useCart();
  const cartCount = getCartCount(domain);

  const baseUrl = `/${domain}`;

  const tabs = [
    { id: "mobile-nav-home", label: "Home", icon: Home, href: baseUrl },
    { id: "mobile-nav-wishlist", label: "Wishlist", icon: Heart, href: `${baseUrl}/wishlist` },
    { id: "mobile-nav-cart", label: "Cart", icon: ShoppingCart, href: `${baseUrl}/cart`, badge: cartCount },
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
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-[#05050A]/95 backdrop-blur-md border-t border-gray-100 dark:border-[#2A2A3A] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe transition-colors duration-300"
      >
        <div className="flex items-center justify-around px-3 py-2">
          {tabs.map((tab) => {
            const { id, label, icon: Icon, href, badge } = tab;
            const cleanHref = href.split('?')[0];
            const active = id === "mobile-nav-home"
              ? pathname === cleanHref
              : pathname.startsWith(cleanHref) && cleanHref !== "#";
            
            const handleClick = (e: React.MouseEvent) => {
              if (!isLoggedIn && (id === "mobile-nav-auth" || id === "mobile-nav-wishlist" || id === "mobile-nav-cart" || id === "mobile-nav-orders")) {
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
                className={`flex flex-col items-center gap-1 flex-1 py-1.5 rounded-2xl transition-all duration-300 group cursor-pointer relative ${
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
                    className="w-[22px] h-[22px] transition-colors duration-300"
                  />
                  {badge ? (
                    <span className={`absolute -top-1 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-sm ${badgeColor}`}>
                      {badge}
                    </span>
                  ) : null}
                </div>
                <span
                  className="text-[10px] font-black tracking-tight transition-all duration-300"
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
