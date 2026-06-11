import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Utensils, ShoppingBag, HeartPulse } from "lucide-react";

export const metadata = {
  title: "About Us – NearBuy",
  description: "Learn more about NearBuy, your smart campus companion.",
};

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D0D17] flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-12 md:py-20 text-gray-800 dark:text-gray-200">
        
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0f172a] dark:text-white tracking-widest uppercase shrink-0">
            ABOUT US
          </h1>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#f97316] to-transparent opacity-80"></div>
        </div>

        {/* Paragraph */}
        <p className="text-base md:text-[17px] text-gray-600 dark:text-gray-400 leading-relaxed mb-16 md:mb-20 max-w-4xl">
          Welcome to NearBuy, your ultimate smart campus companion. We are a student-centric platform dedicated to making your life easier by delivering everything you need right to your doorstep. From sudden cravings to urgent study supplies, we bridge the gap between local campus vendors and you, offering a seamless, lightning-fast, and highly convenient hyperlocal delivery experience.
        </p>

        {/* Subheading */}
        <div className="flex items-center gap-4 mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-[#0f172a] dark:text-white tracking-widest uppercase shrink-0">
            WHAT WE DO!
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#f97316] to-transparent opacity-80"></div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          
          {/* Box 1: Food */}
          <div className="bg-orange-50 dark:bg-[#0D0D17] border border-orange-50 dark:border-[#2A2A3A] rounded-[2rem] p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-orange-100 dark:hover:border-orange-500/30 duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-orange-500">
                <Utensils className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Food</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-[15px] leading-relaxed">
              Discover top-rated local restaurants near you and order your favourite food anytime. From quick snacks between classes to full meals after a long day, enjoy fast and reliable delivery straight to your hostel room.
            </p>
          </div>

          {/* Box 2: Essentials */}
          <div className="bg-white dark:bg-[#0D0D17] border border-orange-50 dark:border-[#2A2A3A] shadow-sm rounded-[2rem] p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-orange-100 dark:hover:border-orange-500/30 duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-orange-500">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Essentials</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm md:text-[15px] leading-relaxed">
              Running out of notebooks, stationery, or daily toiletries? Get your everyday student and hostel essentials delivered to you without having to step out during your busy study schedule.
            </p>
          </div>

        </div>

      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
