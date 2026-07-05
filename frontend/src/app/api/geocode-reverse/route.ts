import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode-reverse?lat=...&lng=...
 * Uses OpenStreetMap Nominatim (Free, Highly accurate street-level) 
 * or Geoapify Geocoding API (reverse) to get address details from coordinates.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") || "";
  const lng = searchParams.get("lng") || "";
  const apiKey = process.env.GEOAPIFY_API_KEY || "";

  if (!lat || !lng) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  try {
    // 1. Try Geoapify if API Key is present
    if (apiKey && apiKey !== "YOUR_GEOAPIFY_API_KEY_HERE") {
      const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lng);
      url.searchParams.set("apiKey", apiKey);

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const f = data.features[0];
        const results = [{
          formatted_address: f.properties.formatted,
          address_components: [
             { types: ["postal_code"], long_name: f.properties.postcode || "" },
             { types: ["sublocality", "neighborhood"], long_name: f.properties.suburb || f.properties.district || "" },
             { types: ["locality"], long_name: f.properties.city || f.properties.town || f.properties.village || "" }
          ],
          geometry: { location: { lat: f.properties.lat, lng: f.properties.lon } },
          name: f.properties.name || f.properties.suburb || f.properties.city || f.properties.street
        }];
        return NextResponse.json({ results }, { status: 200 });
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim (Free, highly detailed)
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    nominatimUrl.searchParams.set("lat", lat);
    nominatimUrl.searchParams.set("lon", lng);
    nominatimUrl.searchParams.set("format", "json");
    nominatimUrl.searchParams.set("addressdetails", "1");

    const nomRes = await fetch(nominatimUrl.toString(), { 
      cache: "no-store",
      headers: { "User-Agent": "ZyphCartApp/1.0 (Reverse Geocoding)" }
    });

    if (nomRes.ok) {
      const data = await nomRes.json();
      if (data && data.address) {
        const addr = data.address;
        
        // Find the most relevant specific area name
        const areaName = addr.neighbourhood || addr.suburb || addr.village || addr.town || addr.city_district || addr.city || "My Location";

        const results = [{
          formatted_address: data.display_name,
          address_components: [
            { types: ["postal_code"], long_name: addr.postcode || "" },
            { types: ["sublocality", "neighborhood"], long_name: addr.neighbourhood || addr.suburb || addr.city_district || "" },
            { types: ["locality"], long_name: addr.city || addr.town || addr.village || "" }
          ],
          geometry: { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
          name: areaName
        }];
        return NextResponse.json({ results }, { status: 200 });
      }
    }

    return NextResponse.json({ results: [] }, { status: 200 });
  } catch (err) {
    console.error("geocode-reverse error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
