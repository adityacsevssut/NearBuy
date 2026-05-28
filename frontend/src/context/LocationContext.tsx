"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SavedAddress {
  id: string;
  name: string;
  full_address: string | null;
  pincode: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

interface LocationContextType {
  locationName: string;
  pincode: string;
  landmark: string;
  latitude: number | null;
  longitude: number | null;
  setLocation: (name: string, pin: string, landmark?: string, lat?: number, lon?: number) => void;
  fetchExactLocation: () => Promise<void>; // kept for interface compat
  isFetchingLocation: boolean;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  activeCenter: any | null;
  // Saved addresses
  savedAddresses: SavedAddress[];
  addSavedAddress: (addr: Omit<SavedAddress, "id" | "created_at">) => Promise<void>;
  removeSavedAddress: (id: string) => Promise<void>;
  refreshSavedAddresses: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SAVED_ADDRESSES_LS = "nearbuy_saved_addresses";

function lsGetSavedAddresses(): SavedAddress[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_ADDRESSES_LS) || "[]");
  } catch {
    return [];
  }
}

function lsSetSavedAddresses(addresses: SavedAddress[]) {
  localStorage.setItem(SAVED_ADDRESSES_LS, JSON.stringify(addresses));
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationName, setLocationName] = useState("Select Location");
  const [pincode, setPincode] = useState("");
  const [landmark, setLandmark] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isFetchingLocation] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeCenter, setActiveCenter] = useState<any | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const { user, accessToken, isLoggedIn, updateUser } = useAuth();

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

  // ── Restore from localStorage on boot ──────────────────────────────────────
  useEffect(() => {
    const savedName = localStorage.getItem("nearbuy_locationName");
    const savedPin = localStorage.getItem("nearbuy_pincode");
    const savedLandmark = localStorage.getItem("nearbuy_landmark");
    const savedLat = localStorage.getItem("nearbuy_latitude");
    const savedLon = localStorage.getItem("nearbuy_longitude");
    if (savedName) setLocationName(savedName);
    if (savedPin) setPincode(savedPin);
    if (savedLandmark) setLandmark(savedLandmark);
    if (savedLat) setLatitude(parseFloat(savedLat));
    if (savedLon) setLongitude(parseFloat(savedLon));
    // Load saved addresses from localStorage (offline/pre-login cache)
    setSavedAddresses(lsGetSavedAddresses());
  }, []);

  // ── Sync DB location on login ───────────────────────────────────────────────
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.locationName || user.latitude) {
        const localTimestamp = localStorage.getItem("nearbuy_location_ts");
        const dbTimestamp = localStorage.getItem("nearbuy_location_db_ts");
        if (localTimestamp && dbTimestamp && localTimestamp > dbTimestamp) {
          localStorage.setItem("nearbuy_location_db_ts", new Date().toISOString());
          return;
        }
        const name = user.locationName || "Select Location";
        const pin = user.pincode || "";
        const lmk = user.landmark || "";
        const lat = user.latitude != null ? parseFloat(user.latitude.toString()) : null;
        const lon = user.longitude != null ? parseFloat(user.longitude.toString()) : null;
        setLocationName(name);
        setPincode(pin);
        setLandmark(lmk);
        setLatitude(lat);
        setLongitude(lon);
        localStorage.setItem("nearbuy_locationName", name);
        localStorage.setItem("nearbuy_pincode", pin);
        localStorage.setItem("nearbuy_landmark", lmk);
        localStorage.setItem("nearbuy_location_db_ts", new Date().toISOString());
        localStorage.setItem("nearbuy_location_ts", new Date().toISOString());
        if (lat !== null) localStorage.setItem("nearbuy_latitude", lat.toString());
        else localStorage.removeItem("nearbuy_latitude");
        if (lon !== null) localStorage.setItem("nearbuy_longitude", lon.toString());
        else localStorage.removeItem("nearbuy_longitude");
      }
    }
  }, [isLoggedIn, user]);

  // ── Fetch saved addresses from DB on login ──────────────────────────────────
  const refreshSavedAddresses = useCallback(async () => {
    if (!isLoggedIn || !accessToken) {
      setSavedAddresses(lsGetSavedAddresses());
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/auth/me/saved-addresses`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const addresses: SavedAddress[] = data.addresses || [];
        setSavedAddresses(addresses);
        lsSetSavedAddresses(addresses); // keep local cache in sync
      }
    } catch {
      // fall back to localStorage cache
      setSavedAddresses(lsGetSavedAddresses());
    }
  }, [isLoggedIn, accessToken, apiBase]);

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      refreshSavedAddresses();
    }
  }, [isLoggedIn, accessToken, refreshSavedAddresses]);

  // ── Active center resolution ────────────────────────────────────────────────
  useEffect(() => {
    if ((latitude === null || longitude === null) && !pincode) {
      setActiveCenter(null);
      return;
    }
    fetch(`${apiBase}/api/public/service-centers`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const centers = data.centers || [];
        let matchingCenter = null;
        if (latitude !== null && longitude !== null) {
          matchingCenter = centers.find((c: any) => {
            const dist = getDistance(latitude, longitude, parseFloat(c.latitude), parseFloat(c.longitude));
            return dist <= parseFloat(c.radius_km);
          });
        } else if (pincode) {
          matchingCenter = centers.find((c: any) => c.pincode === pincode);
        }
        setActiveCenter(matchingCenter || null);
      })
      .catch((err) => console.error("Failed to fetch service centers", err));
  }, [latitude, longitude, pincode, apiBase]);

  // ── Sync active location to backend ────────────────────────────────────────
  const syncLocationToBackend = async (name: string, pin: string, lmk?: string, lat?: number, lon?: number) => {
    if (!isLoggedIn || !accessToken) return;
    try {
      await fetch(`${apiBase}/api/auth/me/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ locationName: name, pincode: pin, landmark: lmk, latitude: lat, longitude: lon }),
      });
    } catch (err) {
      console.error("Failed to sync location to backend", err);
    }
  };

  const setLocation = (name: string, pin: string, lmk?: string, lat?: number, lon?: number) => {
    setLocationName(name);
    setPincode(pin);
    setLandmark(lmk || "");
    localStorage.setItem("nearbuy_locationName", name);
    localStorage.setItem("nearbuy_pincode", pin);
    localStorage.setItem("nearbuy_landmark", lmk || "");
    if (lat !== undefined && lat !== null) {
      setLatitude(lat);
      localStorage.setItem("nearbuy_latitude", lat.toString());
    } else {
      setLatitude(null);
      localStorage.removeItem("nearbuy_latitude");
    }
    if (lon !== undefined && lon !== null) {
      setLongitude(lon);
      localStorage.setItem("nearbuy_longitude", lon.toString());
    } else {
      setLongitude(null);
      localStorage.removeItem("nearbuy_longitude");
    }
    localStorage.setItem("nearbuy_location_ts", new Date().toISOString());
    if (isLoggedIn && updateUser) {
      updateUser({
        locationName: name,
        pincode: pin,
        landmark: lmk,
        latitude: lat,
        longitude: lon,
      });
    }
    syncLocationToBackend(name, pin, lmk, lat, lon);
  };

  // ── Add a saved address (DB + localStorage) ─────────────────────────────────
  const addSavedAddress = useCallback(
    async (addr: Omit<SavedAddress, "id" | "created_at">) => {
      // Optimistic local update
      const tempEntry: SavedAddress = {
        ...addr,
        id: `temp_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      const optimistic = [tempEntry, ...savedAddresses.filter(
        (a) => !(a.name === addr.name && (a.pincode || "") === (addr.pincode || "") && (a.landmark || "") === (addr.landmark || ""))
      )].slice(0, 10);
      setSavedAddresses(optimistic);
      lsSetSavedAddresses(optimistic);

      if (!isLoggedIn || !accessToken) return; // localStorage only for guests

      try {
        const res = await fetch(`${apiBase}/api/auth/me/saved-addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            name: addr.name,
            fullAddress: addr.full_address,
            pincode: addr.pincode,
            landmark: addr.landmark,
            latitude: addr.latitude,
            longitude: addr.longitude,
          }),
        });
        if (res.ok) {
          // Refresh the real list from DB to get the correct UUID
          await refreshSavedAddresses();
        }
      } catch {
        // keep local optimistic state
      }
    },
    [isLoggedIn, accessToken, apiBase, savedAddresses, refreshSavedAddresses]
  );

  // ── Remove a saved address (DB + localStorage) ──────────────────────────────
  const removeSavedAddress = useCallback(
    async (id: string) => {
      // Optimistic remove
      const updated = savedAddresses.filter((a) => a.id !== id);
      setSavedAddresses(updated);
      lsSetSavedAddresses(updated);

      if (!isLoggedIn || !accessToken || id.startsWith("temp_")) return;

      try {
        await fetch(`${apiBase}/api/auth/me/saved-addresses/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // local state already updated
      }
    },
    [isLoggedIn, accessToken, apiBase, savedAddresses]
  );

  // kept for interface compat
  const fetchExactLocation = async () => {};

  return (
    <LocationContext.Provider
      value={{
        locationName,
        pincode,
        landmark,
        latitude,
        longitude,
        setLocation,
        fetchExactLocation,
        isFetchingLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        activeCenter,
        savedAddresses,
        addSavedAddress,
        removeSavedAddress,
        refreshSavedAddresses,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocationContext must be used within a LocationProvider");
  }
  return context;
}
