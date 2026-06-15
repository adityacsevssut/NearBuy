"use client";

import React, { useEffect, useState } from "react";
import { RefreshCcw, WifiOff } from "lucide-react";

export default function NetworkGuard({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const currentPath = typeof window !== 'undefined' ? window.location.href : '';
  const isStore = currentPath.toLowerCase().includes('/store') || currentPath.toLowerCase().includes('theme=blue') || currentPath.toLowerCase().includes('/essentials');

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
        className={`fixed inset-0 z-[9999] bg-[#f5f5f5] dark:bg-[#0D0D17] flex-col items-center justify-center p-4 text-center font-sans ${isOffline ? 'flex' : 'hidden'}`}
      >
        {/* Error Illustration */}
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-6">
          <img src={isStore ? "/images/network_error_store.png" : "/images/network_error_store.png"} alt="Offline" className="object-contain w-full h-full dark:hidden drop-shadow-xl" />
          <img src={isStore ? "/images/network_error_store_dark.png" : "/images/network_error_store_dark.png"} alt="Offline" className="object-contain w-full h-full hidden dark:block rounded-xl" />
        </div>

        {/* Error Text Content */}
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
          Oops!
        </h1>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Poor Internet Connection
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-md px-4">
          It looks like you're offline. Please check your network connection or Wi-Fi and try again to continue using NearBuy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm mx-auto">
          <button 
            id="retry-btn"
            onClick={handleRetry}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 ${isStore ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'} rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg`}
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>

      {/* Render children only when online, maintaining original unmount behavior */}
      {!isOffline && children}
    </>
  );
}
