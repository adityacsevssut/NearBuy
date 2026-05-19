"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Star, Clock, ChevronRight,
  MapPin, ChevronDown, SlidersHorizontal, X, Utensils
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import BusinessRequestModal from "@/components/BusinessRequestModal";
import { useLocationContext } from "@/context/LocationContext";




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
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
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
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80",
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
  const [showFilters, setShowFilters] = useState(false);
  const [reqModal, setReqModal] = useState(false);
  const [reqType, setReqType] = useState<"student" | "vendor">("vendor");
  const { locationName, pincode, setIsLocationModalOpen } = useLocationContext();

  const filtered = restaurants.filter((r) => {
    const matchVeg = foodPref === "all" || (foodPref === "veg" ? r.veg : !r.veg);
    const matchSearch =
      !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    return matchVeg && matchSearch;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-orange-50/40 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* ── Mobile Top Bar (Location) ── */}
          <div className="md:hidden pt-4 pb-2 px-1">
            <button
              suppressHydrationWarning
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white shadow-sm active:bg-orange-50 transition-colors"
            >
               <div className="flex items-center gap-2.5 overflow-hidden">
                 <MapPin className="w-6 h-6 text-orange-500 shrink-0" />
                 <div className="flex flex-col overflow-hidden text-left">
                   <div className="flex items-center gap-1">
                     <span className="font-black text-gray-900 text-lg tracking-tight leading-none truncate">Delivery Location</span>
                     <ChevronDown className="w-4 h-4 text-orange-500 shrink-0" />
                   </div>
                   <span className="text-[12px] text-gray-500 font-medium leading-tight truncate">{locationName}{pincode ? ` · ${pincode}` : ''}</span>
                 </div>
               </div>
               <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center shadow-sm shrink-0 ml-2">
                  <span className="text-sm font-black text-white uppercase">{locationName.charAt(0)}</span>
               </div>
            </button>
          </div>

          {/* ── Fixed Hero Banner ── */}
          <div className="py-4 md:py-6 w-full">
            <div className="relative w-full aspect-[2/1] md:aspect-[3/1] lg:aspect-[4/1] rounded-3xl overflow-hidden shadow-xl border border-orange-100">
              <Image
                src="/food_hero_v2.png"
                alt="NearBuy Food Banner"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                className="object-cover object-center"
                priority
              />
            </div>
          </div>

          {/* ── Sub-header (Filter / Veg Toggle) ── */}
          <div className="flex items-center justify-between py-4 border-b border-orange-100 mb-4">
            <h1 className="font-black text-lg md:text-xl text-orange-500 tracking-tight leading-tight mr-2">
              NearBuy<br />Food
            </h1>
            <div className="flex items-center gap-3">
              {/* Veg Toggle (Zomato Style) */}
              <label className="flex items-center gap-1.5 cursor-pointer bg-white border border-gray-200 px-2.5 py-1.5 rounded-xl shadow-sm hover:border-green-300 transition-all select-none">
                <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-colors ${foodPref === "veg" ? "border-green-600 bg-white" : "border-gray-400 bg-gray-50"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${foodPref === "veg" ? "bg-green-600" : "bg-transparent"}`} />
                </span>
                <span className={`text-[11px] font-bold transition-colors ${foodPref === "veg" ? "text-green-700" : "text-gray-600"}`}>Veg Mode</span>
                <div className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${foodPref === "veg" ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${foodPref === "veg" ? "translate-x-3.5" : "translate-x-0.5"}`} />
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={foodPref === "veg"} 
                  onChange={(e) => setFoodPref(e.target.checked ? "veg" : "all")} 
                />
              </label>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${showFilters ? "bg-orange-600 text-white border-orange-600 shadow-orange-500/30 shadow-sm" : "bg-white border-orange-200 text-gray-700 hover:border-orange-400"}`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
              </button>
            </div>
          </div>



          <div className="flex gap-6 pb-12">
            {/* ── Sidebar filters ── */}
            {/* Mobile Overlay */}
            {showFilters && (
              <div
                className="fixed inset-0 z-[60] bg-black/50 md:hidden backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
            )}
            <aside
              className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col md:relative md:z-0 md:w-64 md:transform-none md:bg-transparent md:shadow-none md:flex-shrink-0 ${showFilters ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
            >
              {/* Mobile Header */}
              <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  <p className="font-black text-lg text-gray-900">Filters</p>
                </div>
                <button onClick={() => setShowFilters(false)} className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white md:rounded-2xl md:border md:border-gray-200 md:sticky md:top-24 md:shadow-sm pb-24 md:pb-0 scrollbar-hide">
                <div className="hidden md:flex px-5 py-4 border-b border-gray-100 items-center gap-2">
                  <Utensils className="w-5 h-5 text-orange-600" />
                  <p className="font-black text-base text-gray-900">Filters</p>
                </div>

                {/* Dietary Preference */}
                <div className="px-5 py-5 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Dietary Preference</p>
                  <div className="space-y-1">
                    <button onClick={() => setFoodPref("all")} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${foodPref === "all" ? "bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-md shadow-orange-500/20" : "text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-transparent"}`}>View All</button>
                    <button onClick={() => setFoodPref("veg")} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${foodPref === "veg" ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-md shadow-green-500/20" : "text-gray-600 hover:bg-green-50 hover:text-green-600 border border-transparent"}`}>
                      <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${foodPref === "veg" ? "border-white bg-white" : "border-green-600"}`}><span className={`w-1.5 h-1.5 rounded-full ${foodPref === "veg" ? "bg-green-600" : "bg-transparent"}`} /></span>Pure Veg
                    </button>
                    <button onClick={() => setFoodPref("non-veg")} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${foodPref === "non-veg" ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20" : "text-gray-600 hover:bg-red-50 hover:text-red-600 border border-transparent"}`}>
                      <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${foodPref === "non-veg" ? "border-white bg-white" : "border-red-600"}`}><span className={`w-1.5 h-1.5 rounded-full ${foodPref === "non-veg" ? "bg-red-600" : "bg-transparent"}`} /></span>Non-Veg Only
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Main Content Area ── */}
            <div className="flex-1 min-w-0 pt-2">
              {/* Mobile Search Replacement */}
              <div className="md:hidden py-3 mb-2">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-orange-200 bg-white shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100/50 transition-all mx-1">
              <Search className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <input
                suppressHydrationWarning
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
                  <div className="relative w-full h-44 md:h-48 bg-gray-100 flex items-center justify-center border-b border-gray-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />

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
                <div className="col-span-full flex flex-col items-center py-20 text-gray-400 bg-white rounded-3xl border border-gray-200">
                  <span className="text-5xl mb-4">🍽️</span>
                  <p className="font-bold text-gray-600 text-lg">No restaurants found</p>
                  <p className="text-sm mt-1">Try changing your filters or search</p>
                </div>
              )}
            </div>
          </div>
        </div>

        </div>
      </main>

      <Footer />
      <MobileBottomNav />
      <BusinessRequestModal isOpen={reqModal} onClose={() => setReqModal(false)} defaultType={reqType} />
    </div>
  );
}
