"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User, LogIn } from "lucide-react";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isEssentials = pathname.startsWith('/essentials');
  const isMedico = pathname.startsWith('/medico');

  const activeBg = isEssentials ? "bg-blue-50/70" : isMedico ? "bg-emerald-50/70" : "bg-orange-50/70";
  const activeText = isEssentials ? "text-blue-600" : isMedico ? "text-emerald-600" : "text-orange-600";

  const { isLoggedIn } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const homeHref = isEssentials ? "/essentials" : isMedico ? "/medico" : "/";

  const tabs = [
    { id: "mobile-nav-home", label: "Home", icon: Home, href: homeHref },
    { id: "mobile-nav-search", label: "Search", icon: Search, href: "/search" },
    { id: "mobile-nav-orders", label: "Orders", icon: ClipboardList, href: "/orders" },
    { 
      id: "mobile-nav-auth", 
      label: isLoggedIn ? "Account" : "Login", 
      icon: isLoggedIn ? User : LogIn, 
      href: isLoggedIn ? (isEssentials ? "/account?theme=blue" : isMedico ? "/account?theme=emerald" : "/account") : "#" 
    },
  ];

  return (
    <>
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe transition-colors duration-300"
      >
        <div className="flex items-center justify-around px-3 py-2">
          {tabs.map(({ id, label, icon: Icon, href }) => {
            const cleanHref = href.split('?')[0];
            const active = id === "mobile-nav-home"
              ? pathname === cleanHref || (!pathname.startsWith('/search') && !pathname.startsWith('/orders') && !pathname.startsWith('/account'))
              : pathname.startsWith(cleanHref) && cleanHref !== "#";
            
            const handleClick = (e: React.MouseEvent) => {
              if (id === "mobile-nav-auth" && !isLoggedIn) {
                e.preventDefault();
                setIsLoginModalOpen(true);
              }
            };

            return (
              <a
                key={id}
                id={id}
                href={href}
                onClick={handleClick}
                className={`flex flex-col items-center gap-1 w-20 py-1.5 rounded-2xl transition-all duration-300 group cursor-pointer relative ${
                  active 
                    ? `${activeBg} ${activeText} scale-105` 
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50/50"
                }`}
              >
                <div
                  className={`p-0.5 rounded-xl transition-all duration-300 ${
                    active ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"
                  }`}
                >
                  <Icon
                    className="w-[22px] h-[22px] transition-colors duration-300"
                  />
                </div>
                <span
                  className="text-[10px] font-black tracking-tight transition-all duration-300"
                >
                  {label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} isEssentials={isEssentials} isMedico={isMedico} />
    </>
  );
}
