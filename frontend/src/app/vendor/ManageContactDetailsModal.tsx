"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
const THEMES = {
  food: {
    bg: "bg-orange-500", text: "text-white",
    iconBg: "bg-orange-100", iconColor: "text-orange-600"
  },
  store: {
    bg: "bg-blue-500", text: "text-white",
    iconBg: "bg-blue-100", iconColor: "text-blue-600"
  },
  medicine: {
    bg: "bg-emerald-500", text: "text-white",
    iconBg: "bg-emerald-100", iconColor: "text-emerald-600"
  }
};

export default function ManageContactDetailsModal({
  isOpen,
  onClose,
  profile,
  vendorType,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  vendorType: keyof typeof THEMES;
}) {
  const [ownerNumber, setOwnerNumber] = useState("");
  const [deliveryBoyNumber, setDeliveryBoyNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { accessToken } = useAuth();
  
  const t = THEMES[vendorType] || THEMES.food;

  useEffect(() => {
    if (profile) {
      setOwnerNumber(profile.owner_number || "");
      setDeliveryBoyNumber(profile.delivery_boy_number || "");
    }
  }, [profile, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      
      const res = await fetch(`${API}/api/vendor-profile/contact`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          owner_number: ownerNumber,
          delivery_boy_number: deliveryBoyNumber
        })
      });
      
      if (!res.ok) throw new Error("Failed to save contact details");
      
      toast.success("Contact details saved!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save contact details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={`px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.iconBg} ${t.iconColor}`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-lg">Contact Details</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Support Numbers</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest ml-1">Owner Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={ownerNumber}
                    onChange={(e) => setOwnerNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold outline-none placeholder:font-medium"
                  />
                </div>
                <p className="text-[10px] font-medium text-gray-400 ml-1">Customers will call this if they need help.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-widest ml-1">Delivery Boy Number (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={deliveryBoyNumber}
                    onChange={(e) => setDeliveryBoyNumber(e.target.value)}
                    placeholder="e.g. 8765432109"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-semibold outline-none placeholder:font-medium"
                  />
                </div>
                <p className="text-[10px] font-medium text-gray-400 ml-1">Visible to customers after order is confirmed.</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className={`w-full py-3.5 ${t.bg} hover:brightness-95 ${t.text} rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 shadow-sm`}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? "Saving..." : "Save Details"}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
