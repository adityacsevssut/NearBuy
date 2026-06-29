"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
  Package,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import BusinessRequestModal from "@/components/BusinessRequestModal";
import { useLocationContext } from "@/context/LocationContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";


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
  { label: "Chicken", image: "/chicken_gemini.png" },
  { label: "Paneer", image: "/paneer_gemini.png" },
  { label: "Mutton", image: "/mutton_gemini.png" },
  { label: "Rice", image: "/rice_gemini.png" },
  { label: "Roti", image: "/roti_gemini.png" },
  { label: "Naan", image: "/naan_gemini.png" },
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
      <h2 className={`text-[17px] font-black tracking-tight drop-shadow-sm ${title.includes('Hot Deals') || title.includes('Popular')
        ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500 dark:from-orange-400 dark:to-red-400'
        : 'text-gray-900 dark:text-gray-100'
        }`}>
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
      className={`group flex-shrink-0 w-[148px] h-[168px] relative bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-[#2A2A3A] hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-[0.97] ${dim ? "opacity-60" : ""}`}
    >
      {/* Background Image */}
      {r.image ? (
        <Image src={r.image} alt={r.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover z-0" />
      ) : (
        <div className="w-full h-full bg-orange-50 flex items-center justify-center z-0">
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
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white dark:bg-[#0D0D17]/90 shadow flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <Heart
          className={`w-3.5 h-3.5 ${wishlist.some((w: any) => w.id === r.id) ? "fill-rose-500 text-rose-500" : "text-gray-400"}`}
        />
      </button>

      {/* Dim overlay */}
      {dim && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40 pointer-events-none">
          <span className="text-red-500 bg-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm border border-red-100">
            {closed ? "Closed Now" : "Out of Range"}
          </span>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-[65%] bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none z-10" />

      {/* Content Container (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full p-2.5 flex flex-col justify-end z-20">
        {/* Name and Open/Offline Badge */}
        <div className="flex items-start justify-between gap-1 w-full mb-0.5">
          <p className="font-bold text-[13px] text-white leading-tight line-clamp-1 drop-shadow-sm flex-1">
            {r.name}
          </p>
          {!closed ? (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-[7px] font-bold text-green-300 uppercase tracking-wider shrink-0 shadow-sm backdrop-blur-sm mt-0.5">
              <span className="w-1 h-1 rounded-full bg-green-400 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-[7px] font-bold text-red-300 uppercase tracking-wider shrink-0 shadow-sm backdrop-blur-sm mt-0.5">
              <span className="w-1 h-1 rounded-full bg-red-400"></span>
              Offline
            </span>
          )}
        </div>

        {/* Rating, Time, Distance Row */}
        <div className="flex items-center gap-1.5 text-[9px] text-gray-200 drop-shadow-sm flex-wrap w-full">
          <span className="flex items-center gap-0.5 text-green-400 font-bold">
            <Star className="w-2.5 h-2.5 fill-current" /> {r.rating || "4.0"}
          </span>
          <span className="text-gray-400">•</span>
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-orange-400" />
            {fmtTime(r)}
          </span>
        </div>

        {/* Distance */}
        {dist && (
          <p className="text-[10px] text-orange-400 font-bold mt-1 flex items-center gap-0.5 drop-shadow-sm">
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
  const [numericId] = useState(() => parseInt(deal.id.toString().replace(/[^0-9]/g, '')) || Math.floor(Math.random() * 1000));

  // Determine if item is veg based on backend data (type, veg flag, or name)
  const isVeg = deal.type ? deal.type.toLowerCase() === 'veg' :
    (deal.veg === true || deal.veg === 'Yes' || deal.veg === 1 || deal.veg === '1' ||
      (deal.name && !deal.name.toLowerCase().includes('chicken') && !deal.name.toLowerCase().includes('egg') && !deal.name.toLowerCase().includes('mutton') && !deal.name.toLowerCase().includes('fish') && deal.veg !== false && deal.veg !== 'No'));

  const quantity = itemQty(numericId, deal.restaurantId);
  const discountPercent = Math.round(((deal.originalPrice - deal.discountPrice) / deal.originalPrice) * 100);
  const closed = deal.isOpen === false;

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
    <div className={`group flex-shrink-0 w-[140px] h-[200px] relative rounded-2xl overflow-hidden shadow-sm bg-gray-100 dark:bg-[#1F1F2E] cursor-pointer border border-gray-200 dark:border-[#2A2A3A] ${closed ? "opacity-60" : ""}`}>
      {/* Background Image */}
      {deal.image ? (
        <Image src={deal.image} alt={deal.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover z-0" />
      ) : (
        <div className="w-full h-full bg-orange-50 flex items-center justify-center z-0">
          <Utensils className="w-7 h-7 text-orange-200" />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-[65%] bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none z-10" />

      {/* Discount Pill (Top Left) */}
      <div className="absolute top-2 left-2 bg-white dark:bg-[#151522] text-orange-600 dark:text-orange-500 text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm border border-orange-100 dark:border-orange-500/20 z-20 uppercase">
        {discountPercent}% OFF
      </div>

      {/* Closed Overlay */}
      {closed && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-40 pointer-events-none">
          <span className="text-red-500 bg-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm border border-red-100">
            Closed Now
          </span>
        </div>
      )}

      {/* Add Button (Top Right) */}
      {!closed && (
        <div className="absolute top-2 right-2 z-30">
          {quantity === 0 ? (
            <button
              onClick={handlePlus}
              className="w-7 h-7 bg-white dark:bg-[#151522] text-orange-500 dark:text-orange-400 rounded-full flex items-center justify-center shadow-lg border border-orange-100 dark:border-orange-500/30 active:scale-95 transition-all"
            >
              <span className="text-xl leading-none font-light mb-0.5">+</span>
            </button>
          ) : (
            <div className="flex items-center bg-white dark:bg-[#151522] rounded-full shadow-lg border border-orange-200 dark:border-orange-500/30 overflow-hidden h-7">
              <button
                onClick={handleMinus}
                className="w-6 h-full flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-50 font-bold text-sm"
              >
                −
              </button>
              <span className="text-[10px] font-black text-gray-800 dark:text-gray-100 w-3 text-center">{quantity}</span>
              <button
                onClick={handlePlus}
                className="w-6 h-full flex items-center justify-center text-orange-600 dark:text-orange-400 hover:bg-orange-50 font-bold text-sm"
              >
                +
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content Container (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full p-2 flex flex-col justify-end z-20">
        {/* Name with Veg/NonVeg icon inline */}
        <div className="mb-0.5 w-full">
          <p className="font-bold text-[12px] text-white leading-tight line-clamp-2 drop-shadow-sm">
            <span className={`inline-flex align-middle mr-1 w-2.5 h-2.5 border items-center justify-center rounded-sm relative -top-[1px] ${isVeg ? 'border-green-500 bg-black/30' : 'border-red-500 bg-black/30'}`}>
              <span className={`w-1 h-1 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            {deal.name}
          </p>
        </div>

        {/* by Restaurant */}
        <p className="text-[9px] text-gray-300 font-medium truncate drop-shadow-sm">
          by {deal.restaurantName}
        </p>

        {/* Rating and Time */}
        <div className="flex items-center gap-1 text-[9px] text-gray-200 mt-0.5 drop-shadow-sm">
          <span className="flex items-center gap-0.5 text-green-400 font-bold">
            <Star className="w-2.5 h-2.5 fill-current" /> {deal.rating}
          </span>
          <span className="text-gray-400">•</span>
          <span>{20 + (parseInt(deal.id.split('-')[1] || '0') % 3) * 5}-{30 + (parseInt(deal.id.split('-')[1] || '0') % 3) * 5} mins</span>
        </div>

        {/* Bottom Row: Price */}
        <div className="mt-0.5 flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <span className="font-black text-[13px] text-white drop-shadow-md">₹{deal.discountPrice}</span>
            <span className="text-[9px] text-gray-400 line-through font-medium">₹{deal.originalPrice}</span>
          </div>
          {deal.originalPrice - deal.discountPrice > 0 && (
            <span className="text-[9px] font-black text-green-400 drop-shadow-sm uppercase tracking-wider">
              {discountPercent}% OFF
            </span>
          )}
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
      className={`group block w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 dark:border-[#2A2A3A] hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:-translate-y-1 ${dim ? "opacity-70" : ""}`}
    >
      <div className="relative w-full h-[260px] bg-gray-100 dark:bg-[#1F1F2E]">
        {/* Image */}
        {r.image ? (
          <Image src={r.image} alt={r.name} fill sizes="(max-width: 768px) 100vw, 50vw" className={`object-cover`} />
        ) : (
          <div className="w-full h-full bg-orange-50 flex items-center justify-center">
            <Utensils className="w-10 h-10 text-orange-200" />
          </div>
        )}

        {/* Gradient Overlay for Text */}
        <div className="absolute bottom-0 left-0 w-full h-[60%] bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />

        {/* Top Left Best Seller Tag */}
        {(r.isBestSeller || (r.rating && parseFloat(r.rating) >= 4.0)) && (
          <div className="absolute top-3 left-3 bg-white dark:bg-[#151522] text-orange-600 dark:text-orange-500 text-[10px] font-black px-2 py-0.5 rounded shadow-sm border border-orange-100 dark:border-orange-500/20 z-20 uppercase">
            Best Seller
          </div>
        )}

        {/* Top Right Heart */}
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md shadow flex items-center justify-center active:scale-90 transition-transform z-20"
        >
          <Heart
            className={`w-4 h-4 ${wishlist.some((w: any) => w.id === r.id) ? "fill-rose-500 text-rose-500" : "text-white"}`}
          />
        </button>

        {/* Top Right Share */}
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
          className="absolute top-3 right-14 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md shadow flex items-center justify-center active:scale-90 transition-transform z-20"
        >
          <Send className="w-4 h-4 text-white fill-white" />
        </button>

        {/* Dim overlay for Closed/OOR */}
        {dim && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 pointer-events-none">
            <span className="text-red-500 bg-white font-black text-[12px] uppercase px-3 py-1 rounded-full shadow-sm border border-red-100">
              {closed ? "Closed Now" : "Out of Range"}
            </span>
          </div>
        )}

        {/* Info Content Container */}
        <div className="absolute bottom-0 left-0 w-full px-2 pb-1.5 pt-4 flex flex-col justify-end z-20">
          {/* Row 1: Name and Rating */}
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {r.veg && (
                <span className="w-3 h-3 rounded-sm border-2 border-green-500 bg-black/20 flex items-center justify-center shrink-0">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                </span>
              )}
              <h3 className="font-black text-[17px] text-white leading-tight truncate drop-shadow-sm">
                {r.name}
              </h3>
            </div>
            <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0 border border-green-500">
              <Star className="w-2.5 h-2.5 fill-white" />
              {r.rating || "4.0"}
            </span>
          </div>

          {/* Row 2: Cuisine */}
          <p className="text-[11px] text-gray-200 font-medium truncate drop-shadow-sm mb-0.5">
            {r.cuisine}
          </p>

          {/* Row 3: Stats & Open Badge */}
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-center flex-wrap gap-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-white bg-black/40 border border-white/10 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                <Clock className="w-2.5 h-2.5 text-orange-400" />
                {fmtTime(r)}
              </span>
              <span className="inline-flex items-center text-[9px] font-semibold text-white bg-black/40 border border-white/10 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                Min ₹{r.minOrder || 0}
              </span>
              {dist && (
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-400 bg-orange-900/40 border border-orange-500/30 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-2.5 h-2.5" />
                  {dist}
                </span>
              )}
            </div>
            {!closed ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-400/30 text-[8px] font-bold text-green-300 uppercase tracking-wider shrink-0 backdrop-blur-sm">
                <span className="w-1 h-1 rounded-full bg-green-400 animate-[pulse_1.5s_ease-in-out_infinite]"></span>
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-400/30 text-[8px] font-bold text-red-300 uppercase tracking-wider shrink-0 backdrop-blur-sm">
                <span className="w-1 h-1 rounded-full bg-red-400"></span>
                Offline
              </span>
            )}
          </div>

          {/* Offer */}
          {r.offer && (
            <div className="mt-1.5 pt-1.5 border-t border-white/20 border-dashed text-[9px] font-bold text-orange-400 flex items-center gap-1 drop-shadow-sm">
              <span>🏷</span>
              <span className="truncate">{r.offer}</span>
            </div>
          )}
        </div>
      </div>

      {/* Matched Items */}
      {r.matched_items && r.matched_items.length > 0 && (
        <div className="bg-white dark:bg-[#151522] border-t border-gray-100 dark:border-[#2A2A3A] p-2.5 flex flex-col gap-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Available items matching search</p>
          <div className="flex flex-col gap-1.5">
            {r.matched_items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-2 bg-gray-50 dark:bg-[#0D0D17] rounded-lg p-1.5 border border-gray-100 dark:border-[#2A2A3A]">
                {item.image ? (
                  <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 relative bg-gray-200 dark:bg-[#1F1F2E]">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-md shrink-0 bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <Utensils className="w-3.5 h-3.5 text-orange-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                  <p className="text-[10px] font-black text-orange-500">₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

/* ─── Skeleton Loaders ──────────────────────────────────────────────────────── */
function PopCardSkeleton() {
  return (
    <div className="group flex-shrink-0 w-[148px] h-[168px] relative bg-gray-200 dark:bg-[#1F1F2E] rounded-2xl overflow-hidden shadow-sm animate-pulse border border-gray-100 dark:border-[#2A2A3A]">
      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-300 dark:bg-[#2A2A3A]" />
      <div className="absolute bottom-0 left-0 w-full p-2.5 flex flex-col justify-end">
        <div className="h-3 w-3/4 bg-gray-300 dark:bg-[#2A2A3A] rounded mb-2"></div>
        <div className="h-2 w-1/2 bg-gray-300 dark:bg-[#2A2A3A] rounded mb-1.5"></div>
        <div className="h-2 w-2/3 bg-gray-300 dark:bg-[#2A2A3A] rounded"></div>
      </div>
    </div>
  );
}

function DealCardSkeleton() {
  return (
    <div className="group flex-shrink-0 w-[140px] h-[200px] relative rounded-2xl overflow-hidden shadow-sm bg-gray-200 dark:bg-[#1F1F2E] border border-gray-100 dark:border-[#2A2A3A] animate-pulse">
      <div className="absolute top-2 left-2 w-10 h-4 bg-gray-300 dark:bg-[#2A2A3A] rounded" />
      <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gray-300 dark:bg-[#2A2A3A]" />
      <div className="absolute bottom-0 left-0 w-full p-2 flex flex-col justify-end">
        <div className="h-3 w-4/5 bg-gray-300 dark:bg-[#2A2A3A] rounded mb-2"></div>
        <div className="h-2 w-1/2 bg-gray-300 dark:bg-[#2A2A3A] rounded mb-2"></div>
        <div className="flex justify-between w-full">
          <div className="h-3 w-1/3 bg-gray-300 dark:bg-[#2A2A3A] rounded"></div>
          <div className="h-3 w-1/4 bg-gray-300 dark:bg-[#2A2A3A] rounded"></div>
        </div>
      </div>
    </div>
  );
}

function RestCardSkeleton() {
  return (
    <div className="w-full h-[260px] bg-gray-200 dark:bg-[#1F1F2E] rounded-2xl overflow-hidden shadow-md border border-gray-100 dark:border-[#2A2A3A] animate-pulse relative">
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-300 dark:bg-[#2A2A3A]" />
      <div className="absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-1/2 bg-gray-300 dark:bg-[#2A2A3A] rounded"></div>
          <div className="h-4 w-8 bg-gray-300 dark:bg-[#2A2A3A] rounded"></div>
        </div>
        <div className="h-3 w-1/3 bg-gray-300 dark:bg-[#2A2A3A] rounded mb-3"></div>
        <div className="flex gap-2">
          <div className="h-3 w-12 bg-gray-300 dark:bg-[#2A2A3A] rounded-full"></div>
          <div className="h-3 w-12 bg-gray-300 dark:bg-[#2A2A3A] rounded-full"></div>
          <div className="h-3 w-16 bg-gray-300 dark:bg-[#2A2A3A] rounded-full"></div>
        </div>
      </div>
    </div>
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
  posterLoaded: false,
  hotDealsUnder60: [] as any[],
  hotDealsUnder130: [] as any[],
  hotDealsLoaded: false
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
  const [isQuickBitesDrawerOpen, setIsQuickBitesDrawerOpen] = useState(false);


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
  const [popularLimit, setPopularLimit] = useState(10);
  const [isPopularLoading, setIsPopularLoading] = useState(false);
  const [deals60Limit, setDeals60Limit] = useState(10);
  const [isDeals60LoadingMore, setIsDeals60LoadingMore] = useState(false);
  const [deals130Limit, setDeals130Limit] = useState(10);
  const [isDeals130LoadingMore, setIsDeals130LoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef(0);

  const [posters, setPosters] = useState<any[]>(cachedState.posters);
  const [posterLoading, setPosterLoading] = useState(!cachedState.posterLoaded);

  const [activePosterIndex, setActivePosterIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  // Hot Deals State
  const [hotDealsUnder60, setHotDealsUnder60] = useState<any[]>(cachedState.hotDealsUnder60);
  const [hotDealsUnder130, setHotDealsUnder130] = useState<any[]>(cachedState.hotDealsUnder130);
  const [isHotDealsLoading, setIsHotDealsLoading] = useState(!cachedState.hotDealsLoaded);
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
        setHotDealsUnder60(data.under60 || []);
        setHotDealsUnder130(data.under130 || []);
        cachedState.hotDealsUnder60 = data.under60 || [];
        cachedState.hotDealsUnder130 = data.under130 || [];
        cachedState.hotDealsLoaded = true;
      } else {
        setHotDealsUnder60([]);
        setHotDealsUnder130([]);
      }
    } catch (err) {
      console.error("Failed to fetch hot deals", err);
      setHotDealsUnder60([]);
      setHotDealsUnder130([]);
    } finally {
      setIsHotDealsLoading(false);
    }
  }

  // Fetch Hot Deals when location changes
  useEffect(() => {
    if (!cachedState.hotDealsLoaded) {
      fetchHotDeals();
    }
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

  // Infinite Scroll Observer removed in favor of manual "Load More" button

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

  async function fetchRestaurants(pageNum = 1, isReset = false, searchTerm = debouncedSearch) {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);

    const requestId = ++requestRef.current;

    try {
      const API = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      ).replace(/\/+$/, "");
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: "10",
      });
      if (searchTerm) query.append("search", searchTerm);
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

        if (requestId !== requestRef.current) return;

        let data = result.data || [];
        const more = pageNum < (result.pagination?.totalPages || 1);

        setHasMore(more);
        cachedState.hasMore = more;
        cachedState.page = pageNum;

        setRestaurants((prev) => {
          const newArr = isReset ? [...data] : [...prev, ...data];
          cachedState.restaurants = newArr;
          return newArr;
        });
      }
    } catch {
      /* silent */
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
        setLoadingMore(false);
      }
    }
  }

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

  const filteredDeals60 = hotDealsUnder60.filter((deal: any) => {
    const raw = getDistance(
      latitude,
      longitude,
      deal.latitude ? parseFloat(deal.latitude) : null,
      deal.longitude ? parseFloat(deal.longitude) : null,
    );
    const isOor =
      raw != null && raw > (deal.deliveryRange ? parseFloat(deal.deliveryRange) : 5);
    return !isOor;
  });

  const filteredDeals130 = hotDealsUnder130.filter((deal: any) => {
    const raw = getDistance(
      latitude,
      longitude,
      deal.latitude ? parseFloat(deal.latitude) : null,
      deal.longitude ? parseFloat(deal.longitude) : null,
    );
    const isOor =
      raw != null && raw > (deal.deliveryRange ? parseFloat(deal.deliveryRange) : 5);
    return !isOor;
  });

  const popular = filtered.slice(0, popularLimit);
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

      <main className="flex-1 pb-8 md:pb-6 relative">




        {/* ══ LOCATION (SCROLLS AWAY) ════════════════════════════ */}
        <div className="max-w-7xl mx-auto px-4 pt-4 pb-3">
          <div className="w-full">
            <button
              suppressHydrationWarning
              onClick={() => setIsLocationModalOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#151522] rounded-2xl border border-transparent hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] active:scale-[0.99]"
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
        </div>

        {/* ══ STICKY TOP BAR (Search + Categories) ════════════════════════════ */}
        <div className="sticky top-16 z-40 bg-white/90 dark:bg-[#0D0D17]/90 backdrop-blur-xl z-[45]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col gap-0">
            {/* ─────────────────────────────────────────────────────────────
 ROW 1 — Search bar + Filter (full width)
 ───────────────────────────────────────────────────────────── */}
            <div className="w-full flex items-center gap-3 pt-2 pb-4">
              <div className="flex-1 min-w-0 flex items-center bg-white dark:bg-[#151522] rounded-full px-5 py-3 border border-transparent hover:border-orange-400 focus-within:border-orange-500 dark:hover:border-orange-500/80 dark:focus-within:border-orange-500 shadow-sm focus-within:shadow-md transition-all duration-300">
                <Search className="w-5 h-5 text-orange-500 dark:text-orange-400 shrink-0 mr-3" strokeWidth={2.5} />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search Restaurants..."
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  onClick={() => setSearchQuery("")}
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors ml-2 ${searchQuery ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                >
                  <X className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                </button>
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
                                ? "bg-black/20 dark:bg-black/40"
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
          <div className="max-w-7xl mx-auto">
            {/* ── 1. Category Quick-Bites ─────────────────────────────────────── */}
            <section className="pt-2 pb-2 relative z-10">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pt-2 pb-3">
                {quickBites.slice(0, 8).map(({ label, image }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.04, duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Link
                      href={`/food/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex-shrink-0 flex flex-col items-center gap-1 group outline-none"
                    >
                      <div className="relative w-[54px] h-[54px] rounded-full overflow-hidden border-[2px] border-transparent group-hover:border-orange-400 bg-gray-200 dark:bg-[#1F1F2E] animate-pulse shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 group-active:scale-90 isolate">
                        <Image src={image} alt={label} fill sizes="54px" priority={true} className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 dark:hidden" />
                        <Image src={image.replace('.png', '_dark.png')} alt={label} fill sizes="54px" priority={true} className="object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 hidden dark:block" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight group-hover:text-orange-500 transition-colors max-w-[60px]">
                        {label}
                      </span>
                    </Link>
                  </motion.div>
                ))}

                {/* See All Button */}
                {quickBites.length > 8 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 8 * 0.04, duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <button
                      onClick={() => setIsQuickBitesDrawerOpen(true)}
                      className="flex-shrink-0 flex flex-col items-center gap-1 group outline-none"
                    >
                      <div className="relative w-[54px] h-[54px] rounded-full overflow-hidden border-[2px] border-transparent group-hover:border-orange-400 bg-orange-50 dark:bg-orange-500/10 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 group-active:scale-90 flex items-center justify-center isolate">
                        <ChevronDown className="w-6 h-6 text-orange-500 -rotate-90 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight group-hover:text-orange-500 transition-colors max-w-[60px]">
                        See All
                      </span>
                    </button>
                  </motion.div>
                )}
              </div>
            </section>
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
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${active ? "bg-black/20 dark:bg-black/40" : "bg-gray-200"
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

        {/* Quick Bites Drawer */}
        {isQuickBitesDrawerOpen && (
          <div
            className="fixed inset-0 z-[75] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsQuickBitesDrawerOpen(false)}
          />
        )}
        <div
          className={`fixed inset-y-0 right-0 z-[80] w-80 max-w-full bg-white dark:bg-[#0D0D17] shadow-2xl flex flex-col transition-transform duration-300 ${isQuickBitesDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#2A2A3A]">
            <p className="font-black text-[17px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500 dark:from-orange-400 dark:to-red-400 drop-shadow-sm flex items-center gap-2">
              What are you craving?
            </p>
            <button
              onClick={() => setIsQuickBitesDrawerOpen(false)}
              className="group relative p-2 bg-gray-50 dark:bg-[#151522] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full border border-gray-200 dark:border-[#2A2A3A] hover:border-red-200 dark:hover:border-red-500/30 transition-all duration-300 shadow-sm hover:shadow-md active:scale-90"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-red-500 transition-colors group-hover:rotate-90 duration-300" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
            <div className="grid grid-cols-3 gap-y-6 gap-x-4">
              {quickBites.map(({ label, image }) => (
                <Link
                  key={label}
                  href={`/food/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setIsQuickBitesDrawerOpen(false)}
                  className="flex flex-col items-center gap-2 group outline-none"
                >
                  <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden border-[2px] border-transparent group-hover:border-orange-400 bg-gray-200 dark:bg-[#1F1F2E] animate-pulse shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-active:scale-90">
                    <Image src={image} alt={label} fill sizes="70px" loading="lazy" className="object-cover transition-transform duration-500 group-hover:scale-110 dark:hidden" />
                    <Image src={image.replace('.png', '_dark.png')} alt={label} fill sizes="70px" loading="lazy" className="hidden object-cover transition-transform duration-500 group-hover:scale-110 dark:block" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center leading-tight group-hover:text-orange-500 transition-colors">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ══ PAGE CONTENT ════════════════════════════════════════════════════ */}
        <div className="max-w-7xl mx-auto">


          {/* ── 2. Promo Banner ─────────────────────────────────────────────── */}
          <section className="w-full pt-0 pb-2 relative px-[2px] md:px-0">
            {posterLoading ? (
              <div className="w-full aspect-[2/1] md:aspect-[21/9] relative rounded-2xl md:rounded-3xl overflow-hidden bg-gray-50 dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex items-center justify-center isolate">

                {/* Central Placeholder Content */}
                <div className="flex flex-col items-center justify-center gap-3 md:gap-4 z-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] bg-gray-200 dark:bg-[#1F1F2E] flex items-center justify-center shadow-sm animate-pulse">
                    <Utensils className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="flex flex-col items-center gap-2 md:gap-2.5">
                    <div className="h-2.5 md:h-3 w-32 md:w-48 bg-gray-200 dark:bg-[#1F1F2E] rounded-full animate-pulse" />
                    <div className="h-2 md:h-2.5 w-20 md:w-32 bg-gray-200 dark:bg-[#1F1F2E] rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Abstract glowing blobs for premium aesthetic */}
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-400/20 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-400/20 dark:bg-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
              </div>
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
                  <PopCardSkeleton key={i} />
                ))}
              </div>
            ) : popular.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1 items-stretch">
                {popular.map((r) => (
                  <PopCard key={r.id} r={r} {...cp} />
                ))}

                {/* Skeletons while loading */}
                {(isPopularLoading || loadingMore) && (
                  <>
                    <PopCardSkeleton />
                    <PopCardSkeleton />
                  </>
                )}

                {/* Load More Button */}
                {!(isPopularLoading || loadingMore) && (popularLimit < filtered.length || hasMore) && (
                  <button
                    onClick={() => {
                      setIsPopularLoading(true);
                      setTimeout(() => {
                        if (popularLimit >= filtered.length && hasMore) {
                          setPage((prev) => {
                            const next = prev + 1;
                            fetchRestaurants(next, false);
                            return next;
                          });
                        }
                        setPopularLimit(prev => prev + 10);
                        setIsPopularLoading(false);
                      }, 800);
                    }}
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-6 group outline-none min-h-[140px]"
                  >
                    <div className="w-[70px] h-[70px] rounded-full bg-white dark:bg-[#1A100C] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-8 h-8 text-orange-500" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
                      See All
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <p className="px-4 text-sm text-gray-400 font-medium">
                No restaurants available yet.
              </p>
            )}
          </section>

          {/* ── Hot Deals Under 60 ────────────────────────────────────────── */}
          {(filteredDeals60.length > 0 || isHotDealsLoading) && (
            <section className="py-3">
              <SectionHeader
                title="Hot Deals Under ₹60"
                onViewAll={() => { }}
              />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 pt-1">
                {isHotDealsLoading
                  ? [1, 2, 3, 4].map((i) => <DealCardSkeleton key={i} />)
                  : filteredDeals60.slice(0, deals60Limit).map((deal) => (
                    <DealCard key={deal.id} deal={deal} wishlist={restaurantWishlist} toggle={toggleRestaurant} onConfirmNeeded={setDealToConfirm} />
                  ))}

                {!isHotDealsLoading && (isDeals60LoadingMore) && (
                  <>
                    <DealCardSkeleton />
                    <DealCardSkeleton />
                  </>
                )}

                {!isHotDealsLoading && !isDeals60LoadingMore && deals60Limit < filteredDeals60.length && (
                  <button
                    onClick={() => {
                      setIsDeals60LoadingMore(true);
                      setTimeout(() => {
                        setDeals60Limit(prev => prev + 10);
                        setIsDeals60LoadingMore(false);
                      }, 800);
                    }}
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-6 group outline-none min-h-[140px]"
                  >
                    <div className="w-[70px] h-[70px] rounded-full bg-white dark:bg-[#1A100C] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-8 h-8 text-orange-500" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
                      See All
                    </span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── Hot Deals Under 130 ───────────────────────────────────────── */}
          {(filteredDeals130.length > 0 || isHotDealsLoading) && (
            <section className="py-3">
              <SectionHeader
                title="Hot Deals Under ₹130"
                onViewAll={() => { }}
              />
              <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2 pt-1">
                {isHotDealsLoading
                  ? [1, 2, 3, 4].map((i) => <DealCardSkeleton key={i} />)
                  : filteredDeals130.slice(0, deals130Limit).map((deal) => (
                    <DealCard key={deal.id} deal={deal} wishlist={restaurantWishlist} toggle={toggleRestaurant} onConfirmNeeded={setDealToConfirm} />
                  ))}

                {!isHotDealsLoading && (isDeals130LoadingMore) && (
                  <>
                    <DealCardSkeleton />
                    <DealCardSkeleton />
                  </>
                )}

                {!isHotDealsLoading && !isDeals130LoadingMore && deals130Limit < filteredDeals130.length && (
                  <button
                    onClick={() => {
                      setIsDeals130LoadingMore(true);
                      setTimeout(() => {
                        setDeals130Limit(prev => prev + 10);
                        setIsDeals130LoadingMore(false);
                      }, 800);
                    }}
                    className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-6 group outline-none min-h-[140px]"
                  >
                    <div className="w-[70px] h-[70px] rounded-full bg-white dark:bg-[#1A100C] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <ChevronRight className="w-8 h-8 text-orange-500" />
                    </div>
                    <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
                      See All
                    </span>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ── 4. Top Cuisines ─────────────────────────────────────────────── */}
          <section className="py-3 overflow-hidden">
            <SectionHeader title="Top Cuisines" />
            <div className="flex w-max animate-marquee gap-2.5 px-4 pb-1">
              {[...topCuisines, ...topCuisines].map(({ label, image, bg, border }, idx) => (
                <div
                  key={`${label}-${idx}`}
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
                    ? "bg-black/20 dark:bg-black/40"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <RestCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mx-4 flex flex-col items-center py-20 bg-gray-50 dark:bg-[#151522] rounded-3xl border border-gray-100 dark:border-[#2A2A3A]">
                <span className="text-5xl mb-4 float-anim inline-block">🍽️</span>
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
                {loadingMore && (
                  <>
                    {[1, 2, 3, 4].map(i => <RestCardSkeleton key={`skeleton-all-${i}`} />)}
                  </>
                )}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && filtered.length > 0 && (
              <div className="w-full flex justify-center mt-10 mb-6">
                <button
                  onClick={() => {
                    if (hasMore && !loadingMore) {
                      setPage((prev) => {
                        const next = prev + 1;
                        fetchRestaurants(next, false);
                        return next;
                      });
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 group outline-none"
                >
                  <div className="w-[70px] h-[70px] rounded-full bg-white dark:bg-[#1A100C] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {loadingMore ? (
                      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <ChevronDown className="w-8 h-8 text-orange-500" />
                    )}
                  </div>
                  <span className="text-[13px] font-bold text-gray-700 dark:text-gray-300 text-center">
                    {loadingMore ? "Loading..." : "Load More"}
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>


      </main>

      <Footer />
      <MobileBottomNav />


      {/* Confirmation Modal for Hot Deals */}
      {dealToConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151522] w-full max-w-sm mx-auto rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">Existing Items in Cart</h3>
            <p className="text-[13px] text-center text-gray-600 dark:text-gray-400 mb-6 font-medium leading-relaxed">
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
