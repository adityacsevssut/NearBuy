"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Navigation, Check, Loader2, Sparkles, Sliders, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocationContext } from "@/context/LocationContext";
import { motion, AnimatePresence } from "framer-motion";

interface ManageLocationRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
}

export default function ManageLocationRangeModal({
  isOpen,
  onClose,
  profile,
}: ManageLocationRangeModalProps) {
  const { accessToken } = useAuth();
  const { savedAddresses } = useLocationContext();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    delivery_range: 5,
    gps_address: "",
    manual_address: "",
    latitude: "",
    longitude: "",
    pincode: "",
    landmark: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        delivery_range: profile.delivery_range ? parseFloat(profile.delivery_range) : 5.0,
        gps_address: profile.gps_address || "",
        manual_address: profile.manual_address || "",
        latitude: profile.latitude?.toString() || "",
        longitude: profile.longitude?.toString() || "",
        pincode: profile.pincode || "",
        landmark: profile.landmark || "",
      });
    }
  }, [profile]);

  if (!isOpen) return null;



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.manual_address?.trim()) {
      toast.error("Please select a store location from your saved addresses");
      return;
    }
    setIsSaving(true);

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, String(value));
      });

      const res = await fetch(`${API}/api/vendor-profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (res.ok) {
        toast.success("Location & range limits saved!");
        onClose();
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0D0D17] rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-[#2A2A3A] flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2A2A3A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 dark:text-gray-100 tracking-tight">Delivery Zone & Location</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Set delivery range limits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#1F1F2E] rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Delivery Range Slider */}
          <div className="bg-orange-50/50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-orange-950 dark:text-orange-gradient uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Max Delivery Range
              </label>
              <span className="text-sm font-black text-orange-gradient bg-white dark:bg-[#0D0D17] border border-orange-100 dark:border-orange-500/20 px-2.5 py-0.5 rounded-full shadow-sm">
                {formData.delivery_range} km
              </span>
            </div>
            
            <input 
              type="range" 
              min="0.5" 
              max="25" 
              step="0.5"
              value={formData.delivery_range}
              onChange={(e) => setFormData({ ...formData, delivery_range: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-orange-100 dark:bg-orange-500/30 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            
            <div className="flex justify-between text-[10px] font-bold text-orange-gradient/80 uppercase">
              <span>0.5 km</span>
              <span>12.5 km</span>
              <span>25 km</span>
            </div>
            
            <p className="text-xs text-orange-800/80 dark:text-orange-gradient/80 leading-normal">
              Customers outside of a <span className="font-bold">{formData.delivery_range} km</span> radius from your store coordinates will see your restaurant marked as <span className="font-bold text-red-600 dark:text-red-500">"Not available in your location"</span>.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#2A2A3A]">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Select Store Location</label>
              
              {savedAddresses.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {savedAddresses.map((addr) => {
                    const isSelected = formData.pincode === addr.pincode && formData.manual_address === addr.full_address;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            latitude: addr.latitude?.toString() || prev.latitude,
                            longitude: addr.longitude?.toString() || prev.longitude,
                            gps_address: addr.name,
                            manual_address: addr.full_address || "",
                            pincode: addr.pincode || "",
                            landmark: addr.landmark || ""
                          }));
                          toast.success(`Store location set to ${addr.name}`);
                        }}
                        className={`w-full flex flex-col text-left px-4 py-3 border rounded-xl transition-all shadow-sm ${
                          isSelected 
                            ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-500' 
                            : 'bg-white dark:bg-[#0D0D17] border-gray-200 dark:border-[#2A2A3A] hover:border-orange-300 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-sm font-black text-gray-800 dark:text-gray-200">{addr.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{addr.full_address}</span>
                        {addr.landmark && <span className="text-[10px] text-gray-400 mt-1">Landmark: {addr.landmark}</span>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 bg-orange-50/50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-xl text-center">
                  <p className="text-xs text-orange-800 dark:text-orange-gradient">You don't have any saved addresses. Please add an address from the home page first to set your store location.</p>
                </div>
              )}
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522]/50 flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2.5 border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-100 dark:hover:bg-[#1F1F2E] text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-orange-500/10 flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
