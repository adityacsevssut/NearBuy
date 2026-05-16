"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

const restaurants = [
  {
    id: "rest-1",
    name: "Sharma Dhaba",
    cuisine: "North Indian · Biryani · Thali",
    rating: 4.7,
    reviews: 320,
    time: "12–15 min",
    image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=500&q=80",
    badge: "Bestseller",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "rest-2",
    name: "Maggi Corner",
    cuisine: "Fast Food · Noodles · Snacks",
    rating: 4.5,
    reviews: 210,
    time: "8–12 min",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=500&q=80",
    badge: "Late Night",
    badgeColor: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "rest-3",
    name: "Campus Café",
    cuisine: "Beverages · Sandwiches · Pastries",
    rating: 4.6,
    reviews: 180,
    time: "10–14 min",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=500&q=80",
    badge: "Top Rated",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "rest-4",
    name: "Pizza Bhai",
    cuisine: "Pizza · Pasta · Garlic Bread",
    rating: 4.3,
    reviews: 95,
    time: "18–22 min",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80",
    badge: "New",
    badgeColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "rest-5",
    name: "Hostel Meals",
    cuisine: "Home Style · Thali · Dal Rice",
    rating: 4.4,
    reviews: 140,
    time: "15–20 min",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=500&q=80",
    badge: "Budget Pick",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    id: "rest-6",
    name: "Rolls & Wraps",
    cuisine: "Rolls · Wraps · Kathi",
    rating: 4.2,
    reviews: 88,
    time: "10–15 min",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=500&q=80",
    badge: "Popular",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];

export default function VendorPage() {
  const params = useParams();
  const vendorId = params.vendorId as string;
  const vendor = restaurants.find(r => r.id === vendorId) || restaurants[0];

  const [foodPref, setFoodPref] = useState<"all" | "veg" | "non-veg">("all");
  const [sortOrder, setSortOrder] = useState<"relevance" | "low-to-high" | "high-to-low">("relevance");
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Generate mock dish data for this vendor
  const mockDishes = [
    {
      id: 1,
      name: `Chicken Dum Biryani`,
      category: "Biryani",
      price: 180,
      rating: 4.5,
      reviews: 142,
      type: "non-veg",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80",
      badge: "Bestseller",
      desc: `Authentic and delicious dum biryani prepared with fresh ingredients and secret spices.`,
    },
    {
      id: 2,
      name: `Egg Chicken Roll`,
      category: "Roll",
      price: 90,
      rating: 4.2,
      reviews: 89,
      type: "non-veg",
      image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=300&q=80",
      badge: "Spicy",
      desc: `For the spice lovers! Our signature roll with an extra kick of flavours.`,
    },
    {
      id: 3,
      name: `Chole Bhature`,
      category: "Others",
      price: 120,
      rating: 4.8,
      reviews: 210,
      type: "veg",
      image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80",
      badge: "Must Try",
      desc: `A premium combo featuring our top-rated chole bhature along with onion rings.`,
    },
    {
      id: 4,
      name: `Paneer Butter Masala`,
      category: "Others",
      price: 180,
      rating: 4.1,
      reviews: 305,
      type: "veg",
      image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=300&q=80",
      badge: "Pocket Friendly",
      desc: `Rich and creamy paneer butter masala, perfect with naan or rice.`,
    },
    {
      id: 5,
      name: `Special Veg Thali`,
      category: "Others",
      price: 150,
      rating: 4.6,
      reviews: 112,
      type: "veg",
      image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80",
      badge: "Serves 1",
      desc: `A complete meal with dal, sabzi, roti, rice, sweet, and papad.`,
    },
  ];

  const filteredDishes = mockDishes
    .filter((dish) => foodPref === "all" || dish.type === foodPref)
    .sort((a, b) => {
      if (sortOrder === "low-to-high") return a.price - b.price;
      if (sortOrder === "high-to-low") return b.price - a.price;
      return 0;
    });

  const groupedDishes = filteredDishes.reduce((acc, dish) => {
    if (!acc[dish.category]) acc[dish.category] = [];
    acc[dish.category].push(dish);
    return acc;
  }, {} as Record<string, typeof mockDishes>);

  const categoryNames = Object.keys(groupedDishes).sort((a, b) => {
    if (a === "Others") return 1;
    if (b === "Others") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      {/* Vendor Hero */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 mb-4 transition-colors bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="flex gap-4 items-center mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
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
              <p className="text-sm font-medium text-gray-500 mb-2">{vendor.cuisine}</p>
              
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

          {/* Filters combined with header */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => setFoodPref("all")}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-sm ${
                foodPref === "all"
                  ? "bg-gray-900 border-gray-900 text-white"
                  : "bg-white/80 backdrop-blur-md border-gray-200 text-gray-700"
              }`}
            >
              View All
            </button>
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

      <main className="flex-1 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-10">
            {categoryNames.map(category => (
              <div key={category} className="space-y-4">
                <h2 className="font-black text-2xl text-gray-900 tracking-tight">{category}</h2>
                <div className="space-y-4">
                  {groupedDishes[category].map((dish) => {
                    const wished = wishlist.includes(dish.id);
                    return (
                      <div
                        key={dish.id}
                        className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-300 flex gap-4"
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
                            
                            <div className="flex items-center gap-1.5 mb-2 mt-2">
                              <span className="text-base font-black text-gray-900">₹{dish.price}</span>
                            </div>

                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed max-w-md mt-2">
                              {dish.desc}
                            </p>
                          </div>
                        </div>

                        {/* Image & Action Section */}
                        <div className="relative flex flex-col items-center justify-start w-32 flex-shrink-0 mb-8">
                          <div className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                            <button
                              onClick={() => setWishlist(w => w.includes(dish.id) ? w.filter(i => i !== dish.id) : [...w, dish.id])}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                            >
                              <Heart className={`w-3.5 h-3.5 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                            </button>

                            {/* Quantity Selector and ADD Button */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-28 flex flex-col gap-1.5 items-center">
                              <div className="flex items-center justify-between w-20 bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden h-6">
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
                                  const q = quantities[dish.id] || 1;
                                  setCart(c => ({ ...c, [dish.id]: (c[dish.id] || 0) + q }));
                                  setQuantities(q => ({ ...q, [dish.id]: 1 }));
                                }}
                                className={`w-full py-1 border font-black text-xs rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1 uppercase tracking-wide ${
                                  cart[dish.id]
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-white text-orange-600 border-gray-200 hover:bg-orange-50"
                                }`}
                              >
                                {cart[dish.id] ? `ADDED (${cart[dish.id]})` : "ADD"}
                              </button>
                            </div>
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
                <p className="font-black text-gray-700 text-xl">No items found</p>
                <p className="text-sm mt-2 font-medium">Try disabling the Veg/Non-veg filter.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
