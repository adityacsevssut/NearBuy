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
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 flex flex-col items-center justify-center text-center">
        
        {/* Error Illustration */}
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 mb-6">
          <Image
            src={isStore ? "/images/404_store_light.png" : "/images/404_error_light.png"}
            alt="Page Not Found"
            fill
            className="object-contain dark:hidden drop-shadow-xl"
            priority
          />
          <Image
            src={isStore ? "/images/404_store_dark.png" : "/images/404_error_dark.png"}
            alt="Page Not Found"
            fill
            className="object-contain hidden dark:block rounded-xl"
            priority
          />
        </div>

        {/* Error Text Content */}
        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
          Whoops!
        </h1>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">
          Error 404 - The page does not exist.
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 max-w-md px-4">
          It looks like you took a wrong turn! The page or route you are looking for is completely missing from our servers. 
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md">
          <button 
            onClick={() => window.history.back()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-[#0D0D17] border-2 border-gray-200 dark:border-[#2A2A3A] hover:border-gray-300 rounded-xl font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <Link 
            href={isStore ? "/store" : "/"}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 ${isStore ? "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"} rounded-xl font-bold text-white transition-all active:scale-95 shadow-lg`}
          >
            <Home className="w-5 h-5" />
            Home Page
          </Link>
        </div>

      </main>

      <MobileBottomNav />
    </div>
  );
}
