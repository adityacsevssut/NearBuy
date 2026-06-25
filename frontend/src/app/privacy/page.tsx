"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PrivacyPage() {
  const [isStore, setIsStore] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsStore(window.location.search.includes("theme=store"));
    }
  }, []);

  const accentColor = isStore ? "text-blue-500" : "text-orange-500";
  const hoverColor = isStore ? "hover:text-blue-500 dark:hover:text-blue-400" : "hover:text-orange-500 dark:hover:text-orange-400";
  const bgGradient = isStore ? "from-blue-50/80 dark:from-blue-900/20" : "from-orange-50/80 dark:from-orange-900/20";
  const selectionBg = isStore ? "selection:bg-blue-500/30" : "selection:bg-orange-500/30";

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 font-sans ${selectionBg}`}>
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative pt-32 pb-16 overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b ${bgGradient} to-transparent blur-[80px] pointer-events-none`} />
        <div className="max-w-[800px] mx-auto px-6 sm:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-black dark:text-white">
            Privacy <span className={accentColor}>Policy</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            How we collect, use, and protect your data.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[800px] mx-auto px-6 sm:px-8 pb-16">
        <div 
          className="bg-white dark:bg-[#151522] rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-[#2A2A3A]"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          
          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">1. Information We Collect</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              To provide you with localized {isStore ? "Essentials" : "Food"} delivery, NearBuy collects the following essential information:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li><strong className="text-gray-900 dark:text-white">Personal Identification:</strong> Your Name, Email Address, and Mobile Number for account creation and order tracking.</li>
              <li><strong className="text-gray-900 dark:text-white">Location Data:</strong> Your delivery addresses and GPS coordinates (only when you use our Map Picker) to accurately route your orders to the nearest vendors.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">2. How We Use Your Data</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              The data we collect is used strictly for the facilitation of our delivery services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li>To process your orders for {isStore ? "Daily Essentials" : "Food"}.</li>
              <li>To send you important OTPs, order updates, and delivery confirmations.</li>
              <li>To improve our localized search algorithms, ensuring you see the most relevant nearby stores and restaurants.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">3. Data Sharing & Vendors</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              NearBuy <strong className="text-gray-900 dark:text-white">does not</strong> sell your personal data to third-party marketers. We only share the strictly necessary details (your first name, delivery address, and a masked or direct contact number) with the specific Restaurant or Store you placed an order from, and the delivery partner assigned to your order. This is required to physically deliver your items.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">4. Data Protection & Security</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              We employ industry-standard encryption and secure database practices to ensure your passwords and sensitive information are protected against unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">5. Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              You have the right to access, modify, or request the deletion of your personal data at any time. You can update your profile details and addresses directly from your Account Dashboard. If you wish to permanently delete your account, please contact our support team.
            </p>
          </section>

        </div>
        
        <div className="mt-10 flex justify-center">
          <Link href="/" className={`flex items-center gap-2 bg-white dark:bg-[#151522] text-gray-700 dark:text-gray-300 ${hoverColor} px-6 py-3 rounded-full shadow-sm border border-gray-200 dark:border-[#2A2A3A] transition-all hover:shadow-md hover:-translate-y-0.5 font-medium`}>
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
