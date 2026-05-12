"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Code, Briefcase, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const pathname = usePathname();
  const isEssentials = pathname === "/essentials";
  const primaryText = isEssentials ? "text-blue-500" : "text-orange-500";
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 relative bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight text-center flex items-center justify-center gap-1.5">
                Welcome to <span className="font-black text-2xl tracking-tight drop-shadow-sm"><span className={primaryText}>Near</span><span className="text-gray-900">Buy</span></span>
              </h2>
              <button 
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500 text-center mb-6 font-medium">
                Please select your account type to continue
              </p>

              <button className="w-full flex items-center gap-4 p-4 rounded-full border-2 border-gray-100 hover:border-orange-500 hover:bg-orange-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <User className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg">User Login</h3>
                  <p className="text-xs text-gray-500 font-medium">Order food and essentials</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-full border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Code className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg">Developer Login</h3>
                  <p className="text-xs text-gray-500 font-medium">Manage API and integrations</p>
                </div>
              </button>

              <button className="w-full flex items-center gap-4 p-4 rounded-full border-2 border-gray-100 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <Briefcase className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800 text-lg">Partner Login</h3>
                  <p className="text-xs text-gray-500 font-medium">Manage your store and orders</p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
