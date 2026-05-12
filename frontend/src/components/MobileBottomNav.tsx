"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User, LogIn } from "lucide-react";
import LoginModal from "./LoginModal";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isEssentials = pathname.startsWith('/essentials');
  const activeBg = isEssentials ? "bg-blue-100" : "bg-orange-100";
  const activeText = isEssentials ? "text-blue-600" : "text-orange-600";

  // Mock authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const tabs = [
    { id: "mobile-nav-home", label: "Home", icon: Home, href: "/" },
    { id: "mobile-nav-search", label: "Search", icon: Search, href: "/search" },
    { id: "mobile-nav-orders", label: "Orders", icon: ClipboardList, href: "/orders" },
    { 
      id: "mobile-nav-auth", 
      label: isLoggedIn ? "Profile" : "Login", 
      icon: isLoggedIn ? User : LogIn, 
      href: isLoggedIn ? "/profile" : "#" 
    },
  ];

  return (
    <>
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden
          bg-white/90 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tabs.map(({ id, label, icon: Icon, href }) => {
            const active = pathname === href && href !== "#";
            
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
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 group cursor-pointer"
              >
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    active ? activeBg : "group-hover:bg-gray-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      active ? activeText : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold transition-colors duration-200 ${
                    active ? activeText : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
