"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Star, Clock, ChevronRight, ChevronLeft,
  Filter, Flame, Leaf, Zap, Coffee, Pizza, UtensilsCrossed,
  MapPin, ChevronDown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import BusinessRequestModal from "@/components/BusinessRequestModal";



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

const quickBites: { label: string; image: string; emoji: string }[] = [
  { label: "Biryani", image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=200&h=200", emoji: "🍛" },
  { label: "Roll", image: "/roll.png", emoji: "🌯" },
  { label: "Dosa", image: "/dosa.png", emoji: "🫓" },
  { label: "Chowmin", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=200&h=200", emoji: "🍜" },
  { label: "Momo", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=200&h=200", emoji: "🥟" },
  { label: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&h=200", emoji: "🍕" },
  { label: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&h=200", emoji: "🍔" },
  { label: "Chicken Pokoda", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=200&h=200", emoji: "🍗" },
  { label: "Vada", image: "/vada.png", emoji: "🍘" },
  { label: "Manchurrian", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=200&h=200", emoji: "🥘" },
  { label: "Others", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=200&h=200", emoji: "🍽️" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg">("all");
  const [reqModal, setReqModal] = useState(false);
  const [reqType, setReqType] = useState<"student" | "vendor">("vendor");

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
    <div className="min-h-screen bg-orange-50/40 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* ── Mobile Top Bar (Location) ── */}
          <div className="md:hidden pt-4 pb-2 px-1">
            <div className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white shadow-sm">
               <div className="flex items-center gap-2.5 overflow-hidden">
                 <MapPin className="w-6 h-6 text-orange-500 shrink-0" />
                 <div className="flex flex-col overflow-hidden">
                   <div className="flex items-center gap-1 cursor-pointer">
                     <span className="font-black text-gray-900 text-lg tracking-tight leading-none truncate">Home</span>
                     <ChevronDown className="w-4 h-4 text-orange-500 shrink-0" />
                   </div>
                   <span className="text-[12px] text-gray-500 font-medium leading-tight truncate">Pulaha Hostel, Burla, Odisha...</span>
                 </div>
               </div>
               <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shadow-sm border border-orange-200 shrink-0 ml-2">
                  <span className="text-sm font-black text-orange-600">N</span>
               </div>
            </div>
          </div>

          {/* ── Banner Section (Slider) ── */}
          <div className="py-4 md:py-6 w-full relative group">
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
                  className={`relative w-full flex-shrink-0 h-40 md:h-64 rounded-3xl overflow-hidden shadow-lg border border-gray-200 snap-center ${banner.image ? "" : banner.bg
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
          <div className="flex items-center justify-between py-4 border-b border-orange-100">
            <h1 className="font-black text-2xl text-orange-500 tracking-tight">Food Items</h1>
            <div className="flex items-center gap-2">
              <button
                id="all-toggle"
                onClick={() => setFoodPref("all")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${foodPref === "all"
                  ? "bg-gradient-to-r from-orange-500 to-orange-400 border-orange-500 text-white shadow-orange-500/30"
                  : "bg-white border-orange-200 text-gray-600 hover:border-orange-400 hover:text-orange-600"
                  }`}
              >
                View All
              </button>
              <button
                id="veg-toggle"
                onClick={() => setFoodPref("veg")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${foodPref === "veg"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${foodPref === "non-veg"
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-gray-300 text-gray-600"
                  }`}
              >
                <span className={`w-3 h-3 rounded-sm border-2 ${foodPref === "non-veg" ? "border-white bg-white" : "border-red-600"}`} />
                Non-veg
              </button>
            </div>
          </div>



          {/* Mobile Search Replacement */}
          <div className="md:hidden py-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-orange-200 bg-white shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100/50 transition-all mx-1">
              <Search className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search restaurants..."
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="py-2">
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 px-1">
              {quickBites.map(({ label, image }) => (
                <Link
                  key={label}
                  href={`/dish/${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex-shrink-0 flex flex-col items-center gap-2 group w-20 md:w-24"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-sm group-hover:shadow-md border border-gray-100 transition-all duration-300 group-hover:scale-105 group-hover:border-orange-300 bg-gray-100 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt={label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-700 text-center leading-tight group-hover:text-orange-600 transition-colors">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>



          <div className="py-4">
            <h2 className="text-xl font-black text-orange-500 tracking-tight mb-6">
              Nearest Vendors & Restaurants
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {filtered.map((r) => (
                <Link
                  href={`/vendor/${r.id}`}
                  key={r.id}
                  className="group flex flex-col bg-white rounded-2xl border border-gray-200
                    hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 text-left transition-all duration-300 overflow-hidden"
                >
                  <div className="relative w-full h-44 md:h-48 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center text-8xl md:text-9xl border-b border-gray-100 overflow-hidden">
                    <div className="group-hover:scale-110 transition-transform duration-500 drop-shadow-md">
                      {r.emoji}
                    </div>
                    <span className={`absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm z-10 ${r.badgeColor}`}>
                      {r.badge}
                    </span>
                    {r.veg && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-sm border-2 border-orange-600 flex items-center justify-center bg-white shadow-sm z-10">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 flex flex-col justify-between flex-1 w-full bg-white">
                    <div>
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="font-black text-gray-900 text-[17px] tracking-tight truncate">{r.name}</p>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                          <Star className="w-3 h-3 fill-white" />
                          {r.rating}
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-500 mb-2 truncate">{r.cuisine}</p>

                      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 mb-3">
                        <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md shadow-sm">
                          <Clock className="w-3 h-3 text-orange-400" /> {r.time}
                        </span>
                        <span className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-md shadow-sm">Min {r.minOrder}</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-orange-700 font-bold">
                        <span className="text-orange-500 text-sm">🏷</span>
                        {r.offer}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
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
      <BusinessRequestModal isOpen={reqModal} onClose={() => setReqModal(false)} defaultType={reqType} />
    </div>
  );
}
