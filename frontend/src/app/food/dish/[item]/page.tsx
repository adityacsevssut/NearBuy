"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart, ArrowDown, Share2, Send, ChevronDown, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import Footer from "@/components/Footer";
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

function DishCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0D0D17] p-4 rounded-2xl border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex gap-4 animate-pulse">
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="h-5 w-3/4 bg-gray-200 dark:bg-[#1F1F2E] rounded-full mb-3"></div>
          <div className="h-3 w-1/3 bg-gray-200 dark:bg-[#1F1F2E] rounded-full mb-4"></div>
          <div className="h-5 w-1/4 bg-gray-200 dark:bg-[#1F1F2E] rounded-full mb-4"></div>
          <div className="flex gap-3 mb-4">
            <div className="h-3 w-12 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
            <div className="h-3 w-16 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
          </div>
          <div className="h-2.5 w-full bg-gray-200 dark:bg-[#1F1F2E] rounded-full mb-2"></div>
          <div className="h-2.5 w-5/6 bg-gray-200 dark:bg-[#1F1F2E] rounded-full"></div>
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-start w-32 flex-shrink-0 mb-8">
        <div className="w-32 h-32 bg-gray-200 dark:bg-[#1F1F2E] rounded-xl border border-gray-100 dark:border-[#2A2A3A]"></div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-gray-300 dark:bg-[#2A2A3A] rounded-lg shadow-sm border border-gray-100 dark:border-[#3A3A4A]"></div>
      </div>
    </div>
  );
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
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [availableTypes, setAvailableTypes] = useState<string[]>(['veg', 'non-veg']);

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

      const res = await fetch(`${API}/api/public/dishes/${encodeURIComponent(searchCategory)}?${query.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const newDishes = data.dishes || [];
        setHasMore(pageNum < (data.pagination?.totalPages || 1));
        setDishes(prev => isReset ? newDishes : [...prev, ...newDishes]);
        if (data.availableTypes) {
          setAvailableTypes(data.availableTypes);
        }
      }
    } catch (err) {
      console.error("Failed to fetch dishes", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }

  // Infinite Scroll Observer removed in favor of manual "Load More" button

  const filteredDishes = dishes;

  return (
    <div className="min-h-screen bg-white dark:bg-[#151522] flex flex-col pt-16">
      <Navbar />

      {/* Sticky Header */}
      <div className="sticky top-16 z-40 bg-white dark:bg-[#0D0D17] border-b border-gray-200 dark:border-[#2A2A3A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 py-4">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-orange-600 transition-colors bg-white dark:bg-[#0D0D17]/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-[#2A2A3A]/50 hover:border-orange-200 flex-shrink-0">
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
                      : "bg-white dark:bg-[#0D0D17] border-gray-200 dark:border-[#2A2A3A] text-gray-700 dark:text-gray-300 hover:border-gray-300"
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Filters</span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${showFilterDropdown ? "rotate-180" : ""}`} />
                </button>

                {showFilterDropdown && (
                  <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl shadow-2xl overflow-hidden min-w-[240px] max-w-[calc(100vw-32px)]">
                    <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-[#2A2A3A]">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">DIETARY PREFERENCE</p>
                    </div>
                    <div className="py-1 max-h-[40vh] overflow-y-auto">
                      {[
                        { id: "all", label: "View All" },
                        { id: "veg", label: "Veg Only" },
                        { id: "non-veg", label: "Non Veg Only" },
                      ]
                      .filter(pref => pref.id === "all" || availableTypes.includes(pref.id))
                      .map((pref) => (
                        <button
                          key={pref.id}
                          onClick={() => { setFoodPref(pref.id as any); setShowFilterDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${
                            foodPref === pref.id
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
                          className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${
                            sortOrder === sort.id
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
              const isClosed = dish.vendor_is_open === false;
              const isUnavailable = isOutOfRange || isClosed;

              return (
                <div
                  key={dish.id}
                  onClick={() => setSelectedFood(dish)}
                  className={`bg-white dark:bg-[#0D0D17] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm transition-all duration-300 flex gap-4 cursor-pointer ${isUnavailable ? 'opacity-60 grayscale' : 'hover:border-orange-300 hover:shadow-md'}`}
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
                      
                      {/* Vendor name with location pin styling */}
                      <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        by <span className="text-orange-gradient">{dish.vendor}</span>
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
                        <span className="text-base font-black text-gray-900 dark:text-gray-100">₹{dish.price}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span className="flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
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
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100 dark:border-[#2A2A3A] flex items-center justify-center text-6xl shadow-inner relative overflow-hidden">
                      {dish.image_url ? (
                        <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                      ) : (
                        dish.emoji || "🍽️"
                      )}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = window.location.href;
                            try {
                              if (navigator.share) {
                                await navigator.share({
                                  title: `ZyphCart - ${dish.name}`,
                                  text: `Check out ${dish.name} by ${dish.vendor} on ZyphCart!`,
                                  url: url
                                });
                              } else {
                                await navigator.clipboard.writeText(`Check out ${dish.name} by ${dish.vendor} on ZyphCart! ${url}`);
                                toast.success("Link copied to clipboard!");
                              }
                            } catch (err) {}
                          }}
                          className={`p-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-transform bg-white dark:bg-[#0D0D17]/80 border-gray-200 dark:border-[#2A2A3A] hover:scale-110`}
                          title="Share"
                        >
                          <Send className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isUnavailable) return;
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
                          className={`p-1.5 rounded-full backdrop-blur-sm border shadow-sm transition-transform ${isUnavailable ? 'bg-gray-100 dark:bg-[#1F1F2E] border-gray-300 cursor-not-allowed' : 'bg-white dark:bg-[#0D0D17]/80 border-gray-200 dark:border-[#2A2A3A] hover:scale-110'}`}
                          disabled={isUnavailable}
                        >
                          <Heart className={`w-3.5 h-3.5 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                        </button>
                      </div>
                      {(isOutOfRange || isClosed) && (
                        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-xl z-20">
                          <span className="text-white font-black text-[10px] uppercase bg-black/60 px-2 py-0.5 rounded-full">{isClosed ? "Closed" : "Out of Range"}</span>
                        </div>
                      )}
                    </div>

                    {/* Quantity Selector and ADD Button */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 flex flex-col gap-1.5 items-center z-10">
                      <div className={`flex items-center justify-between w-20 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-full shadow-sm overflow-hidden h-6 ${isUnavailable ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isUnavailable) return;
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
                        disabled={isUnavailable}
                        className={`w-full py-1 border font-black text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-1 uppercase tracking-wide ${
                          isUnavailable 
                            ? "bg-gray-100 dark:bg-[#1F1F2E] text-gray-400 border-gray-200 dark:border-[#2A2A3A] cursor-not-allowed"
                            : inCartCount > 0
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                              : "bg-white dark:bg-[#0D0D17] text-orange-600 border-gray-200 dark:border-[#2A2A3A] hover:bg-orange-50"
                        }`}
                      >
                        {inCartCount > 0 ? `ADDED (${inCartCount})` : "ADD"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {loadingMore && filteredDishes.length > 0 && (
              <>
                {[1, 2, 3].map(i => <DishCardSkeleton key={`loading-more-${i}`} />)}
              </>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <DishCardSkeleton key={`initial-${i}`} />)}
              </div>
            ) : filteredDishes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white dark:bg-[#0D0D17] rounded-3xl border border-gray-200 dark:border-[#2A2A3A]">
                <motion.span 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-6xl mb-4 inline-block"
                >
                  🍽️
                </motion.span>
                <p className="font-black text-gray-700 dark:text-gray-300 text-xl text-center">No {itemName} found</p>
                <p className="text-sm mt-2 font-medium text-center px-6 max-w-xs leading-relaxed">
                  Try disabling the Veg Only filter or check back later.
                </p>
              </div>
            )}
            {/* Load More Button */}
            {hasMore && filteredDishes.length > 0 && (
              <div className="w-full flex justify-center mt-10 mb-6">
                  <button
                    onClick={() => {
                      if (hasMore && !loadingMore) {
                        setPage((prev) => {
                          const next = prev + 1;
                          fetchDishes(next, false);
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
          </div>
        </div>

        {/* Food Details Modal */}
        {selectedFood && (() => {
          const vendorLat = selectedFood.latitude ? parseFloat(selectedFood.latitude) : null;
          const vendorLon = selectedFood.longitude ? parseFloat(selectedFood.longitude) : null;
          const rawDistance = getDistance(latitude ? parseFloat(latitude.toString()) : null, longitude ? parseFloat(longitude.toString()) : null, vendorLat, vendorLon);
          const isOutOfRange = rawDistance != null && rawDistance > (selectedFood.delivery_range ? parseFloat(selectedFood.delivery_range) : 5);
          const isClosed = selectedFood.vendor_is_open === false;
          const isUnavailable = isOutOfRange || isClosed;

          return (
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
                        toggleFood({ ...selectedFood, restaurantId: selectedFood.vendor_id, restaurantName: selectedFood.vendor });
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
                            body: JSON.stringify({ type: 'item', target_id: selectedFood.id, extra_data: { vendor_id: selectedFood.vendor_id } })
                          });
                          if (res.ok) {
                            const { id } = await res.json();
                            const shareUrl = `${window.location.origin}/s/${id}`;
                            if (navigator.share) await navigator.share({ title: 'ZyphCart', text: `Check out ${selectedFood.name}`, url: shareUrl });
                            else { await navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }
                          }
                        } catch (err) {}
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
                      {selectedFood.desc || selectedFood.description || "No description available for this delicious item."}
                    </p>
                  </div>

                  {selectedFood.time && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-[#0D0D17] p-3 rounded-xl border border-gray-100 dark:border-[#2A2A3A]">
                      <Clock className="w-4 h-4 text-orange-400" />
                      Preparation time: <span className="font-bold text-gray-700 dark:text-gray-300">{selectedFood.time}</span>
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
                  ) : isUnavailable ? (
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
                            restaurantId: selectedFood.vendor_id,
                            restaurantName: selectedFood.vendor,
                            section: "food",
                          }, q);
                          setQuantities(q => ({ ...q, [selectedFood.id]: 1 }));
                          setSelectedFood(null);
                        }}
                        className="flex-1 py-2.5 px-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1 text-xs whitespace-nowrap"
                      >
                        {itemQty(selectedFood.id, selectedFood.vendor_id) > 0 ? `ADD MORE` : `ADD TO CART`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </main>

      <MobileBottomNav />
    </div>
  );
}
