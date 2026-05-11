"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search, Star, SlidersHorizontal, ChevronDown,
  ShoppingCart, Heart, Zap, BadgePercent, Package,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";

const categories = [
  { id: "all", label: "All", emoji: "🛒" },
  { id: "stationery", label: "Stationery", emoji: "✏️" },
  { id: "tech", label: "Tech & Cables", emoji: "🔌" },
  { id: "lab", label: "Lab Supplies", emoji: "🥼" },
  { id: "food", label: "Snacks & Drinks", emoji: "🍜" },
  { id: "print", label: "Print & Copy", emoji: "🖨️" },
  { id: "hygiene", label: "Hygiene", emoji: "🧴" },
];

const sortOptions = ["Relevance", "Price: Low to High", "Price: High to Low", "Ratings", "Newest"];

const products = [
  { id: "p1", name: "USB-C Charger 65W GaN", cat: "tech", price: 349, mrp: 599, rating: 4.6, reviews: 128, emoji: "🔌", badge: "Best Seller", inStock: true, express: true },
  { id: "p2", name: "Classmate A4 Notebook (200 pg)", cat: "stationery", price: 65, mrp: 80, rating: 4.4, reviews: 240, emoji: "📓", badge: "Top Pick", inStock: true, express: true },
  { id: "p3", name: "Lab Coat White (L / XL)", cat: "lab", price: 280, mrp: 450, rating: 4.5, reviews: 90, emoji: "🥼", badge: "Practical Ready", inStock: true, express: false },
  { id: "p4", name: "Staedtler HB Pencils (12-pack)", cat: "stationery", price: 65, mrp: 90, rating: 4.7, reviews: 185, emoji: "✏️", badge: "Lab Approved", inStock: true, express: true },
  { id: "p5", name: "Maggi 2-Minute Noodles (4-pack)", cat: "food", price: 60, mrp: 72, rating: 4.8, reviews: 410, emoji: "🍜", badge: "Hostel Fave", inStock: true, express: true },
  { id: "p6", name: "A4 Printout – B&W (per page)", cat: "print", price: 2, mrp: 3, rating: 4.3, reviews: 310, emoji: "📄", badge: "Upload & Print", inStock: true, express: true },
  { id: "p7", name: "Scientific Calculator FX-82", cat: "lab", price: 720, mrp: 950, rating: 4.9, reviews: 60, emoji: "🧮", badge: "Exam Essential", inStock: true, express: false },
  { id: "p8", name: "Dove Men Shampoo 180ml", cat: "hygiene", price: 145, mrp: 185, rating: 4.4, reviews: 78, emoji: "🧴", badge: null, inStock: true, express: false },
  { id: "p9", name: "Data Cable 1m (Type-C to C)", cat: "tech", price: 120, mrp: 249, rating: 4.3, reviews: 99, emoji: "🔋", badge: "Value Pick", inStock: true, express: true },
  { id: "p10", name: "Highlighter Set (5 colours)", cat: "stationery", price: 85, mrp: 120, rating: 4.6, reviews: 155, emoji: "🖊️", badge: null, inStock: false, express: false },
];

const priceRanges = [
  { label: "Under ₹100", max: 100 },
  { label: "₹100 – ₹300", max: 300, min: 100 },
  { label: "₹300 – ₹600", max: 600, min: 300 },
  { label: "Above ₹600", min: 600 },
];

export default function EssentialsPage() {
  const [activeCat, setActiveCat] = useState("all");
  const [activeSort, setActiveSort] = useState("Relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  const filtered = products
    .filter((p) => {
      const matchCat = activeCat === "all" || p.cat === activeCat;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPrice = !priceRange || (() => {
        const range = priceRanges.find((r) => r.label === priceRange);
        if (!range) return true;
        const above = range.min ? p.price >= range.min : true;
        const below = range.max ? p.price <= range.max : true;
        return above && below;
      })();
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (activeSort === "Price: Low to High") return a.price - b.price;
      if (activeSort === "Price: High to Low") return b.price - a.price;
      if (activeSort === "Ratings") return b.rating - a.rating;
      return 0;
    });

  const discount = (p: number, m: number) => Math.round(((m - p) / m) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* ── Banner Section ── */}
          <div className="py-6 w-full">
            <div className="relative w-full h-40 md:h-64 rounded-3xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src="/banner.png"
                alt="NearBuy Promo Banner"
                fill
                className="object-cover object-right"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute inset-y-0 right-0 p-6 md:p-10 flex flex-col justify-center items-end text-right pointer-events-none">
                <span className="inline-block px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full mb-3 shadow-md">
                  STUDENT STORE
                </span>
                <h2 className="text-white text-2xl md:text-4xl font-black max-w-sm leading-tight tracking-tight drop-shadow-md">
                  Shop gear, tech & daily essentials.
                </h2>
              </div>
            </div>
          </div>

          {/* ── Mobile Sub-header & Search ── */}
          <div className="md:hidden py-2 border-b border-gray-200 mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="font-black text-xl text-gray-900 tracking-tight">Student Store</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    showFilters ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-300 text-gray-700"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white shadow-sm">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for chargers, notebooks..."
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-6 pb-12">
            {/* ── Sidebar filters (Desktop only or toggled) ── */}
            <aside
              className={`flex-shrink-0 w-64 transition-all duration-300 ${showFilters ? "block" : "hidden md:block"}`}
            >
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-24 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <p className="font-black text-base text-gray-900">Filters</p>
                </div>

                {/* Category filter */}
                <div className="px-5 py-5 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Category</p>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCat(cat.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          activeCat === cat.id
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <span className="text-lg">{cat.emoji}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="px-5 py-5 border-b border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Price Range</p>
                  <div className="space-y-1">
                    {priceRanges.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setPriceRange(priceRange === r.label ? null : r.label)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                          priceRange === r.label
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold shadow-sm"
                            : "text-gray-600 hover:bg-gray-50 border border-transparent font-medium"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="px-5 py-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Sort By</p>
                  <div className="space-y-1">
                    {sortOptions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setActiveSort(s)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                          activeSort === s
                            ? "text-emerald-700 font-bold bg-emerald-50/50"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Product Grid ── */}
            <div className="flex-1 min-w-0 pt-2">
              <div className="hidden md:flex items-center justify-between mb-6">
                <h1 className="font-black text-2xl text-gray-900 tracking-tight">Student Store</h1>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium text-gray-500">
                    Showing <span className="text-gray-900 font-black">{filtered.length}</span> products
                  </p>
                  {(activeCat !== "all" || priceRange) && (
                    <button
                      onClick={() => { setActiveCat("all"); setPriceRange(null); }}
                      className="text-xs text-emerald-600 font-bold hover:underline px-3 py-1.5 bg-emerald-50 rounded-lg"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p) => {
                  const disc = discount(p.price, p.mrp);
                  const wished = wishlist.includes(p.id);
                  const inCart = cart.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden
                        shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 flex flex-col relative"
                    >
                      {/* Image area */}
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center
                        justify-center h-40 text-6xl border-b border-gray-100 p-4">
                        {p.emoji}
                        {!p.inStock && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest px-3 py-1 bg-white rounded-full shadow-sm">Out of Stock</span>
                          </div>
                        )}
                        {/* Wishlist */}
                        <button
                          onClick={() => setWishlist(w => w.includes(p.id) ? w.filter(i => i !== p.id) : [...w, p.id])}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white border border-gray-200
                            shadow-sm hover:scale-110 transition-transform z-10"
                        >
                          <Heart className={`w-4 h-4 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                        </button>
                        {/* Express badge */}
                        {p.express && (
                          <span className="absolute top-3 left-3 flex items-center gap-0.5 px-2 py-1
                            bg-emerald-500 text-white rounded-md text-[10px] font-black shadow-sm z-10">
                            <Zap className="w-3 h-3 fill-white" /> EXPRESS
                          </span>
                        )}
                      </div>

                      <div className="p-4 flex flex-col flex-1 bg-white">
                        {p.badge && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-1 rounded w-fit mb-2">
                            {p.badge}
                          </span>
                        )}

                        <p className="text-sm font-bold text-gray-800 leading-snug mb-2 line-clamp-2 flex-1">
                          {p.name}
                        </p>

                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="inline-flex items-center gap-0.5 bg-green-600 text-white
                            text-[11px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                            <Star className="w-3 h-3 fill-white" />
                            {p.rating}
                          </span>
                          <span className="text-[11px] text-gray-400 font-medium">({p.reviews})</span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-lg font-black text-gray-900">₹{p.price}</span>
                          <span className="text-xs text-gray-400 line-through font-medium">₹{p.mrp}</span>
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded">
                            <BadgePercent className="w-3 h-3" />{disc}% off
                          </span>
                        </div>

                        <button
                          disabled={!p.inStock}
                          onClick={() => setCart(c => c.includes(p.id) ? c.filter(i => i !== p.id) : [...c, p.id])}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            !p.inStock
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : inCart
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                              : "btn-emerald text-white hover:opacity-90 shadow-md"
                          }`}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {!p.inStock ? "Out of Stock" : inCart ? "Added ✓" : "Add to Cart"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400 bg-white rounded-3xl border border-gray-200">
                    <span className="text-6xl mb-4">📦</span>
                    <p className="font-black text-gray-700 text-xl">No products found</p>
                    <p className="text-sm mt-2 font-medium">Try changing your filters or searching for something else.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
