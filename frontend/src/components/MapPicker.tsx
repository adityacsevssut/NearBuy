"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapEventsHandler({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fix Leaflet map sizing issues in modals
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    
    return () => {
      clearTimeout(timer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [map]);

  useMapEvents({
    move() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    moveend() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const center = map.getCenter();
        const dist = Math.sqrt(Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lng, 2));
        // Only trigger location change if the map moved by a small threshold (~5 meters)
        // This prevents resize events (e.g. keyboard opening) from triggering infinite re-renders.
        if (dist > 0.00005) {
          onLocationChange(center.lat, center.lng);
        }
      }, 400);
    },
  });

  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const center = map.getCenter();
    const dist = Math.sqrt(
      Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lng, 2)
    );
    // Only recenter if the difference is significant (prevents jitter when panning)
    if (dist > 0.0005) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onLocationChange }: MapPickerProps) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        style={{ width: "100%", height: "100%", zIndex: 10 }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap lat={lat} lng={lng} />
        <MapEventsHandler lat={lat} lng={lng} onLocationChange={onLocationChange} />
      </MapContainer>

      {/* Fixed Center Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[20] pointer-events-none">
        <div style={{ position: "relative", width: "40px", height: "40px" }}>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40px", height: "40px",
            background: "rgba(249, 115, 22, 0.2)",
            borderRadius: "50%",
            animation: "pulse 1.8s ease-in-out infinite"
          }}></div>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px", height: "20px",
            background: "#f97316",
            border: "3px solid white",
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(249,115,22,0.6)"
          }}></div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
            50% { transform: translate(-50%,-50%) scale(1.6); opacity: 0.3; }
          }
        `}</style>
      </div>
    </div>
  );
}
