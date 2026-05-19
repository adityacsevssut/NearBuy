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
  const activeBg = isEssentials ? "bg-blue-100" : isMedico ? "bg-emerald-100" : "bg-orange-100";
  const activeText = isEssentials ? "text-blue-600" : isMedico ? "text-emerald-600" : "text-orange-600";

  const { isLoggedIn } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const tabs = [
    { id: "mobile-nav-home", label: "Home", icon: Home, href: "/" },
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
      <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden flex justify-center pointer-events-none pb-safe">
        <nav
          id="mobile-bottom-nav"
          className="pointer-events-auto bg-white/85 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl w-full max-w-[380px] px-2 py-1.5"
        >
          <div className="flex items-center justify-around relative">
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
                  className="flex flex-col items-center gap-1 w-16 py-1 rounded-2xl transition-all duration-300 group cursor-pointer relative"
                >
                  {active && (
                    <div className={`absolute inset-0 ${activeBg} rounded-2xl opacity-50 -z-10`} />
                  )}
                  <div
                    className={`p-1.5 rounded-xl transition-all duration-300 ${
                      active ? "-translate-y-1" : "group-hover:-translate-y-0.5"
                    }`}
                  >
                    <Icon
                      className={`w-[22px] h-[22px] transition-colors duration-300 ${
                        active ? activeText : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-bold transition-all duration-300 ${
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
      </div>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} isEssentials={isEssentials} isMedico={isMedico} />
    </>
  );
}
