"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icons in Next.js build
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 14, { duration: 1.5 });
  }, [lat, lon, map]);
  return null;
}

export default function DevMap({ lat, lon, title }: { lat: number; lon: number; title: string }) {
  return (
    <MapContainer 
      center={[lat, lon]} 
      zoom={14} 
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem", zIndex: 10 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[lat, lon]} icon={defaultIcon}>
        <Popup>
          <strong>{title}</strong>
        </Popup>
      </Marker>
      <MapUpdater lat={lat} lon={lon} />
    </MapContainer>
  );
}
