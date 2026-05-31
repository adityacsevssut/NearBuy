"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search, Star, Clock, MapPin, ChevronDown,
  SlidersHorizontal, X, Utensils, Heart, Bell, GraduationCap, Share2, Navigation, Send
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import BusinessRequestModal from "@/components/BusinessRequestModal";
import { useLocationContext } from "@/context/LocationContext";
import { useWishlist } from "@/context/WishlistContext";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const quickBites = [
  { label: "Biryani",         image: "/biryani_gemini.png" },
  { label: "Roll",            image: "/roll.png" },
  { label: "Dosa",            image: "/dosa.png" },
  { label: "Chowmin",         image: "/chowmin_gemini.png" },
  { label: "Momo",            image: "/momo_gemini.png" },
  { label: "Pizza",           image: "/pizza_gemini.png" },
  { label: "Burger",          image: "/burger_gemini.png" },
  { label: "Chicken Pokoda",  image: "/chicken_pakoda.png" },
  { label: "Vada",            image: "/vada.png" },
  { label: "Manchurrian",     image: "/manchurian.png" },
  { label: "Bakery",          image: "/bakery.png" },
  { label: "Drinks",          image: "/drinks.png" },
  { label: "Chole Bhature",   image: "/chole_bhature.png" },
  { label: "Samosa",          image: "/samosa_gemini.png" },
  { label: "Others",          image: "/others_gemini.png" },
];

const topCuisines = [
  { label: "Indian",       image: "/indian_cuisine.png",  bg: "bg-orange-50",  border: "border-orange-100" },
  { label: "Chinese",      image: "/chinese_cuisine.png", bg: "bg-red-50",     border: "border-red-100" },
  { label: "South Indian", image: "/south_indian.png",    bg: "bg-yellow-50",  border: "border-yellow-100" },
  { label: "Fast Food",    image: "/fast_food.png",       bg: "bg-pink-50",    border: "border-pink-100" },
  { label: "Desserts",     image: "/desserts.png",        bg: "bg-purple-50",  border: "border-purple-100" },
  { label: "Beverages",    image: "/beverages.png",       bg: "bg-green-50",   border: "border-green-100" },
];

/* ─── Dummy restaurants removed ──────────────────────────────────────────── */

/* ─── Distance helpers ─────────────────────────────────────────────────────── */

function deg2rad(d: number) { return d * (Math.PI / 180); }

function getDistance(lat1: number|null, lon1: number|null, lat2: number|null, lon2: number|null) {
  if (lat1==null||lon1==null||lat2==null||lon2==null) return null;
  const R = 6371, dLat = deg2rad(lat2-lat1), dLon = deg2rad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fmtDist(lat: number|null, lon: number|null, pin: string, v: any) {
  const d = getDistance(lat, lon,
    v.latitude  ? parseFloat(v.latitude)  : null,
    v.longitude ? parseFloat(v.longitude) : null);
  if (d==null) return null;
  return d < 1 ? `${Math.round(d*1000)} m` : `${d.toFixed(1)} km`;
}

/* ─── Section header ───────────────────────────────────────────────────────── */
function SectionHeader({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3 px-4">
      <h2 className="text-[15px] font-black text-gray-900 tracking-tight">{title}</h2>
      {onViewAll && (
        <button onClick={onViewAll} className="text-[13px] font-bold text-orange-500 active:opacity-70">
          View All
        </button>
      )}
    </div>
  );
}

/* ─── Compact "Popular Near You" card ─────────────────────────────────────── */
function PopCard({ r, lat, lon, pin, wishlist, toggle }: any) {
  const dist = fmtDist(lat, lon, pin, r);
  const raw  = getDistance(lat, lon, r.latitude ? parseFloat(r.latitude) : null, r.longitude ? parseFloat(r.longitude) : null);
  const oor  = raw != null && raw > (r.deliveryRange ? parseFloat(r.deliveryRange) : 5);
  const closed = r.isOpen === false;
  const dim  = oor || closed;

  return (
    <Link
      href={`/vendor/${r.id}`}
      className={`group flex-shrink-0 w-[148px] bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 hover:border-orange-200/80 hover:bg-orange-50 transition-all active:scale-[0.97] ${dim ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <div className="relative h-[100px] bg-gray-100 overflow-hidden">
        {r.image
          ? <img src={r.image} alt={r.name} className={`w-full h-full object-cover ${dim ? "grayscale" : ""}`} />
          : <div className="w-full h-full bg-orange-50 flex items-center justify-center"><Utensils className="w-7 h-7 text-orange-200" /></div>
        }
        {/* Heart */}
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation();
            toggle({ id: r.id, name: r.name, type: r.cuisine, image_url: r.image, rating: r.rating, distance: dist||"0 km", isClosed: dim }); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-95 transition-transform"
        >
          <Heart className={`w-3.5 h-3.5 ${wishlist.some((w:any)=>w.id===r.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
        </button>
        {/* Badge */}
        {r.badge && <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">{r.badge}</span>}
        {/* Dim overlay */}
        {dim && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-t-2xl z-20">
            <span className="text-white font-black text-[10px] uppercase bg-black/60 px-2 py-0.5 rounded-full">{closed?"Closed":"Out of Range"}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="font-black text-[15px] text-gray-900 truncate leading-tight">{r.name}</p>
        {/* Rating row */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
            <Star className="w-2.5 h-2.5 fill-white" />{r.rating||"4.0"}
          </span>
          <span className="text-gray-400 text-[10px]">·</span>
          <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-orange-400" />{r.time||"30 min"}
          </span>
        </div>
        {/* Distance */}
        {dist && (
          <p className="text-[10px] text-orange-500 font-bold mt-0.5 flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />{dist}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ─── Full grid restaurant card ───────────────────────────────────────────── */
function RestCard({ r, lat, lon, pin, wishlist, toggle }: any) {
  const dist   = fmtDist(lat, lon, pin, r);
  const raw    = getDistance(lat, lon, r.latitude ? parseFloat(r.latitude) : null, r.longitude ? parseFloat(r.longitude) : null);
  const oor    = raw != null && raw > (r.deliveryRange ? parseFloat(r.deliveryRange) : 5);
  const closed = r.isOpen === false;
  const dim    = oor || closed;

  return (
    <Link
      href={`/vendor/${r.id}`}
      className={`group bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 hover:border-orange-200/80 hover:bg-orange-50 transition-all duration-200 hover:shadow-[0_6px_24px_rgba(249,115,22,0.18)] hover:-translate-y-0.5 ${dim?"opacity-70":""}`}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100 overflow-hidden">
        {r.image
          ? <img src={r.image} alt={r.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${dim?"grayscale":""}`} />
          : <div className="w-full h-full bg-orange-50 flex items-center justify-center"><Utensils className="w-10 h-10 text-orange-200" /></div>
        }
        {/* Heart */}
        <button
          onClick={e=>{ e.preventDefault(); e.stopPropagation();
            toggle({ id:r.id, name:r.name, type:r.cuisine, image_url:r.image, rating:r.rating, distance:dist||"0 km", isClosed:dim }); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-90 transition-transform"
        >
          <Heart className={`w-4 h-4 ${wishlist.some((w:any)=>w.id===r.id)?"fill-rose-500 text-rose-500":"text-gray-400"}`} />
        </button>
        {/* Share */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
              const res = await fetch(`${API}/api/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'restaurant', target_id: r.id })
              });
              if (res.ok) {
                const { id } = await res.json();
                const shareUrl = `${window.location.origin}/s/${id}`;
                if (navigator.share) {
                  await navigator.share({
                    title: 'NearBuy',
                    text: `Hii Get Your favourite Food From ${r.name}`,
                    url: shareUrl
                  });
                } else {
                  // Fallback for desktop/unsupported browsers
                  await navigator.clipboard.writeText(`Hii Get Your favourite Food From ${r.name} ${shareUrl}`);
                  alert("Link copied to clipboard!");
                }
              }
            } catch (err) {
              console.error("Error sharing:", err);
            }
          }}
          className="absolute top-2.5 right-12 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center active:scale-90 transition-transform"
        >
          <Send className="w-4 h-4 text-orange-500 fill-orange-500" />
        </button>
        {/* Badge */}
        {r.badge && <span className="absolute top-2.5 left-2.5 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase shadow-sm">{r.badge}</span>}
        {/* Veg dot */}
        {r.veg && (
          <span className="absolute bottom-2.5 left-2.5 w-4 h-4 rounded-sm border-2 border-green-600 bg-white flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
          </span>
        )}
        {/* Dim overlay */}
        {dim && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-t-2xl z-20">
            <span className="text-white font-black text-[12px] uppercase bg-black/60 px-3 py-1 rounded-full">{closed?"Closed":"Out of Range"}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <p className="font-black text-[16px] text-gray-900 leading-tight flex-1 truncate">{r.name}</p>
          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shrink-0">
            <Star className="w-2.5 h-2.5 fill-white" />{r.rating||"4.0"}
          </span>
        </div>
        {/* Cuisine */}
        <p className="text-[13px] text-gray-500 font-medium truncate mb-2">{r.cuisine}</p>
        {/* Stats */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5 text-orange-400" />{r.time||"30 min"}
          </span>
          <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            Min ₹{r.minOrder||0}
          </span>
          {dist && (
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{dist}
            </span>
          )}
        </div>
        {/* Offer */}
        {r.offer && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-100 text-[10px] font-bold text-orange-600 flex items-center gap-1">
            <span>🏷</span>{r.offer}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [foodPref,    setFoodPref]    = useState<"all"|"veg"|"non-veg"|"avail-all"|"avail-veg"|"avail-non-veg">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [reqModal,    setReqModal]    = useState(false);
  const [reqType,     setReqType]     = useState<"student"|"vendor">("vendor");

  const { locationName, landmark, pincode, latitude, longitude, setIsLocationModalOpen, activeCenter } = useLocationContext();
  const { restaurantWishlist, toggleRestaurant } = useWishlist();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(true);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => { fetchFoodPoster(); }, []);

  // Fetch when filters change
  useEffect(() => {
    setPage(1);
    setRestaurants([]);
    setHasMore(true);
    fetchRestaurants(1, true);
  }, [debouncedSearch, foodPref, latitude, longitude, pincode]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchRestaurants(next, false);
            return next;
          });
        }
      },
      { threshold: 1.0 }
    );
    if (lastElementRef.current) observer.observe(lastElementRef.current);
    observerRef.current = observer;
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isLoading, loadingMore, hasMore, lastElementRef.current]);

  async function fetchFoodPoster() {
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/homepage-poster?type=food`);
      if (res.ok) {
        const data = await res.json();
        if (data.poster?.image_url) setPosterUrl(data.poster.image_url);
      }
    } catch { /* silent — fallback to static image */ } finally {
      setPosterLoading(false);
    }
  }

  async function fetchRestaurants(pageNum = 1, isReset = false) {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);
    
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20"
      });
      if (debouncedSearch) query.append("search", debouncedSearch);
      if (foodPref !== "all") query.append("foodPref", foodPref);
      if (latitude && longitude) {
        query.append("lat", latitude.toString());
        query.append("lon", longitude.toString());
      } else if (pincode) {
        query.append("pincode", pincode);
      }

      const res = await fetch(`${API}/api/public/vendors?${query.toString()}`);
      if (res.ok) {
        const result = await res.json();
        const data = result.data || [];
        setHasMore(pageNum < (result.pagination?.totalPages || 1));
        setRestaurants(prev => isReset ? data : [...prev, ...data]);
      }
    } catch { /* silent */ } finally { 
      setIsLoading(false);
      setLoadingMore(false);
    }
  }

  /* filter */
  const filtered = restaurants;

  const popular = filtered.slice(0, 8);
  const cp = { lat: latitude, lon: longitude, pin: pincode, wishlist: restaurantWishlist, toggle: toggleRestaurant };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-8 md:pb-6">

        {/* ══ STICKY TOP BAR (below orange navbar) ════════════════════════════ */}
        <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col gap-0">

            {/* ─────────────────────────────────────────────────────────────
                ROW 1 — Location (full width, bordered)
            ───────────────────────────────────────────────────────────── */}
            <div className="w-full pt-3 pb-3 border-b border-gray-100">
              <button
                suppressHydrationWarning
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-md active:scale-[0.99] transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                  <MapPin className="w-4 h-4 text-orange-500" />
                </div>
                {/* Location name + chevron */}
                <div className="flex flex-col items-start leading-none flex-1 min-w-0 text-left">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Deliver to</span>
                  <span className="text-[14px] font-black text-gray-900 flex items-center gap-1 mt-1">
                    <span className="truncate max-w-[180px] sm:max-w-xs">{landmark ? `${landmark}, ${locationName}` : locationName}</span>
                    <ChevronDown className="w-4 h-4 text-orange-500 shrink-0" />
                  </span>
                </div>
                {/* Pincode pushed to far right */}
                {pincode && (
                  <span className="ml-auto shrink-0 text-[12px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    📍 {pincode}
                  </span>
                )}
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                ROW 2 — Search bar + Filter (full width)
            ───────────────────────────────────────────────────────────── */}
            <div className="w-full flex items-center gap-3 py-3">
              <div className="flex-1 flex items-center gap-2.5 bg-gray-50 rounded-2xl px-4 py-3.5 border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/15 focus-within:border-orange-400 transition-all duration-200">
                <Search className="w-5 h-5 text-gray-500 shrink-0" />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search for restaurants or cuisines"
                  className="flex-1 bg-transparent text-[14px] text-gray-900 outline-none placeholder:text-gray-500 font-semibold"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center shrink-0 hover:bg-gray-500 transition-colors">
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-[14px] font-black border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
                    showFilters || foodPref !== "all"
                      ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-white hover:border-orange-300 hover:text-orange-600"
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {foodPref !== "all" && <span className="w-2 h-2 rounded-full bg-white shadow-sm" />}
                </button>

                {/* Desktop dropdown */}
                {showFilters && (
                  <div className="hidden md:block absolute right-0 top-full mt-2 z-[80] w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <p className="font-black text-sm text-gray-900">Dietary Preference</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {(["all","veg","non-veg","avail-all","avail-veg","avail-non-veg"] as const).map(p => {
                        const active = foodPref === p;
                        const label = p === "all" ? "View All" : p === "veg" ? "Pure Veg" : p === "non-veg" ? "Non-Veg Only" : p === "avail-all" ? "Available (ALL)" : p === "avail-veg" ? "Available Veg" : "Available Non-Veg";
                        const activeBg = (p === "all" || p === "avail-all") ? "bg-orange-500" : (p === "veg" || p === "avail-veg") ? "bg-green-600" : "bg-red-600";
                        return (
                          <button key={p} onClick={() => { setFoodPref(p); setShowFilters(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                              active ? `${activeBg} text-white` : "text-gray-600 hover:bg-gray-50"
                            }`}>
                            <span>{label}</span>
                            {/* Pill toggle */}
                            <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                              active ? "bg-white/30" : "bg-gray-200"
                            }`}>
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
                                active ? "translate-x-4 bg-white" : "translate-x-0 bg-gray-400"
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Mobile filter drawer */}
        {showFilters && <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setShowFilters(false)} />}
        <div className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl flex flex-col md:hidden transition-transform duration-300 ${showFilters?"translate-x-0":"translate-x-full"}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <p className="font-black text-lg text-gray-900 flex items-center gap-2"><Utensils className="w-5 h-5 text-orange-500" />Filters</p>
            <button onClick={() => setShowFilters(false)} className="p-1.5 bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-600" /></button>
          </div>
          <div className="p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Dietary Preference</p>
            {(["all","veg","non-veg","avail-all","avail-veg","avail-non-veg"] as const).map(p => {
              const active = foodPref === p;
              const label = p === "all" ? "View All" : p === "veg" ? "Pure Veg" : p === "non-veg" ? "Non-Veg Only" : p === "avail-all" ? "Available (ALL)" : p === "avail-veg" ? "Available Veg" : "Available Non-Veg";
              const activeBg = (p === "all" || p === "avail-all") ? "bg-orange-500" : (p === "veg" || p === "avail-veg") ? "bg-green-600" : "bg-red-600";
              return (
                <button key={p} onClick={() => { setFoodPref(p); setShowFilters(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                    active ? `${activeBg} text-white shadow-md` : "text-gray-700 bg-gray-50 hover:bg-gray-100"
                  }`}>
                  <span>{label}</span>
                  {/* Pill toggle */}
                  <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                    active ? "bg-white/30" : "bg-gray-200"
                  }`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
                      active ? "translate-x-4 bg-white" : "translate-x-0 bg-gray-400"
                    }`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto">

          {/* ── 1. Category Quick-Bites ─────────────────────────────────────── */}
          <section className="pt-4 pb-2">
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-1">
              {quickBites.map(({ label, image }) => (
                <Link
                  key={label}
                  href={`/food/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-[62px] h-[62px] rounded-full overflow-hidden border-[2.5px] border-transparent group-hover:border-orange-400 bg-gray-100 shadow-sm group-hover:shadow-md transition-all duration-200 isolate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={label} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 text-center leading-tight group-hover:text-orange-500 transition-colors max-w-[60px]">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── 2. Promo Banner ─────────────────────────────────────────────── */}
          <section className="px-4 py-3">
            {posterLoading ? (
              <div className="w-full h-40 md:h-72 lg:h-80 bg-gray-100 rounded-2xl animate-pulse"></div>
            ) : (
              <div className="block relative w-full rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(249,115,22,0.15)] group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={posterUrl || "/1000242984.png"} 
                  alt="NearBuy Special Offer" 
                  className="w-full h-auto md:max-h-72 lg:max-h-80 object-contain group-hover:scale-[1.02] transition-transform duration-500 ease-out bg-orange-50"
                />
              </div>
            )}
          </section>

          {/* ── 3. Popular Near You ─────────────────────────────────────────── */}
          <section className="py-3">
            <SectionHeader
              title="Popular Near You"
              onViewAll={() => document.getElementById("all-section")?.scrollIntoView({ behavior: "smooth" })}
            />
            {isLoading ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
                {[1,2,3,4].map(i => <div key={i} className="flex-shrink-0 w-[148px] h-[168px] bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : popular.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
                {popular.map(r => <PopCard key={r.id} r={r} {...cp} />)}
              </div>
            ) : (
              <p className="px-4 text-sm text-gray-400 font-medium">No restaurants available yet.</p>
            )}
          </section>

          {/* ── 4. Top Cuisines ─────────────────────────────────────────────── */}
          <section className="py-3">
            <SectionHeader title="Top Cuisines" />
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
              {topCuisines.map(({ label, image, bg, border }) => (
                <div
                  key={label}
                  className={`group flex-shrink-0 flex items-center gap-2 pr-3.5 pl-1.5 py-1.5 rounded-full border ${bg} ${border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[12px] font-bold text-gray-700 hover:text-gray-900 cursor-default`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-110">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={label} className="w-full h-full object-cover" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* ── 5. All Restaurants ──────────────────────────────────────────── */}
          <section id="all-section" className="pt-3 pb-6">
            <div className="flex items-center justify-between mb-3 px-4 gap-3">
              <h2 className="text-[15px] font-black text-gray-900 tracking-tight min-w-0">
                <span className="truncate block">
                  {searchQuery ? `Results for "${searchQuery}"` : "All Restaurants"}
                </span>
                {!isLoading && <span className="text-[11px] font-semibold text-gray-400">({filtered.length})</span>}
              </h2>

              {/* Responsive Veg pill toggle */}
              <button
                onClick={() => setFoodPref(p => p === "veg" ? "all" : "veg")}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 shrink-0 transition-all duration-200 ${
                  foodPref === "veg"
                    ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-200"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-[13px] font-black whitespace-nowrap">Pure Veg</span>
                {/* Mini toggle track */}
                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                  foodPref === "veg" ? "bg-white/30" : "bg-gray-200"
                }`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${
                    foodPref === "veg" ? "translate-x-4 bg-white" : "translate-x-0 bg-gray-400"
                  }`} />
                </div>
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mx-4 flex flex-col items-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="font-bold text-gray-700 text-lg">No restaurants found</p>
                <p className="text-sm text-gray-400 mt-1">Try changing your filters or search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {filtered.map(r => <RestCard key={r.id} r={r} {...cp} />)}
              </div>
            )}
            
            {/* Infinite Scroll Loader */}
            {hasMore && filtered.length > 0 && (
              <div ref={lastElementRef} className="w-full h-16 flex items-center justify-center mt-6">
                {loadingMore && <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
            )}
          </section>

        </div>

        {/* ══ QUICK ACTION CARDS — below all restaurants, above footer ══════════ */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">

            {/* Card 1 — Register as Student */}
            <button
              onClick={() => { setReqType("student"); setReqModal(true); }}
              className="group bg-white rounded-2xl border border-gray-200 shadow-md
                p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
                hover:shadow-lg hover:-translate-y-0.5 hover:bg-orange-50 hover:border-orange-200/80
                transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between w-full">
                {/* Orange icon */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                {/* Arrow */}
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center
                  group-hover:bg-orange-100 group-hover:border-orange-300 transition-colors shrink-0">
                  <ChevronDown className="w-3.5 h-3.5 text-orange-400 -rotate-90 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
              <div className="w-full">
                <p className="font-black text-[15px] sm:text-[16px] text-gray-900 leading-tight">Register as Student</p>
              </div>
            </button>

            {/* Card 2 — Register as a Vendor */}
            <button
              onClick={() => { setReqType("vendor"); setReqModal(true); }}
              className="group bg-white rounded-2xl border border-gray-200 shadow-md
                p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
                hover:shadow-lg hover:-translate-y-0.5 hover:bg-orange-50 hover:border-orange-200/80
                transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between w-full">
                {/* Orange icon */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
                  <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                {/* Arrow */}
                <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center
                  group-hover:bg-orange-100 group-hover:border-orange-300 transition-colors shrink-0">
                  <ChevronDown className="w-3.5 h-3.5 text-orange-400 -rotate-90 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
              <div className="w-full">
                <p className="font-black text-[15px] sm:text-[16px] text-gray-900 leading-tight">Register as a Vendor</p>
              </div>
            </button>

          </div>
        </div>

      </main>

      <Footer />
      <MobileBottomNav />
      <BusinessRequestModal isOpen={reqModal} onClose={() => setReqModal(false)} defaultType={reqType} />
    </div>
  );
}
