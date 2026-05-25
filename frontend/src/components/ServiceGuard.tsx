"use client";

import React, { useEffect, useState } from "react";
import { useLocationContext } from "@/context/LocationContext";
import { usePathname } from "next/navigation";
import { MapPin, Navigation, Map, ShieldAlert, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
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
  
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "no-location">("checking");
  const [permissionPrompted, setPermissionPrompted] = useState(false);
  const [isWelcomed, setIsWelcomed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const welcomed = sessionStorage.getItem("nearbuy_welcomed") === "true";
        setIsWelcomed(welcomed);
      } catch (e) {}
    }
  }, []);

  // Bypass the guard for these paths
  const bypassedPaths = ["/dev", "/manager", "/vendor", "/account", "/wishlist", "/orders", "/cart"];
  const isBypassed = bypassedPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    if (isBypassed) return;
    fetchCenters();
  }, [isBypassed]);

  async function fetchCenters() {
    try {
      const res = await fetch(`${API}/api/public/service-centers`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setCenters(data.centers || []);
      }
    } catch (err) {
      console.error("Failed to fetch service centers", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isBypassed || loading) return;

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
      setStatus("no-location");
      
      // Prompt for geolocation once
      if (!permissionPrompted) {
        setPermissionPrompted(true);
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lon = pos.coords.longitude;
              
              // Reverse geocode to get name/pincode (optional but good)
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
                const data = await res.json();
                const pin = data.address?.postcode || "";
                const name = data.address?.city || data.address?.town || data.address?.suburb || "Current Location";
                setLocation(name, pin, lat, lon);
              } catch {
                setLocation("Current Location", "", lat, lon);
              }
            },
            (err) => {
              console.warn("Geolocation error or denied:", err);
              // Open modal so they can manually set it
              setIsLocationModalOpen(true);
            }
          );
        }
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
  }, [latitude, longitude, centers, loading, isBypassed, permissionPrompted, setLocation, setIsLocationModalOpen]);

  useEffect(() => {
    if (status !== "checking") {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("nearbuy_welcomed", "true");
          setIsWelcomed(true);
        } catch (e) {}
      }
    }
  }, [status]);

  const [isDetecting, setIsDetecting] = useState(false);

  const handleAutoDetectLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      setIsDetecting(false);
      return;
    }
    
    const toastId = toast.loading("Detecting location...");
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`);
          const data = await res.json();
          const pin = data.address?.postcode || "";
          const name = data.address?.city || data.address?.town || data.address?.suburb || "Current Location";
          setLocation(name, pin, lat, lon);
          toast.success("Location detected!", { id: toastId });
        } catch {
          setLocation("Current Location", "", lat, lon);
          toast.success("Location detected!", { id: toastId });
        } finally {
          setIsDetecting(false);
        }
      },
      (err) => {
        console.warn("Geolocation error or denied:", err);
        toast.error("Location permission denied. Please select manually.", { id: toastId });
        setIsDetecting(false);
        setIsLocationModalOpen(true);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (isBypassed) return <>{children}</>;

  if (loading || status === "checking") {
    if (isWelcomed) {
      return <>{children}</>;
    }
    return (
      <div className="min-h-screen bg-orange-50/20 flex flex-col items-center justify-center p-4 select-none">
        {/* Simple card container */}
        <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 text-center shadow-xl border border-gray-100 flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center -skew-x-6 pr-1 mb-6">
            <span className="font-black text-4xl tracking-tighter drop-shadow-sm text-orange-500">
              N
            </span>
            <span className="text-black font-black text-4xl tracking-tighter drop-shadow-sm">
              B
            </span>
            <span className="font-black text-2xl tracking-tight text-gray-800 ml-1.5 skew-x-6">
              <span className="text-orange-500">Near</span>Buy
            </span>
          </div>

          {/* Texts */}
          <h2 className="text-2xl font-black text-gray-900 mb-1 tracking-tight leading-tight">
            Welcome to <span className="text-orange-500">Near</span>Buy
          </h2>
          <p className="text-gray-500 font-bold text-sm tracking-tight mb-8">
            Explore Your Nearest Market
          </p>

          {/* Simple classic spinning loader with MapPin */}
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin"></div>
            <MapPin className="absolute inset-0 m-auto w-6 h-6 text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "no-location") {
    return (
      <div className="min-h-screen bg-orange-50/40 flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 my-8">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-orange-100">
              <Navigation className="w-10 h-10 text-orange-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Location Required</h1>
            <p className="text-gray-500 mb-8 leading-relaxed font-medium text-[15px]">
              Please allow location access or select your location manually to see if we deliver to your area.
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleAutoDetectLocation}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors shadow-lg disabled:opacity-70"
              >
                <Navigation className={`w-5 h-5 ${isDetecting ? 'animate-pulse' : ''}`} /> 
                {isDetecting ? "Detecting..." : "Auto Detect Location"}
              </button>
              <button 
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 hover:bg-black rounded-xl text-white font-bold transition-colors shadow-lg"
              >
                <Map className="w-5 h-5" /> Select Location Manually
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-orange-50/40 flex flex-col pt-16">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden my-8">
          {/* Background decorations */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"></div>

          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl shadow-gray-200/50 border border-gray-100 relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-red-50 to-orange-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100 relative">
              <div className="absolute inset-0 rounded-full border border-red-500/20 animate-ping opacity-75"></div>
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Service not available at your address</h1>
            <p className="text-gray-500 mb-4 leading-relaxed font-medium text-[15px]">
              We are currently expanding our operational zones. We will be available in your area soon!
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-left text-xs text-gray-600 font-mono overflow-auto">
              <p className="font-bold mb-1 text-gray-800">Debug Information:</p>
              <p>User Lat/Lon: {latitude?.toFixed(4) || "null"}, {longitude?.toFixed(4) || "null"}</p>
              {centers.length > 0 ? (
                <div className="mt-2 space-y-2">
                  <p>Active Centers:</p>
                  {centers.map(c => {
                    const dist = (latitude && longitude) ? getDistance(latitude, longitude, parseFloat(c.latitude), parseFloat(c.longitude)).toFixed(2) : "N/A";
                    return (
                      <div key={c.id} className="pl-2 border-l-2 border-orange-200">
                        <p>{c.name} (PIN: {c.pincode})</p>
                        <p>Center: {parseFloat(c.latitude).toFixed(4)}, {parseFloat(c.longitude).toFixed(4)}</p>
                        <p>Radius: {c.radius_km}km</p>
                        <p className="font-bold text-red-500">Distance: {dist}km</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No active centers found in database.</p>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  toast.success("Request recorded! We'll notify you when we arrive.");
                }}
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl text-white font-bold transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-0.5 active:translate-y-0"
              >
                Request service in this area
              </button>
              <button 
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-100 hover:border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 font-bold transition-all"
              >
                Change Location <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  return <>{children}</>;
}
