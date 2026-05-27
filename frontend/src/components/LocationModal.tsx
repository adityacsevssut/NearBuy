"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Search, Navigation, ChevronLeft, Loader2,
  CheckCircle, Crosshair, Building2, Clock, Trash2,
} from "lucide-react";
import { useLocationContext, SavedAddress } from "@/context/LocationContext";
import toast from "react-hot-toast";
import GooglePlacesSearch, { ResolvedGoogleAddress } from "./GooglePlacesSearch";

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

type View = "menu" | "map" | "search";

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function LocationModal() {
  const {
    isLocationModalOpen, setIsLocationModalOpen, setLocation,
    savedAddresses, addSavedAddress, removeSavedAddress,
  } = useLocationContext();

  const [view, setView] = useState<View>("menu");
  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<ResolvedGoogleAddress | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /* ── Helpers ─────────────────────────────────────────── */

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    setIsResolvingAddress(true);
    let resolved = false;

    // 1. Try Google Maps API First
    try {
      const res = await fetch(`/api/geocode-reverse?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const fullAddress = result.formatted_address;
          
          let name = "My Location";
          for (const comp of result.address_components) {
            if (comp.types.includes("sublocality") || comp.types.includes("neighborhood") || comp.types.includes("locality")) {
              name = comp.long_name;
              break;
            }
          }
          
          let pincode = "";
          for (const comp of result.address_components) {
            if (comp.types.includes("postal_code")) {
              pincode = comp.long_name;
              break;
            }
          }

          setResolvedAddress({
            name,
            fullAddress,
            pincode,
            landmark: "",
            lat,
            lng,
          });
          resolved = true;
        }
      }
    } catch (err) {
      console.warn("Google reverse geocoding failed", err);
    }

    // 2. Fallback to BigDataCloud (Free, No API Key, No CORS issues) if Google fails
    if (!resolved) {
      try {
        const fallbackRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (fallbackRes.ok) {
           const data = await fallbackRes.json();
           if (data && (data.locality || data.city || data.principalSubdivision)) {
              const name = data.locality || data.city || data.principalSubdivision || "My Location";
              const pincode = data.postcode || "";
              const fullAddressComponents = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
              // Remove duplicates just in case locality and city are same
              const uniqueAddress = Array.from(new Set(fullAddressComponents)).join(", ");
              const fullAddress = uniqueAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
              
              setResolvedAddress({ name, fullAddress, pincode, landmark: "", lat, lng });
              resolved = true;
           }
        }
      } catch (err) {
        console.warn("BigDataCloud fallback failed", err);
      }
    }

    // 3. Final Fallback (Raw Coordinates) if both fail
    if (!resolved) {
      setResolvedAddress({
        name: "My Location",
        fullAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        pincode: "",
        landmark: "",
        lat,
        lng,
      });
    }

    setIsResolvingAddress(false);
  }, []);

  const handleMapMove = useCallback((lat: number, lng: number) => {
    setMapCoords({ lat, lng });
    resolveAddress(lat, lng);
  }, [resolveAddress]);

  const handleClose = () => {
    setIsLocationModalOpen(false);
    setTimeout(() => { setView("menu"); setMapCoords(null); setResolvedAddress(null); }, 350);
  };

  /* ── GPS → Map ───────────────────────────────────────── */

  const handleDetectAndOpenMap = async () => {
    setIsDetecting(true);
    try {
      if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
      );
      const { latitude, longitude } = position.coords;
      setMapCoords({ lat: latitude, lng: longitude });
      await resolveAddress(latitude, longitude);
      setView("map");
    } catch (err: any) {
      toast.error(err.code === 1 ? "Location permission denied." : "Could not get GPS signal.");
    } finally {
      setIsDetecting(false);
    }
  };

  /* ── Save address (DB + context) ─────────────────────── */

  const handleSaveAddress = () => {
    if (!resolvedAddress) return;
    setIsSaving(true);
    try {
      setLocation(resolvedAddress.name, resolvedAddress.pincode, resolvedAddress.landmark || "", resolvedAddress.lat, resolvedAddress.lng);
      addSavedAddress({
        name: resolvedAddress.name,
        full_address: resolvedAddress.fullAddress,
        pincode: resolvedAddress.pincode,
        landmark: resolvedAddress.landmark || "",
        latitude: resolvedAddress.lat,
        longitude: resolvedAddress.lng,
      });
      toast.success(`📍 Location saved: ${resolvedAddress.name}`);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Pick saved address ──────────────────────────────── */

  const handlePickSaved = (saved: SavedAddress) => {
    setLocation(
      saved.name,
      saved.pincode || "",
      saved.landmark || "",
      saved.latitude != null ? parseFloat(String(saved.latitude)) : undefined,
      saved.longitude != null ? parseFloat(String(saved.longitude)) : undefined
    );
    toast.success(`📍 Switched to ${saved.name}`);
    handleClose();
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedAddress(id);
    toast.success("Address removed");
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <AnimatePresence>
      {isLocationModalOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className={[
                "pointer-events-auto w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden",
                view === "map" ? "h-[85dvh]" : "max-h-[88dvh]",
              ].join(" ")}
            >

              {/* ════════════ MENU VIEW ════════════ */}
              {view === "menu" && (
                <div className="flex flex-col overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Set Delivery Location</h2>
                      <p className="text-sm text-gray-500 mt-0.5">How would you like to set your location?</p>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* GPS + Search buttons */}
                  <div className="p-5 space-y-3">
                    <button
                      onClick={handleDetectAndOpenMap}
                      disabled={isDetecting}
                      className="w-full flex items-center gap-4 px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 hover:border-orange-400 hover:shadow-md rounded-2xl transition-all group disabled:opacity-60 active:scale-[0.98]"
                    >
                      <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                        {isDetecting ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Crosshair className="w-6 h-6 text-white" />}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-gray-800 text-[15px] group-hover:text-orange-700">
                          {isDetecting ? "Detecting your location…" : "Use GPS / Current Location"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Automatically detect where you are</p>
                      </div>
                      {!isDetecting && <Navigation className="w-5 h-5 text-orange-400 ml-auto shrink-0" />}
                    </button>

                    <div className="flex items-center gap-3 px-2">
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">OR</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <button
                      onClick={() => setView("search")}
                      className="w-full flex items-center gap-4 px-5 py-4 bg-gray-50 border-2 border-gray-200 hover:border-gray-400 hover:shadow-md rounded-2xl transition-all group active:scale-[0.98]"
                    >
                      <div className="w-11 h-11 bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
                        <Search className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-gray-800 text-[15px] group-hover:text-gray-900">Search by Name or Pincode</p>
                        <p className="text-xs text-gray-500 mt-0.5">Type an area, street or PIN code</p>
                      </div>
                      <Building2 className="w-5 h-5 text-gray-400 ml-auto shrink-0" />
                    </button>
                  </div>

                  {/* ── Saved Addresses Section ── */}
                  {savedAddresses.length > 0 && (
                    <div className="px-5 pb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                          Your Saved Addresses
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <motion.div
                            key={addr.id}
                            onClick={() => handlePickSaved(addr)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && handlePickSaved(addr)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-200 hover:border-orange-300 hover:bg-orange-50/60 rounded-2xl transition-all group text-left shadow-sm cursor-pointer"
                          >
                            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-orange-200 transition-colors">
                              <MapPin className="w-4 h-4 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-gray-800 leading-tight truncate group-hover:text-orange-700">
                                {addr.landmark ? addr.landmark : addr.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {addr.pincode && (
                                  <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full border border-orange-100 shrink-0">
                                    PIN {addr.pincode}
                                  </span>
                                )}
                                <p className="text-[11px] text-gray-400 truncate">
                                  {addr.landmark ? `${addr.name}, ` : ""}{(addr.full_address || "").split(",").slice(0, 2).join(",")}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteSaved(e, addr.id)}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════════════ SEARCH VIEW ════════════ */}
              {view === "search" && (
                <div className="flex flex-col overflow-hidden" style={{ maxHeight: "88dvh" }}>
                  <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
                    <button
                      onClick={() => { setView("menu"); setResolvedAddress(null); setMapCoords(null); }}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-xl font-black text-gray-900 tracking-tight">Search Location</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Enter area name, street or pincode</p>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 overflow-y-auto p-5 space-y-4">
                    <GooglePlacesSearch 
                      onSelect={(addr) => { 
                        setResolvedAddress(addr); 
                        if (addr.lat && addr.lng) {
                          setMapCoords({ lat: addr.lat, lng: addr.lng }); 
                          
                          // If selected address is a postcode or digits-only, reverse-geocode to get the actual city/locality name
                          const isPincodeOnly = addr.isPostcode || /^\d+$/.test(addr.name.trim()) || (addr.pincode && addr.name.trim() === addr.pincode.trim());
                          if (isPincodeOnly) {
                            resolveAddress(addr.lat, addr.lng);
                          }
                        }
                      }} 
                      autoFocus
                    />
                    {mapCoords && resolvedAddress && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
                        <div className="w-full h-40 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                          <MapPicker lat={mapCoords.lat} lng={mapCoords.lng} onLocationChange={(lat, lng) => { setMapCoords({ lat, lng }); resolveAddress(lat, lng); }} />
                        </div>
                        <div className="flex flex-col gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-gray-900 text-[15px] leading-tight">{resolvedAddress.name}</p>
                              <p className="text-[11px] text-gray-500 font-medium mt-1 mb-3 leading-snug line-clamp-2">{resolvedAddress.fullAddress}</p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-orange-700 font-bold w-16">PIN:</span>
                                  <input
                                    type="text"
                                    maxLength={6}
                                    value={resolvedAddress.pincode}
                                    onChange={(e) => setResolvedAddress({ ...resolvedAddress, pincode: e.target.value.replace(/\D/g, "") })}
                                    className="px-2 py-1.5 text-xs font-bold text-gray-900 bg-white border border-orange-200 rounded outline-none focus:border-orange-400 transition-colors flex-1"
                                    placeholder="Auto-fetched or enter PIN"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-orange-700 font-bold w-16">Landmark:</span>
                                  <input
                                    type="text"
                                    value={resolvedAddress.landmark || ""}
                                    onChange={(e) => setResolvedAddress({ ...resolvedAddress, landmark: e.target.value })}
                                    className="px-2 py-1.5 text-xs font-medium text-gray-900 bg-white border border-orange-200 rounded outline-none focus:border-orange-400 transition-colors flex-1"
                                    placeholder="E.g. Plot Name, Hostel Name"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleSaveAddress}
                          disabled={isSaving}
                          className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/25 disabled:opacity-40 transition-all active:scale-[0.98] text-[15px] flex items-center justify-center gap-2"
                        >
                          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</> : <><CheckCircle className="w-5 h-5" />Save This Address</>}
                        </button>
                      </motion.div>
                    )}
                    {!resolvedAddress && (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                        <Search className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm font-semibold">Start typing to search</p>
                        <p className="text-xs mt-1 opacity-70">Works with area names, streets &amp; PIN codes</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ════════════ MAP VIEW (GPS) ════════════ */}
              {view === "map" && (
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
                    <button onClick={() => setView("menu")} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-[17px] font-black text-gray-900 tracking-tight">Confirm Your Location</h2>
                      <p className="text-xs text-gray-500 font-medium">Tap map or drag pin to adjust</p>
                    </div>
                  </div>
                  <div className="flex-1 relative min-h-0">
                    {mapCoords && <MapPicker lat={mapCoords.lat} lng={mapCoords.lng} onLocationChange={handleMapMove} />}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-xs font-bold text-gray-600 pointer-events-none whitespace-nowrap">
                      📍 Tap anywhere or drag pin to adjust
                    </div>
                  </div>
                  <div className="shrink-0 bg-white border-t border-gray-100 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.08)]">
                    {isResolvingAddress ? (
                      <div className="flex items-center gap-3 py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-orange-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-500">Resolving address…</span>
                      </div>
                    ) : resolvedAddress ? (
                      <>
                        <div className="flex items-start gap-3 mb-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-gray-900 text-[16px] leading-tight">{resolvedAddress.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-1 mb-2 leading-snug line-clamp-2">{resolvedAddress.fullAddress}</p>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-orange-600 font-bold w-16">PIN:</span>
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={resolvedAddress.pincode}
                                  onChange={(e) => setResolvedAddress({ ...resolvedAddress, pincode: e.target.value.replace(/\D/g, "") })}
                                  className="px-2 py-1.5 text-xs font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded outline-none focus:border-orange-400 focus:bg-white transition-colors flex-1"
                                  placeholder="Auto-fetched or enter PIN"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-orange-600 font-bold w-16">Landmark:</span>
                                <input
                                  type="text"
                                  value={resolvedAddress.landmark || ""}
                                  onChange={(e) => setResolvedAddress({ ...resolvedAddress, landmark: e.target.value })}
                                  className="px-2 py-1.5 text-xs font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded outline-none focus:border-orange-400 focus:bg-white transition-colors flex-1"
                                  placeholder="E.g. Plot Name, Hostel Name"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleSaveAddress}
                          disabled={isSaving}
                          className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] disabled:opacity-40"
                        >
                          {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" />Saving…</> : <><CheckCircle className="w-5 h-5" />Save This Address</>}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">Tap the map to pick a location</p>
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
