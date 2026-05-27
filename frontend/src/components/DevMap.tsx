"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapEventsHandler({
  onLocationChange,
}: {
  onLocationChange?: (lat: number, lon: number) => void;
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
      if (!onLocationChange) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        const center = map.getCenter();
        onLocationChange(center.lat, center.lng);
      }, 400);
    },
  });

  return null;
}

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    const center = map.getCenter();
    const dist = Math.sqrt(
      Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lon, 2)
    );
    if (dist > 0.0005) {
      map.flyTo([lat, lon], 14, { duration: 1.0 });
    }
  }, [lat, lon, map]);
  return null;
}

export default function DevMap({ 
  lat, 
  lon, 
  title,
  onLocationChange 
}: { 
  lat: number; 
  lon: number; 
  title?: string;
  onLocationChange?: (lat: number, lon: number) => void;
}) {
  return (
    <div className="relative w-full h-full">
      <MapContainer 
        center={[lat, lon]} 
        zoom={14} 
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 10 }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater lat={lat} lon={lon} />
        <MapEventsHandler onLocationChange={onLocationChange} />
      </MapContainer>
      
      {/* Fixed Center Pin (Blue) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[20] pointer-events-none">
        <div style={{ position: "relative", width: "40px", height: "40px" }}>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "40px", height: "40px",
            background: "rgba(59, 130, 246, 0.2)",
            borderRadius: "50%",
            animation: "pulse-blue 1.8s ease-in-out infinite"
          }}></div>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "20px", height: "20px",
            background: "#3b82f6",
            border: "3px solid white",
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.6)"
          }}></div>
        </div>
        <style>{`
          @keyframes pulse-blue {
            0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
            50% { transform: translate(-50%,-50%) scale(1.6); opacity: 0.3; }
          }
        `}</style>
      </div>

      {title && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[20] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-xs font-bold text-gray-700 pointer-events-none whitespace-nowrap max-w-[90%] truncate">
          {title}
        </div>
      )}
      
      {onLocationChange && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[20] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-[10px] font-bold text-gray-500 pointer-events-none whitespace-nowrap">
          📍 Drag map to adjust
        </div>
      )}
    </div>
  );
}
