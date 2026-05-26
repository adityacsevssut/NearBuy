import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/geocode-reverse?lat=...&lng=...
 * Proxies to Google Geocoding API (reverse) to get address details from coordinates.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat") || "";
  const lng = searchParams.get("lng") || "";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  if (!lat || !lng) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/geocode/json"
    );
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("language", "en");
    url.searchParams.set("result_type", "sublocality|locality|postal_code");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("geocode-reverse error:", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
