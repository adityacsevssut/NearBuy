"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Star, Clock, ChevronRight, ChevronLeft,
  Filter, Flame, Leaf, Zap, Coffee, Pizza, UtensilsCrossed,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";



const banners = [
  {
    id: 1,
    image: "/banner.png",
    bg: "bg-orange-500",
    tag: "NEW ON CAMPUS",
    title: "Everything you need, delivered in 15 mins.",
  },
  {
    id: 2,
    image: null,
    bg: "bg-gradient-to-r from-orange-500 to-red-500",
    tag: "MIDNIGHT CRAVINGS",
    title: "50% OFF on all late night orders.",
  },
  {
    id: 3,
    image: null,
    bg: "bg-gradient-to-r from-blue-600 to-indigo-600",
    tag: "WELCOME OFFER",
    title: "Free delivery on your first 3 orders!",
  }
];

const restaurants = [
  {
    id: "rest-1",
    name: "Sharma Dhaba",
    tags: ["trending", "fast"],
    cuisine: "North Indian · Biryani · Thali",
    rating: 4.7,
    reviews: 320,
    time: "12–15 min",
    minOrder: "₹80",
    offer: "50% off up to ₹80",
    emoji: "🍛",
    badge: "Bestseller",
    badgeColor: "bg-orange-100 text-orange-700",
    veg: false,
  },
  {
    id: "rest-2",
    name: "Maggi Corner",
    tags: ["trending", "fast", "veg"],
    cuisine: "Fast Food · Noodles · Snacks",
    rating: 4.5,
    reviews: 210,
    time: "8–12 min",
    minOrder: "₹40",
    offer: "Buy 2 Get 1 Free",
    emoji: "🍜",
    badge: "Late Night",
    badgeColor: "bg-indigo-100 text-indigo-700",
    veg: true,
  },
  {
    id: "rest-3",
    name: "Campus Café",
    tags: ["cafe", "veg"],
    cuisine: "Beverages · Sandwiches · Pastries",
    rating: 4.6,
    reviews: 180,
    time: "10–14 min",
    minOrder: "₹60",
    offer: "Free cookie on orders ₹150+",
    emoji: "☕",
    badge: "Top Rated",
    badgeColor: "bg-orange-100 text-orange-700",
    veg: true,
  },
  {
    id: "rest-4",
    name: "Pizza Bhai",
    tags: ["pizza", "fast"],
    cuisine: "Pizza · Pasta · Garlic Bread",
    rating: 4.3,
    reviews: 95,
    time: "18–22 min",
    minOrder: "₹120",
    offer: "₹30 off first order",
    emoji: "🍕",
    badge: "New",
    badgeColor: "bg-blue-100 text-blue-700",
    veg: false,
  },
  {
    id: "rest-5",
    name: "Hostel Meals",
    tags: ["veg", "trending"],
    cuisine: "Home Style · Thali · Dal Rice",
    rating: 4.4,
    reviews: 140,
    time: "15–20 min",
    minOrder: "₹70",
    offer: "Budget friendly – daily specials",
    emoji: "🍱",
    badge: "Budget Pick",
    badgeColor: "bg-purple-100 text-purple-700",
    veg: true,
  },
  {
    id: "rest-6",
    name: "Rolls & Wraps",
    tags: ["fast", "trending"],
    cuisine: "Rolls · Wraps · Kathi",
    rating: 4.2,
    reviews: 88,
    time: "10–15 min",
    minOrder: "₹60",
    offer: "Combo meals from ₹99",
    emoji: "🌯",
    badge: "Popular",
    badgeColor: "bg-amber-100 text-amber-700",
    veg: false,
  },
];

const quickBites: { label: string; emoji: string }[] = [
  { label: "Biryani", emoji: "🍛" },
  { label: "Roll", emoji: "🌯" },
  { label: "Dosa", emoji: "🫓" },
  { label: "Chowmin", emoji: "🍜" },
  { label: "Momo", emoji: "🥟" },
  { label: "Pizza", emoji: "🍕" },
  { label: "Burger", emoji: "🍔" },
  { label: "Chicken Pokoda", emoji: "🍗" },
  { label: "Vada", emoji: "🍘" },
  { label: "Manchurrian", emoji: "🥘" },
  { label: "Others", emoji: "🍽️" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg">("all");

  const filtered = restaurants.filter((r) => {
    const matchVeg = foodPref === "all" || (foodPref === "veg" ? r.veg : !r.veg);
    const matchSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    return matchVeg && matchSearch;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* ── Banner Section (Slider) ── */}
          <div className="py-6 w-full relative group">
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md text-gray-700 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:block"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div
              ref={scrollRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 w-full rounded-3xl"
            >
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`relative w-full flex-shrink-0 h-40 md:h-64 rounded-3xl overflow-hidden shadow-lg border border-gray-200 snap-center ${
                    banner.image ? "" : banner.bg
                  }`}
                >
                  {banner.image && (
                    <>
                      <Image
                        src={banner.image}
                        alt="NearBuy Promo Banner"
                        fill
                        className="object-cover"
                        priority={banner.id === 1}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
                    </>
                  )}
                  <div className="absolute inset-y-0 left-0 p-6 md:p-10 flex flex-col justify-center pointer-events-none">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full w-fit mb-3 shadow-sm border border-white/30">
                      {banner.tag}
                    </span>
                    <h2 className="text-white text-2xl md:text-4xl font-black max-w-sm leading-tight tracking-tight drop-shadow-md">
                      {banner.title}
                    </h2>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sub-header (Filter / Veg Toggle) ── */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <h1 className="font-black text-xl text-gray-900 tracking-tight">Food Delivery</h1>
            <div className="flex items-center gap-2">
              <button
                id="all-toggle"
                onClick={() => setFoodPref("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "all"
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                View All
              </button>
              <button
                id="veg-toggle"
                onClick={() => setFoodPref("veg")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "veg"
                    ? "bg-orange-600 border-orange-600 text-white"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                <span className={`w-3 h-3 rounded-sm border-2 ${foodPref === "veg" ? "border-white bg-white" : "border-orange-600"}`} />
                Veg Only
              </button>
              <button
                id="nonveg-toggle"
                onClick={() => setFoodPref("non-veg")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "non-veg"
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                <span className={`w-3 h-3 rounded-sm border-2 ${foodPref === "non-veg" ? "border-white bg-white" : "border-red-600"}`} />
                Non-veg
              </button>
            </div>
          </div>

          {/* Quick Bites (Mobile Search Replacement) */}
          <div className="md:hidden py-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search restaurants..."
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
            {quickBites.map(({ label, emoji }) => (
              <Link
                key={label}
                href={`/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="flex-shrink-0 inline-flex items-center gap-2.5 rounded-xl bg-white border border-gray-200 shadow-sm px-3 py-2 pr-3.5
                  hover:border-orange-400 hover:text-orange-900 text-sm font-semibold text-gray-800 transition-colors"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-50 to-amber-100 text-lg shadow-inner ring-1 ring-orange-100/80 select-none"
                  aria-hidden
                >
                  {emoji}
                </span>
                <span className="whitespace-nowrap leading-tight">{label}</span>
              </Link>
            ))}
          </div>



          <div className="py-4">
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-6">
              Nearest Vendors & Restaurants
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {filtered.map((r) => (
                <Link
                  href={`/vendor/${r.id}`}
                  key={r.id}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-200
                    hover:border-orange-400 card-shadow text-left transition-all duration-300 overflow-hidden"
                >
                  <div className="relative w-full h-32 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-6xl border-b border-gray-100">
                    {r.emoji}
                    <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                    {r.veg && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-sm border-2 border-orange-600 flex items-center justify-center bg-white shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 w-full">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-black text-gray-900 text-lg tracking-tight truncate">{r.name}</p>
                      <span className="flex items-center gap-1 text-xs font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                        <Star className="w-3 h-3 fill-white" />
                        {r.rating}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 truncate">{r.cuisine}</p>

                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-4">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" /> {r.time}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded-md">Min {r.minOrder}</span>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-orange-700 font-bold">
                        <span className="text-orange-500 text-sm">🏷</span>
                        {r.offer}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-20 text-gray-400">
                <span className="text-5xl mb-4">🍽️</span>
                <p className="font-bold text-gray-600 text-lg">No restaurants found</p>
                <p className="text-sm mt-1">Try changing your filters or search</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
