"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Star,
  Clock,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  X,
  Utensils,
  Heart,
  Bell,
  GraduationCap,
  Share2,
  Navigation,
  Send,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import BusinessRequestModal from "@/components/BusinessRequestModal";
import { useLocationContext } from "@/context/LocationContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { dummyRestaurants } from "./dummyRestaurants";
import { dummyHotDealsUnder50, dummyHotDealsUnder100 } from "./dummyDeals";

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const quickBites = [
  { label: "Biryani", image: "/biryani_gemini.png" },
  { label: "Roll", image: "/roll.png" },
  { label: "Dosa", image: "/dosa.png" },
  { label: "Chowmin", image: "/chowmin_gemini.png" },
  { label: "Momo", image: "/momo_gemini.png" },
  { label: "Pizza", image: "/pizza_gemini.png" },
  { label: "Burger", image: "/burger_gemini.png" },
  { label: "Chicken Kabab", image: "/chicken_kabab.png" },
  { label: "Pasta", image: "/pasta.png" },
  { label: "Sandwich", image: "/sandwich.png" },
  { label: "Chicken Pokoda", image: "/chicken_pakoda.png" },
  { label: "Vada", image: "/vada.png" },
  { label: "Manchurrian", image: "/manchurian.png" },
  { label: "Bakery", image: "/bakery_cake_and_hotdog.png" },
  { label: "Drinks", image: "/drinks_blue_mojito.png" },
  { label: "Chole Bhature", image: "/chole_bhature.png" },
  { label: "Samosa", image: "/samosa_gemini.png" },
  { label: "Others", image: "/others_gemini.png" },
];

const topCuisines = [
  {
    label: "Indian",
    image: "/indian_cuisine.png",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    label: "Chinese",
    image: "/chinese_cuisine.png",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    label: "South Indian",
    image: "/south_indian.png",
    bg: "bg-yellow-50",
    border: "border-yellow-100",
  },
  {
    label: "Fast Food",
    image: "/fast_food.png",
    bg: "bg-pink-50",
    border: "border-pink-100",
  },
  {
    label: "Desserts",
    image: "/desserts.png",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  {
    label: "Beverages",
    image: "/beverages.png",
    bg: "bg-green-50",
    border: "border-green-100",
  },
];

/* ─── Dummy restaurants removed ──────────────────────────────────────────── */

/* ─── Distance helpers ─────────────────────────────────────────────────────── */

function deg2rad(d: number) {
  return d * (Math.PI / 180);
}

function getDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null,
) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371,
    dLat = deg2rad(lat2 - lat1),
    dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(lat: number | null, lon: number | null, pin: string, v: any) {
  const d = getDistance(
    lat,
    lon,
    v.latitude ? parseFloat(v.latitude) : null,
    v.longitude ? parseFloat(v.longitude) : null,
  );
  if (d == null) return null;
  return d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
}

function fmtTime(v: any) {
  if (v.osrmDuration != null) {
    const mins = Math.round(v.osrmDuration / 60);
    return `${mins} min`;
  }
  return v.time || "30 min";
}

/* ─── Section header ───────────────────────────────────────────────────────── */
function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3 px-4">
      <h2 className="text-[15px] font-black text-gray-900 dark:text-gray-100 tracking-tight">
        {title}
      </h2>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="text-[13px] font-bold text-orange-500 active:opacity-70"
        >
          View All
        </button>
      )}
    </div>
  );
}

/* ─── Compact "Popular Near You" card ─────────────────────────────────────── */
function PopCard({ r, lat, lon, pin, wishlist, toggle }: any) {
  const dist = fmtDist(lat, lon, pin, r);
  const raw = getDistance(
    lat,
    lon,
    r.latitude ? parseFloat(r.latitude) : null,
    r.longitude ? parseFloat(r.longitude) : null,
  );
  const oor =
    raw != null && raw > (r.deliveryRange ? parseFloat(r.deliveryRange) : 5);
  const closed = r.isOpen === false;
  const dim = oor || closed;

  return (
    <Link
      href={`/vendor/${r.id}`}
      className={`group flex-shrink-0 w-[148px] bg-white dark:bg-[#0D0D17] rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-[#2A2A3A] hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all active:scale-[0.97] ${dim ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <div className="relative h-[100px] bg-gray-100 dark:bg-[#1F1F2E] overflow-hidden">
        {r.image ? (
          <Image src={r.image} alt={r.name} fill sizes="(max-width: 768px) 50vw, 33vw" className={`object-cover`} />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <Utensils className="w-7 h-7 text-orange-200" />
          </div>
        )}
        {/* Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle({
              id: r.id,
              name: r.name,
              type: r.cuisine,
              image_url: r.image,
              rating: r.rating,
              distance: dist || "0 km",
              isClosed: dim,
            });
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-[#0D0D17]/90 shadow flex items-center justify-center active:scale-95 transition-transform"
        >
          <Heart
            className={`w-3.5 h-3.5 ${wishlist.some((w: any) => w.id === r.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`}
          />
        </button>
        {/* Badge removed from Homepage as requested */}
        {/* Dim overlay */}
        {dim && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-2xl z-20 pointer-events-none">
            <span className="text-red-500 bg-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm border border-red-100">
              {closed ? "Closed Now" : "Out of Range"}
            </span>
          </div>
        )}
      </div>
      {/* Info */}
      <div className="px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <p className="font-black text-[15px] text-gray-900 dark:text-gray-100 truncate leading-tight flex-1">
            {r.name}
          </p>
          {!closed ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-[8px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider shrink-0 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider shrink-0 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Offline
            </span>
          )}
        </div>
        {/* Rating row */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">
            <Star className="w-2.5 h-2.5 fill-white" />
            {r.rating || "4.0"}
          </span>
          <span className="text-gray-400 text-[10px]">·</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-orange-400" />
            {fmtTime(r)}
          </span>
        </div>
        {/* Distance */}
        {dist && (
          <p className="text-[10px] text-orange-500 font-bold mt-0.5 flex items-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {dist}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ─── Compact "Deal" card ──────────────────────────────────────────── */
function DealCard({ deal, onConfirmNeeded }: any) {
  const { items, addItem, updateQty, itemQty } = useCart();
  
  // Create a numeric ID from string for CartContext
  const numericId = parseInt(deal.id.toString().replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 1000);
  const isVeg = numericId % 2 === 0;

  const quantity = itemQty(numericId, deal.restaurantId);

  const discountPercent = Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100);

  const handlePlus = (e: any) => {
    e.preventDefault();
    if (quantity === 0) {
      const hasRestaurantItems = items.some((i: any) => i.restaurantId === deal.restaurantId);
      if (hasRestaurantItems) {
        onConfirmNeeded({
          ...deal,
          numericId,
          type: isVeg ? "veg" : "non-veg"
        });
      } else {
        addItem({
          id: numericId,
          name: deal.name,
          price: deal.discountPrice,
          image: deal.image,
          type: isVeg ? "veg" : "non-veg",
          restaurantId: deal.restaurantId,
          restaurantName: deal.restaurantName,
          section: "food"
        }, 1);
      }
    } else {
      updateQty(`${deal.restaurantId}__${numericId}`, quantity + 1);
    }
  };

  const handleMinus = (e: any) => {
    e.preventDefault();
    updateQty(`${deal.restaurantId}__${numericId}`, Math.max(0, quantity - 1));
  };

  return (
    <div className="group flex-shrink-0 w-[140px] flex flex-col gap-2 cursor-pointer">
      {/* Image container */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-[#1F1F2E]">
        {deal.image ? (
          <Image src={deal.image} alt={deal.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <Utensils className="w-7 h-7 text-orange-200" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Discount / Popular Pill */}
        <div className="absolute top-2 left-2 bg-white dark:bg-[#151522] text-orange-600 dark:text-orange-500 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border border-orange-100 dark:border-orange-500/20">
          {discountPercent}% OFF
        </div>

        {/* Floating Add to Cart Button */}
        <div className="absolute bottom-2 right-2">
          {quantity === 0 ? (
            <button 
              onClick={handlePlus}
              className="w-8 h-8 bg-white dark:bg-[#151522] text-orange-500 dark:text-orange-400 rounded-full flex items-center justify-center shadow-lg border border-orange-100 dark:border-orange-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <span className="text-2xl leading-none font-light mb-0.5">+</span>
            </button>
          ) : (
            <div className="flex items-center bg-white dark:bg-[#151522] rounded-lg shadow-lg border border-orange-200 dark:border-orange-500/30 overflow-hidden h-8">
              <button 
                onClick={handleMinus}
                className="w-7 h-full flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 active:bg-orange-100 dark:active:bg-orange-500/20 font-bold text-lg"
              >
                −
              </button>
              <span className="text-xs font-black text-gray-800 dark:text-gray-100 w-4 text-center">{quantity}</span>
              <button 
                onClick={handlePlus}
                className="w-7 h-full flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 active:bg-orange-100 dark:active:bg-orange-500/20 font-bold text-lg"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 px-1">
        {/* Name with Veg/NonVeg icon */}
        <div className="flex items-start gap-1.5">
          <div className={`mt-1 flex-shrink-0 w-3 h-3 border flex items-center justify-center rounded-sm ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
          </div>
          <p className="font-bold text-[14px] text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
            {deal.name}
          </p>
        </div>

        {/* by Restaurant */}
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
          by {deal.restaurantName}
        </p>

        {/* Rating and Time */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 mt-1">
          <span className="flex items-center gap-0.5 text-green-700 dark:text-green-400 font-bold">
            <Star className="w-3 h-3 fill-current" /> {deal.rating}
          </span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span>{20 + (parseInt(deal.id.split('-')[1] || '0') % 3) * 5}-{30 + (parseInt(deal.id.split('-')[1] || '0') % 3) * 5} mins</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[12px] text-gray-400 line-through font-medium">₹{deal.originalPrice}</span>
          <span className="font-black text-[12px] text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-100 dark:border-orange-500/20">₹{deal.discountPrice}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Full grid restaurant card ───────────────────────────────────────────── */
function RestCard({ r, lat, lon, pin, wishlist, toggle }: any) {
  const dist = fmtDist(lat, lon, pin, r);
  const raw = getDistance(
    lat,
    lon,
    r.latitude ? parseFloat(r.latitude) : null,
    r.longitude ? parseFloat(r.longitude) : null,
  );
  const oor =
    raw != null && raw > (r.deliveryRange ? parseFloat(r.deliveryRange) : 5);
  const closed = r.isOpen === false;
  const dim = oor || closed;

  return (
    <Link
      href={`/vendor/${r.id}`}
      className={`group bg-white dark:bg-[#0D0D17] rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-[#2A2A3A] hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all duration-200 hover:shadow-[0_6px_24px_rgba(249,115,22,0.18)] hover:-translate-y-0.5 ${dim ? "opacity-70" : ""}`}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100 dark:bg-[#1F1F2E] overflow-hidden">
        {r.image ? (
          <Image src={r.image} alt={r.name} fill sizes="(max-width: 768px) 100vw, 50vw" className={`object-cover transition-transform duration-500`} />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-orange-200" />
          </div>
        )}
        {/* Heart */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggle({
              id: r.id,
              name: r.name,
              type: r.cuisine,
              image_url: r.image,
              rating: r.rating,
              distance: dist || "0 km",
              isClosed: dim,
            });
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white dark:bg-[#0D0D17]/90 shadow flex items-center justify-center active:scale-90 transition-transform"
        >
          <Heart
            className={`w-4 h-4 ${wishlist.some((w: any) => w.id === r.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`}
          />
        </button>
        {/* Share */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
              const API = (
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
              ).replace(/\/+$/, "");
              const res = await fetch(`${API}/api/share`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "restaurant", target_id: r.id }),
              });
              if (res.ok) {
                const { id } = await res.json();
                const shareUrl = `${window.location.origin}/s/${id}`;
                if (navigator.share) {
                  await navigator.share({
                    title: "NearBuy",
                    text: `Hii Get Your favourite Food From ${r.name}`,
                    url: shareUrl,
                  });
                } else {
                  // Fallback for desktop/unsupported browsers
                  await navigator.clipboard.writeText(
                    `Hii Get Your favourite Food From ${r.name} ${shareUrl}`,
                  );
                  alert("Link copied to clipboard!");
                }
              }
            } catch (err) {
              console.error("Error sharing:", err);
            }
          }}
          className="absolute top-2.5 right-12 w-8 h-8 rounded-full bg-white dark:bg-[#0D0D17]/90 shadow flex items-center justify-center active:scale-90 transition-transform"
        >
          <Send className="w-4 h-4 text-orange-500 fill-orange-500" />
        </button>
        {/* Badge removed from Homepage as requested */}
        {/* Veg dot */}
        {r.veg && (
          <span className="absolute bottom-2.5 left-2.5 w-4 h-4 rounded-sm border-2 border-green-600 bg-white dark:bg-[#0D0D17] flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
          </span>
        )}
        {/* Dim overlay */}
        {dim && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-t-2xl z-20 pointer-events-none">
            <span className="text-red-500 bg-white font-black text-[12px] uppercase px-3 py-1 rounded-full shadow-sm border border-red-100">
              {closed ? "Closed Now" : "Out of Range"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <p className="font-black text-[16px] text-gray-900 dark:text-gray-100 leading-tight truncate">
              {r.name}
            </p>
            {!closed ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-[8px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider shrink-0 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-[8px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider shrink-0 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Offline
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shrink-0">
            <Star className="w-2.5 h-2.5 fill-white" />
            {r.rating || "4.0"}
          </span>
        </div>
        {/* Cuisine */}
        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium truncate mb-2">
          {r.cuisine}
        </p>
        {/* Stats */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] px-2 py-0.5 rounded-full">
            <Clock className="w-2.5 h-2.5 text-orange-400" />
            {fmtTime(r)}
          </span>
          <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] px-2 py-0.5 rounded-full">
            Min ₹{r.minOrder || 0}
          </span>
          {dist && (
            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {dist}
            </span>
          )}
        </div>
        {/* Offer */}
        {r.offer && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-[#2A2A3A] text-[10px] font-bold text-orange-600 flex items-center gap-1">
            <span>🏷</span>
            {r.offer}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */
let cachedState = {
  restaurants: [] as any[],
  page: 1,
  hasMore: true,
  searchQuery: "",
  foodPref: "all" as any,
  posters: [] as any[],
  posterLoaded: false
};

export default function HomePage() {
  useEffect(() => {
    document.title = "Home Food Essential";
  }, []);

  const [searchQuery, setSearchQuery] = useState(cachedState.searchQuery);
  const [foodPref, setFoodPref] = useState<
    "all" | "veg" | "non-veg" | "avail-all" | "avail-veg" | "avail-non-veg"
  >(cachedState.foodPref);

  const [showFilters, setShowFilters] = useState(false);
  const [reqModal, setReqModal] = useState(false);
  const [reqType, setReqType] = useState<"student" | "vendor">("vendor");

  const {
    locationName,
    landmark,
    pincode,
    latitude,
    longitude,
    setIsLocationModalOpen,
    activeCenter,
  } = useLocationContext();
  const { restaurantWishlist, toggleRestaurant } = useWishlist();

  const [restaurants, setRestaurants] = useState<any[]>(cachedState.restaurants);
  const [isLoading, setIsLoading] = useState(cachedState.restaurants.length === 0);
  const [page, setPage] = useState(cachedState.page);
  const [hasMore, setHasMore] = useState(cachedState.hasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);

  const [posters, setPosters] = useState<any[]>(cachedState.posters);
  const [posterLoading, setPosterLoading] = useState(!cachedState.posterLoaded);
  
  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Hot Deals State
  const [hotDealsUnder50, setHotDealsUnder50] = useState<any[]>([]);
  const [hotDealsUnder100, setHotDealsUnder100] = useState<any[]>([]);
  const [dealToConfirm, setDealToConfirm] = useState<any>(null);
  const { addItem, clearVendorCart } = useCart();

  const handleConfirmDeal = (action: "replace" | "add") => {
    if (!dealToConfirm) return;
    if (action === "replace") {
      clearVendorCart(dealToConfirm.restaurantId);
    }
    addItem({
      id: dealToConfirm.numericId,
      name: dealToConfirm.name,
      price: dealToConfirm.discountPrice,
      image: dealToConfirm.image,
      type: dealToConfirm.type,
      restaurantId: dealToConfirm.restaurantId,
      restaurantName: dealToConfirm.restaurantName,
      section: "food"
    }, 1);
    setDealToConfirm(null);
  };

  // Auto-scroll logic
  useEffect(() => {
    if (posters.length <= 1) return;
    const interval = setInterval(() => {
      if (isUserScrolling.current) return;
      setActivePosterIndex((prev) => {
        const next = (prev + 1) % posters.length;
        if (carouselRef.current) {
          carouselRef.current.scrollTo({
            left: next * carouselRef.current.clientWidth,
            behavior: "smooth"
          });
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [posters.length]);

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const index = Math.round(carouselRef.current.scrollLeft / carouselRef.current.clientWidth);
      if (index !== activePosterIndex) setActivePosterIndex(index);
      
      // Pause auto-scroll
      isUserScrolling.current = true;
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isUserScrolling.current = false;
      }, 4000);
    }
  };

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      cachedState.searchQuery = searchQuery;
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!cachedState.posterLoaded) {
      fetchFoodPoster();
    }
  }, []);

  async function fetchHotDeals() {
    try {
      const API = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      ).replace(/\/+$/, "");
      
      const query = new URLSearchParams();
      if (latitude && longitude) {
        query.append("lat", latitude.toString());
        query.append("lon", longitude.toString());
      } else if (pincode) {
        query.append("pincode", pincode);
      }

      const res = await fetch(`${API}/api/public/hot-deals?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Fallback to dummy data if backend has no items yet
        setHotDealsUnder50(data.under50?.length > 0 ? data.under50 : dummyHotDealsUnder50);
        setHotDealsUnder100(data.under100?.length > 0 ? data.under100 : dummyHotDealsUnder100);
      } else {
        setHotDealsUnder50(dummyHotDealsUnder50);
        setHotDealsUnder100(dummyHotDealsUnder100);
      }
    } catch (err) {
      console.error("Failed to fetch hot deals", err);
      setHotDealsUnder50(dummyHotDealsUnder50);
      setHotDealsUnder100(dummyHotDealsUnder100);
    }
  }

  // Fetch Hot Deals when location changes
  useEffect(() => {
    fetchHotDeals();
  }, [latitude, longitude, pincode]);

  // Fetch when filters change
  useEffect(() => {
    if (cachedState.restaurants.length > 0 &&
      cachedState.foodPref === foodPref &&
      cachedState.searchQuery === debouncedSearch) {
      // Used cached data initially
      setIsLoading(false);
      return;
    }

    cachedState.foodPref = foodPref;
    setPage(1);
    // DO NOT setRestaurants([]) so we don't flash blank if just changing filters slightly
    if (restaurants.length === 0) setIsLoading(true);
    setHasMore(true);
    fetchRestaurants(1, true);
  }, [debouncedSearch, foodPref, latitude, longitude, pincode]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => {
            const next = prev + 1;
            fetchRestaurants(next, false);
            return next;
          });
        }
      },
      { threshold: 1.0 },
    );
    if (lastElementRef.current) observer.observe(lastElementRef.current);
    observerRef.current = observer;
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isLoading, loadingMore, hasMore, lastElementRef.current]);

  async function fetchFoodPoster() {
    try {
      const API = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      ).replace(/\/+$/, "");
      const res = await fetch(`${API}/api/homepage-poster?type=food`);
      if (res.ok) {
        const data = await res.json();
        if (data.posters) {
          setPosters(data.posters);
          cachedState.posters = data.posters;
        }
      }
    } catch {
      /* silent — fallback to static image */
    } finally {
      setPosterLoading(false);
      cachedState.posterLoaded = true;
    }
  }

  async function fetchRestaurants(pageNum = 1, isReset = false) {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);

    try {
      const API = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      ).replace(/\/+$/, "");
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20",
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
        let data = result.data || [];

        const more = pageNum < (result.pagination?.totalPages || 1);
        setHasMore(more);
        cachedState.hasMore = more;
        cachedState.page = pageNum;

        setRestaurants((prev) => {
          const newArr = isReset ? [...data, ...dummyRestaurants] : [...prev, ...data];
          cachedState.restaurants = newArr;
          return newArr;
        });
      }
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }

  /* filter */
  const filtered = restaurants.filter((r: any) => {
    const raw = getDistance(
      latitude,
      longitude,
      r.latitude ? parseFloat(r.latitude) : null,
      r.longitude ? parseFloat(r.longitude) : null,
    );
    const isOor =
      raw != null && raw > (r.deliveryRange ? parseFloat(r.deliveryRange) : 5);
    return !isOor;
  });

  const popular = filtered.slice(0, 8);
  const cp = {
    lat: latitude,
    lon: longitude,
    pin: pincode,
    wishlist: restaurantWishlist,
    toggle: toggleRestaurant,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D0D17] flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-8 md:pb-6">
        {/* ══ STICKY TOP BAR (below orange navbar) ════════════════════════════ */}
        <div className="sticky top-16 z-40 bg-white dark:bg-[#0D0D17] border-b border-gray-100 dark:border-[#2A2A3A] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col gap-0">
            {/* ─────────────────────────────────────────────────────────────
 ROW 1 — Location (full width, bordered)
 ───────────────────────────────────────────────────────────── */}
            <div className="w-full pt-3 pb-3 border-b border-gray-100 dark:border-[#2A2A3A]">
              <button
                suppressHydrationWarning
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#151522] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-md active:scale-[0.99] transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0D0D17] shadow-sm flex items-center justify-center shrink-0 border border-gray-100 dark:border-[#2A2A3A]">
                  <MapPin className="w-4 h-4 text-orange-500" />
                </div>
                {/* Location name + chevron */}
                <div className="flex flex-col items-start leading-none flex-1 min-w-0 text-left mr-3 md:mr-6">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Deliver to
                  </span>
                  <span className="text-[14px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-1 mt-1">
                    <span className="truncate max-w-[120px] sm:max-w-[200px]">
                      {landmark ? `${landmark}, ${locationName}` : locationName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-orange-500 shrink-0" />
                  </span>
                </div>
                {/* Pincode pushed to far right */}
                {pincode && (
                  <span className="ml-auto shrink-0 text-[12px] font-black text-orange-600 bg-orange-50 dark:bg-[#0D0D17] border border-orange-200 dark:border-orange-500/50 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    📍 {pincode}
                  </span>
                )}
              </button>
            </div>

            {/* ─────────────────────────────────────────────────────────────
 ROW 2 — Search bar + Filter (full width)
 ───────────────────────────────────────────────────────────── */}
            <div className="w-full flex items-center gap-3 py-3">
              <div className="flex-1 flex items-center gap-2.5 bg-gray-50 dark:bg-[#151522] rounded-2xl px-4 py-3.5 border border-gray-200 dark:border-[#2A2A3A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:bg-white dark:focus-within:bg-[#0D0D17] dark:bg-[#0D0D17] focus-within:ring-4 focus-within:ring-orange-500/15 focus-within:border-orange-400 transition-all duration-200">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search for restaurants or cuisines"
                  className="flex-1 bg-transparent text-[14px] text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-500 dark:text-gray-400 font-semibold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center shrink-0 hover:bg-gray-50 dark:hover:bg-[#151522]0 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-[14px] font-black border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${showFilters || foodPref !== "all"
                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/30"
                    : "bg-gray-50 dark:bg-[#151522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2A2A3A] hover:bg-white dark:hover:bg-[#0D0D17] hover:border-orange-300 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:text-orange-600"
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {foodPref !== "all" && (
                    <span className="w-2 h-2 rounded-full bg-white dark:bg-[#0D0D17] shadow-sm" />
                  )}
                </button>

                {/* Desktop dropdown */}
                {showFilters && (
                  <div className="hidden md:block absolute right-0 top-full mt-2 z-[80] w-52 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-[#2A2A3A]">
                      <Utensils className="w-4 h-4 text-orange-500" />
                      <p className="font-black text-sm text-gray-900 dark:text-gray-100">
                        Dietary Preference
                      </p>
                    </div>
                    <div className="p-2 space-y-1">
                      {(
                        [
                          "all",
                          "veg",
                          "non-veg",
                          "avail-all",
                          "avail-veg",
                          "avail-non-veg",
                        ] as const
                      ).map((p) => {
                        const active = foodPref === p;
                        const label =
                          p === "all"
                            ? "View All"
                            : p === "veg"
                              ? "Pure Veg"
                              : p === "non-veg"
                                ? "Non-Veg Only"
                                : p === "avail-all"
                                  ? "Available (ALL)"
                                  : p === "avail-veg"
                                    ? "Available Veg"
                                    : "Available Non-Veg";
                        const activeBg =
                          p === "all" || p === "avail-all"
                            ? "bg-orange-500"
                            : p === "veg" || p === "avail-veg"
                              ? "bg-green-600"
                              : "bg-red-600";
                        return (
                          <button
                            key={p}
                            onClick={() => {
                              setFoodPref(p);
                              setShowFilters(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active
                              ? `${activeBg} text-white`
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151522]"
                              }`}
                          >
                            <span>{label}</span>
                            {/* Pill toggle */}
                            <div
                              className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${active
                                ? "bg-white/30 dark:bg-[#0D0D17]/50"
                                : "bg-gray-200"
                                }`}
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${active
                                  ? "translate-x-4 bg-white dark:bg-[#0D0D17]"
                                  : "translate-x-0 bg-gray-400"
                                  }`}
                              />
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
        {showFilters && (
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setShowFilters(false)}
          />
        )}
        <div
          className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white dark:bg-[#0D0D17] shadow-2xl flex flex-col md:hidden transition-transform duration-300 ${showFilters ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#2A2A3A]">
            <p className="font-black text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              Filters
            </p>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1.5 bg-gray-100 dark:bg-[#1F1F2E] rounded-full"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="p-5 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Dietary Preference
            </p>
            {(
              [
                "all",
                "veg",
                "non-veg",
                "avail-all",
                "avail-veg",
                "avail-non-veg",
              ] as const
            ).map((p) => {
              const active = foodPref === p;
              const label =
                p === "all"
                  ? "View All"
                  : p === "veg"
                    ? "Pure Veg"
                    : p === "non-veg"
                      ? "Non-Veg Only"
                      : p === "avail-all"
                        ? "Available (ALL)"
                        : p === "avail-veg"
                          ? "Available Veg"
                          : "Available Non-Veg";
              const activeBg =
                p === "all" || p === "avail-all"
                  ? "bg-orange-500"
                  : p === "veg" || p === "avail-veg"
                    ? "bg-green-600"
                    : "bg-red-600";
              return (
                <button
                  key={p}
                  onClick={() => {
                    setFoodPref(p);
                    setShowFilters(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active
                    ? `${activeBg} text-white shadow-md`
                    : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#151522] hover:bg-gray-100 dark:hover:bg-[#1F1F2E]"
                    }`}
                >
                  <span>{label}</span>
                  {/* Pill toggle */}
                  <div
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${active ? "bg-white/30 dark:bg-[#0D0D17]/50" : "bg-gray-200"
                      }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${active
                        ? "translate-x-4 bg-white dark:bg-[#0D0D17]"
                        : "translate-x-0 bg-gray-400"
                        }`}
                    />
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
                  <div className="relative w-[62px] h-[62px] rounded-full overflow-hidden border-[2.5px] border-transparent group-hover:border-orange-400 bg-gray-100 dark:bg-[#1F1F2E] shadow-sm group-hover:shadow-md transition-all duration-200 isolate">
                    <Image src={image} alt={label} fill sizes="62px" priority={true} className="object-cover transition-transform duration-200 dark:hidden" />
                    <Image src={image.replace('.png', '_dark.png')} alt={label} fill sizes="62px" priority={true} className="object-cover transition-transform duration-200 hidden dark:block" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight group-hover:text-orange-500 transition-colors max-w-[60px]">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── 2. Promo Banner ─────────────────────────────────────────────── */}
          <section className="w-full pt-2 pb-2 relative px-[2px] md:px-0">
            {posterLoading ? (
              <div className="w-full aspect-[2/1] md:aspect-[21/9] bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl md:rounded-3xl animate-pulse"></div>
            ) : posters.length > 0 ? (
              <div className="relative group overflow-hidden rounded-2xl md:rounded-3xl bg-transparent">
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  onTouchStart={handleCarouselScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide w-full"
                >
                  {posters.map((poster, index) => (
                    <div key={poster.id || index} className="flex-shrink-0 w-full aspect-[2/1] md:aspect-[21/9] snap-center block relative overflow-hidden bg-transparent">
                      <Image src={poster.image_url || "/1000242984.png"} alt="NearBuy Special Offer" fill priority={index === 0} className="object-cover transition-transform duration-500 ease-out dark:hidden" />
                      <Image src={poster.dark_image_url || poster.image_url || "/1000242984_dark.png"} alt="NearBuy Special Offer" fill priority={index === 0} className="hidden object-cover transition-transform duration-500 ease-out dark:block" />
                    </div>
                  ))}
                </div>
                {/* Dots indicator */}
                {posters.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {posters.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === activePosterIndex ? "bg-white scale-125 shadow-sm" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="block relative w-full aspect-[2/1] md:aspect-[21/9] rounded-2xl md:rounded-3xl overflow-hidden group bg-transparent">
                <Image src="/1000242984.png" alt="NearBuy Special Offer" fill priority={true} className="object-cover transition-transform duration-500 ease-out dark:hidden" />
                <Image src="/1000242984_dark.png" alt="NearBuy Special Offer" fill priority={true} className="hidden object-cover transition-transform duration-500 ease-out dark:block" />
              </div>
            )}
          </section>

          {/* ── 3. Popular Near You ─────────────────────────────────────────── */}
          <section className="py-3">
            <SectionHeader
              title="Popular Near You"
              onViewAll={() =>
                document
                  .getElementById("all-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />
            {isLoading ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[148px] h-[168px] bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : popular.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
                {popular.map((r) => (
                  <PopCard key={r.id} r={r} {...cp} />
                ))}
              </div>
            ) : (
              <p className="px-4 text-sm text-gray-400 font-medium">
                No restaurants available yet.
              </p>
            )}
          </section>

          {/* ── Hot Deals Under 50 ────────────────────────────────────────── */}
          {hotDealsUnder50.length > 0 && (
            <section className="py-3">
              <SectionHeader
                title="Hot Deals Under ₹50"
                onViewAll={() => {}}
              />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 pt-1">
                {hotDealsUnder50.map((deal) => (
                  <DealCard key={deal.id} deal={deal} wishlist={restaurantWishlist} toggle={toggleRestaurant} onConfirmNeeded={setDealToConfirm} />
                ))}
              </div>
            </section>
          )}

          {/* ── Hot Deals Under 100 ───────────────────────────────────────── */}
          {hotDealsUnder100.length > 0 && (
            <section className="py-3">
              <SectionHeader
                title="Hot Deals Under ₹100"
                onViewAll={() => {}}
              />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 pt-1">
                {hotDealsUnder100.map((deal) => (
                  <DealCard key={deal.id} deal={deal} wishlist={restaurantWishlist} toggle={toggleRestaurant} onConfirmNeeded={setDealToConfirm} />
                ))}
              </div>
            </section>
          )}

          {/* ── 4. Top Cuisines ─────────────────────────────────────────────── */}
          <section className="py-3">
            <SectionHeader title="Top Cuisines" />
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 pb-1">
              {topCuisines.map(({ label, image, bg, border }) => (
                <div
                  key={label}
                  className={`group flex-shrink-0 flex items-center gap-2 pr-3.5 pl-1.5 py-1.5 rounded-full border ${bg} dark:bg-[#151522] ${border} dark:border-[#2A2A3A] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-[12px] font-bold text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-default`}
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm shrink-0 transition-transform duration-300 ">
                    <Image src={image} alt={label} fill sizes="32px" priority={true} className="object-cover" />
                  </div>
                  {label}
                </div>
              ))}
            </div>
          </section>

          {/* ── 5. All Restaurants ──────────────────────────────────────────── */}
          <section id="all-section" className="pt-3 pb-6">
            <div className="flex items-center justify-between mb-3 px-4 gap-3">
              <h2 className="text-[15px] font-black text-gray-900 dark:text-gray-100 tracking-tight min-w-0">
                <span className="truncate block">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : "All Restaurants"}
                </span>
                {!isLoading && (
                  <span className="text-[11px] font-semibold text-gray-400">
                    ({filtered.length})
                  </span>
                )}
              </h2>

              {/* Responsive Veg pill toggle */}
              <button
                onClick={() =>
                  setFoodPref((p) => (p === "veg" ? "all" : "veg"))
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 shrink-0 transition-all duration-200 ${foodPref === "veg"
                  ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/30"
                  : "bg-gray-50 dark:bg-[#151522] border-gray-200 dark:border-[#2A2A3A] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1F1F2E]"
                  }`}
              >
                <span className="text-[13px] font-black whitespace-nowrap">
                  Pure Veg
                </span>
                {/* Mini toggle track */}
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${foodPref === "veg"
                    ? "bg-white dark:bg-[#0D0D17]/30"
                    : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200 ${foodPref === "veg"
                      ? "translate-x-4 bg-white dark:bg-[#0D0D17]"
                      : "translate-x-0 bg-gray-400"
                      }`}
                  />
                </div>
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mx-4 flex flex-col items-center py-20 bg-gray-50 dark:bg-[#151522] rounded-3xl border border-gray-100 dark:border-[#2A2A3A]">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-lg">
                  No restaurants found
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Try changing your filters or search
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {filtered.map((r) => (
                  <RestCard key={r.id} r={r} {...cp} />
                ))}
              </div>
            )}

            {/* Infinite Scroll Loader */}
            {hasMore && filtered.length > 0 && (
              <div
                ref={lastElementRef}
                className="w-full h-16 flex items-center justify-center mt-6"
              >
                {loadingMore && (
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ══ QUICK ACTION CARDS — below all restaurants, above footer ══════════ */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Card 1 — Register as Student */}
            <button
              onClick={() => {
                setReqType("student");
                setReqModal(true);
              }}
              className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-md
 p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]
 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between w-full">
                {/* Orange icon */}
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600"
                >
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D0D17]" />
                </div>
                {/* Arrow */}
                <div
                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-[#2A2A3A] flex items-center justify-center
 group-hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-orange-500 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
              <div className="w-full">
                <p className="font-black text-[15px] sm:text-[16px] text-gray-900 dark:text-gray-100 leading-tight">
                  Register as Student
                </p>
              </div>
            </button>

            {/* Card 2 — Register as a Vendor */}
            <button
              onClick={() => {
                setReqType("vendor");
                setReqModal(true);
              }}
              className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-md
 p-4 sm:p-5 flex flex-col justify-between gap-4 text-left w-full
 hover:shadow-lg hover:-translate-y-0.5 hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]
 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between w-full">
                {/* Orange icon */}
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600"
                >
                  <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-[#0D0D17]" />
                </div>
                {/* Arrow */}
                <div
                  className="w-7 h-7 rounded-full border border-gray-200 dark:border-[#2A2A3A] flex items-center justify-center
 group-hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] shrink-0"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-orange-500 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
              <div className="w-full">
                <p className="font-black text-[15px] sm:text-[16px] text-gray-900 dark:text-gray-100 leading-tight">
                  Register as a Vendor
                </p>
              </div>
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
      <BusinessRequestModal
        isOpen={reqModal}
        onClose={() => setReqModal(false)}
        defaultType={reqType}
      />

      {/* Confirmation Modal for Hot Deals */}
      {dealToConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151522] w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-8 md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Existing Items in Cart</h3>
            <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-6 font-medium leading-relaxed">
              You already have items from <span className="font-bold text-gray-800 dark:text-gray-200">{dealToConfirm.restaurantName}</span> in your cart. Do you want to replace them with this deal, or append this deal to your existing cart?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleConfirmDeal("add")}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md active:scale-[0.98]"
              >
                Append to Cart
              </button>
              <button
                onClick={() => handleConfirmDeal("replace")}
                className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98]"
              >
                Replace Cart Items
              </button>
              <button
                onClick={() => setDealToConfirm(null)}
                className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-bold py-2 transition-colors mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
