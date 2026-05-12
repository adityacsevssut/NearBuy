"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Star, Clock, Filter, Plus, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";

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
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  // Generate mock dish data for the searched item
  const mockDishes = [
    {
      id: 1,
      name: `Classic ${itemName}`,
      vendor: "Sharma Dhaba",
      price: 120,
      rating: 4.5,
      reviews: 142,
      time: "15 min",
      type: "veg",
      emoji: "🍛",
      badge: "Bestseller",
      desc: `Authentic and delicious ${itemName.toLowerCase()} prepared with fresh ingredients and secret spices.`,
    },
    {
      id: 2,
      name: `Spicy Special ${itemName}`,
      vendor: "Hostel Meals",
      price: 140,
      rating: 4.2,
      reviews: 89,
      time: "20 min",
      type: "nonveg",
      emoji: "🌶️",
      badge: "Spicy",
      desc: `For the spice lovers! Our signature ${itemName.toLowerCase()} with an extra kick of flavours.`,
    },
    {
      id: 3,
      name: `Premium ${itemName} Combo`,
      vendor: "Campus Café",
      price: 180,
      rating: 4.8,
      reviews: 210,
      time: "25 min",
      type: "veg",
      emoji: "✨",
      badge: "Must Try",
      desc: `A premium combo featuring our top-rated ${itemName.toLowerCase()} along with a complimentary beverage.`,
    },
    {
      id: 4,
      name: `Budget ${itemName}`,
      vendor: "Maggi Corner",
      price: 80,
      rating: 4.1,
      reviews: 305,
      time: "10 min",
      type: "veg",
      emoji: "🔥",
      badge: "Pocket Friendly",
      desc: `Quick, affordable, and tasty. The perfect ${itemName.toLowerCase()} for your late-night cravings.`,
    },
    {
      id: 5,
      name: `Jumbo ${itemName} Family Pack`,
      vendor: "Rolls & Wraps",
      price: 250,
      rating: 4.6,
      reviews: 112,
      time: "18 min",
      type: "nonveg",
      emoji: "🥘",
      badge: "Serves 2-3",
      desc: `Extra large portion of ${itemName.toLowerCase()}, perfect for sharing with your hostel mates.`,
    },
  ];

  const filteredDishes = mockDishes
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
                      
                      {/* Vendor name with location pin styling */}
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        by <span className="text-orange-700">{dish.vendor}</span>
                      </p>

                      <div className="flex items-center gap-1.5 mb-2">
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
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-100 flex items-center justify-center text-6xl shadow-inner relative">
                      {dish.emoji}
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

            {filteredDishes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-200">
                <span className="text-6xl mb-4">🍽️</span>
                <p className="font-black text-gray-700 text-xl">No {itemName} found</p>
                <p className="text-sm mt-2 font-medium">Try disabling the Veg Only filter.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
