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
    Platform: ["Campus Coverage", "Track Order", "Pricing", "FAQ"],
    Company: ["About Us", "Careers", "Blog", "Press"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Refunds"],
  };

  return (
    <>
      <footer className="bg-white text-gray-900 pt-10 md:pt-20 pb-24 md:pb-10 border-t border-orange-100 relative overflow-hidden mt-6 md:mt-12">
        {/* Subtle Background Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b ${isEssentials ? 'from-blue-50/50' : 'from-orange-50/80'} to-transparent blur-[80px] pointer-events-none`} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            
            {/* Brand Section */}
            <div className="md:col-span-5 lg:col-span-4">
              <div className="flex items-center gap-2 mb-6">
                <span className="font-black text-3xl tracking-tight">
                  <span className={accentColor}>Near</span><span className="text-gray-900">Buy</span>
                </span>
                <Zap className={`w-5 h-5 ${accentColor} fill-current`} />
              </div>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-8 max-w-sm">
                Revolutionizing campus commerce. Bringing food, essentials, and student businesses together on one seamless platform.
              </p>
              
              {/* Socials */}
              <div className="flex items-center gap-4">
                {[Globe, Mail, MessageCircle, Smartphone].map((Icon, i) => (
                  <a key={i} href="#" className={`w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-400 border border-orange-100 shadow-sm transition-all ${hoverColor} ${bgHover} hover:-translate-y-1 hover:border-orange-300 hover:shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Section */}
            <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {Object.entries(links).map(([category, items]) => (
                <div key={category}>
                  <p className="text-sm font-black uppercase tracking-wider text-gray-900 mb-6">
                    {category}
                  </p>
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li key={item}>
                        <a href="#" className={`text-[15px] text-gray-500 font-medium ${hoverColor} transition-colors group flex items-center gap-2`}>
                          <span className="w-0 overflow-hidden transition-all group-hover:w-3 opacity-0 group-hover:opacity-100">
                            <ArrowRight className="w-3 h-3" />
                          </span>
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-orange-100">
            <p className="text-[13px] text-gray-500 font-medium text-center md:text-left">
              © {new Date().getFullYear()} NearBuy Technologies PVT Limited. Made with <Heart className="w-4 h-4 inline text-red-500 fill-current mx-1" /> By Students Of VSSUT Burla.
            </p>
            
            <div className="flex items-center gap-6 text-[13px] font-medium text-gray-500">
              <span className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                All systems operational
              </span>
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
