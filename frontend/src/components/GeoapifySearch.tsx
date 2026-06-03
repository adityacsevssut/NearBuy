"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ResolvedGeoapifyAddress {
  name: string;
  fullAddress: string;
  pincode: string;
  landmark?: string;
  lat: number;
  lng: number;
  isPostcode?: boolean;
}

interface GeoapifySearchProps {
  onSelect: (addr: ResolvedGeoapifyAddress) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function GeoapifySearch({
  onSelect,
  placeholder = "Search area, street or pincode…",
  autoFocus = false,
}: GeoapifySearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Generate a random session token on mount for Google Places billing grouping
  useEffect(() => {
    setSessionToken(Math.random().toString(36).substring(2) + Date.now().toString(36));
  }, []);

  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input.trim() || input.length < 2) {
        setPredictions([]);
        return;
      }
      setIsLoading(true);
      let geoapifySuccess = false;

      // 1. Try Geoapify Autocomplete
      try {
        const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(input)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.predictions && data.predictions.length > 0) {
            setPredictions(data.predictions);
            geoapifySuccess = true;
          } else if (data.predictions && data.predictions.length === 0 && res.status === 200) {
             // 0 results from Geoapify, we could still try photon or just accept 0.
          }
        }
      } catch (err) {
        console.warn("Geoapify autocomplete failed", err);
      }

      // 2. Fallback to Photon (OpenStreetMap)
      if (!geoapifySuccess) {
        try {
          const photonRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=5&lang=en&bbox=68.1,6.75,97.4,37.1`);
          if (photonRes.ok) {
            const data = await photonRes.json();
            if (data.features) {
              const mapped = data.features.map((f: any, idx: number) => {
                const props = f.properties;
                let mainText = props.name || props.city || props.street || "Unknown Location";
                
                // If mainText is purely a postcode or osm_value is postcode, make it more readable by adding area/city info
                const isPostcode = props.osm_value === "postcode" || /^\d+$/.test(mainText);
                if (isPostcode) {
                  const area = props.city || props.county || props.district;
                  if (area) {
                    mainText = `${area} (${props.name})`;
                  }
                }

                const secTextParts = [];
                if (props.street && props.name !== props.street) secTextParts.push(props.street);
                if (props.city && props.name !== props.city) secTextParts.push(props.city);
                if (props.state) secTextParts.push(props.state);
                if (props.postcode) secTextParts.push(props.postcode);
                
                return {
                  place_id: `photon_${idx}_${Date.now()}`,
                  description: `${mainText}, ${secTextParts.join(", ")}`.replace(/, $/, ""),
                  structured_formatting: {
                    main_text: mainText,
                    secondary_text: secTextParts.join(", ")
                  },
                  isPhoton: true,
                  isPhotonPostcode: isPostcode,
                  photonData: f
                };
              });
              setPredictions(mapped);
            }
          }
        } catch (err) {
          console.warn("Photon fallback failed", err);
          setPredictions([]);
        }
      }

      setIsLoading(false);
    },
    [sessionToken]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 350);
  };

  const handleSelectPrediction = async (p: any) => {
    setQuery(p.description);
    setPredictions([]);
    setIsLoading(true);

    // If it's a Photon result or Geoapify result, skip the Details API completely!
    if (p.isPhoton || p.isGeoapify) {
       const isGeo = p.isGeoapify;
       const data = isGeo ? p.geoapifyData : p.photonData;
       const props = data.properties;
       const coords = data.geometry.coordinates; // [lng, lat]
       
       const resolved: ResolvedGeoapifyAddress = {
          name: props.name || props.city || p.structured_formatting.main_text,
          fullAddress: p.description,
          pincode: props.postcode || "",
          landmark: "",
          lat: coords[1],
          lng: coords[0],
          isPostcode: isGeo ? (props.result_type === "postcode") : p.isPhotonPostcode
       };
       onSelect(resolved);
       setIsLoading(false);
       return;
    }

    try {
      // If we somehow get here, we fallback to Google Places details or Geoapify Details
      // But since we skip for Geoapify & Photon, this shouldn't run.
      // Keeping it just in case any old cache runs.
      const res = await fetch(`/api/places-details?place_id=${p.place_id}`);
      const data = await res.json();
      
      if (data.result) {
        const result = data.result;
        const lat = result.geometry?.location?.lat;
        const lng = result.geometry?.location?.lng;
        
        // Extract Pincode
        let pincode = "";
        const components = result.address_components || [];
        for (const comp of components) {
          if (comp.types.includes("postal_code")) {
            pincode = comp.long_name;
            break;
          }
        }

        const types = result.types || [];
        const isPostcode = types.includes("postal_code") || types.includes("postal_code_prefix");

        const resolved: ResolvedGeoapifyAddress = {
          name: result.name || p.description.split(",")[0],
          fullAddress: result.formatted_address || p.description,
          pincode,
          landmark: "",
          lat,
          lng,
          isPostcode,
        };
        
        onSelect(resolved);
      }
    } catch (err) {
      console.error("Failed to fetch place details", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {predictions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] overflow-hidden max-h-60 overflow-y-auto"
          >
            {predictions.map((p, i) => {
              const mainText = p.structured_formatting?.main_text || p.description;
              const secText = p.structured_formatting?.secondary_text || "";
              
              return (
                <li key={p.place_id || i}>
                  <button
                    type="button"
                    onClick={() => handleSelectPrediction(p)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-orange-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 leading-tight truncate">
                        {mainText}
                      </p>
                      {secText && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{secText}</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
