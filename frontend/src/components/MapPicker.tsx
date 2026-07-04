"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

// ── Leaflet Helpers ─────────────────────────────────────────────────────────
function LeafletMapEventsHandler({
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
        if (dist > 0.0005) {
          onLocationChange(center.lat, center.lng);
        }
      }, 400);
    },
  });

  return null;
}

function LeafletRecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    const center = map.getCenter();
    const dist = Math.sqrt(Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lng, 2));
    if (dist > 0.0005) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

// ── Main Component ──────────────────────────────────────────────────────────
interface MapPickerProps {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onLocationChange }: MapPickerProps) {
  const [mapError, setMapError] = useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  const handleMapboxMoveEnd = (e: any) => {
    const viewState = e.viewState;
    const dist = Math.sqrt(Math.pow(viewState.latitude - lat, 2) + Math.pow(viewState.longitude - lng, 2));
    if (dist > 0.0005) {
      onLocationChange(viewState.latitude, viewState.longitude);
    }
  };

  const useLeafletFallback = !mapboxToken || mapError;

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-[#1F1F2E]">
      {useLeafletFallback ? (
        // ── Fallback: Leaflet + OpenStreetMap ────────────────────────────────
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
          <LeafletRecenterMap lat={lat} lng={lng} />
          <LeafletMapEventsHandler lat={lat} lng={lng} onLocationChange={onLocationChange} />
        </MapContainer>
      ) : (
        <Map
          mapboxAccessToken={mapboxToken || ""}
          initialViewState={{ longitude: lng, latitude: lat, zoom: 16 }}
          longitude={lng}
          latitude={lat}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onMoveEnd={handleMapboxMoveEnd}
          onError={(e: any) => {
            console.error("Mapbox error:", e);
            setMapError(true);
          }}
          style={{ width: "100%", height: "100%" }}
        />
      )}

      {/* Fixed Center Pin (overlaying the map) */}
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

