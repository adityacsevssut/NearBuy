"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoggedIn, isInitializing } = useAuth();

  useEffect(() => {
    if (isInitializing) return;

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
  }, [isLoggedIn, user, isInitializing, router]);

  // Splash Screen
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-white to-orange-200 flex flex-col items-center justify-center relative pb-safe">
      {/* Central Logo Area */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center mb-1">
          {/* ZyphCart Logo Image */}
          <Image
            src="/icon.png"
            alt="ZyphCart"
            width={220}
            height={140}
            className="object-contain drop-shadow-xl"
            priority
          />
        </div>

        {/* Tagline */}
        <p className="text-center text-[12px] sm:text-[13px] font-semibold tracking-wide leading-relaxed">
          <span className="text-gray-700">Your </span>
          <span className="text-orange-500 font-black">Everyday Market</span>
          <span className="text-gray-700">, </span>
          <span className="text-gray-500">Just a </span>
          <span className="text-orange-600 font-black">Click Away</span>
        </p>
      </div>

      {/* Bottom Tagline */}
      <div className="absolute bottom-6 sm:bottom-12 flex flex-col items-center w-full">
        <p className="text-gray-500 text-[11px] font-black tracking-[0.25em] uppercase">
          An Eternal Company
        </p>
      </div>
    </div>
  );
}
