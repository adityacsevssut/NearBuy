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

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 flex flex-col md:flex-row items-center justify-center text-center md:text-left gap-8 md:gap-16 relative z-10">
        
        {/* Error Illustration Wrapper */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[450px] md:h-[450px] lg:w-[550px] lg:h-[550px] shrink-0 hover:scale-105 transition-transform duration-700 ease-out z-10">
          <Image
            src="/images/404_burger_boy.png"
            alt="Page Not Found"
            fill
            className="object-contain drop-shadow-2xl"
            priority
            unoptimized
          />
        </div>

        {/* Typography and Actions */}
        <div className="relative z-10 flex flex-col items-center md:items-start max-w-xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-7xl md:text-8xl font-black text-[#1F2937] dark:text-gray-100 tracking-tight drop-shadow-sm">
              Oops!
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-[#1F2937] dark:text-gray-100">Page</span>
              <span className={isStore ? "text-blue-600" : "text-orange-500"}>Not Found</span>
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl font-medium max-w-md">
            The page you're looking for might have been moved, deleted, or never existed.
          </p>

          {/* Premium Action Buttons */}
          <div className="w-full sm:w-auto pt-2 pb-4">
            <Link 
              href={isStore ? "/store" : "/"}
              className={`group relative flex items-center justify-center md:justify-start gap-3 px-8 py-4 ${isStore ? "bg-gradient-to-r from-blue-600 to-blue-500 shadow-blue-600/30" : "bg-gradient-to-r from-orange-500 to-orange-400 shadow-orange-500/30"} rounded-full font-bold text-white text-lg transition-all duration-300 hover:shadow-xl hover:shadow-${isStore ? 'blue' : 'orange'}-500/40 hover:-translate-y-1 active:scale-95 overflow-hidden w-full sm:w-max`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
              <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
              Go Back Home
            </Link>
          </div>

          {/* Elegant Handwritten text */}
          <div className="relative mt-4 inline-block">
            <p 
              className={`text-2xl md:text-3xl font-medium tracking-wide -rotate-3 drop-shadow-md text-transparent bg-clip-text ${isStore ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gradient-to-r from-orange-500 to-amber-400"}`}
              style={{ fontFamily: "'Dancing Script', 'Pacifico', cursive" }}
            >
              Good Food Always Finds You!
            </p>
          </div>
        </div>

      </main>

      <MobileBottomNav />
    </div>
  );
}
