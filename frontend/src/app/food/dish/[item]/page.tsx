"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart, ArrowDown, Share2, Send, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);
  const { toggleFood, isFoodWished } = useWishlist();
  const { addItem, itemQty } = useCart();
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const { isLoggedIn, openLoginModal } = useAuth();
  const { latitude, longitude, pincode } = useLocationContext();

  const [dishes, setDishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPage(1);
    setDishes([]);
    setHasMore(true);
    fetchDishes(1, true);
  }, [rawItem, foodPref, sortOrder, latitude, longitude, pincode]);

  async function fetchDishes(pageNum = 1, isReset = false) {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);
    
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const searchCategory = rawItem.replace(/-/g, " ");
      
      const query = new URLSearchParams({
        page: pageNum.toString(),
        limit: "20"
      });
      if (foodPref !== "all") query.append("foodPref", foodPref);
      if (sortOrder !== "relevance") query.append("sortOrder", sortOrder);
      if (latitude && longitude) {
        query.append("lat", latitude.toString());
        query.append("lon", longitude.toString());
      } else if (pincode) {
        query.append("pincode", pincode);
      }

      const res = await fetch(`${API}/api/public/dishes/${encodeURIComponent(searchCategory)}?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newDishes = data.dishes || [];
        setHasMore(pageNum < (data.pagination?.totalPages || 1));
        setDishes(prev => isReset ? newDishes : [...prev, ...newDishes]);
      }
    } catch (err) {
      console.error("Failed to fetch dishes", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchDishes(next, false);
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

  const filteredDishes = dishes;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-600 transition-colors bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-200/50 hover:border-orange-200 flex-shrink-0">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>


            <div className="ml-auto flex items-center gap-2 relative z-40">
              {/* Filter Picker */}
              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setShowFilterDropdown(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                    foodPref !== "all" || sortOrder !== "relevance"
                      ? "bg-orange-500 border-orange-500 text-white"
                      : showFilterDropdown
                      ? "bg-orange-50 border-orange-400 text-orange-600"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Filters</span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden min-w-[240px] max-w-[calc(100vw-32px)]">
                    <div className="px-3 pt-2.5 pb-2 border-b border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DIETARY PREFERENCE</p>
                    </div>
                    <div className="py-1 max-h-[40vh] overflow-y-auto">
                      {[
                        { id: "all", label: "View All" },
                        { id: "veg", label: "Veg Only" },
                        { id: "non-veg", label: "Non Veg Only" },
                      ].map((pref) => (
                        <button
                          key={pref.id}
                          onClick={() => { setFoodPref(pref.id as any); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${
                            foodPref === pref.id
                              ? "bg-orange-50 text-orange-600"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${foodPref === pref.id ? 'border-orange-500' : 'border-gray-300'}`}>
                            {foodPref === pref.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                          </div>
                          <span>{pref.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="px-3 pt-2.5 pb-2 border-y border-gray-100 bg-gray-50">
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
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${
                            sortOrder === sort.id
                              ? "bg-orange-50 text-orange-600"
                              : "text-gray-700 hover:bg-gray-50"
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
                        {Number(dish.actual_price) > Number(dish.price || 0) && (
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
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            const url = window.location.href;
                            try {
                              if (navigator.share) {
                                await navigator.share({
                                  title: `NearBuy - ${dish.name}`,
                                  text: `Check out ${dish.name} by ${dish.vendor} on NearBuy!`,
                                  url: url
                                });
                              } else {
                                await navigator.clipboard.writeText(`Check out ${dish.name} by ${dish.vendor} on NearBuy! ${url}`);
                                toast.success("Link copied to clipboard!");
                              }
                            } catch (err) {}
                          }}
                          className={`p-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-transform bg-white/80 border-gray-200 hover:scale-110`}
                          title="Share"
                        >
                          <Send className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        </button>
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
                          className={`p-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-transform ${isOutOfRange ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 'bg-white/80 border-gray-200 hover:scale-110'}`}
                          disabled={isOutOfRange}
                        >
                          <Heart className={`w-3.5 h-3.5 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                        </button>
                      </div>
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
            {/* Infinite Scroll Loader */}
            {hasMore && filteredDishes.length > 0 && (
              <div ref={lastElementRef} className="w-full h-16 flex items-center justify-center mt-6">
                {loadingMore && <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
