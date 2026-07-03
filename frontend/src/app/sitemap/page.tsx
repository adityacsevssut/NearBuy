"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Map, 
  Utensils, 
  ShoppingBag, 
  User, 
  Heart, 
  Clock, 
  ShieldCheck, 
  Info, 
  Phone,
  LayoutDashboard,
  Search,
  ShoppingCart,
  ArrowLeft
} from "lucide-react";

export default function SitemapPage() {
  const { isLoggedIn, user, openLoginModal } = useAuth();

  const isVendor = user?.role === "manager" || user?.role === "admin";

  const sitemapData: any[] = [
    {
      category: "Food Delivery",
      icon: <Utensils className="w-6 h-6" strokeWidth={2.5} />,
      show: true,
      links: [
        { name: "Food Home", href: "/", icon: <Map className="w-4 h-4" /> },
        { name: "Active Orders", href: "/food/orders", icon: <Clock className="w-4 h-4" /> },
        { name: "Order History", href: "/food/orders?history=true", icon: <Clock className="w-4 h-4" /> },
        { name: "Food Cart", href: "/food/cart", icon: <ShoppingCart className="w-4 h-4" /> },
        { name: "Food Wishlist", href: "/food/wishlist", icon: <Heart className="w-4 h-4" /> },
      ]
    },
    {
      category: "Store & Essentials",
      icon: <ShoppingBag className="w-6 h-6" strokeWidth={2.5} />,
      show: true,
      links: [
        { name: "Store Home", href: "#", icon: <Map className="w-4 h-4" />, onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openEssentialsModal')); } },
        { name: "Store Orders", href: "#", icon: <Clock className="w-4 h-4" />, onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openEssentialsModal')); } },
        { name: "Store Cart", href: "#", icon: <ShoppingCart className="w-4 h-4" />, onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openEssentialsModal')); } },
        { name: "Store Wishlist", href: "#", icon: <Heart className="w-4 h-4" />, onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openEssentialsModal')); } },
      ]
    },
    {
      category: "Your Account & General",
      icon: <User className="w-6 h-6" strokeWidth={2.5} />,
      show: isLoggedIn,
      links: [
        { name: "My Profile", href: "/account", icon: <User className="w-4 h-4" /> },
      ]
    },
    {
      category: "For Vendors",
      icon: <LayoutDashboard className="w-6 h-6" strokeWidth={2.5} />,
      show: isLoggedIn && isVendor,
      links: [
        { name: "Vendor Dashboard", href: "/manager", icon: <LayoutDashboard className="w-4 h-4" /> },
      ]
    },
    {
      category: "Legal & Company",
      icon: <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />,
      show: true,
      links: [
        { name: "About Us", href: "/about", icon: <Info className="w-4 h-4" /> },
        { name: "Contact & Support", href: "/contact", icon: <Phone className="w-4 h-4" /> },
        { name: "Terms & Conditions", href: "/terms", icon: <ShieldCheck className="w-4 h-4" /> },
        { name: "Privacy Policy", href: "/privacy", icon: <ShieldCheck className="w-4 h-4" /> },
        { name: "Refund Policy", href: "/refund-policy", icon: <ShieldCheck className="w-4 h-4" /> },
      ]
    }
  ];

  const visibleSections = sitemapData.filter(section => section.show);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D0D17] flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 max-w-[1000px] mx-auto w-full px-6 py-12 md:py-20 text-gray-800 dark:text-gray-200">
        
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#0f172a] dark:text-white tracking-widest uppercase shrink-0">
            SITEMAP
          </h1>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-[#f97316] to-transparent opacity-80"></div>
        </div>

        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-12 max-w-3xl">
          Looking for something specific? Use our sitemap to quickly navigate through all the sections and features of NearBuy.
        </p>

        {/* Sitemap Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
          {visibleSections.map((section, idx) => (
            <div 
              key={idx} 
              className="bg-gray-50 dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] rounded-[2rem] p-8 md:p-10 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-orange-100 dark:hover:border-orange-500/30 duration-300"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="text-orange-gradient">
                  {section.icon}
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                  {section.category}
                </h2>
              </div>
              
              <ul className="space-y-4">
                {section.links.map((link: any, linkIdx: number) => (
                  <li key={linkIdx}>
                    <Link 
                      href={link.href}
                      onClick={link.onClick}
                      className="group flex items-center gap-3 text-sm md:text-base font-medium text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] flex items-center justify-center text-gray-400 group-hover:text-orange-500 group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all shadow-sm group-hover:scale-105">
                        {link.icon}
                      </span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Not Logged In Helper */}
        {!isLoggedIn && (
          <div className="mt-8 p-6 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-orange-950 dark:text-orange-400 mb-1">Want to see more?</h3>
              <p className="text-sm text-orange-800 dark:text-orange-200/80">Log in to view your account, wishlist, and active orders.</p>
            </div>
            <button
              onClick={openLoginModal}
              className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl whitespace-nowrap transition-colors shadow-md active:scale-95"
            >
              Login / Register
            </button>
          </div>
        )}

      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
