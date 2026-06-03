import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/places-autocomplete?input=...
 * Proxies to Geoapify Autocomplete API (avoids CORS issues on client).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("input") || "";
  const apiKey = process.env.GEOAPIFY_API_KEY || "";

  if (!apiKey || apiKey === "YOUR_GEOAPIFY_API_KEY_HERE") {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  if (!input.trim()) {
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }

  try {
    const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
    url.searchParams.set("text", input);
    // restrict to India (optional but good based on existing code)
    url.searchParams.set("filter", "countrycode:in");
    url.searchParams.set("lang", "en");
    url.searchParams.set("limit", "5");
    url.searchParams.set("apiKey", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    
    // Check if limits exceeded
    if (res.status === 401 || res.status === 403 || res.status === 429) {
      return NextResponse.json({ error: "limit_reached" }, { status: res.status });
    }

    if (data.features) {
      // Format predictions to match what frontend expects
      const predictions = data.features.map((f: any, idx: number) => {
        const props = f.properties;
        let mainText = props.name || props.city || props.street || props.formatted || "Unknown Location";
        
        const secTextParts = [];
        if (props.street && props.name !== props.street) secTextParts.push(props.street);
        if (props.city && props.name !== props.city) secTextParts.push(props.city);
        if (props.state) secTextParts.push(props.state);
        if (props.postcode) secTextParts.push(props.postcode);

        return {
          place_id: `geoapify_${props.place_id || idx}`,
          description: props.formatted,
          structured_formatting: {
            main_text: mainText,
            secondary_text: secTextParts.join(", ")
          },
          isGeoapify: true,
          geoapifyData: f
        };
      });
      return NextResponse.json({ predictions }, { status: 200 });
    }

    return NextResponse.json({ predictions: [] }, { status: 200 });
  } catch (err) {
    console.error("places-autocomplete error:", err);
    return NextResponse.json({ predictions: [] }, { status: 200 });
  }
}
