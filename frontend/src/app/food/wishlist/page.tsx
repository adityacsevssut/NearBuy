"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Star, Clock, Utensils, Heart, ArrowDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function WishlistPage() {
  const { restaurantWishlist, foodWishlist, toggleRestaurant, toggleFood } = useWishlist();
  const { addItem, itemQty } = useCart();
  const { latitude, longitude } = useLocationContext();
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/");
    }
  }, [mounted, isLoggedIn, router]);

  const getDistance = (lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) => {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!mounted || (!isLoggedIn && mounted)) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D0D17] flex flex-col pt-16 pb-24 md:pb-8">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-full text-gray-500 dark:text-gray-400 hover:text-orange-500 shadow-sm transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-2xl md:text-3xl text-gray-900 dark:text-gray-100 tracking-tight">
            Your <span className="text-rose-500">Wishlist</span>
          </h1>
        </div>

        {restaurantWishlist.length === 0 && foodWishlist.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 sm:py-40 text-gray-400 bg-white dark:bg-[#0D0D17] rounded-3xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm mt-8">
            <Heart className="w-16 h-16 mb-4 text-gray-300" />
            <p className="font-bold text-gray-600 dark:text-gray-400 text-lg">Your wishlist is empty</p>
            <p className="text-sm mt-1 max-w-[250px] text-center">Start adding your favorite restaurants and dishes!</p>
            <Link href="/" className="mt-6 px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl shadow-sm shadow-orange-500/20 hover:bg-orange-600 transition-colors">
              Explore Food
            </Link>
          </div>
        )}

        {/* RESTAURANTS SECTION */}
        {restaurantWishlist.length > 0 && (
          <div className="mb-12">
            <h2 className="font-black text-xl text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <StoreIcon /> Saved Restaurants
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {restaurantWishlist.map((r) => (
                <Link
                  href={`/vendor/${r.id}`}
                  key={r.id}
                  className={`relative group flex flex-col bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 text-left transition-all duration-300 overflow-hidden ${r.isClosed ? "opacity-75" : ""}`}
                >
                  <div className="relative w-full h-40 bg-gray-100 dark:bg-[#1F1F2E] flex items-center justify-center border-b border-gray-100 dark:border-[#2A2A3A] overflow-hidden">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${r.isClosed ? 'grayscale' : ''}`} />
                    ) : (
                      <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                        <Utensils className="w-10 h-10 text-orange-200" />
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleRestaurant(r);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-[#0D0D17]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2A2A3A] shadow-sm hover:scale-110 transition-transform z-30"
                    >
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </button>
                    
                    {r.isClosed && (
                      <div className="absolute inset-0 bg-white dark:bg-[#0D0D17]/40 flex items-center justify-center z-20 pointer-events-none">
                        <span className="text-red-600 font-black text-xs uppercase tracking-widest px-3 py-1 bg-white dark:bg-[#0D0D17]/80 rounded-md shadow-sm">
                          Closed Now
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3.5 flex flex-col justify-between flex-1 w-full bg-white dark:bg-[#0D0D17]">
                    <div>
                      <div className="flex justify-between items-start mb-0.5">
                        <p className="font-black text-gray-900 dark:text-gray-100 text-base tracking-tight truncate">{r.name}</p>
                        <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-orange-600 px-1.5 py-0.5 rounded shadow-sm">
                          <Star className="w-3 h-3 fill-white" />
                          {r.rating || "New"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{r.type}</p>
                      
                      <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                        {r.distance && (
                          <span className="bg-orange-50 border border-orange-100 px-2 py-1 rounded-md shadow-sm text-orange-600 font-bold flex items-center gap-0.5">
                            📍 {r.distance}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FOOD ITEMS SECTION */}
        {foodWishlist.length > 0 && (
          <div>
            <h2 className="font-black text-xl text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" /> Saved Dishes
            </h2>
            <div className="space-y-4">
              {foodWishlist.map((dish) => (
                <div
                  key={dish.id}
                  className={`relative bg-white dark:bg-[#0D0D17] p-4 rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-sm transition-all duration-300 flex gap-4 ${dish.is_available === false ? "opacity-75 grayscale-[0.2]" : "hover:border-orange-300 hover:shadow-md"}`}
                >
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white dark:bg-[#0D0D17] ${dish.type === "veg" ? "border-green-600" : "border-red-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dish.type === "veg" ? "bg-green-600" : "bg-red-600"}`} />
                        </span>
                        {dish.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded text-orange-700 bg-orange-100 font-bold uppercase tracking-wider">
                            {dish.badge}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg tracking-tight mb-0.5">
                        {dish.name}
                      </h3>
                      
                      <Link href={`/vendor/${dish.restaurantId}`} className="text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors mb-1 block">
                        by <span className="font-bold">{dish.restaurantName}</span>
                      </Link>
                      
                      <div className="flex items-baseline gap-1.5 mb-2 mt-1">
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
                      
                      {dish.is_available === false && (
                        <div className="absolute inset-0 bg-white dark:bg-[#0D0D17]/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white font-black text-[10px] px-2 py-1 rounded shadow-sm uppercase tracking-widest text-center">Out of<br/>Stock</span>
                        </div>
                      )}
                      
                      <button
                        onClick={() => toggleFood(dish)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white dark:bg-[#0D0D17]/80 backdrop-blur-sm border border-gray-200 dark:border-[#2A2A3A] shadow-sm hover:scale-110 transition-transform z-20"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      </button>
                    </div>
                    
                    {/* Add Button */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 flex flex-col gap-1.5 items-center z-10">
                      {dish.is_available === false ? (
                        <div className="w-full py-1.5 border border-red-200 font-black text-[10px] rounded-lg shadow-sm bg-red-50 text-red-600 text-center uppercase tracking-wider">
                          Out of Stock
                        </div>
                      ) : (
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              addItem({
                                id: Number(dish.id),
                                name: dish.name,
                                price: Number(dish.price),
                                image: dish.image_url,
                                type: dish.type as "veg" | "non-veg",
                                restaurantId: dish.restaurantId,
                                restaurantName: dish.restaurantName,
                                section: "food",
                              }, 1);
                            }}
                            className={`w-full py-1.5 border font-black text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center uppercase tracking-wide ${
                              itemQty(Number(dish.id), dish.restaurantId) > 0
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                              : "bg-white dark:bg-[#0D0D17] text-orange-600 border-gray-200 dark:border-[#2A2A3A] hover:bg-orange-50"
                            }`}
                          >
                            {itemQty(Number(dish.id), dish.restaurantId) > 0 ? `ADDED (${itemQty(Number(dish.id), dish.restaurantId)})` : "ADD"}
                          </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}

function StoreIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}
