"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Map from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

function LeafletMapEventsHandler({
  onLocationChange,
}: {
  onLocationChange?: (lat: number, lon: number) => void;
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

function LeafletMapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    const center = map.getCenter();
    const dist = Math.sqrt(Math.pow(center.lat - lat, 2) + Math.pow(center.lng - lon, 2));
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
  const [mapError, setMapError] = useState(false);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

  const handleMapboxMoveEnd = (e: any) => {
    if (!onLocationChange) return;
    const viewState = e.viewState;
    onLocationChange(viewState.latitude, viewState.longitude);
  };

  const useLeafletFallback = !mapboxToken || mapError;

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-[#1F1F2E] rounded-xl overflow-hidden">
      {useLeafletFallback ? (
        <MapContainer
          center={[lat, lon]}
          zoom={14}
          style={{ height: "100%", width: "100%", zIndex: 10 }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LeafletMapUpdater lat={lat} lon={lon} />
          <LeafletMapEventsHandler onLocationChange={onLocationChange} />
        </MapContainer>
      ) : (
        <Map
          mapboxAccessToken={mapboxToken || ""}
          initialViewState={{ longitude: lon, latitude: lat, zoom: 14 }}
          longitude={lon}
          latitude={lat}
          onMoveEnd={handleMapboxMoveEnd}
          mapStyle="mapbox://styles/mapbox/light-v11"
          onError={(e: any) => {
            console.error("Mapbox error:", e);
            setMapError(true);
          }}
          style={{ width: "100%", height: "100%" }}
        />
      )}

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
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[20] bg-white dark:bg-[#0D0D17]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 dark:border-[#2A2A3A] text-xs font-bold text-gray-700 dark:text-gray-300 pointer-events-none whitespace-nowrap max-w-[90%] truncate">
          {title}
        </div>
      )}

      {onLocationChange && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[20] bg-white dark:bg-[#0D0D17]/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 dark:border-[#2A2A3A] text-[10px] font-bold text-gray-500 dark:text-gray-400 pointer-events-none whitespace-nowrap">
          📍 Drag map to adjust
        </div>
      )}
    </div>
  );
}
