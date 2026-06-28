"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Image as ImageIcon, MapPin, Loader2, Navigation, Star, Clock, Tag, Heart, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import imageCompression from 'browser-image-compression';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { requestGpsActivation } from '@/utils/locationHelper';

interface ManageFrontPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorType: string;
}

export default function ManageFrontPageModal({ isOpen, onClose, vendorType }: ManageFrontPageModalProps) {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [currentIsOpen, setCurrentIsOpen] = useState<boolean | null>(null);

  const [formData, setFormData] = useState({
    restaurant_name: "",
    cuisine: "",
    delivery_time: "30-45 min",
    min_order: "80",
    offer: "50% off up to ₹80",
    badge: "Bestseller",
    gps_address: "",
    manual_address: "",
    latitude: "",
    longitude: "",
    pincode: "",
    landmark: "",
    rating: "4.5",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Theme accents
  const tColor = vendorType === "store" ? "blue" : "orange";

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/vendor-profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.profile) {
        setFormData({
          restaurant_name: data.profile.restaurant_name || "",
          cuisine: data.profile.cuisine || "",
          delivery_time: data.profile.delivery_time || "",
          min_order: data.profile.min_order?.toString() || "",
          offer: data.profile.offer || "",
          badge: data.profile.badge || "",
          gps_address: data.profile.gps_address || "",
          manual_address: data.profile.manual_address || "",
          latitude: data.profile.latitude?.toString() || "",
          longitude: data.profile.longitude?.toString() || "",
          pincode: data.profile.pincode || "",
          landmark: data.profile.landmark || "",
          rating: data.profile.rating?.toString() || "0.0",
        });
        // Preserve the current open/closed state so saving this modal never resets it
        setCurrentIsOpen(data.profile.is_open ?? false);
        if (data.profile.image_url) {
          setImagePreview(data.profile.image_url);
        }
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);


  // We removed handleDelete, hasProfile, isDeleting state parameters, so we can clean it up.

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image size must be less than 20MB");
        return;
      }
      
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error("Compression error:", error);
        toast.error("Failed to compress image");
      }
    }
  };

  const fetchGpsLocation = async () => {
    setIsGpsLoading(true);
    
    try {
      if (Capacitor.isNativePlatform()) {
        await requestGpsActivation();
      } else if (!navigator.geolocation) {
        toast.error("Geolocation not supported by browser");
        setIsGpsLoading(false);
        return;
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`);
        const data = await res.json();
        const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        const pincode = data.address?.postcode || "";

        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          gps_address: address,
          pincode: pincode,
        }));
        toast.success("GPS location auto-filled");
      } catch (err) {
        toast.error("Could not resolve address");
      }
    } catch (err: any) {
      toast.error(err.message === "Permission denied" ? "Location permission denied" : "Please Turn On Location.");
    } finally {
      setIsGpsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurant_name) {
      toast.error("Shop/Restaurant name is required");
      return;
    }
    if (!formData.landmark?.trim() || !formData.pincode?.trim()) {
      toast.error("Please fill in both Landmark and Pincode");
      return;
    }
    
    setIsSaving(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        form.append(key, value)
      );
      // Always send back the current is_open value so we don't accidentally reset it
      if (currentIsOpen !== null) {
        form.append("is_open", String(currentIsOpen));
      }
      if (imageFile) {
        form.append("image", imageFile);
      } else if (imagePreview && imagePreview.startsWith("data:")) {
        // Fallback for existing image (handled by backend if no file)
        form.append("existing_image_url", imagePreview);
      } else if (imagePreview) {
        form.append("existing_image_url", imagePreview);
      }

      const res = await fetch(`${API}/api/vendor-profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("Front page created successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] shrink-0">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Manage Front Page</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">Customise how your shop appears to customers</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 dark:bg-[#1F1F2E] text-gray-500 dark:text-gray-400 hover:bg-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 className={`w-8 h-8 animate-spin text-${tColor}-500`} />
              </div>
            ) : (
              <div className="space-y-8">
                {/* ════════ Live Preview Card ════════ */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Live Customer Preview</label>
                  <div className="relative block h-[260px] max-w-[340px] w-full mx-auto sm:mx-0 bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-[#2A2A3A]">
                    {/* Image Background */}
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover z-0" />
                    ) : (
                      <div className="absolute inset-0 bg-orange-50 flex items-center justify-center z-0">
                        <ImageIcon className="w-16 h-16 text-orange-200" />
                      </div>
                    )}

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

                    {/* Top Left Badge */}
                    {formData.badge && (
                      <div className="absolute top-3 left-3 bg-white dark:bg-[#151522] text-orange-600 dark:text-orange-500 text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-orange-100 dark:border-orange-500/20 z-20 uppercase">
                        {formData.badge}
                      </div>
                    )}

                    {/* Top Right Heart */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md shadow flex items-center justify-center z-20">
                      <Heart className="w-4 h-4 text-white" />
                    </div>

                    {/* Top Right Share */}
                    <div className="absolute top-3 right-14 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md shadow flex items-center justify-center z-20">
                      <Send className="w-4 h-4 text-white fill-white" />
                    </div>

                    {/* Info Content Container */}
                    <div className="absolute bottom-0 left-0 w-full px-2 pb-1.5 pt-4 flex flex-col justify-end z-20">
                      {/* Row 1: Name and Rating */}
                      <div className="flex items-start justify-between gap-1.5 mb-0.5">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="w-3 h-3 rounded-sm border-2 border-green-500 bg-black/20 flex items-center justify-center shrink-0">
                            <span className="w-1 h-1 rounded-full bg-green-500" />
                          </span>
                          <h3 className="font-black text-[17px] text-white leading-tight truncate drop-shadow-sm">
                            {formData.restaurant_name || "Your Shop Name"}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0 border border-green-500">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          {formData.rating || "4.5"}
                        </span>
                      </div>

                      {/* Row 2: Cuisine */}
                      <p className="text-[11px] text-gray-200 font-medium truncate drop-shadow-sm mb-0.5">
                        {formData.cuisine || "Category · Tags"}
                      </p>

                      {/* Row 3: Stats & Open Badge */}
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-white bg-black/40 border border-white/10 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            <Clock className="w-2.5 h-2.5 text-orange-400" />
                            {formData.delivery_time || "Time"}
                          </span>
                          <span className="inline-flex items-center text-[9px] font-semibold text-white bg-black/40 border border-white/10 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            Min ₹{formData.min_order || "0"}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-400 bg-orange-900/40 border border-orange-500/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                            <MapPin className="w-2.5 h-2.5" />
                            2.5 km
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-[8px] font-bold text-green-300 uppercase tracking-wider shrink-0 backdrop-blur-sm">
                          <span className="w-1 h-1 rounded-full bg-green-400 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
                          Open
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200/60 w-full" />

                {/* ════════ Form ════════ */}
                <form id="frontPageForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Image Upload Banner */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Display Banner Image</label>
                  <div className="relative w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-[#151522] overflow-hidden hover:bg-gray-100 dark:hover:bg-[#1F1F2E] transition-colors group">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                        <ImageIcon className="w-10 h-10" />
                        <span className="text-sm font-medium">Click to upload image</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    {imagePreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-full">Change Image</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Shop Name</label>
                    <input 
                      value={formData.restaurant_name}
                      onChange={e => setFormData({...formData, restaurant_name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. Sharma Dhaba"
                    />
                  </div>

                  {/* Cuisine */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Tags / Categories</label>
                    <input 
                      value={formData.cuisine}
                      onChange={e => setFormData({...formData, cuisine: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. North Indian, Biryani"
                    />
                  </div>

                  {/* Delivery Time */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Avg. Delivery Time</label>
                    <input 
                      value={formData.delivery_time}
                      onChange={e => setFormData({...formData, delivery_time: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. 30-45 min"
                    />
                  </div>

                  {/* Min Order */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Min Order (₹)</label>
                    <input 
                      type="number"
                      value={formData.min_order}
                      onChange={e => setFormData({...formData, min_order: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. 80"
                    />
                  </div>

                  {/* Offer */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Active Offer</label>
                    <input 
                      value={formData.offer}
                      onChange={e => setFormData({...formData, offer: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. 50% off up to ₹80"
                    />
                  </div>

                  {/* Badge */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Highlight Badge</label>
                    <input 
                      value={formData.badge}
                      onChange={e => setFormData({...formData, badge: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. Bestseller"
                    />
                  </div>

                  {/* Rating */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Rating (0.0 - 5.0)</label>
                    <input 
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={e => setFormData({...formData, rating: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                      placeholder="e.g. 4.5"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#2A2A3A] space-y-5">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Shop Location</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Auto-fetch your GPS coords and provide manual details</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">GPS Auto-Fetch Address</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly
                        value={formData.gps_address}
                        className="flex-1 px-4 py-3 bg-gray-100 dark:bg-[#1F1F2E] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 outline-none"
                        placeholder="Click button to auto-fetch GPS..."
                      />
                      <button 
                        type="button"
                        onClick={fetchGpsLocation}
                        disabled={isGpsLoading}
                        className={`px-4 py-3 bg-${tColor}-500 hover:bg-${tColor}-600 text-white rounded-xl font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2`}
                      >
                        {isGpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                        <span className="hidden sm:inline">Fetch GPS</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Landmark <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        value={formData.landmark}
                        onChange={e => setFormData({...formData, landmark: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                        placeholder="e.g. Pulaha Hall"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Pincode <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={e => setFormData({...formData, pincode: e.target.value.replace(/\D/g, "")})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
                        placeholder="e.g. 768018"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Manual Address Detail</label>
                    <textarea 
                      value={formData.manual_address}
                      onChange={e => setFormData({...formData, manual_address: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl font-bold text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none h-24"
                      placeholder="e.g. Shop No 4, Kirba Chowk, Near Main Gate, Burla"
                    />
                  </div>
                </div>
              </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2A2A3A] shrink-0 flex justify-end gap-3 bg-gray-50 dark:bg-[#151522]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="frontPageForm"
              disabled={isSaving || isLoading}
              className={`px-6 py-2.5 bg-${tColor}-500 hover:bg-${tColor}-600 text-white rounded-xl font-black shadow-lg shadow-${tColor}-500/20 transition-all disabled:opacity-50 flex items-center gap-2 active:scale-95`}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Front Page
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
