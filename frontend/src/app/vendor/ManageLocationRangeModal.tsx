"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Navigation, Check, Loader2, Sparkles, Sliders } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);

  const [formData, setFormData] = useState({
    delivery_range: 5,
    gps_address: "",
    manual_address: "",
    latitude: "",
    longitude: "",
    pincode: "",
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
      });
    }
  }, [profile]);

  if (!isOpen) return null;

  const fetchGpsLocation = () => {
    setIsGpsLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by browser");
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addressName = data.display_name || `${latitude}, ${longitude}`;
          const pin = data.address?.postcode || "";

          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            gps_address: addressName,
            pincode: pin || prev.pincode,
          }));
          toast.success("GPS Location detected!");
        } catch (err) {
          console.error("OSM lookup error:", err);
          setFormData((prev) => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            gps_address: `Lat: ${latitude}, Lon: ${longitude}`,
          }));
          toast.success("GPS coords saved (Address lookup failed).");
        } finally {
          setIsGpsLoading(false);
        }
      },
      (err) => {
        toast.error("Could not get GPS. Grant permissions and try again.");
        setIsGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 tracking-tight">Delivery Zone & Location</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Set delivery range limits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Delivery Range Slider */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> Max Delivery Range
              </label>
              <span className="text-sm font-black text-orange-600 bg-white border border-orange-100 px-2.5 py-0.5 rounded-full shadow-sm">
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
              className="w-full h-1.5 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            
            <div className="flex justify-between text-[10px] font-bold text-orange-400/80 uppercase">
              <span>0.5 km</span>
              <span>12.5 km</span>
              <span>25 km</span>
            </div>
            
            <p className="text-xs text-orange-800/80 leading-normal">
              Customers outside of a <span className="font-bold">{formData.delivery_range} km</span> radius from your store coordinates will see your restaurant marked as <span className="font-bold text-red-600">"Not available in your location"</span>.
            </p>
          </div>

          {/* GPS Location Details */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Store Coordinates (GPS)</label>
              <button
                type="button"
                onClick={fetchGpsLocation}
                disabled={isGpsLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {isGpsLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                Auto Detect GPS
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Latitude</span>
                <input 
                  type="text" 
                  readOnly 
                  value={formData.latitude} 
                  placeholder="21.49xx"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Longitude</span>
                <input 
                  type="text" 
                  readOnly 
                  value={formData.longitude} 
                  placeholder="83.90xx"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Detected GPS Address</span>
              <input 
                type="text" 
                readOnly 
                value={formData.gps_address} 
                placeholder="Auto-detected address will show here"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 truncate outline-none"
              />
            </div>
          </div>

          {/* Manual Address & Pincode */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Manual Address Detail</label>
              <textarea 
                value={formData.manual_address}
                onChange={(e) => setFormData({ ...formData, manual_address: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                placeholder="e.g. Near University Gate, Main Chowk"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Pincode</label>
              <input 
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                placeholder="768018"
              />
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2.5 border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs transition-colors"
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
