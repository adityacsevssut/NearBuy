"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, Star, Clock, MapPin, ChevronDown,
  SlidersHorizontal, X, Utensils, Heart, Bell
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import BusinessRequestModal from "@/components/BusinessRequestModal";
import { useLocationContext } from "@/context/LocationContext";
import { useWishlist } from "@/context/WishlistContext";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const quickBites = [
  { label: "Biryani",         image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=200&h=200" },
  { label: "Roll",            image: "/roll.png" },
  { label: "Dosa",            image: "/dosa.png" },
  { label: "Chowmin",         image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&h=200" },
  { label: "Momo",            image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=200&h=200" },
  { label: "Pizza",           image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&h=200" },
  { label: "Burger",          image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&h=200" },
  { label: "Chicken Pokoda",  image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=200&h=200" },
  { label: "Vada",            image: "/vada.png" },
  { label: "Manchurrian",     image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=200" },
  { label: "More",            image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=200&h=200" },
];

const topCuisines = [
  { label: "Indian",       emoji: "🍛",  bg: "bg-orange-50",  border: "border-orange-100" },
  { label: "Chinese",      emoji: "🍜",  bg: "bg-red-50",     border: "border-red-100" },
  { label: "South Indian", emoji: "🫓",  bg: "bg-yellow-50",  border: "border-yellow-100" },
  { label: "Fast Food",    emoji: "🍔",  bg: "bg-pink-50",    border: "border-pink-100" },
  { label: "Desserts",     emoji: "🍨",  bg: "bg-purple-50",  border: "border-purple-100" },
  { label: "Beverages",   emoji: "🧃",  bg: "bg-green-50",   border: "border-green-100" },
];

/* ─── Dummy restaurants (shown when API returns nothing) ──────────────── */
const DUMMY_RESTAURANTS = [
  {
    id: "d1", name: "Campus Cafe", cuisine: "North Indian · Chinese",
    rating: "4.5", time: "20 min", minOrder: 80, deliveryRange: 5,
    offer: "50% off up to ₹80", badge: "Bestseller", badgeColor: "bg-orange-500",
    veg: false, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d2", name: "Biryani House", cuisine: "Biryani · Mughlai",
    rating: "4.6", time: "35 min", minOrder: 120, deliveryRange: 5,
    offer: "Free delivery on first order", badge: "Popular", badgeColor: "bg-red-500",
    veg: false, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d3", name: "Green Leaf", cuisine: "South Indian · Pure Veg",
    rating: "4.3", time: "25 min", minOrder: 60, deliveryRange: 5,
    offer: null, badge: "Veg Only", badgeColor: "bg-green-600",
    veg: true, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d4", name: "Pizza Planet", cuisine: "Pizza · Fast Food · Italian",
    rating: "4.4", time: "30 min", minOrder: 100, deliveryRange: 5,
    offer: "Buy 1 Get 1 on Tuesdays", badge: null, badgeColor: "",
    veg: false, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d5", name: "Burger Barn", cuisine: "Burgers · Wraps · Shakes",
    rating: "4.2", time: "20 min", minOrder: 80, deliveryRange: 5,
    offer: "20% off on orders above ₹200", badge: "New", badgeColor: "bg-blue-500",
    veg: false, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d6", name: "Dosa Corner", cuisine: "South Indian · Breakfast",
    rating: "4.7", time: "15 min", minOrder: 50, deliveryRange: 5,
    offer: null, badge: "Top Rated", badgeColor: "bg-yellow-500",
    veg: true, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d7", name: "Wok & Roll", cuisine: "Chinese · Thai · Noodles",
    rating: "4.1", time: "30 min", minOrder: 90, deliveryRange: 5,
    offer: "Flat ₹50 off", badge: null, badgeColor: "",
    veg: false, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d8", name: "Sharma Dhaba", cuisine: "Punjabi · Dal Makhani · Roti",
    rating: "4.8", time: "40 min", minOrder: 100, deliveryRange: 5,
    offer: "Free raita on orders above ₹250", badge: "Must Try", badgeColor: "bg-orange-600",
    veg: false, isOpen: false, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d9", name: "Sweet Cravings", cuisine: "Desserts · Ice Cream · Cakes",
    rating: "4.5", time: "25 min", minOrder: 70, deliveryRange: 5,
    offer: "10% off on all desserts", badge: null, badgeColor: "",
    veg: true, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&h=400",
  },
  {
    id: "d10", name: "Momo Mania", cuisine: "Momos · Tibetan · Snacks",
    rating: "4.3", time: "20 min", minOrder: 60, deliveryRange: 5,
    offer: "12 pcs for price of 8", badge: "Trending", badgeColor: "bg-purple-500",
    veg: false, isOpen: true, latitude: null, longitude: null,
    image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=600&h=400",
  },
];

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
      className={`flex-shrink-0 w-[148px] bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100 transition-all active:scale-[0.97] ${dim ? "opacity-60" : ""}`}
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
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <span className="text-white font-black text-[10px] uppercase bg-black/50 px-2 py-0.5 rounded-full">{closed?"Closed":"Out of Range"}</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="px-2.5 py-2">
        <p className="font-black text-[13px] text-gray-900 truncate leading-tight">{r.name}</p>
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
      className={`group bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-gray-100 transition-all duration-200 hover:shadow-[0_6px_24px_rgba(249,115,22,0.15)] hover:-translate-y-0.5 ${dim?"opacity-70":""}`}
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
          <div className="absolute inset-0 bg-white/30 flex items-center justify-center">
            <span className="text-red-600 font-black text-sm uppercase tracking-widest bg-white/90 px-3 py-1 rounded-lg shadow-sm">{closed?"Closed Now":"Out of Range"}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <p className="font-black text-[14px] text-gray-900 leading-tight flex-1 truncate">{r.name}</p>
          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shrink-0">
            <Star className="w-2.5 h-2.5 fill-white" />{r.rating||"4.0"}
          </span>
        </div>
        {/* Cuisine */}
        <p className="text-[11px] text-gray-400 font-medium truncate mb-2">{r.cuisine}</p>
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
  const [foodPref,    setFoodPref]    = useState<"all"|"veg"|"non-veg">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [reqModal,    setReqModal]    = useState(false);
  const [reqType,     setReqType]     = useState<"student"|"vendor">("vendor");

  const { locationName, pincode, latitude, longitude, setIsLocationModalOpen, activeCenter } = useLocationContext();
  const { restaurantWishlist, toggleRestaurant } = useWishlist();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);

  useEffect(() => { fetchRestaurants(); }, []);

  async function fetchRestaurants() {
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/public/vendors`);
      if (res.ok) setRestaurants(await res.json());
    } catch { /* silent */ } finally { setIsLoading(false); }
  }

  /* Use real data if loaded, otherwise show dummy restaurants for preview */
  const sourceList = !isLoading && restaurants.length === 0 ? DUMMY_RESTAURANTS : restaurants;

  /* filter */
  const filtered = sourceList.filter(r => {
    const matchVeg  = foodPref==="all"||(foodPref==="veg"?r.veg:!r.veg);
    const matchSrch = !searchQuery
      || r.name.toLowerCase().includes(searchQuery.toLowerCase())
      || r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());

    let matchCenter = true;
    if (activeCenter && r.latitude && r.longitude) {
      const vLat=r.latitude?parseFloat(r.latitude):null, vLon=r.longitude?parseFloat(r.longitude):null;
      const cLat=activeCenter.latitude?parseFloat(activeCenter.latitude):null, cLon=activeCenter.longitude?parseFloat(activeCenter.longitude):null;
      if (vLat!=null&&vLon!=null&&cLat!=null&&cLon!=null) {
        const d = getDistance(cLat,cLon,vLat,vLon);
        if (d!=null) matchCenter = d <= parseFloat(activeCenter.radius_km);
      }
    }
    return matchVeg && matchSrch && matchCenter;
  });

  const popular = filtered.slice(0, 8);
  const cp = { lat: latitude, lon: longitude, pin: pincode, wishlist: restaurantWishlist, toggle: toggleRestaurant };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-24 md:pb-6">

        {/* ══ STICKY TOP BAR (below orange navbar) ════════════════════════════ */}
        <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col gap-0">

            {/* ─────────────────────────────────────────────────────────────
                ROW 1 — Location (full width, bordered)
            ───────────────────────────────────────────────────────────── */}
            <div className="w-full pt-2.5 pb-2.5 border-b border-gray-100">
              <button
                suppressHydrationWarning
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-100 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50/40 active:scale-[0.99] transition-all"
              >
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                {/* Location name + chevron */}
                <div className="flex flex-col items-start leading-none flex-1 min-w-0 text-left">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Deliver to</span>
                  <span className="text-[13px] font-black text-gray-900 flex items-center gap-0.5 mt-0.5">
                    <span className="truncate max-w-[160px] sm:max-w-xs">{locationName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-orange-500 shrink-0 ml-0.5" />
                  </span>
                </div>
                {/* Pincode pushed to far right */}
                {pincode && (
                  <span className="ml-auto shrink-0 text-[11px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                    📍 {pincode}
                  </span>
                )}
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                ROW 2 — Search bar + Filter (full width)
            ───────────────────────────────────────────────────────────── */}
            <div className="w-full flex items-center gap-2.5 py-2.5">
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-400/30 focus-within:border focus-within:border-orange-300 transition-all">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search for restaurants or cuisines"
                  className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400 font-medium"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center shrink-0">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
                    showFilters || foodPref !== "all"
                      ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200"
                      : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filter</span>
                  {foodPref !== "all" && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />}
                </button>

                {/* Desktop dropdown */}
                {showFilters && (
                  <div className="hidden md:block absolute right-0 top-full mt-2 z-[80] w-52 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <p className="font-black text-sm text-gray-900">Dietary Preference</p>
                    </div>
                    <div className="p-2 space-y-1">
                      {(["all","veg","non-veg"] as const).map(p => {
                        const active = foodPref === p;
                        const label = p === "all" ? "View All" : p === "veg" ? "Pure Veg" : "Non-Veg Only";
                        const activeBg = p === "all" ? "bg-orange-500" : p === "veg" ? "bg-green-600" : "bg-red-600";
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
            {(["all","veg","non-veg"] as const).map(p => {
              const active = foodPref === p;
              const label = p === "all" ? "View All" : p === "veg" ? "Pure Veg" : "Non-Veg Only";
              const activeBg = p === "all" ? "bg-orange-500" : p === "veg" ? "bg-green-600" : "bg-red-600";
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
                  href={`/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex-shrink-0 flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-[62px] h-[62px] rounded-full overflow-hidden border-[2.5px] border-transparent group-hover:border-orange-400 bg-gray-100 shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={label} className="w-full h-full object-cover" />
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
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#ff6b00] via-[#ff8c00] to-[#ffa500] p-5 flex items-center justify-between shadow-lg shadow-orange-300/40 min-h-[110px]">
              {/* Decorative circles */}
              <div className="absolute w-40 h-40 rounded-full bg-white/10 -right-10 -top-10" />
              <div className="absolute w-28 h-28 rounded-full bg-white/10 -right-4 -bottom-8" />
              <div className="absolute w-20 h-20 rounded-full bg-white/15 right-16 top-2" />

              {/* Left content */}
              <div className="relative z-10">
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest mb-0.5">Limited Time Offer</p>
                <p className="text-white font-black text-3xl leading-none tracking-tight mb-0.5">
                  50% <span className="text-yellow-200">OFF</span>
                </p>
                <p className="text-white/90 text-xs font-semibold mb-3">ON YOUR FIRST ORDER</p>
                <button className="bg-white text-orange-600 font-black text-[11px] px-4 py-1.5 rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform uppercase tracking-wide">
                  ORDER NOW →
                </button>
              </div>

              {/* Right emoji */}
              <div className="relative z-10 text-5xl select-none drop-shadow-lg">🍱</div>
            </div>
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
              {topCuisines.map(({ label, emoji, bg, border }) => (
                <Link
                  key={label}
                  href={`/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border ${bg} ${border} hover:border-orange-300 transition-all text-[12px] font-bold text-gray-700 hover:text-orange-600 active:scale-95`}
                >
                  <span className="text-[15px] leading-none">{emoji}</span>
                  {label}
                </Link>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mx-4 flex flex-col items-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="font-bold text-gray-700 text-lg">No restaurants found</p>
                <p className="text-sm text-gray-400 mt-1">Try changing your filters or search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
                {filtered.map(r => <RestCard key={r.id} r={r} {...cp} />)}
              </div>
            )}
          </section>

        </div>
      </main>

      <Footer />
      <MobileBottomNav />
      <BusinessRequestModal isOpen={reqModal} onClose={() => setReqModal(false)} defaultType={reqType} />
    </div>
  );
}
