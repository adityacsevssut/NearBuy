"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function RefundPolicyPage() {
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
            Refund & <span className={accentColor}>Cancellation</span> Policy
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            Understanding how cancellations and refunds work on NearBuy.
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
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">1. Order Cancellations</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Because we deal in {isStore ? "fast-moving Daily Essentials" : "quickly prepared Food"}, time is critical. Our cancellation policy is strictly enforced to protect our vendors.
            </p>
            
            <div className="space-y-6">
              {/* COD Section */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cash On Delivery (COD)</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                  {!isStore && <li><strong className="text-gray-900 dark:text-white">Food Orders:</strong> Food orders cannot be cancelled after they have been shipped by the vendor.</li>}
                  <li><strong className="text-gray-900 dark:text-white">Platform Fee:</strong> The Platform Fee is strictly non-refundable for COD orders.</li>
                </ul>
              </div>

              {/* OOD Section (Highlighted) */}
              <div className={`p-6 rounded-2xl border ${isStore ? 'bg-blue-50/80 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-orange-50/80 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'}`}>
                <h3 className={`text-xl font-bold mb-3 ${accentColor}`}>Online Order Delivery (OOD)</h3>
                <p className="text-gray-700 dark:text-gray-200 leading-relaxed mb-4 font-medium">
                  Unlike COD, Online Orders can be cancelled at any moment. However, the following strict deduction rules apply depending on the timing of your cancellation:
                </p>
                
                <div className="space-y-4">
                  <div className="bg-white dark:bg-[#151522] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#2A2A3A]">
                    <strong className="block text-gray-900 dark:text-white text-lg mb-2">Cancelling BEFORE <span className={accentColor}>Out for Delivery</span>:</strong>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                      <li>If you have <strong className="text-gray-900 dark:text-white">paid in full</strong>: The Delivery Fee and Platform Fee will be deducted from your refund.</li>
                      <li>If you paid an <strong className="text-gray-900 dark:text-white">Advance (Adv) Amount</strong>: The Platform Fee and Delivery Fee will be deducted, and the remaining Advance Amount will be refunded.</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-[#151522] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#2A2A3A]">
                    <strong className="block text-gray-900 dark:text-white text-lg mb-2">Cancelling AFTER <span className={accentColor}>Out for Delivery</span>:</strong>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                      <li>If you paid the <strong className="text-gray-900 dark:text-white">full payment at once</strong> (e.g., due to vendor request), you will only receive <strong className={accentColor}>50% of the total order amount</strong> as a refund.</li>
                      <li>If you paid an <strong className="text-gray-900 dark:text-white">Advance (Adv) Amount</strong>: Your refund will be the Advance Amount minus: <strong className={accentColor}>(Platform Fee + Delivery Fee + 10% of the Advance Amount)</strong>.</li>
                    </ul>
                  </div>

                  <div className="bg-white dark:bg-[#151522] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-[#2A2A3A]">
                    <strong className="block text-gray-900 dark:text-white text-lg mb-2">If the Vendor Cancels:</strong>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                      <li>If a restaurant or store cancels your order (e.g., due to item unavailability), you will receive a <strong className={accentColor}>100% full refund</strong>, which includes a complete refund of the Platform Fee, Delivery Fee, and any Advance Amounts paid.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Essentials Section */}
              {isStore && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Essentials Orders</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Essentials can be cancelled prior to the store packing and dispatching the items. Once the delivery agent has picked up the package, cancellation is no longer possible.</li>
                  </ul>
                </div>
              )}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">2. Refund Processing</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
              If an order is successfully cancelled within the allowed window, or if a vendor cancels your order (due to item unavailability), refunds are processed based on your payment method:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
              <li><strong className="text-gray-900 dark:text-white">Online Payments:</strong> If you paid online via Razorpay, the refunded amount will automatically be credited back to your original payment method. Please allow 5-7 business days for the amount to reflect in your bank account.</li>
              <li>
                <strong className="text-gray-900 dark:text-white">Cash on Delivery (COD):</strong> Since no money was collected upfront, no general monetary refund is required. <strong className="text-red-500 dark:text-red-400">Please Note:</strong> NearBuy is <strong className="text-gray-900 dark:text-white">only responsible</strong> to pay a refund of the Platform Fee if the order is explicitly cancelled by the vendor/owner. NearBuy is not responsible for any other refund amount under COD. Please make sure before ordering.
              </li>
            </ul>
          </section>

          <section className={`mb-10 ${isStore ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'} p-6 rounded-2xl border`}>
            <h2 className={`text-2xl font-black italic mb-4 ${isStore ? 'text-blue-600 dark:text-blue-500' : 'text-orange-600 dark:text-orange-500'}`}>3. When Refunds Are Denied</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We reserve the right to deny refunds under the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
              <li>You were unreachable at the time of delivery or provided an incorrect delivery address.</li>
              <li>You rejected the order at your doorstep for reasons outside of food safety (e.g., "changed my mind").</li>
              <li>The {isStore ? "order" : "food order"} was successfully prepared and dispatched, but you attempted a late cancellation.</li>
            </ul>

            <div className="mt-5 p-4 bg-white/60 dark:bg-black/20 rounded-xl">
              <strong className="block text-gray-900 dark:text-white mb-2">Partial Refunds in These Cases:</strong>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 text-sm">
                If your situation falls under the above scenarios, you will not receive a full refund. However, you will receive a partial refund based on your payment method:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                <li>If you paid the <strong className="text-gray-900 dark:text-white">full payment online</strong>, you will receive a refund of <strong className={accentColor}>50% of the overall order amount</strong>.</li>
                <li>If you paid an <strong className="text-gray-900 dark:text-white">Advance Amount</strong>, your refund will be the Advance Amount minus: <strong className={accentColor}>(Platform Fee + Delivery Fee + 10% of the Advance Amount)</strong>.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black italic mb-4 text-black dark:text-white">4. Disputed Orders</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              If you receive the wrong items, missing items, or items with severe quality issues, please contact NearBuy Support immediately through the app. We will investigate the issue directly with the vendor. Partial or full refunds in these specific cases are granted at the sole discretion of the NearBuy administration team.
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
