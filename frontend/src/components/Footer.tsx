"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Globe, Mail, MessageCircle, Smartphone, ArrowRight, Zap, Heart } from "lucide-react";
import BusinessRequestModal from "./BusinessRequestModal";

export default function Footer() {
  const pathname = usePathname() || "";
  const isEssentials = pathname.startsWith('/essentials');
  const accentColor = isEssentials ? "text-blue-600" : "text-orange-500";
  const hoverColor = isEssentials ? "hover:text-blue-600" : "hover:text-orange-600";
  const bgHover = isEssentials ? "hover:bg-blue-50" : "hover:bg-orange-50";
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType] = useState<"student" | "vendor">("vendor");

  const links = {
    NearBuy: [
      { name: "Home", href: "/" },
      { name: "About Us", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "#" },
      { name: "Contact", href: "#" },
    ],
    "Important Links": [
      { name: "Food Cart", href: "/food/cart" },
      { name: "Wishlist", href: "/food/wishlist" },
      { name: "Your Orders", href: "/food/orders?history=true" },
      { name: "Track Order", href: "#" },
    ],
    Restaurants: [
      { name: "Browse Food", href: "/" },
      { name: "Medicine", href: "/essentials" },
      { name: "Groceries", href: "/essentials" },
      { name: "Campus Coverage", href: "#" },
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
              <div className="flex items-center gap-2 mb-6">
                <span className="font-black text-2xl tracking-tight uppercase">
                  <span className={accentColor}>Near</span><span className="text-gray-900">Buy</span>
                </span>
                <Zap className={`w-5 h-5 ${accentColor} fill-current`} />
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
                        <a href={item.href} className={`text-[13px] text-gray-500 font-medium ${hoverColor} transition-colors`}>
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
                {[Globe, Mail, MessageCircle, Smartphone].map((Icon, i) => (
                  <a key={i} href="#" className={`w-8 h-8 flex items-center justify-center text-gray-400 transition-all ${hoverColor} hover:-translate-y-0.5`}>
                    <Icon className="w-5 h-5" />
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
