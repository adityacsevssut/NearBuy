"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface LocationContextType {
  locationName: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  setLocation: (name: string, pin: string, lat?: number, lon?: number) => void;
  // Kept for compatibility but no longer used internally (map handles GPS now)
  fetchExactLocation: () => Promise<void>;
  isFetchingLocation: boolean;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  activeCenter: any | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

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

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationName, setLocationName] = useState("Select Location");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeCenter, setActiveCenter] = useState<any | null>(null);
  const { user, accessToken, isLoggedIn } = useAuth();

  // Restore saved location from localStorage on app boot
  useEffect(() => {
    const savedName = localStorage.getItem("nearbuy_locationName");
    const savedPin = localStorage.getItem("nearbuy_pincode");
    const savedLat = localStorage.getItem("nearbuy_latitude");
    const savedLon = localStorage.getItem("nearbuy_longitude");
    if (savedName) setLocationName(savedName);
    if (savedPin) setPincode(savedPin);
    if (savedLat) setLatitude(parseFloat(savedLat));
    if (savedLon) setLongitude(parseFloat(savedLon));
  }, []);

  // Sync DB-stored user location details into context state on login
  useEffect(() => {
    if (isLoggedIn && user) {
      if (user.locationName || user.latitude) {
        const name = user.locationName || "Select Location";
        const pin = user.pincode || "";
        const lat = user.latitude !== undefined && user.latitude !== null ? parseFloat(user.latitude.toString()) : null;
        const lon = user.longitude !== undefined && user.longitude !== null ? parseFloat(user.longitude.toString()) : null;

        setLocationName(name);
        setPincode(pin);
        setLatitude(lat);
        setLongitude(lon);

        localStorage.setItem("nearbuy_locationName", name);
        localStorage.setItem("nearbuy_pincode", pin);
        if (lat !== null) {
          localStorage.setItem("nearbuy_latitude", lat.toString());
        } else {
          localStorage.removeItem("nearbuy_latitude");
        }
        if (lon !== null) {
          localStorage.setItem("nearbuy_longitude", lon.toString());
        } else {
          localStorage.removeItem("nearbuy_longitude");
        }
      }
    }
  }, [isLoggedIn, user]);

  // Fetch active centers and resolve the active center based on user coordinates
  useEffect(() => {
    if (latitude === null || longitude === null) {
      setActiveCenter(null);
      return;
    }

    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    fetch(`${apiBase}/api/public/service-centers`)
      .then(res => res.json())
      .then(data => {
        const centers = data.centers || [];
        const matchingCenter = centers.find((c: any) => {
          const dist = getDistance(latitude, longitude, parseFloat(c.latitude), parseFloat(c.longitude));
          return dist <= parseFloat(c.radius_km);
        });
        setActiveCenter(matchingCenter || null);
      })
      .catch(err => {
        console.error("Failed to fetch service centers for context", err);
      });
  }, [latitude, longitude]);

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
    syncLocationToBackend(name, pin, lat, lon);
  };

  // No-op kept for interface compatibility; GPS is now handled inside LocationModal/MapPicker
  const fetchExactLocation = async () => {};

  return (
    <LocationContext.Provider
      value={{
        locationName,
        pincode,
        latitude,
        longitude,
        setLocation,
        fetchExactLocation,
        isFetchingLocation,
        isLocationModalOpen,
        setIsLocationModalOpen,
        activeCenter,
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
