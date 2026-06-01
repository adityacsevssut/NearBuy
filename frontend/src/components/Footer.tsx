"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Zap, Heart } from "lucide-react";
import { FaInstagram, FaTelegramPlane, FaWhatsapp, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import BusinessRequestModal from "./BusinessRequestModal";
import { useAuth } from "@/context/AuthContext";

export default function Footer() {
  const { isLoggedIn } = useAuth();
  const pathname = usePathname() || "";
  const isEssentials = pathname.startsWith('/essentials');
  const accentColor = isEssentials ? "text-blue-600" : "text-orange-500";
  const hoverColor = isEssentials ? "hover:text-blue-600" : "hover:text-orange-600";
  const bgHover = isEssentials ? "hover:bg-blue-50" : "hover:bg-orange-50";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType] = useState<"student" | "vendor">("vendor");

  const links: Record<string, { name: string, href: string, onClick?: (e: any) => void }[]> = {
    NearBuy: [
      { name: "Home", href: "/" },
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Contact", href: "#" },
    ],
    "Important Links": [
      { name: "Food Cart", href: "/food/cart" },
      { name: "Wishlist", href: "/food/wishlist" },
      { name: "Your Orders", href: "/food/orders?history=true" },
      isLoggedIn ? { name: "Account", href: "/account" } : { name: "Login", href: "/signup" },
    ],
    "Our Platforms": [
      { name: "Food", href: "/" },
      { name: "Essentials", href: "#", onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openEssentialsModal')); } },
      { name: "Medico", href: "#", onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openMedicineModal')); } },
    ],
    Legal: [
      { name: "Terms & Conditions", href: "#" },
      { name: "Privacy Policy", href: "#" },
      { name: "Sitemap", href: "#" },
    ],
  };

  return (
    <>
      <footer className="bg-white text-gray-900 pt-12 md:pt-16 pb-24 md:pb-8 border-t border-gray-100 relative overflow-hidden mt-6 md:mt-12">
        {/* Subtle Background Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b ${isEssentials ? 'from-blue-50/50' : 'from-orange-50/80'} to-transparent blur-[80px] pointer-events-none`} />

        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 mb-16">
            
            {/* Column 1: Brand & Address */}
            <div className="md:col-span-3 lg:col-span-3">
              <div className="flex items-center flex-shrink-0 mb-6 group cursor-pointer">
                
                {/* Simple NB Logo */}
                <div className="flex items-baseline mr-1.5 md:mr-2 transition-transform duration-300 group-hover:scale-105 -skew-x-12">
                  <span className={`relative z-10 font-black text-3xl sm:text-4xl md:text-5xl ${accentColor} tracking-tighter drop-shadow-sm`}>N</span>
                  <span className="relative z-0 font-black text-3xl sm:text-4xl md:text-5xl text-black tracking-tighter drop-shadow-sm -ml-0.5">B</span>
                </div>

                <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-tight flex items-baseline">
                  <span className={`${accentColor} drop-shadow-sm`}>Near</span>
                  <span className="text-black drop-shadow-sm">Buy</span>
                </span>
              </div>
              <p className="text-gray-500 text-[13px] font-medium leading-relaxed mb-6 max-w-[250px]">
                NearBuy HQ, 123 University Road<br/>
                VSSUT Campus, Burla 768018, India
              </p>
            </div>

            {/* Links Columns (NearBuy, Important Links, Restaurants, Legal) */}
            <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 lg:grid-cols-4 gap-8">
              {Object.entries(links).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-[13px] font-black uppercase tracking-wider text-gray-900 mb-5">
                    {category}
                  </h4>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.name}>
                        <a 
                          href={item.href} 
                          onClick={item.onClick}
                          className={`text-[13px] text-gray-500 font-medium ${hoverColor} transition-colors`}
                        >
                          {item.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Column 5: Follow (Socials) */}
            <div className="md:col-span-2 lg:col-span-2">
              <h4 className="text-[13px] font-black uppercase tracking-wider text-gray-900 mb-5">
                Follow
              </h4>
              <div className="flex items-center flex-wrap gap-4">
                {[FaInstagram, FaTelegramPlane, FaWhatsapp, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                  <a key={i} href="#" className={`w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-full text-gray-500 transition-all duration-300 ${bgHover} ${hoverColor} hover:-translate-y-1 hover:shadow-md shadow-sm`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-center pt-6 border-t border-gray-100">
            {/* Copyright */}
            <div className="text-[12px] text-gray-400 font-medium text-center">
              Copyright {new Date().getFullYear()} © NearBuy Interactive<br/>
              Platform by Students Of VSSUT Burla
            </div>
          </div>
        </div>
      </footer>
      <BusinessRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        defaultType={modalType} 
      />
    </>
  );
}
