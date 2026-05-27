"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart, Loader2, Store, Utensils, ArrowDown, ChevronDown, LayoutList } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";
import { useWishlist } from "@/context/WishlistContext";

export default function VendorPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  const [vendor, setVendor] = useState<any>(null);
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

  const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg">("all");
  const [sortOrder, setSortOrder] = useState<"relevance" | "low-to-high" | "high-to-low">("relevance");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const { isFoodWished, toggleFood } = useWishlist();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addItem, itemQty } = useCart();
  const [menuItems, setMenuItems] = useState<any[]>([]);

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredDishes = menuItems
    .filter((dish: any) => foodPref === "all" || dish.type === foodPref)
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
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
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
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : !vendor ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 font-bold">Restaurant not found.</p>
        </div>
      ) : (
        <>
          {/* Vendor Hero */}
          <div className="bg-white border-b border-gray-200 shadow-sm relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 relative overflow-visible">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 mb-4 transition-colors bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex gap-4 items-center mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center">
              {vendor.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-black text-2xl md:text-3xl text-gray-900 tracking-tight">
                  {vendor.name}
                </h1>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm ${vendor.badgeColor}`}>
                  {vendor.badge}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2.5">{vendor.cuisine}</p>
              {(vendor.landmark || vendor.manualAddress || vendor.gpsAddress) && (
                <p className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-1">
                  <span className="text-sm shrink-0">📍</span> {vendor.landmark ? `${vendor.landmark}, ` : ""}{vendor.manualAddress || vendor.gpsAddress}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {vendor.rating} <span className="font-normal text-gray-400">({vendor.reviews})</span>
                </span>
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> {vendor.time}
                </span>
              </div>
            </div>
          </div>

          {/* ── Filter Bar ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 py-1">

            {/* Left side: View All + Category — NOT inside overflow-x-auto so dropdown renders freely */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View All */}
              <button
                onClick={() => { setFoodPref("all"); setSelectedCategory(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "all" && selectedCategory === null
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white/80 backdrop-blur-md border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                View All
              </button>

              {/* Category Picker */}
              <div className="relative" ref={catDropdownRef}>
                <button
                  onClick={() => setShowCatDropdown(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                    selectedCategory
                      ? "bg-orange-500 border-orange-500 text-white"
                      : showCatDropdown
                      ? "bg-orange-50 border-orange-400 text-orange-600"
                      : "bg-white/80 backdrop-blur-md border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <LayoutList className="w-3 h-3" />
                  <span className="max-w-[80px] truncate">{selectedCategory || "Category"}</span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${showCatDropdown ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown — renders freely outside overflow parent */}
                {showCatDropdown && (
                  <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden min-w-[180px]">
                    <div className="px-3 pt-2.5 pb-2 border-b border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filter by Category</p>
                    </div>
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {/* All option */}
                      <button
                        onClick={() => { setSelectedCategory(null); setShowCatDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-2 ${
                          selectedCategory === null
                            ? "bg-orange-50 text-orange-600"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span>All Categories</span>
                        {selectedCategory === null && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
                      </button>

                      {allCategories.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-gray-400 font-medium">No categories found</p>
                      ) : (
                        allCategories.map((cat: string) => (
                          <button
                            key={cat}
                            onClick={() => { setSelectedCategory(cat); setShowCatDropdown(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center justify-between gap-2 ${
                              selectedCategory === cat
                                ? "bg-orange-50 text-orange-600"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>{cat}</span>
                            {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: scrollable veg/non-veg/sort pills */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0">
              <button
                onClick={() => setFoodPref("veg")}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "veg"
                    ? "bg-orange-600 border-orange-600 text-white"
                    : "bg-white/80 backdrop-blur-md border-gray-200 text-gray-700"
                }`}
              >
                <span className={`w-3 h-3 rounded-sm border-2 ${foodPref === "veg" ? "border-white bg-white" : "border-orange-600"}`} />
                Veg Only
              </button>
              <button
                onClick={() => setFoodPref("non-veg")}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "non-veg"
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-white/80 backdrop-blur-md border-gray-200 text-gray-700"
                }`}
              >
                <span className={`w-3 h-3 rounded-sm border-2 ${foodPref === "non-veg" ? "border-white bg-white" : "border-red-600"}`} />
                Non-veg Only
              </button>

              <div className="relative flex-shrink-0 ml-auto">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="appearance-none flex items-center gap-1.5 pl-8 pr-8 py-1.5 rounded-full text-xs font-bold border border-gray-200 bg-white/80 backdrop-blur-md text-gray-700 shadow-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 cursor-pointer"
                >
                  <option value="relevance">Filter: Relevance</option>
                  <option value="low-to-high">Price: Low to High</option>
                  <option value="high-to-low">Price: High to Low</option>
                </select>
                <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">▼</div>
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
                <h2 className="font-black text-2xl text-gray-900 tracking-tight">{category}</h2>
                <div className="space-y-4">
                  {groupedDishes[category].map((dish: any) => {
                    const wished = isFoodWished(dish.id);
                    return (
                      <div
                        key={dish.id}
                        className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 flex gap-4 ${(dish.is_available === false || isOutOfRange || isClosed) ? "opacity-60 grayscale" : "hover:border-orange-300 hover:shadow-md"}`}
                      >
                        {/* Info Section */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            {/* Veg/Non-veg icon & Badge */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white ${dish.type === "veg" ? "border-green-600" : "border-red-600"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${dish.type === "veg" ? "bg-green-600" : "bg-red-600"}`} />
                              </span>
                              {dish.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded text-orange-700 bg-orange-100 font-bold uppercase tracking-wider">
                                  {dish.badge}
                                </span>
                              )}
                            </div>

                            <h3 className="font-black text-gray-900 text-lg tracking-tight mb-0.5">
                              {dish.name}
                            </h3>
                            
                            <div className="flex items-baseline gap-1.5 mb-2 mt-2">
                              {dish.actual_price && Number(dish.actual_price) > Number(dish.price || 0) && (
                                <>
                                  <span className="flex items-center gap-0.5 text-green-600 font-black text-[13px]">
                                    <ArrowDown className="w-3.5 h-3.5" strokeWidth={3} />
                                    {Math.round(((Number(dish.actual_price) - Number(dish.price || 0)) / Number(dish.actual_price)) * 100)}%
                                  </span>
                                  <span className="text-gray-400 font-semibold line-through text-sm">₹{dish.actual_price}</span>
                                </>
                              )}
                              <span className="text-base font-black text-gray-900">₹{dish.price}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
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
                          <div className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm relative flex items-center justify-center">
                            {dish.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                            ) : (
                              <Utensils className="w-8 h-8 text-gray-300" />
                            )}
                            
                            {dish.is_available === false ? (
                              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                                <span className="bg-red-600 text-white font-black text-[10px] px-2 py-1 rounded shadow-sm uppercase tracking-widest text-center">Out of<br/>Stock</span>
                              </div>
                            ) : (isOutOfRange || isClosed) ? (
                              <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-black/10 rounded-xl z-20">
                                <span className="text-white font-black text-[10px] uppercase bg-black/60 px-2 py-0.5 rounded-full">{isClosed ? "Closed" : "Out of Range"}</span>
                              </div>
                            ) : null}

                            <button
                              onClick={() => toggleFood({...dish, restaurantId: vendor.id, restaurantName: vendor.name})}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                            >
                              <Heart className={`w-3.5 h-3.5 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
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
                                <div className={`flex items-center justify-between w-20 bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden h-6 ${isOutOfRange || isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setQuantities(q => ({ ...q, [dish.id]: Math.max(1, (q[dish.id] || 1) - 1) }));
                                    }}
                                    className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 font-bold transition-colors text-xs"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-xs text-gray-800 w-6 text-center">{quantities[dish.id] || 1}</span>
                                  <button 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setQuantities(q => ({ ...q, [dish.id]: (q[dish.id] || 1) + 1 }));
                                    }}
                                    className="flex-1 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 font-bold transition-colors text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                                <button 
                                  disabled={isClosed || isOutOfRange}
                                  onClick={(e) => {
                                    e.preventDefault();
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
                                  className={`w-full py-1 border font-black text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1 uppercase tracking-wide ${
                                    isClosed || isOutOfRange
                                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                      : itemQty(dish.id, vendor.id) > 0
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-white text-orange-600 border-gray-200 hover:bg-orange-50"
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

            {filteredDishes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-200">
                <span className="text-6xl mb-4">🍽️</span>
                <p className="font-black text-gray-700 text-xl">No food available</p>
                <p className="text-sm mt-2 font-medium">It will be available soon.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      </>
      )}

      <MobileBottomNav />
    </div>
  );
}
