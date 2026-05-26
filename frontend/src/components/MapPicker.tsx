"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom pulsing marker icon styling for Orange Pin
const pulsingIcon = L.divIcon({
  className: "",
  html: `
    <div style="position: relative; width: 40px; height: 40px;">
      <div style="
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 40px; height: 40px;
        background: rgba(249, 115, 22, 0.2);
        border-radius: 50%;
        animation: pulse 1.8s ease-in-out infinite;
      "></div>
      <div style="
        position: absolute;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: 20px; height: 20px;
        background: #f97316;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(249,115,22,0.6);
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.8; }
        50% { transform: translate(-50%,-50%) scale(1.6); opacity: 0.3; }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface MapEventsProps {
  onMapClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onMapClick }: MapEventsProps) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
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
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ width: "100%", height: "100%" }}
      zoomControl={true}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap lat={lat} lng={lng} />
      <MapClickHandler onMapClick={onLocationChange} />
      <Marker
        position={[lat, lng]}
        icon={pulsingIcon}
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            onLocationChange(position.lat, position.lng);
          },
        }}
      />
    </MapContainer>
  );
}
