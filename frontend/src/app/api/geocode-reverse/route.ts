import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode-reverse?lat=...&lng=...
 * Proxies to Geoapify Geocoding API (reverse) to get address details from coordinates.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") || "";
  const lng = searchParams.get("lng") || "";
  const apiKey = process.env.GEOAPIFY_API_KEY || "";

  if (!apiKey || apiKey === "YOUR_GEOAPIFY_API_KEY_HERE") {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  if (!lat || !lng) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  try {
    const url = new URL("https://api.geoapify.com/v1/geocode/reverse");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("apiKey", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    
    // Format back to a generic result structure matching the old api if possible
    // The old api returned { results: [ { formatted_address, address_components, ... } ] }
    // Let's adapt geoapify's feature format to mimic this so existing frontend parsing won't break heavily,
    // or we can adjust frontend. The frontend uses `results[0].formatted_address` or similar.
    
    if (data.features && data.features.length > 0) {
      const f = data.features[0];
      const results = [{
        formatted_address: f.properties.formatted,
        address_components: [
           { types: ["postal_code"], long_name: f.properties.postcode || "" }
        ],
        geometry: { location: { lat: f.properties.lat, lng: f.properties.lon } },
        name: f.properties.name || f.properties.city || f.properties.street
      }];
      return NextResponse.json({ results }, { status: 200 });
    }

    return NextResponse.json({ results: [] }, { status: 200 });
  } catch (err) {
    console.error("geocode-reverse error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
