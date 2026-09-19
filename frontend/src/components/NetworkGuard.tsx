"use client";

import React, { useEffect, useState } from "react";
import { RefreshCcw, Wifi, Plane, BarChart2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function NetworkGuard({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const pathname = usePathname() || '';
  const [isStore, setIsStore] = useState(false);

  useEffect(() => {
    setIsStore(pathname.toLowerCase().includes('/store') || pathname.toLowerCase().includes('/essentials') || window.location.href.toLowerCase().includes('theme=blue'));
  }, [pathname]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check initial state
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      if (navigator.onLine) {
        setIsOffline(false);
      } else {
        // Trigger a tiny animation or visual feedback if they click while still offline
        const btn = document.getElementById("retry-btn");
        if (btn) {
          btn.classList.add("animate-shake");
          setTimeout(() => btn.classList.remove("animate-shake"), 500);
        }
      }
    }
  };

  return (
    <>
      {/* Offline Overlay - always in DOM so images preload, but hidden when online */}
      <div 
        className={`fixed inset-0 z-[9999] bg-[#FAFAFA] dark:bg-[#0D0D17] flex-col font-sans overflow-y-auto ${isOffline ? 'flex' : 'hidden'}`}
      >
        <div className="flex-none w-full">
          <Navbar forceSolid />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center pb-24 md:pb-0 mt-8 sm:mt-12">
          {/* Error Illustration */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-2">
            <img src="/images/offline_boy.png" alt="Offline" className="object-contain drop-shadow-2xl w-full h-full" />
          </div>

          {/* Error Text Content */}
          <h1 className="text-[44px] leading-[1.1] font-black text-[#1C213E] dark:text-gray-100 tracking-tight mt-4">
            Oops!
          </h1>
          <h2 className="text-[32px] font-black text-[#FF4700] dark:text-[#FF5511] mb-6">
            You're Offline
          </h2>

          {/* Three small icons row */}
          <div className="flex items-start justify-between w-full max-w-[340px] px-2 mb-8">
            <div className="flex flex-col items-center flex-1">
              <div className="w-[50px] h-[50px] rounded-full bg-[#FFF0E6] dark:bg-orange-500/10 text-[#FF4700] dark:text-orange-400 flex items-center justify-center mb-2.5">
                <Wifi className="w-[22px] h-[22px] stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-gray-400 font-bold leading-[1.3] text-center">Check your<br/>network</p>
            </div>

            <div className="w-[1px] h-10 bg-gray-200 dark:bg-gray-800 mt-2 mx-2"></div>

            <div className="flex flex-col items-center flex-1">
              <div className="w-[50px] h-[50px] rounded-full bg-[#FFF0E6] dark:bg-orange-500/10 text-[#FF4700] dark:text-orange-400 flex items-center justify-center mb-2.5">
                <Plane className="w-[22px] h-[22px] stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-gray-400 font-bold leading-[1.3] text-center">Turn off<br/>airplane mode</p>
            </div>

            <div className="w-[1px] h-10 bg-gray-200 dark:bg-gray-800 mt-2 mx-2"></div>

            <div className="flex flex-col items-center flex-1">
              <div className="w-[50px] h-[50px] rounded-full bg-[#FFF0E6] dark:bg-orange-500/10 text-[#FF4700] dark:text-orange-400 flex items-center justify-center mb-2.5">
                <BarChart2 className="w-[22px] h-[22px] stroke-[2.5]" />
              </div>
              <p className="text-[11px] text-[#64748B] dark:text-gray-400 font-bold leading-[1.3] text-center">Try again<br/>in a moment</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-[320px] mx-auto px-1">
            <button 
              id="retry-btn"
              onClick={handleRetry}
              className={`w-full flex items-center justify-center gap-2.5 px-6 py-[15px] ${isStore ? 'bg-[#0055FF] hover:bg-blue-700 shadow-[0_8px_20px_rgba(0,85,255,0.25)]' : 'bg-[#FF4700] hover:bg-[#E64000] shadow-[0_8px_20px_rgba(255,71,0,0.25)]'} rounded-full font-black text-[17px] text-white transition-all active:scale-95`}
            >
              <RefreshCcw className="w-[22px] h-[22px] stroke-[2.5]" />
              Try Again
            </button>
          </div>

          {/* Divider with text */}
          <div className="flex items-center justify-center gap-3 mt-8 w-full max-w-[320px]">
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800"></div>
            <div className="text-[#64748B] dark:text-gray-500 text-[11px] font-bold tracking-wide flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[15px]">🍔</span> Your cravings aren't going anywhere.
            </div>
            <div className="h-[1px] flex-1 bg-gray-200 dark:bg-gray-800"></div>
          </div>
        </div>

        <div className="flex-none w-full hidden md:block">
          <Footer />
        </div>
        <div className="flex-none w-full md:hidden">
          <MobileBottomNav />
        </div>
      </div>

      {/* Render children only when online, maintaining original unmount behavior */}
      {!isOffline && children}
    </>
  );
}
