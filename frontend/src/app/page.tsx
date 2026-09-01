"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoggedIn, isInitializing } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Minimum duration for the splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1800); // 1.8 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isInitializing || showSplash) return;

    if (isLoggedIn && user) {
      if (user.role === "vendor") {
        router.replace("/food/vendor");
      } else if (user.role === "admin") {
        router.replace("/food/manager");
      } else {
        router.replace("/food/user");
      }
    } else {
      router.replace("/food/user");
    }
  }, [isLoggedIn, user, isInitializing, showSplash, router]);

  // Classic Gradient Splash Screen
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-white to-orange-200 flex flex-col items-center justify-center relative pb-safe">
      {/* Central Logo Area */}
      <div className="flex flex-col items-center animate-fade-in">
        <div className="flex items-center justify-center mb-2">
          {/* ZC Logo */}
          <div className="flex items-baseline -skew-x-12 mr-2 sm:mr-3">
            <span className="relative z-10 font-black text-5xl sm:text-6xl md:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-700">Z</span>
            <span className="relative z-0 font-black text-5xl sm:text-6xl md:text-7xl tracking-tighter text-gray-800 -ml-1">C</span>
          </div>
          {/* ZyphCart Text */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight flex items-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-700">Zyph</span>
            <span className="text-gray-800">Cart</span>
          </h1>
        </div>
        <p className="text-gray-600 text-[15px] font-semibold tracking-wide mt-1">
          Your Nearest Market Place
        </p>
      </div>

      {/* Bottom Tagline */}
      <div className="absolute bottom-6 sm:bottom-12 flex flex-col items-center animate-fade-in-up w-full">
        <p className="text-gray-500 text-[11px] font-black tracking-[0.25em] uppercase">
          An Eternal Company
        </p>
      </div>
    </div>
  );
}
