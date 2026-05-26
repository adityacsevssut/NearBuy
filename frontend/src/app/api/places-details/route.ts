import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/places-details?place_id=...&sessiontoken=...
 * Proxies to Google Place Details API to get coordinates + address_components.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const place_id = searchParams.get("place_id") || "";
  const sessiontoken = searchParams.get("sessiontoken") || "";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return NextResponse.json({ result: null }, { status: 200 });
  }

  if (!place_id.trim()) {
    return NextResponse.json({ result: null }, { status: 400 });
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", place_id);
    url.searchParams.set("fields", "geometry,formatted_address,address_components,name");
    url.searchParams.set("sessiontoken", sessiontoken);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("places-details error:", err);
    return NextResponse.json({ result: null }, { status: 500 });
  }
}
