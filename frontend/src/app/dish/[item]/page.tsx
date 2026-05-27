"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart, ArrowDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";

function deg2rad(d: number) { return d * (Math.PI / 180); }

function getDistance(lat1: number|null, lon1: number|null, lat2: number|null, lon2: number|null) {
  if (lat1==null||lon1==null||lat2==null||lon2==null) return null;
  const R = 6371, dLat = deg2rad(lat2-lat1), dLon = deg2rad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(deg2rad(lat1))*Math.cos(deg2rad(lat2))*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default function DishPage() {
  const params = useParams();
  const rawItem = (params.item as string) || "";
  // Decode and format the item name: "cold-coffee" -> "Cold Coffee"
  const itemName = rawItem
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg">("all");
  const [sortOrder, setSortOrder] = useState<"relevance" | "low-to-high" | "high-to-low">("relevance");
  const { toggleFood, isFoodWished } = useWishlist();
  const { addItem, itemQty } = useCart();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { isLoggedIn, openLoginModal } = useAuth();
  const { latitude, longitude } = useLocationContext();

  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDishes() {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        // We'll search for the rawItem directly to handle URL-friendly versions like 'chicken-pokoda'
        // But the front page category could be either. We use rawItem and replace dashes with spaces.
        const searchCategory = rawItem.replace(/-/g, " ");
        const res = await fetch(`${API}/api/public/dishes/${encodeURIComponent(searchCategory)}`);
        if (res.ok) {
          const data = await res.json();
          setDishes(data.dishes || []);
        }
      } catch (err) {
        console.error("Failed to fetch dishes", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDishes();
  }, [rawItem]);

  const filteredDishes = dishes
    .filter((dish) => foodPref === "all" || dish.type === foodPref)
    .sort((a, b) => {
      if (sortOrder === "low-to-high") return a.price - b.price;
      if (sortOrder === "high-to-low") return b.price - a.price;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-4">
            <Link href="/" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-black text-xl text-gray-900 tracking-tight">
                {itemName}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {filteredDishes.length} dishes found near you
              </p>
            </div>

            <div className="ml-auto flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 pl-4">
              <button
                onClick={() => setFoodPref("all")}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "all"
                    ? "bg-gray-900 border-gray-900 text-white"
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                View All
              </button>
              <button
                onClick={() => setFoodPref("veg")}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                  foodPref === "veg"
                    ? "bg-orange-600 border-orange-600 text-white"
                    : "bg-white border-gray-300 text-gray-600"
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
                    : "bg-white border-gray-300 text-gray-600"
                }`}
              >
                <span className={`w-3 h-3 rounded-sm border-2 ${foodPref === "non-veg" ? "border-white bg-white" : "border-red-600"}`} />
                Non-veg Only
              </button>

              <div className="relative flex-shrink-0">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="appearance-none flex items-center gap-1.5 pl-8 pr-8 py-1.5 rounded-full text-xs font-bold border border-gray-300 bg-white text-gray-700 shadow-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 cursor-pointer"
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
          <div className="space-y-4">
            {filteredDishes.map((dish) => {
              const wished = isFoodWished(dish.id);
              const inCartCount = itemQty(dish.id, dish.vendor_id);
              
              const vendorLat = dish.latitude ? parseFloat(dish.latitude) : null;
              const vendorLon = dish.longitude ? parseFloat(dish.longitude) : null;
              const rawDistance = getDistance(latitude ? parseFloat(latitude.toString()) : null, longitude ? parseFloat(longitude.toString()) : null, vendorLat, vendorLon);
              const isOutOfRange = rawDistance != null && rawDistance > (dish.delivery_range ? parseFloat(dish.delivery_range) : 5);

              return (
                <div
                  key={dish.id}
                  className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 flex gap-4 ${isOutOfRange ? 'opacity-60 grayscale' : 'hover:border-orange-300 hover:shadow-md'}`}
                >
                  {/* Info Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      {/* Veg/Non-veg icon & Badge */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white ${dish.type === "veg" ? "border-orange-600" : "border-red-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dish.type === "veg" ? "bg-orange-600" : "bg-red-600"}`} />
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
                      
                      {/* Vendor name with location pin styling */}
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        by <span className="text-orange-700">{dish.vendor}</span>
                      </p>

                      <div className="flex items-baseline gap-1.5 mb-2">
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

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1 font-bold text-gray-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {dish.rating} <span className="font-normal text-gray-400">({dish.reviews})</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {dish.time}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed max-w-md">
                        {dish.desc}
                      </p>
                    </div>
                  </div>

                  {/* Image & Action Section */}
                  <div className="relative flex flex-col items-center justify-start w-32 flex-shrink-0 mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100 flex items-center justify-center text-6xl shadow-inner relative overflow-hidden">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                      ) : (
                        dish.emoji || "🍽️"
                      )}
                      <button
                        onClick={() => {
                          if (isOutOfRange) return;
                          toggleFood({
                            id: dish.id,
                            name: dish.name,
                            price: dish.price,
                            actual_price: dish.actual_price,
                            type: dish.type,
                            badge: dish.badge || "",
                            description: dish.desc || "",
                            image_url: dish.image_url || "",
                            rating: dish.rating?.toString() || "0",
                            prep_time: dish.time || "30 min",
                            reviews: dish.reviews?.toString() || "0",
                            restaurantId: dish.vendor_id || "",
                            restaurantName: dish.vendor || "Unknown",
                            is_available: dish.is_available
                          });
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-transform ${isOutOfRange ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white/80 border-gray-200 hover:scale-110'}`}
                        disabled={isOutOfRange}
                      >
                        <Heart className={`w-3.5 h-3.5 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                      </button>
                      {isOutOfRange && (
                        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-black/10 rounded-xl z-20">
                          <span className="text-white font-black text-[10px] uppercase bg-black/60 px-2 py-0.5 rounded-full">Out of Range</span>
                        </div>
                      )}
                    </div>

                    {/* Quantity Selector and ADD Button */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 flex flex-col gap-1.5 items-center z-10">
                      <div className={`flex items-center justify-between w-20 bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden h-6 ${isOutOfRange ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          if (isOutOfRange) return;
                          if (!isLoggedIn) return openLoginModal();
                          const q = quantities[dish.id] || 1;
                          addItem({
                            id: dish.id,
                            name: dish.name,
                            price: dish.price,
                            image: dish.image_url || "",
                            type: dish.type,
                            restaurantId: dish.vendor_id,
                            restaurantName: dish.vendor,
                            section: "food"
                          }, q);
                          setQuantities(q => ({ ...q, [dish.id]: 1 }));
                        }}
                        disabled={isOutOfRange}
                        className={`w-full py-1 border font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 uppercase tracking-wide ${
                          isOutOfRange 
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : inCartCount > 0
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                              : "bg-white text-orange-600 border-gray-200 hover:bg-orange-50"
                        }`}
                      >
                        {inCartCount > 0 ? `ADDED (${inCartCount})` : "ADD"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-200">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-gray-700 text-xl">Loading dishes...</p>
              </div>
            ) : filteredDishes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-200">
                <span className="text-6xl mb-4">🍽️</span>
                <p className="font-black text-gray-700 text-xl">No {itemName} found</p>
                <p className="text-sm mt-2 font-medium">Try disabling the Veg Only filter or check back later.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
