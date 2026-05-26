import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/places-autocomplete?input=...&sessiontoken=...
 * Proxies to Google Places Autocomplete API (avoids CORS issues on client).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input") || "";
  const sessiontoken = searchParams.get("sessiontoken") || "";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  if (!input.trim()) {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", input);
    url.searchParams.set("components", "country:in");
    url.searchParams.set("language", "en");
    url.searchParams.set("types", "geocode");
    url.searchParams.set("sessiontoken", sessiontoken);
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("places-autocomplete error:", err);
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }
}
