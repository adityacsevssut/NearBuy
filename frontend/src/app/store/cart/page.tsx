"use client";

import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StoreCartPage() {
  const { isLoggedIn, openLoginModal } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.title = "Store Cart - Disabled";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D17] flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full mt-20 mb-32">
        <div className="bg-white dark:bg-[#151522] rounded-[2rem] p-8 md:p-12 shadow-sm border border-gray-100 dark:border-[#2A2A3A] w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
            <Store className="w-10 h-10 text-blue-500" />
          </div>
          
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
            Cart Disabled
          </h1>
          
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base leading-relaxed mb-8">
            The Store Cart feature has been temporarily disabled by the developer. Please check back later.
          </p>

          <Link 
            href="/store"
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Store Home
          </Link>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
