"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { RefreshCcw } from "lucide-react";

export default function NetworkGuard({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);

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

  if (isOffline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col items-center justify-center p-4 text-center font-sans">
        
        {/* Error Illustration */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mb-6">
          <Image
            src="/images/network_error_light.png"
            alt="No Internet Connection"
            fill
            className="object-contain dark:hidden drop-shadow-xl"
            priority
          />
          <Image
            src="/images/network_error_dark.png"
            alt="No Internet Connection"
            fill
            className="object-contain hidden dark:block rounded-xl"
            priority
          />
        </div>

        {/* Error Text Content */}
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
          Oops!
        </h1>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          No Internet Connection
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-md px-4">
          It looks like you're offline. Please check your network connection or Wi-Fi and try again to continue using NearBuy.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-sm mx-auto">
          <button 
            id="retry-btn"
            onClick={handleRetry}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
