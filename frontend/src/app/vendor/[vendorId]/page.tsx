"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart, Loader2, Store, Utensils, ArrowDown, ChevronDown, LayoutList, Phone, Share2, Navigation, Send, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";
import { useWishlist } from "@/context/WishlistContext";

function VendorPageSkeleton() {
  return (
    <div className="flex-1 flex flex-col w-full animate-pulse">
      {/* Banner Skeleton */}
      <div className="w-full h-[250px] bg-gray-200 dark:bg-[#1F1F2E] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0D0D17] to-transparent"></div>
        <div className="absolute bottom-6 left-4 sm:left-6 flex gap-4 md:gap-6 items-start w-full max-w-4xl mx-auto">
          <div className="flex-1 space-y-3">
            <div className="h-8 w-64 bg-gray-300 dark:bg-[#2A2A3A] rounded-full"></div>
            <div className="h-4 w-32 bg-gray-300 dark:bg-[#2A2A3A] rounded-full"></div>
            <div className="h-4 w-48 bg-gray-300 dark:bg-[#2A2A3A] rounded-full"></div>
            <div className="flex gap-3 pt-2">
              <div className="h-8 w-24 bg-gray-300 dark:bg-[#2A2A3A] rounded-xl"></div>
              <div className="h-8 w-24 bg-gray-300 dark:bg-[#2A2A3A] rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Skeleton */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        <div className="h-6 w-32 bg-gray-200 dark:bg-[#1F1F2E] rounded-full mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-[#0D0D17] p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex gap-4">
            <div className="flex-1 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
              <div className="h-4 w-1/4 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
              <div className="h-3 w-5/6 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
            </div>
            <div className="w-32 h-32 bg-gray-200 dark:bg-[#1F1F2E] rounded-xl relative overflow-hidden">
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-gray-300 dark:bg-[#2A2A3A] rounded-lg shadow-sm"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 dark:bg-[#1F1F2E] rounded-full mb-4"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white dark:bg-[#0D0D17] p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
            <div className="h-4 w-1/4 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
            <div className="flex gap-3 mb-4">
              <div className="h-3 w-12 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
              <div className="h-3 w-16 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
            </div>
            <div className="h-3 w-5/6 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
          </div>
          <div className="w-32 h-32 bg-gray-200 dark:bg-[#1F1F2E] rounded-xl relative overflow-hidden">
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-gray-300 dark:bg-[#2A2A3A] rounded-lg shadow-sm border border-gray-100 dark:border-[#3A3A4A]"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VendorPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  const [vendor, setVendor] = useState<any>(null);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { latitude, longitude } = useLocationContext();

  const getDistance = (lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) => {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const rawDistance = vendor ? getDistance(
    latitude,
    longitude,
    vendor.latitude ? parseFloat(vendor.latitude) : null,
    vendor.longitude ? parseFloat(vendor.longitude) : null
  ) : null;

  const maxRange = vendor && vendor.deliveryRange ? parseFloat(vendor.deliveryRange) : 5.0;
  const isOutOfRange = rawDistance !== null && rawDistance > maxRange;
  const isClosed = vendor && vendor.isOpen === false;

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${API}/api/public/vendors/${vendorId}`);
        if (res.ok) {
          const data = await res.json();
          setVendor(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVendor();
  }, [vendorId]);

  useEffect(() => {
    if (vendor) {
      document.title = `Items-${vendor.name}`;
    }
  }, [vendor]);

  const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg" | "available-veg" | "available-non-veg">("all");
  const [sortOrder, setSortOrder] = useState<"relevance" | "low-to-high" | "high-to-low">("relevance");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const { isFoodWished, toggleFood } = useWishlist();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addItem, itemQty } = useCart();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  useEffect(() => {
    if (!vendorId) return;
    const fetchMenu = async () => {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${API}/api/public/vendors/${vendorId}/menu`);
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data.items || []);
        }
      } catch (err) {
        console.error("Failed to load menu:", err);
      } finally {
        setIsMenuLoading(false);
      }
    };
    fetchMenu();
  }, [vendorId]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) {
        setShowCatDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredDishes = menuItems
    .filter((dish: any) => {
      if (foodPref === "all") return true;
      if (foodPref === "veg") return dish.type === "veg";
      if (foodPref === "non-veg") return dish.type === "non-veg";
      if (foodPref === "available-veg") return dish.type === "veg" && dish.is_available !== false;
      if (foodPref === "available-non-veg") return dish.type === "non-veg" && dish.is_available !== false;
      return true;
    })
    .sort((a: any, b: any) => {
      if (sortOrder === "low-to-high") return a.price - b.price;
      if (sortOrder === "high-to-low") return b.price - a.price;
      return 0;
    });

  // All unique categories derived from full menu (not filtered) for the dropdown
  const allCategories = Array.from(
    new Set(
      menuItems
        .map((d: any) => d.category)
        .filter(Boolean)
        .sort((a: string, b: string) => {
          if (a === "Others") return 1;
          if (b === "Others") return -1;
          return a.localeCompare(b);
        })
    )
  );

  const groupedDishes = filteredDishes.reduce((acc: any, dish: any) => {
    if (!acc[dish.category]) acc[dish.category] = [];
    acc[dish.category].push(dish);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryNames = Object.keys(groupedDishes)
    .sort((a, b) => {
      if (a === "Others") return 1;
      if (b === "Others") return -1;
      return a.localeCompare(b);
    })
    .filter((cat) => selectedCategory === null || cat === selectedCategory);

  return (
    <div className="min-h-screen bg-white dark:bg-[#151522] flex flex-col pt-16">
      <Navbar />

      {/* Warning Banner */}
      {!isLoading && vendor && (isClosed || isOutOfRange) && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center justify-center text-center">
          <p className="text-xs sm:text-sm font-black text-red-600 uppercase tracking-wider">
            ⚠️ {isClosed ? "This restaurant is temporarily closed and not accepting orders" : "This restaurant does not deliver to your location"}
          </p>
        </div>
      )}

      {isLoading ? (
        <VendorPageSkeleton />
      ) : !vendor ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 font-bold">Restaurant not found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-[#0D0D17] border-b border-gray-100 dark:border-[#2A2A3A] relative overflow-visible">
            {/* Blurred Background Image */}
            {vendor.image && (
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img src={vendor.image} alt="Background" className="w-full h-full object-cover opacity-15 blur-3xl scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0D0D17] via-white/90 dark:via-[#0D0D17]/90 to-white/20 dark:to-[#0D0D17]/20" />
              </div>
            )}

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 relative z-30 overflow-visible">
              <div className="flex items-center gap-2 mb-6">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors bg-white dark:bg-[#0D0D17]/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-[#2A2A3A]/50 hover:border-orange-200">
                  <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
              </div>

              <div className="flex gap-4 md:gap-6 items-start mb-2">
                <div className="flex-1 min-w-0 pt-1 md:pt-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 className="font-black text-3xl md:text-4xl text-gray-900 dark:text-gray-100 tracking-tight">
                      {vendor.name}
                    </h1>
                    <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-full font-black shadow-sm uppercase tracking-wider ${vendor.badgeColor || 'bg-orange-100 text-orange-gradient'}`}>
                      {vendor.badge || 'Bestseller'}
                    </span>
                  </div>
                  <p className="text-sm md:text-base font-semibold text-gray-500 dark:text-gray-400 mb-3">{vendor.cuisine}</p>
                  {vendor.landmark && (
                    <p className="flex items-start text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 leading-snug">
                      <span className="text-sm shrink-0">📍</span> {vendor.landmark}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs md:text-sm font-bold flex-wrap mb-6">
                    <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-100/50 shadow-sm">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      {vendor.rating} <span className="opacity-70 font-semibold">({vendor.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100/50 shadow-sm">
                      <Clock className="w-4 h-4 text-blue-500" /> {vendor.time}
                    </span>
                    {vendor.minOrder > 0 && (
                      <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100/50 shadow-sm">
                        Min Order: ₹{vendor.minOrder}
                      </span>
                    )}
                  </div>

                  {/* ── Filter Bar ──────────────────────────────────────────────────── */}
                  <div className="flex items-center gap-2 relative z-40">
                    {/* Category Picker */}
                    <div className="relative" ref={catDropdownRef}>
                      <button
                        onClick={() => setShowCatDropdown(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${selectedCategory
                          ? "bg-orange-500 border-orange-500 text-white"
                          : showCatDropdown
                            ? "bg-orange-50 border-orange-400 text-orange-600"
                            : "bg-white dark:bg-[#0D0D17]/80 backdrop-blur-md border-gray-200 dark:border-[#2A2A3A] text-gray-700 dark:text-gray-300 hover:border-gray-300"
                          }`}
                      >
                        <LayoutList className="w-3 h-3" />
                        <span className="max-w-[80px] truncate">{selectedCategory || "Category"}</span>
                        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${showCatDropdown ? "rotate-180" : ""}`} />
                      </button>

                      {/* Dropdown */}
                      {showCatDropdown && (
                        <div className="absolute left-0 top-full mt-2 z-50 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl shadow-2xl overflow-hidden min-w-[220px]">
                          <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-[#2A2A3A]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CATEGORIES</p>
                          </div>
                          <div className="py-1 max-h-64 overflow-y-auto">
                            {/* All option */}
                            <button
                              onClick={() => { setSelectedCategory(null); setShowCatDropdown(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-2 ${selectedCategory === null
                                ? "bg-orange-50 text-orange-600"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#151522]"
                                }`}
                            >
                              <span>All Categories</span>
                              {selectedCategory === null && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
                            </button>

                            {allCategories.length === 0 ? (
                              <p className="px-4 py-3 text-xs text-gray-400 font-medium text-center">No categories found</p>
                            ) : (
                              allCategories.map((cat: string) => (
                                <button
                                  key={cat}
                                  onClick={() => { setSelectedCategory(cat); setShowCatDropdown(false); }}
                                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-2 ${selectedCategory === cat
                                    ? "bg-orange-50 text-orange-600"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#151522]"
                                    }`}
                                >
                                  <span className="truncate pr-2">{cat}</span>
                                  {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Filter Picker */}
                    <div className="relative" ref={filterDropdownRef}>
                      <button
                        onClick={() => setShowFilterDropdown(prev => !prev)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${foodPref !== "all" || sortOrder !== "relevance"
                          ? "bg-orange-500 border-orange-500 text-white"
                          : showFilterDropdown
                            ? "bg-orange-50 border-orange-400 text-orange-600"
                            : "bg-white dark:bg-[#0D0D17]/80 backdrop-blur-md border-gray-200 dark:border-[#2A2A3A] text-gray-700 dark:text-gray-300 hover:border-gray-300"
                          }`}
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filters</span>
                        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`} />
                      </button>

                      {showFilterDropdown && (
                        <div className="absolute left-0 min-[400px]:right-0 min-[400px]:left-auto top-full mt-2 z-50 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl shadow-2xl overflow-hidden min-w-[240px] max-w-[calc(100vw-32px)]">
                          <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-[#2A2A3A]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DIETARY PREFERENCE</p>
                          </div>
                          <div className="py-1 max-h-[40vh] overflow-y-auto">
                            {[
                              { id: "all", label: "View All" },
                              { id: "veg", label: "Veg Only" },
                              { id: "non-veg", label: "Non Veg Only" },
                              { id: "available-all", label: "Available (ALL)" },
                              { id: "available-veg", label: "Available Veg Only" },
                              { id: "available-non-veg", label: "Available Non Veg Only" },
                            ].map((pref) => (
                              <button
                                key={pref.id}
                                onClick={() => { setFoodPref(pref.id as any); setShowFilterDropdown(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${foodPref === pref.id
                                  ? "bg-orange-50 text-orange-600"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#151522]"
                                  }`}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${foodPref === pref.id ? 'border-orange-500' : 'border-gray-300'}`}>
                                  {foodPref === pref.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                </div>
                                <span>{pref.label}</span>
                              </button>
                            ))}
                          </div>

                          <div className="px-3 pt-2.5 pb-2 border-y border-gray-100 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#151522]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PRICING</p>
                          </div>
                          <div className="py-1">
                            {[
                              { id: "relevance", label: "Relevance" },
                              { id: "low-to-high", label: "Low to High" },
                              { id: "high-to-low", label: "High to Low" },
                            ].map((sort) => (
                              <button
                                key={sort.id}
                                onClick={() => { setSortOrder(sort.id as any); setShowFilterDropdown(false); }}
                                className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${sortOrder === sort.id
                                  ? "bg-orange-50 text-orange-600"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#151522]"
                                  }`}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sortOrder === sort.id ? 'border-orange-500' : 'border-gray-300'}`}>
                                  {sortOrder === sort.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                </div>
                                <span>{sort.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
              <div className="space-y-10">
                {categoryNames.map(category => (
                  <div key={category} className="space-y-4">
                    <h2 className="font-black text-2xl text-gray-900 dark:text-gray-100 tracking-tight">{category}</h2>
                    <div className="space-y-4">
                      {groupedDishes[category].map((dish: any) => {
                        const wished = isFoodWished(dish.id);
                        return (
                          <div
                            key={dish.id}
                            onClick={() => setSelectedFood(dish)}
                            className={`cursor-pointer bg-white dark:bg-[#0D0D17] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm transition-all duration-300 flex gap-4 ${(dish.is_available === false || isOutOfRange || isClosed) ? "opacity-60" : "hover:border-orange-300 hover:shadow-md"}`}
                          >
                            {/* Info Section */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div>
                                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg tracking-tight mb-0.5 leading-tight">
                                    <span className={`inline-flex flex-shrink-0 w-4 h-4 border-2 items-center justify-center rounded-sm mr-2 align-middle -mt-1 bg-white dark:bg-[#0D0D17] ${dish.type === "veg" ? "border-green-600" : "border-red-600"}`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${dish.type === "veg" ? "bg-green-600" : "bg-red-600"}`}></span>
                                    </span>
                                    <span className="align-middle">{dish.name}</span>
                                  </h3>
                                  {dish.badge && (
                                    <div className="mb-1.5 mt-1">
                                      <span className="text-[10px] px-1.5 py-0.5 rounded text-orange-gradient bg-orange-100 font-bold uppercase tracking-wider">
                                        {dish.badge}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-baseline gap-1.5 mb-2 mt-2">
                                  {Number(dish.actual_price) > Number(dish.price || 0) && (
                                    <>
                                      <span className="flex items-center gap-0.5 text-green-600 font-black text-[13px]">
                                        <ArrowDown className="w-3.5 h-3.5" strokeWidth={3} />
                                        {Math.round(((Number(dish.actual_price) - Number(dish.price || 0)) / Number(dish.actual_price)) * 100)}%
                                      </span>
                                      <span className="text-gray-400 font-semibold line-through text-sm">₹{dish.actual_price}</span>
                                    </>
                                  )}
                                  <span className="text-base font-black text-gray-900 dark:text-gray-100">₹{dish.price}</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                                  {dish.rating && parseFloat(dish.rating) > 0 && (
                                    <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                      {dish.rating}
                                      {dish.reviews && parseInt(dish.reviews) > 0 && (
                                        <span className="text-gray-400 font-medium ml-0.5">({dish.reviews})</span>
                                      )}
                                    </span>
                                  )}
                                  {dish.prep_time && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      {dish.prep_time}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed max-w-md mt-2">
                                  {dish.description}
                                </p>
                              </div>
                            </div>

                            {/* Image & Action Section */}
                            <div className="relative flex flex-col items-center justify-start w-32 flex-shrink-0 mb-10">
                              <div className="w-32 h-32 bg-gray-100 dark:bg-[#1F1F2E] rounded-xl border border-gray-200 dark:border-[#2A2A3A] overflow-hidden shadow-sm relative flex items-center justify-center">
                                {dish.image_url ? (
                                  <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Utensils className="w-8 h-8 text-gray-300" />
                                )}

                                {dish.is_available === false ? (
                                  <div className="absolute inset-0 bg-white/60 dark:bg-[#0D0D17]/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                    <span className="bg-red-600 text-white font-black text-[10px] px-2 py-1 rounded shadow-sm uppercase tracking-widest text-center">Out of<br />Stock</span>
                                  </div>
                                ) : (isOutOfRange || isClosed) ? (
                                  <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-black/40 rounded-xl z-20 pointer-events-none">
                                    <span className="text-red-500 bg-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm border border-red-100">{isClosed ? "Closed Now" : "Out of Range"}</span>
                                  </div>
                                ) : null}

                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFood({ ...dish, restaurantId: vendor.id, restaurantName: vendor.name, isClosed: isClosed });
                                  }}
                                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-[#0D0D17]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2A2A3A] shadow-sm hover:scale-110 transition-transform"
                                >
                                  <Heart className={`w-3.5 h-3.5 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    try {
                                      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
                                      const res = await fetch(`${API}/api/share`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          type: 'item',
                                          target_id: dish.id,
                                          extra_data: { vendor_id: vendor.id }
                                        })
                                      });
                                      if (res.ok) {
                                        const { id } = await res.json();
                                        const shareUrl = `${window.location.origin}/s/${id}`;
                                        if (navigator.share) {
                                          await navigator.share({
                                            title: 'ZyphCart',
                                            text: `Hii get Your favourite ${dish.name} at just ₹${dish.price} grab it before it goes out of stock`,
                                            url: shareUrl
                                          });
                                        } else {
                                          await navigator.clipboard.writeText(`Hii get Your favourite ${dish.name} at just ₹${dish.price} grab it before it goes out of stock ${shareUrl}`);
                                          alert("Link copied to clipboard!");
                                        }
                                      }
                                    } catch (err) {
                                      console.error("Error sharing:", err);
                                    }
                                  }}
                                  className="absolute top-10 right-2 p-1.5 rounded-full bg-white dark:bg-[#0D0D17]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2A2A3A] shadow-sm hover:scale-110 transition-transform"
                                >
                                  <Send className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                </button>
                              </div>

                              {/* Quantity Selector and ADD Button */}
                              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 flex flex-col gap-1.5 items-center z-10">
                                {dish.is_available === false ? (
                                  <div className="w-full py-1.5 border border-red-200 font-black text-[10px] rounded-lg shadow-sm bg-red-50 text-red-600 text-center uppercase tracking-wider">
                                    Out of Stock
                                  </div>
                                ) : (
                                  <>
                                    <div className={`flex items-center justify-between w-20 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-full shadow-sm overflow-hidden h-6 ${isOutOfRange || isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setQuantities(q => ({ ...q, [dish.id]: Math.max(1, (q[dish.id] || 1) - 1) }));
                                        }}
                                        className="flex-1 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F2E] font-bold transition-colors text-xs"
                                      >
                                        -
                                      </button>
                                      <span className="font-bold text-xs text-gray-800 dark:text-gray-200 w-6 text-center">{quantities[dish.id] || 1}</span>
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setQuantities(q => ({ ...q, [dish.id]: (q[dish.id] || 1) + 1 }));
                                        }}
                                        className="flex-1 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F2E] font-bold transition-colors text-xs"
                                      >
                                        +
                                      </button>
                                    </div>
                                    <button
                                      disabled={isClosed || isOutOfRange}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const q = quantities[dish.id] || 1;
                                        addItem({
                                          id: dish.id,
                                          name: dish.name,
                                          price: dish.price,
                                          image: dish.image_url,
                                          type: dish.type as "veg" | "non-veg",
                                          restaurantId: vendor.id,
                                          restaurantName: vendor.name,
                                          section: "food",
                                        }, q);
                                        setQuantities(q => ({ ...q, [dish.id]: 1 }));
                                      }}
                                      className={`w-full py-1 border font-black text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1 uppercase tracking-wide ${isClosed || isOutOfRange
                                        ? "bg-gray-100 dark:bg-[#1F1F2E] text-gray-400 border-gray-200 dark:border-[#2A2A3A] cursor-not-allowed"
                                        : itemQty(dish.id, vendor.id) > 0
                                          ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                          : "bg-white dark:bg-[#0D0D17] text-orange-600 border-gray-200 dark:border-[#2A2A3A] hover:bg-orange-50"
                                        }`}
                                    >
                                      {isClosed || isOutOfRange
                                        ? "UNAVAILABLE"
                                        : itemQty(dish.id, vendor.id) > 0
                                          ? `ADDED (${itemQty(dish.id, vendor.id)})`
                                          : "ADD"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {isMenuLoading ? (
                  <MenuSkeleton />
                ) : filteredDishes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white dark:bg-[#0D0D17] rounded-3xl border border-gray-200 dark:border-[#2A2A3A]">
                    <span className="text-6xl mb-4">🍽️</span>
                    <p className="font-black text-gray-700 dark:text-gray-300 text-xl">No food available</p>
                    <p className="text-sm mt-2 font-medium">It will be available soon.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </>
      )}

      {/* Food Details Modal */}
      {selectedFood && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedFood(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-[#151522] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Image Header */}
            <div className="relative h-64 w-full bg-gray-100 dark:bg-[#1F1F2E] shrink-0">
              {selectedFood.image_url ? (
                <img src={selectedFood.image_url} alt={selectedFood.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-gray-300" />
                </div>
              )}

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFood({ ...selectedFood, restaurantId: vendor.id, restaurantName: vendor.name, isClosed: isClosed });
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors shadow-sm"
                >
                  <Heart className={`w-4 h-4 ${isFoodWished(selectedFood.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
                      const res = await fetch(`${API}/api/share`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'item', target_id: selectedFood.id, extra_data: { vendor_id: vendor.id } })
                      });
                      if (res.ok) {
                        const { id } = await res.json();
                        const shareUrl = `${window.location.origin}/s/${id}`;
                        if (navigator.share) await navigator.share({ title: 'ZyphCart', text: `Check out ${selectedFood.name}`, url: shareUrl });
                        else { await navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }
                      }
                    } catch (err) { }
                  }}
                  className="w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full backdrop-blur-sm hover:bg-black/70 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4 fill-orange-500 text-orange-500 -ml-0.5" />
                </button>
              </div>

              {/* Badges on image */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center bg-white dark:bg-[#0D0D17] ${selectedFood.type === "veg" ? "border-green-600" : "border-red-600"}`}>
                  <span className={`w-2 h-2 rounded-full ${selectedFood.type === "veg" ? "bg-green-600" : "bg-red-600"}`} />
                </span>
                {selectedFood.badge && (
                  <span className="text-[10px] px-2 py-1 rounded-md bg-orange-500 text-white font-black uppercase tracking-wider shadow-sm">
                    {selectedFood.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Details Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 leading-tight">{selectedFood.name}</h2>

              <div className="flex items-center gap-4 mb-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-gray-900 dark:text-gray-100">₹{selectedFood.price}</span>
                  {Number(selectedFood.actual_price) > Number(selectedFood.price || 0) && (
                    <span className="text-gray-400 font-semibold line-through text-sm">₹{selectedFood.actual_price}</span>
                  )}
                </div>

                {selectedFood.rating && parseFloat(selectedFood.rating) > 0 && (
                  <span className="flex items-center gap-1 bg-amber-50 dark:bg-[#1F1F2E] text-amber-600 px-2.5 py-1 rounded-lg text-sm font-bold border border-amber-100 dark:border-[#2A2A3A]">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {selectedFood.rating}
                    {selectedFood.reviews && parseInt(selectedFood.reviews) > 0 && (
                      <span className="opacity-70 ml-0.5">({selectedFood.reviews})</span>
                    )}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">About this item</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {selectedFood.description || "No description available for this delicious item."}
                </p>
              </div>

              {selectedFood.prep_time && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-[#0D0D17] p-3 rounded-xl border border-gray-100 dark:border-[#2A2A3A]">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Preparation time: <span className="font-bold text-gray-700 dark:text-gray-300">{selectedFood.prep_time}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#2A2A3A] bg-gray-50 dark:bg-[#0D0D17] flex gap-3 shrink-0">
              <button
                onClick={() => setSelectedFood(null)}
                className="flex-1 py-2.5 rounded-xl font-black text-gray-700 dark:text-gray-300 bg-white dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#1F1F2E] transition-colors shadow-sm"
              >
                CLOSE
              </button>

              {selectedFood.is_available === false ? (
                <div className="flex-1 py-2.5 flex items-center justify-center font-black text-red-600 bg-red-50 border border-red-200 rounded-xl shadow-sm">
                  OUT OF STOCK
                </div>
              ) : isClosed || isOutOfRange ? (
                <div className="flex-1 py-2.5 flex items-center justify-center font-black text-gray-400 bg-gray-100 dark:bg-[#1F1F2E] border border-gray-200 dark:border-[#2A2A3A] rounded-xl text-xs sm:text-sm shadow-sm">
                  {isClosed ? "CLOSED" : "OUT OF RANGE"}
                </div>
              ) : (
                <div className="flex-[1.5] flex gap-2">
                  <div className="flex items-center justify-between w-[90px] bg-white dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl shadow-sm overflow-hidden shrink-0">
                    <button
                      onClick={() => setQuantities(q => ({ ...q, [selectedFood.id]: Math.max(1, (q[selectedFood.id] || 1) - 1) }))}
                      className="flex-1 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F2E] font-bold transition-colors"
                    >-</button>
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-200 w-6 text-center">{quantities[selectedFood.id] || 1}</span>
                    <button
                      onClick={() => setQuantities(q => ({ ...q, [selectedFood.id]: (q[selectedFood.id] || 1) + 1 }))}
                      className="flex-1 h-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1F1F2E] font-bold transition-colors"
                    >+</button>
                  </div>
                  <button
                    onClick={() => {
                      const q = quantities[selectedFood.id] || 1;
                      addItem({
                        id: selectedFood.id,
                        name: selectedFood.name,
                        price: selectedFood.price,
                        image: selectedFood.image_url,
                        type: selectedFood.type as "veg" | "non-veg",
                        restaurantId: vendor.id,
                        restaurantName: vendor.name,
                        section: "food",
                      }, q);
                      setQuantities(q => ({ ...q, [selectedFood.id]: 1 }));
                      setSelectedFood(null);
                    }}
                    className="flex-1 py-2.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1 text-xs whitespace-nowrap"
                  >
                    {itemQty(selectedFood.id, vendor.id) > 0 ? `ADD MORE` : `ADD TO CART`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
