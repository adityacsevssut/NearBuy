"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Search, Crosshair, CheckCircle,
  Navigation, ChevronLeft, Loader2
} from "lucide-react";
import { useLocationContext } from "@/context/LocationContext";
import toast from "react-hot-toast";

// Dynamically import map to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="text-sm font-medium">Loading map…</span>
      </div>
    </div>
  ),
});

type View = "menu" | "map" | "pincode";

interface ResolvedAddress {
  name: string;
  fullAddress: string;
  pincode: string;
  lat: number;
  lng: number;
}

export default function LocationModal() {
  const { isLocationModalOpen, setIsLocationModalOpen, setLocation } =
    useLocationContext();

  const [view, setView] = useState<View>("menu");
  const [manualPincode, setManualPincode] = useState("");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedAddress | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmittingPincode, setIsSubmittingPincode] = useState(false);

  /* ── Helpers ─────────────────────────────────────────── */

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    setIsResolvingAddress(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.suburb || addr.neighbourhood || addr.residential ||
        addr.city || addr.town || addr.village || addr.county ||
        data.display_name?.split(",")[0] || "My Location";
      setResolvedAddress({
        name,
        fullAddress: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        pincode: addr.postcode || "",
        lat,
        lng,
      });
    } catch {
      setResolvedAddress({
        name: "My Location",
        fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        pincode: "",
        lat,
        lng,
      });
    } finally {
      setIsResolvingAddress(false);
    }
  }, []);

  const handleMapMove = useCallback(
    (lat: number, lng: number) => {
      setMapCoords({ lat, lng });
      resolveAddress(lat, lng);
    },
    [resolveAddress]
  );

  const handleClose = () => {
    setIsLocationModalOpen(false);
    setTimeout(() => {
      setView("menu");
      setManualPincode("");
      setMapCoords(null);
      setResolvedAddress(null);
    }, 350);
  };

  /* ── GPS → Map ───────────────────────────────────────── */

  const handleDetectAndOpenMap = async () => {
    setIsDetecting(true);
    try {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported by your browser");
        return;
      }
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        })
      );
      const { latitude, longitude } = position.coords;
      setMapCoords({ lat: latitude, lng: longitude });
      await resolveAddress(latitude, longitude);
      setView("map");
    } catch (err: any) {
      toast.error(
        err.code === 1
          ? "Location permission denied. Enable it in your browser settings."
          : "Could not get GPS signal. Try again."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  /* ── Confirm map location ────────────────────────────── */

  const handleConfirmMapLocation = () => {
    if (!resolvedAddress) return;
    setLocation(
      resolvedAddress.name,
      resolvedAddress.pincode,
      resolvedAddress.lat,
      resolvedAddress.lng
    );
    toast.success(`📍 Location set to ${resolvedAddress.name}`);
    handleClose();
  };

  /* ── Pincode submit ──────────────────────────────────── */

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPincode.length < 6) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    setIsSubmittingPincode(true);
    const toastId = toast.loading("Looking up pincode…");
    try {
      // 1. Fetch Post Office name from Postal API
      let locationName = `Pincode ${manualPincode}`;
      try {
        const postalRes = await fetch(
          `/api/pincode?pin=${manualPincode}`
        );
        const postalData = await postalRes.json();
        if (postalData?.[0]?.Status === "Success" && postalData[0].PostOffice?.length > 0) {
          const po = postalData[0].PostOffice[0];
          locationName = `${po.Name}, ${po.District}`;
        }
      } catch (err) {
        console.warn("Postal API proxy lookup failed, falling back to nominatim only.", err);
      }

      // 2. Fetch coordinates for this pincode in India
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${manualPincode}&country=India&format=json&addressdetails=1&accept-language=en`
      );
      const geoData = await geoRes.json();
      
      if (geoData && geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        
        if (locationName.startsWith("Pincode ")) {
          const addr = geoData[0].address || {};
          let parsedName = addr.suburb || addr.neighbourhood || addr.residential || addr.city || addr.town || addr.village || addr.county || addr.state_district || "";
          
          if (!parsedName) {
            const parts = geoData[0].display_name?.split(",") || [];
            parsedName = parts.length > 1 ? parts[1].trim() : (parts[0] || manualPincode);
          }
          
          if (parsedName && parsedName !== manualPincode) {
             locationName = parsedName;
          }
        }

        setLocation(locationName, manualPincode, lat, lon);
        toast.success(`📍 Location set to ${locationName}`, { id: toastId });
      } else {
        // Fallback: search by query
        const queryRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${manualPincode}+India&format=json&accept-language=en`
        );
        const queryData = await queryRes.json();
        if (queryData && queryData.length > 0) {
          const lat = parseFloat(queryData[0].lat);
          const lon = parseFloat(queryData[0].lon);
          setLocation(locationName, manualPincode, lat, lon);
          toast.success(`📍 Location set to ${locationName}`, { id: toastId });
        } else {
          // If all geocoding fails, fallback without coordinates
          setLocation(locationName, manualPincode);
          toast.error(`Could not resolve coordinates for ${manualPincode}. Range check might be restricted.`, { id: toastId });
        }
      }
    } catch {
      setLocation(`Pincode ${manualPincode}`, manualPincode);
      toast.error(`Lookup failed.`, { id: toastId });
    } finally {
      setIsSubmittingPincode(false);
    }
    handleClose();
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <AnimatePresence>
      {isLocationModalOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* ── Centered card ── */}
          <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            key="card"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={[
              "pointer-events-auto",
              "w-full max-w-md",
              "bg-white rounded-3xl shadow-2xl",
              "flex flex-col overflow-hidden",
              view === "map" ? "h-[75dvh]" : "max-h-[80dvh]",
            ].join(" ")}
          >
            {/* ════════════ MENU VIEW ════════════ */}
            {view === "menu" && (
              <div className="flex flex-col overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      Set Delivery Location
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Where should we deliver to?
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Options */}
                <div className="p-5 space-y-4 pb-8">
                  {/* GPS */}
                  <button
                    onClick={handleDetectAndOpenMap}
                    disabled={isDetecting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 hover:border-orange-400 hover:shadow-sm rounded-xl transition-all group disabled:opacity-60 active:scale-[0.98]"
                  >
                    {isDetecting ? (
                      <Loader2 className="w-5 h-5 text-orange-400 animate-spin shrink-0" />
                    ) : (
                      <Navigation className="w-5 h-5 text-orange-500 shrink-0" />
                    )}
                    <span className="font-bold text-gray-700 group-hover:text-orange-600 text-[15px]">
                      {isDetecting ? "Fetching GPS…" : "Fetch Exact Location"}
                    </span>
                  </button>

                  <div className="flex items-center gap-3 px-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      OR
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  {/* Pincode */}
                  <button
                    onClick={() => setView("pincode")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-white border border-gray-200 hover:border-gray-400 hover:shadow-sm rounded-xl transition-all group active:scale-[0.98]"
                  >
                    <Search className="w-5 h-5 text-gray-500 group-hover:text-gray-700 shrink-0" />
                    <span className="font-bold text-gray-700 group-hover:text-gray-900 text-[15px]">
                      Enter Pincode Here
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* ════════════ PINCODE VIEW ════════════ */}
            {view === "pincode" && (
              <div className="flex flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                  <button
                    onClick={() => setView("menu")}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                      Enter Pincode
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      We'll find your area automatically
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form
                  onSubmit={handlePincodeSubmit}
                  className="p-5 space-y-4 pb-10"
                >
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={manualPincode}
                      onChange={(e) =>
                        setManualPincode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="e.g. 759100"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-2xl font-black text-gray-900 placeholder:text-gray-300 placeholder:font-normal tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                  </div>

                  {/* digit progress dots */}
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          i < manualPincode.length
                            ? "bg-orange-500 scale-125"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={manualPincode.length < 6 || isSubmittingPincode}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:shadow-none transition-all active:scale-[0.98] text-[16px] flex items-center justify-center gap-2"
                  >
                    {isSubmittingPincode ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Looking up…
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        Confirm Location
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ════════════ MAP VIEW ════════════ */}
            {view === "map" && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
                  <button
                    onClick={() => setView("menu")}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-[17px] font-black text-gray-900 tracking-tight">
                      Confirm Your Location
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Tap map or drag pin to adjust
                    </p>
                  </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative min-h-0">
                  {mapCoords && (
                    <MapPicker
                      lat={mapCoords.lat}
                      lng={mapCoords.lng}
                      onLocationChange={handleMapMove}
                    />
                  )}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-xs font-bold text-gray-600 pointer-events-none whitespace-nowrap">
                    📍 Tap anywhere or drag pin to adjust
                  </div>
                </div>

                {/* Address confirmation */}
                <div className="shrink-0 bg-white border-t border-gray-100 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
                  {isResolvingAddress ? (
                    <div className="flex items-center gap-3 py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500 shrink-0" />
                      <span className="text-sm font-medium text-gray-500">
                        Resolving address…
                      </span>
                    </div>
                  ) : resolvedAddress ? (
                    <>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 text-[16px] leading-tight">
                            {resolvedAddress.name}
                          </p>
                          {resolvedAddress.pincode !== undefined && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-orange-600 font-bold">Pincode:</span>
                              <input
                                type="text"
                                maxLength={6}
                                value={resolvedAddress.pincode}
                                onChange={(e) => setResolvedAddress({...resolvedAddress, pincode: e.target.value.replace(/\D/g, "")})}
                                className="px-2 py-0.5 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded outline-none focus:border-orange-400 focus:bg-white transition-colors"
                                placeholder="Edit Pincode"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          <p className="text-[11px] text-gray-400 font-medium mt-1 leading-snug line-clamp-2">
                            {resolvedAddress.fullAddress}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmMapLocation}
                        className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirm this address
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Tap the map to pick a location
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
