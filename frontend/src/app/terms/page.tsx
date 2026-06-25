"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TermsPage() {
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
            Terms & <span className={accentColor}>Conditions</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            Please read these terms carefully before using NearBuy.
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
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              By accessing and placing an order on NearBuy, you confirm that you are in agreement with and bound by the terms of service contained in the Terms & Conditions outlined below. These terms apply to the entire website and any email or other type of communication between you and NearBuy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">2. Scope of Service</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              NearBuy operates as a localized hyper-delivery platform connecting users with local vendors. Please note our strict service limitations:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              {!isStore && <li><strong className="text-gray-900 dark:text-white">Food Delivery:</strong> We facilitate the delivery of freshly prepared food from local partnered restaurants.</li>}
              {isStore && <li><strong className="text-gray-900 dark:text-white">Daily Essentials:</strong> We support the delivery of general groceries, snacks, and daily household essentials from verified local stores.</li>}
            </ul>
          </section>

          <section className="mb-10 bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
            <h2 className="text-2xl font-black italic mb-4 text-red-600 dark:text-red-500">3. Strictly Prohibited Items</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              To ensure the safety and legality of our platform, NearBuy maintains a zero-tolerance policy for unauthorized goods. The following items are explicitly banned:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li><strong className="text-gray-900 dark:text-white">Medicines & Pharmaceuticals:</strong> We do NOT permit the sale, purchase, or delivery of any prescription drugs, over-the-counter medicines, or pharmaceutical products.</li>
              <li><strong className="text-gray-900 dark:text-white">Alcohol & Tobacco:</strong> Sale of intoxicating substances is prohibited on the platform.</li>
              <li><strong className="text-gray-900 dark:text-white">Illegal Goods:</strong> Any items that are prohibited by local or national laws.</li>
            </ul>
            <p className="text-red-500 dark:text-red-400 text-sm mt-4 font-semibold">
              Note: Any vendor found listing these items, or user requesting these items, will face immediate account termination.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">4. User Responsibilities</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              As a user of NearBuy, you agree to the following responsibilities to ensure smooth operations:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li><strong className="text-gray-900 dark:text-white">Accurate Information:</strong> You must provide accurate delivery addresses and active contact numbers.</li>
              <li><strong className="text-gray-900 dark:text-white">Availability:</strong> You must be available at the provided address to receive the delivery when it arrives.</li>
              <li><strong className="text-gray-900 dark:text-white">Fair Usage:</strong> You will not misuse the Cash on Delivery (COD) feature by repeatedly refusing to accept legitimate orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">5. Limitation of Liability</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              NearBuy acts as an intermediary platform. We do not {isStore ? "manufacture the essentials" : "prepare the food"} sold. While we strictly vet our partners, NearBuy is not liable for the quality, safety, or exact representation of the items provided by the vendors. Any severe grievances regarding product quality will be mediated between you and the vendor directly.
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
