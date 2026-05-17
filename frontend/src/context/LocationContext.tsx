"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface LocationContextType {
  locationName: string;
  pincode: string;
  setLocation: (name: string, pin: string, lat?: number, lon?: number) => void;
  // Kept for compatibility but no longer used internally (map handles GPS now)
  fetchExactLocation: () => Promise<void>;
  isFetchingLocation: boolean;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationName, setLocationName] = useState("Select Location");
  const [pincode, setPincode] = useState("");
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const { accessToken, isLoggedIn } = useAuth();

  // Restore saved location from localStorage on app boot
  useEffect(() => {
    const savedName = localStorage.getItem("nearbuy_locationName");
    const savedPin = localStorage.getItem("nearbuy_pincode");
    if (savedName) setLocationName(savedName);
    if (savedPin) setPincode(savedPin);
  }, []);

  const syncLocationToBackend = async (
    name: string,
    pin: string,
    lat?: number,
    lon?: number
  ) => {
    if (!isLoggedIn || !accessToken) return;
    try {
      const apiBase = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      ).replace(/\/+$/, "");
      await fetch(`${apiBase}/api/auth/me/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          locationName: name,
          pincode: pin,
          latitude: lat,
          longitude: lon,
        }),
      });
    } catch (err) {
      console.error("Failed to sync location to backend", err);
    }
  };

  const setLocation = (name: string, pin: string, lat?: number, lon?: number) => {
    setLocationName(name);
    setPincode(pin);
    localStorage.setItem("nearbuy_locationName", name);
    localStorage.setItem("nearbuy_pincode", pin);
    syncLocationToBackend(name, pin, lat, lon);
  };

  // No-op kept for interface compatibility; GPS is now handled inside LocationModal/MapPicker
  const fetchExactLocation = async () => {};

  return (
    <LocationContext.Provider
      value={{
        locationName,
        pincode,
        setLocation,
        fetchExactLocation,
        isFetchingLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
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
