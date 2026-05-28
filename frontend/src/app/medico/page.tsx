"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search, Star, SlidersHorizontal, ChevronDown,
  ShoppingCart, Heart, Zap, BadgePercent, X, MapPin, Pill
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import { useLocationContext } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

const categories = [
  { id: "all", label: "All", emoji: "🛒" },
  { id: "medicines", label: "Medicines", emoji: "💊" },
  { id: "firstaid", label: "First Aid", emoji: "🩹" },
  { id: "supplements", label: "Supplements", emoji: "⚡" },
  { id: "personalcare", label: "Personal Care", emoji: "🧴" },
];

const sortOptions = ["Relevance", "Price: Low to High", "Price: High to Low", "Ratings", "Newest"];

const products = [
  { id: "p1", name: "Paracetamol 500mg (10 Tabs)", cat: "medicines", price: 25, mrp: 30, rating: 4.8, reviews: 320, emoji: "💊", badge: "Best Seller", inStock: true, express: true },
  { id: "p2", name: "Band-Aid Washproof (Pack of 10)", cat: "firstaid", price: 40, mrp: 45, rating: 4.6, reviews: 150, emoji: "🩹", badge: "Essential", inStock: true, express: true },
  { id: "p3", name: "Vicks Vaporub 50g", cat: "medicines", price: 155, mrp: 170, rating: 4.7, reviews: 210, emoji: "🌿", badge: "Top Pick", inStock: true, express: false },
  { id: "p4", name: "Dettol Antiseptic Liquid 125ml", cat: "firstaid", price: 65, mrp: 70, rating: 4.9, reviews: 400, emoji: "🧴", badge: null, inStock: true, express: true },
  { id: "p5", name: "Vitamin C Zinc Tablets", cat: "supplements", price: 120, mrp: 150, rating: 4.5, reviews: 90, emoji: "🍋", badge: "Immunity", inStock: true, express: true },
  { id: "p6", name: "Cough Syrup 100ml", cat: "medicines", price: 110, mrp: 130, rating: 4.4, reviews: 85, emoji: "🥄", badge: null, inStock: true, express: false },
  { id: "p7", name: "Digital Thermometer", cat: "firstaid", price: 250, mrp: 300, rating: 4.6, reviews: 115, emoji: "🌡️", badge: "Must Have", inStock: true, express: true },
  { id: "p8", name: "Pain Relief Spray 55g", cat: "medicines", price: 180, mrp: 200, rating: 4.3, reviews: 75, emoji: "💨", badge: "Quick Relief", inStock: true, express: true },
  { id: "p9", name: "ORS Powder (Apple Flavor)", cat: "supplements", price: 20, mrp: 22, rating: 4.8, reviews: 500, emoji: "🧃", badge: "Hydration", inStock: true, express: true },
  { id: "p10", name: "Hand Sanitizer 100ml", cat: "personalcare", price: 50, mrp: 60, rating: 4.7, reviews: 260, emoji: "🫧", badge: null, inStock: false, express: false },
];

const priceRanges = [
  { label: "Under ₹50", max: 50 },
  { label: "₹50 – ₹150", max: 150, min: 50 },
  { label: "₹150 – ₹300", max: 300, min: 150 },
  { label: "Above ₹300", min: 300 },
];

export default function MedicoPage() {
  const [activeCat, setActiveCat] = useState("all");
  const [activeSort, setActiveSort] = useState("Relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const { locationName, landmark, pincode, setIsLocationModalOpen } = useLocationContext();
  const { isLoggedIn, openLoginModal } = useAuth();
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [posterLoading, setPosterLoading] = useState(true);

  useEffect(() => {
    async function fetchPoster() {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${API}/api/homepage-poster?type=medicine`);
        if (res.ok) {
          const data = await res.json();
          if (data.poster?.image_url) setPosterUrl(data.poster.image_url);
        }
      } catch { /* silent */ } finally {
        setPosterLoading(false);
      }
    }
    fetchPoster();
  }, []);

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
    <div className="min-h-screen bg-emerald-50/40 flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          {/* ── Mobile Top Bar (Location) ── */}
          <div className="md:hidden pt-4 pb-2 px-1">
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-white shadow-sm active:bg-emerald-50 transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <MapPin className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="flex flex-col overflow-hidden text-left">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-gray-900 text-lg tracking-tight leading-none truncate">Delivery Location</span>
                    <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
                  </div>
                  <span className="text-[12px] text-gray-500 font-medium leading-tight truncate">{landmark ? `${landmark}, ${locationName}` : locationName}{pincode ? ` · ${pincode}` : ''}</span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shadow-sm shrink-0 ml-2">
                <span className="text-sm font-black text-white uppercase">{locationName.charAt(0)}</span>
              </div>
            </button>
          </div>

          {/* ── Banner Section ── */}
          <div className="py-4 md:py-6 w-full">
            <div className="relative w-full aspect-[2/1] md:aspect-[3/1] lg:aspect-[4/1] rounded-3xl overflow-hidden shadow-xl border border-emerald-100 bg-emerald-50">
              {posterLoading ? (
                <div className="w-full h-full bg-emerald-100/50 animate-pulse"></div>
              ) : posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={posterUrl} alt="NearBuy Medico Banner" className="w-full h-full object-cover object-center" />
              ) : (
                <Image
                  src="/medico_hero_v4.png"
                  alt="NearBuy Medico Banner"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                  className="object-cover object-center"
                  priority
                />
              )}
            </div>
          </div>

          {/* ── Mobile Sub-header ── */}
          <div className="md:hidden py-3 border-b border-emerald-100 mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h1 className="font-black text-xl text-emerald-600 tracking-tight">NearBuy Medico</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${showFilters ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/30 shadow-sm" : "bg-white border-emerald-200 text-gray-700 hover:border-emerald-400"
                    }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-emerald-200 bg-white shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100/50 transition-all mx-1">
              <Search className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for medicines, first aid..."
                className="flex-1 bg-transparent text-sm text-gray-800 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
              className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white shadow-2xl transform transition-transform duration-300 flex flex-col md:relative md:z-0 md:w-64 md:transform-none md:bg-transparent md:shadow-none md:flex-shrink-0 ${showFilters ? "translate-x-0" : "translate-x-full md:translate-x-0"
                }`}
            >
              {/* Mobile Header */}
              <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  <p className="font-black text-lg text-gray-900">Filters</p>
                </div>
                <button onClick={() => setShowFilters(false)} className="p-1.5 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white md:rounded-2xl md:border md:border-gray-200 md:sticky md:top-24 md:shadow-sm pb-24 md:pb-0 scrollbar-hide">
                <div className="hidden md:flex px-5 py-4 border-b border-gray-100 items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeCat === cat.id
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent"
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
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${priceRange === r.label
                          ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20"
                          : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-transparent font-medium"
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
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${activeSort === s
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
                <h1 className="font-black text-2xl text-emerald-600 tracking-tight">NearBuy Medico</h1>
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
                        shadow-sm hover:shadow-lg hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all duration-300 flex flex-col relative"
                    >
                      {/* Image area */}
                      <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center
                        justify-center h-44 md:h-48 text-8xl md:text-9xl border-b border-gray-100 p-4 overflow-hidden">
                        <div className="group-hover:scale-110 transition-transform duration-500 drop-shadow-md">
                          {p.emoji}
                        </div>
                        {!p.inStock && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest px-3 py-1 bg-white rounded-full shadow-sm">Out of Stock</span>
                          </div>
                        )}
                        {/* Wishlist */}
                        <button
                          onClick={() => {
                            if (!isLoggedIn) return openLoginModal();
                            setWishlist(w => w.includes(p.id) ? w.filter(i => i !== p.id) : [...w, p.id]);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white border border-gray-200
                            shadow-sm hover:scale-110 transition-transform z-10"
                        >
                          <Heart className={`w-4 h-4 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                        </button>
                        {/* Express badge */}
                        {p.express && (
                          <span className="absolute top-3 left-3 flex items-center gap-0.5 px-2 py-1
                            bg-emerald-600 text-white rounded-md text-[10px] font-black shadow-sm z-10">
                            <Zap className="w-3 h-3 fill-white" /> EXPRESS
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 flex flex-col justify-between flex-1 bg-white">
                        <div>
                          {p.badge && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded w-fit mb-1.5 block shadow-sm">
                              {p.badge}
                            </span>
                          )}

                          <p className="text-[13px] font-bold text-gray-800 leading-snug mb-1.5 line-clamp-2">
                            {p.name}
                          </p>

                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white
                              text-[11px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                              <Star className="w-3 h-3 fill-white" />
                              {p.rating}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">({p.reviews})</span>
                          </div>

                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-[17px] font-black text-gray-900 tracking-tight">₹{p.price}</span>
                            <span className="text-[11px] text-gray-400 line-through font-medium">₹{p.mrp}</span>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded shadow-sm">
                              <BadgePercent className="w-3 h-3" />{disc}% off
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={!p.inStock}
                          onClick={() => {
                            if (!isLoggedIn) return openLoginModal();
                            setCart(c => c.includes(p.id) ? c.filter(i => i !== p.id) : [...c, p.id]);
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-bold transition-all mt-auto ${!p.inStock
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : inCart
                              ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
                              : "bg-emerald-500 text-white hover:opacity-90 shadow-md shadow-emerald-600/20"
                            }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
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
