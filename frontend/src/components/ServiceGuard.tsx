"use client";

import React, { useEffect, useState } from "react";
import { useLocationContext } from "@/context/LocationContext";
import { usePathname } from "next/navigation";
import { MapPin, Navigation, Map, ShieldAlert, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { requestGpsActivation } from '@/utils/locationHelper';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

// Distance calculation using Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export default function ServiceGuard({ children }: { children: React.ReactNode }) {
  const { latitude, longitude, pincode, locationName, setLocation, setIsLocationModalOpen } = useLocationContext();
  const pathname = usePathname();
  const currentPath = typeof window !== 'undefined' ? window.location.href : (pathname || '');
  const isStore = currentPath.toLowerCase().includes('/store') || currentPath.toLowerCase().includes('theme=blue') || currentPath.toLowerCase().includes('/essentials');
  
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "no-location">("checking");
  const [permissionPrompted, setPermissionPrompted] = useState(false);
  const [isWelcomed, setIsWelcomed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const welcomed = sessionStorage.getItem("zyphcart_welcomed") === "true";
        setIsWelcomed(welcomed);
      } catch (e) {}
    }
  }, []);

  // Bypass the guard for these paths
  const bypassedPaths = ["/dev", "/food/manager", "/food/vendor", "/account", "/food/user/wishlist", "/food/user/orders", "/food/user/cart", "/wishlist", "/orders", "/cart"];
  const isBypassed = bypassedPaths.some(path => pathname?.startsWith(path));

  async function fetchCenters() {
    try {
      const res = await fetch(`${API}/api/public/service-centers`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setCenters(data.centers || []);
      }
    } catch (err) {
      console.warn("Failed to fetch service centers", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCenters();
  }, []);


  useEffect(() => {
    if (loading) return;

    if (latitude === null || longitude === null) {
      // If user typed/selected a location but coordinates are unresolved, they are out of range.
      // Fallback: Check if the exact pincode matches any active center
      if (pincode && centers.some(c => c.pincode === pincode)) {
        setStatus("allowed");
        return;
      }
      
      if (pincode || (locationName && locationName !== "Select Location")) {
        setStatus("denied");
        return;
      }
      if (!permissionPrompted) {
        setPermissionPrompted(true);
        const fetchPos = async () => {
          try {
            if (Capacitor.isNativePlatform()) {
              await requestGpsActivation();
            } else if (typeof window === "undefined" || !navigator.geolocation) {
              throw new Error("Not supported");
            }
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
              const data = await res.json();
              const pin = data.address?.postcode || "";
              const name = data.address?.city || data.address?.town || data.address?.suburb || "Current Location";
              setLocation(name, pin, "", lat, lon, data.display_name || "");
            } catch {
              setLocation("Current Location", "", "", lat, lon, "");
            }
          } catch (err) {
            console.warn("Geolocation error or denied:", err);
            setStatus("denied");
          }
        };
        fetchPos();
      }
      return;
    }

    // Check if within any active center
    let isWithinRange = false;
    for (const center of centers) {
      const dist = getDistance(latitude, longitude, parseFloat(center.latitude), parseFloat(center.longitude));
      if (dist <= parseFloat(center.radius_km)) {
        isWithinRange = true;
        break;
      }
    }

    if (isWithinRange) {
      setStatus("allowed");
    } else {
      setStatus("denied");
    }
  }, [latitude, longitude, centers, loading, permissionPrompted, setLocation, setIsLocationModalOpen]);

  useEffect(() => {
    if (status !== "checking") {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("zyphcart_welcomed", "true");
          setIsWelcomed(true);
        } catch (e) {}
      }
    }
  }, [status]);

  const [isDetecting, setIsDetecting] = useState(false);

  const handleAutoDetectLocation = async () => {
    setIsDetecting(true);
    const toastId = toast.loading("Detecting location...");
    
    try {
      if (Capacitor.isNativePlatform()) {
        await requestGpsActivation();
      } else if (typeof window === "undefined" || !navigator.geolocation) {
        toast.error("Geolocation not supported by your browser", { id: toastId });
        setIsDetecting(false);
        return;
      }

      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
        const data = await res.json();
        const pin = data.address?.postcode || "";
        const name = data.address?.city || data.address?.town || data.address?.suburb || "Current Location";
        setLocation(name, pin, "", lat, lon, data.display_name || "");
        toast.success("Location detected!", { id: toastId });
      } catch {
        setLocation("Current Location", "", "", lat, lon, "");
        toast.success("Location detected!", { id: toastId });
      }
    } catch (err) {
      console.warn("Geolocation error or denied:", err);
      toast.error("Location permission denied. Please select manually.", { id: toastId });
      setIsLocationModalOpen(true);
    } finally {
      setIsDetecting(false);
    }
  };

  if (isBypassed) return <>{children}</>;

  if (loading || status === "checking") {
    if (isWelcomed) {
      return <>{children}</>;
    }
    return (
      <div className={`min-h-screen ${isStore ? "bg-blue-50/20" : "bg-orange-50/20"} dark:bg-black flex flex-col items-center justify-center p-4 select-none`}>
        {/* Simple card container */}
        <div className="max-w-md w-full bg-white dark:bg-[#0D0D17] rounded-3xl p-8 md:p-10 text-center shadow-xl border border-gray-100 dark:border-[#2A2A3A] flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center -skew-x-6 pr-1 mb-6">
            <span className={`font-black text-4xl tracking-tighter drop-shadow-sm ${isStore ? "text-blue-600" : "text-orange-gradient"}`}>
              Z
            </span>
            <span className="text-black dark:text-white font-black text-4xl tracking-tighter drop-shadow-sm">
              C
            </span>
            <span className="font-black text-2xl tracking-tight text-gray-800 dark:text-gray-200 ml-1.5 skew-x-6">
              <span className={isStore ? "text-blue-600" : "text-orange-gradient"}>Zyph</span>Cart
            </span>
          </div>

          {/* Texts */}
          <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-1 tracking-tight leading-tight">
            Welcome to <span className={isStore ? "text-blue-600" : "text-orange-gradient"}>Zyph</span>Cart
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-tight mb-8">
            Explore Your Nearest Market
          </p>

          {/* Simple classic spinning loader with MapPin */}
          <div className="w-16 h-16 relative">
            <div className={`absolute inset-0 rounded-full border-4 ${isStore ? "border-blue-100" : "border-orange-100"}`}></div>
            <div className={`absolute inset-0 rounded-full border-4 ${isStore ? "border-blue-600" : "border-orange-500"} border-t-transparent animate-spin`}></div>
            <MapPin className={`absolute inset-0 m-auto w-6 h-6 ${isStore ? "text-blue-600" : "text-orange-500"}`} />
          </div>
        </div>
      </div>
    );
  }



  if (status === "denied") {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0D0D17] flex flex-col pt-16 font-sans">
        <Navbar forceSolid />
        <main className="flex-1 flex flex-col items-center p-6 mt-4 text-center">
          
          {/* Main Hero Image */}
          <div className="w-full max-w-[280px] sm:max-w-xs mx-auto mb-6 flex justify-center items-center">
            <img 
              src={isStore ? "/images/out_of_service_store.png" : "/images/out_of_service_hero.png"}
              alt="Out of Service Area" 
              className="w-full h-auto mx-auto object-contain mix-blend-darken dark:hidden contrast-[1.05] brightness-[1.05]" 
            />
            <img 
              src={isStore ? "/images/out_of_service_store_dark.png" : "/images/out_of_service_hero_dark.png"}
              alt="Out of Service Area" 
              className="w-full h-auto mx-auto object-contain hidden dark:block" 
            />
          </div>

          {/* Heading */}
          <h1 
            className={`text-4xl font-bold ${isStore ? "text-blue-600" : "text-orange-500"} mb-2 tracking-wide`}
            style={{ fontFamily: "cursive" }}
          >
            Not Available At Your Location
          </h1>
          <p className="text-[#7e808c] text-[17px] font-medium mb-10">
            Stay tuned for updates!
          </p>

          {/* Dotted divider */}
          <div className="w-full max-w-md mx-auto flex items-center justify-center gap-3 mb-10 overflow-hidden opacity-30 px-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rotate-45 bg-gray-50 dark:bg-[#151522] flex-shrink-0"></div>
            ))}
          </div>

          {/* Bottom Section */}
          <div className="flex flex-col items-center">
            <p className="text-[#93959f] font-bold text-[15px] tracking-wide mb-0.5">
              ZyphCart
            </p>
            <p className="text-[#d4d5d9] font-black text-2xl tracking-tighter mb-4">
              Your Nearest Market Place
            </p>
            <div className="w-48 mx-auto mb-10">
              <img 
                src={isStore ? "/images/delivery_store.png" : "/images/delivery_boy_bottom.png"}
                alt="Delivery Info" 
                className="w-full h-auto object-contain mix-blend-darken dark:hidden contrast-[1.05] brightness-[1.05]" 
              />
              <img 
                src={isStore ? "/images/delivery_store_dark.png" : "/images/delivery_boy_bottom_dark.png"}
                alt="Delivery Info" 
                className="w-full h-auto object-contain hidden dark:block rounded-xl" 
              />
            </div>
          </div>

          {/* Action buttons (Added so user can escape this screen easily) */}
          <div className="w-full max-w-sm mx-auto space-y-3 pb-8">
             <button 
                onClick={() => setIsLocationModalOpen(true)}
                className={`w-full py-4 ${isStore ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-500 hover:bg-orange-600"} rounded-xl text-white font-bold transition-all shadow-lg active:scale-[0.98]`}
              >
                Change Location
              </button>
              <button 
                onClick={() => toast.success("We'll notify you when we expand to your area!")}
                className="w-full py-4 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522] rounded-xl text-gray-700 dark:text-gray-300 font-bold transition-all active:scale-[0.98]"
              >
                Notify Me
              </button>
          </div>

        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }


  return <>{children}</>;
}
