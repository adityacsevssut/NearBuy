"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function NotFound() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isStore = pathname.startsWith('/store') || pathname.startsWith('/essentials');

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col pt-16 pb-20">
      <Navbar forceSolid />

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col items-center justify-center text-center relative z-10">
        
        {/* Ambient Glow Background behind illustration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-400/20 dark:bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Error Illustration Wrapper */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-8 hover:scale-105 transition-transform duration-700 ease-out z-10">
          <Image
            src={isStore ? "/images/404_store_light.png" : "/images/404_error_light.png"}
            alt="Page Not Found"
            fill
            className="object-contain dark:hidden drop-shadow-2xl"
            priority
            unoptimized
          />
          <Image
            src={isStore ? "/images/404_store_dark.png" : "/images/404_error_dark.png"}
            alt="Page Not Found"
            fill
            className="object-contain hidden dark:block drop-shadow-2xl"
            priority
            unoptimized
          />
        </div>

        {/* Elegant Typography */}
        <div className="relative z-10 space-y-4 mb-10">
          <h1 
            className={`text-4xl font-bold ${isStore ? "text-blue-600" : "text-orange-500"} mb-2 tracking-wide drop-shadow-sm`}
            style={{ fontFamily: "cursive" }}
          >
            404 Page Does Not Exist
          </h1>
        </div>

        {/* Premium Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md relative z-10">
          <button 
            onClick={() => window.history.back()}
            className="flex-1 group relative flex items-center justify-center gap-2 px-6 py-4 bg-white/60 dark:bg-[#151522]/60 backdrop-blur-md border border-white/20 dark:border-white/5 hover:bg-white/80 dark:hover:bg-[#1A1A27]/80 rounded-2xl font-bold text-gray-800 dark:text-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Go Back
          </button>
          
          <Link 
            href={isStore ? "/store" : "/"}
            className={`flex-1 group relative flex items-center justify-center gap-2 px-6 py-4 ${isStore ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/30" : "bg-gradient-to-r from-orange-500 to-orange-400 shadow-orange-500/30"} rounded-2xl font-bold text-white transition-all duration-300 hover:shadow-2xl hover:shadow-${isStore ? 'blue' : 'orange'}-500/40 hover:-translate-y-1 active:scale-95 overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
            <Home className="w-5 h-5 transition-transform group-hover:scale-110" />
            Home Page
          </Link>
        </div>

      </main>

      <MobileBottomNav />
    </div>
  );
}
