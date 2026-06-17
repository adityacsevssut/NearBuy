"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Link from "next/link";

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "food" | "store" | "general";
}

export default function RefundModal({ isOpen, onClose, type }: RefundModalProps) {
  const { isLoggedIn, user, accessToken } = useAuth();
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const isStore = type === "store";

  const theme = {
    focus: isStore ? "focus:border-blue-500" : "focus:border-orange-500",
    buttonBg: isStore ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/30" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30",
    iconBg: isStore ? "bg-blue-100 dark:bg-blue-500/20 text-blue-500" : "bg-orange-100 dark:bg-orange-500/20 text-orange-500",
    gradientBtn: isStore 
      ? "from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25" 
      : "from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25",
    activeText: isStore ? "text-blue-500" : "text-orange-500"
  };

  // When modal opens, auto-fill email and name if user exists
  useState(() => {
    if (user?.email) setEmail(user.email);
    if (user?.firstName) setUserName(`${user.firstName} ${user.lastName || ""}`.trim());
  });

  const validateEmail = (e: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(e);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("You must be logged in to submit a refund request.");
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");

    if (!orderId.trim()) {
      toast.error("Please enter a valid Order ID.");
      return;
    }

    if (!userName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/public/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ email, order_id: orderId, user_name: userName, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit refund request");
      
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 4000);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setSuccess(false);
      setOrderId("");
      setEmail(user?.email || "");
      setUserName(user ? `${user.firstName} ${user.lastName || ""}`.trim() : "");
      setEmailError("");
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0D0D17] border border-gray-100 dark:border-[#2A2A3A] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] flex justify-between items-center bg-gray-50/50 dark:bg-[#151522]/50">
              <div>
                <h3 className="font-black text-xl text-gray-900 dark:text-white tracking-tight">Request Refund</h3>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5">We will process your refund shortly</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-[#2A2A3A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {!isLoggedIn ? (
                <div className="text-center py-8">
                  <div className={`w-16 h-16 ${theme.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Send className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Login Required</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">You must be logged in to request a refund.</p>
                  <a href="/login" className={`inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm ${theme.buttonBg}`}>
                    Go to Login
                  </a>
                </div>
              ) : success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.1 }}
                    className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-5"
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">Refund Requested!</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Visit the <Link href="/refunds" className={`font-bold hover:underline ${theme.activeText}`} onClick={handleClose}>Refunds page</Link> regularly to know about your refund update.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Registered Email</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      placeholder="your@email.com"
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border ${emailError ? 'border-red-400 focus:border-red-500' : `border-gray-200 dark:border-[#2A2A3A] ${theme.focus}`} rounded-xl text-sm outline-none transition-all dark:text-white`}
                    />
                    {emailError && <p className="text-xs font-bold text-red-500 mt-1.5">{emailError}</p>}
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-semibold">Email in which order was placed</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">User Name</label>
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] ${theme.focus} rounded-xl text-sm outline-none transition-all dark:text-white`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">Order ID</label>
                    <input
                      type="text"
                      required
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      placeholder="Enter the 8-digit Order ID"
                      className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] ${theme.focus} rounded-xl text-sm outline-none transition-all font-mono dark:text-white`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 bg-gradient-to-r ${theme.gradientBtn} text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Receipt className="w-4 h-4" />
                        Submit Request
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
