"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Zap, Heart } from "lucide-react";
import { FaInstagram, FaTelegramPlane, FaWhatsapp, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import BusinessRequestModal from "./BusinessRequestModal";
import FeedbackModal from "./FeedbackModal";
import SupportModal from "./SupportModal";
import RefundModal from "./RefundModal";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function Footer() {
  const { isLoggedIn, openLoginModal } = useAuth();
  const pathname = usePathname() || "";
  const router = useRouter();
  const isStore = pathname.startsWith('/store') || pathname.startsWith('/essentials');
  const accentColor = isStore ? "text-blue-600" : "text-orange-500";
  const hoverColor = isStore ? "hover:text-blue-600" : "hover:text-orange-600";
  const bgHover = isStore ? "hover:bg-blue-50" : "hover:bg-orange-50";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"student" | "vendor">("vendor");
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  const links: Record<string, { name: string, href: string, onClick?: (e: any) => void }[]> = {
    NearBuy: [
      { name: "Home", href: "/" },
      { name: "About Us", href: "/about" },
      { name: "Need Support", href: "#", onClick: (e: any) => { e.preventDefault(); setIsSupportOpen(true); } },
      { name: "My Refunds", href: isStore ? "/refunds?theme=blue" : "/refunds" },
      { name: "Feedback", href: "#", onClick: (e: any) => { e.preventDefault(); setIsFeedbackOpen(true); } },
    ],
    "Important Links": [
      { name: isStore ? "Store Cart" : "Food Cart", href: isStore ? "/store/cart" : "/food/cart" },
      { name: "Wishlist", href: isStore ? "/store/wishlist" : "/food/wishlist" },
      { name: "Your Orders", href: isStore ? "/store/orders" : "/food/orders?history=true" },
      isLoggedIn ? { name: "Account", href: "/account" } : { name: "Login", href: "#", onClick: (e: any) => { e.preventDefault(); openLoginModal(); } },
    ],
    Register: [
      { name: "Register as Student", href: "#", onClick: (e: any) => { e.preventDefault(); setModalType("student"); setIsModalOpen(true); } },
      { name: "Register as Restaurant", href: "#", onClick: (e: any) => { e.preventDefault(); setModalType("vendor"); setIsModalOpen(true); } },
    ],
    "Our Platforms": [
      { name: "Food", href: "/" },
      { name: "Essentials", href: "#", onClick: (e: any) => { e.preventDefault(); window.dispatchEvent(new Event('openEssentialsModal')); } },
    ],
    Legal: [
      { name: "Terms & Conditions", href: isStore ? "/terms?theme=store" : "/terms" },
      { name: "Privacy Policy", href: isStore ? "/privacy?theme=store" : "/privacy" },
      { name: "Refund Policy", href: isStore ? "/refund-policy?theme=store" : "/refund-policy" },
    ],
  };

  return (
    <>
      <footer className="bg-white dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 pt-12 md:pt-16 pb-24 md:pb-8 border-t border-gray-100 dark:border-[#2A2A3A] relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b ${isStore ? 'from-blue-50/50' : 'from-orange-50/80'} dark:hidden to-transparent blur-[80px] pointer-events-none`} />

        <div className="max-w-[1400px] mx-auto px-6 sm:px-8 relative z-10">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 mb-16">

            {/* Column 1: Brand & Address */}
            <div className="md:col-span-3 lg:col-span-3">
              <div className="flex items-center flex-shrink-0 mb-6 group cursor-pointer">

                {/* Simple NB Logo */}
                <div className="flex items-baseline mr-1.5 md:mr-2 transition-transform duration-300 group-hover:scale-105 -skew-x-12">
                  <span className={`relative z-10 font-black text-3xl sm:text-4xl md:text-5xl ${accentColor} tracking-tighter drop-shadow-sm`}>N</span>
                  <span className="relative z-0 font-black text-3xl sm:text-4xl md:text-5xl text-black dark:text-white tracking-tighter drop-shadow-sm -ml-0.5">B</span>
                </div>

                <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-tight flex items-baseline">
                  <span className={`${accentColor} drop-shadow-sm`}>Near</span>
                  <span className="relative text-black dark:text-white drop-shadow-sm">
                    Buy
                    <svg className={`absolute -bottom-3 sm:-bottom-3.5 -left-1 w-[120%] h-3 sm:h-3.5 ${accentColor}`} viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path d="M 4,8 Q 40,-2 100,12 Q 40,6 4,16 A 4,4 0 0,1 4,8 Z" fill="currentColor" />
                    </svg>
                  </span>
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[13px] font-medium leading-relaxed mb-6 max-w-[250px]">
                NearBuy HQ, 123 University Road<br />
                VSSUT Campus, Burla 768018, India
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 lg:grid-cols-5 gap-8">
              {Object.entries(links).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-[13px] font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-5">
                    {category}
                  </h4>
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.name}>
                        <a
                          href={item.href}
                          onClick={(e) => {
                            if (!isLoggedIn && item.name !== "Login") {
                              e.preventDefault();
                              toast.error("Please login first");
                              openLoginModal();
                              return;
                            }
                            if (item.onClick) {
                              item.onClick(e);
                            }
                          }}
                          className={`text-[13px] text-gray-500 dark:text-gray-400 font-medium ${hoverColor} transition-colors`}
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
              <h4 className="text-[13px] font-black uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-5">
                Follow
              </h4>
              <div className="flex items-center flex-wrap gap-4">
                {[FaInstagram, FaTelegramPlane, FaWhatsapp, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                  <a key={i} href="#" className={`w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] rounded-full text-gray-500 dark:text-gray-400 transition-all duration-300 ${bgHover} ${hoverColor} hover:-translate-y-1 hover:shadow-md shadow-sm`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-center pt-6 border-t border-gray-100 dark:border-[#2A2A3A]">
            {/* Copyright */}
            <div className="text-[12px] text-gray-400 font-medium text-center">
              Copyright {new Date().getFullYear()} © <span className={accentColor}>Near</span><span className="text-black dark:text-white">Buy</span> Interactive<br />
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
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        type={isStore ? "store" : "food"}
      />
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        type={isStore ? "store" : "food"}
      />
      <RefundModal
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        type={isStore ? "store" : "food"}
      />
    </>
  );
}
