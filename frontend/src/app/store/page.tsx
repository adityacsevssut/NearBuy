"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search, Star, SlidersHorizontal, ChevronDown,
  ShoppingCart, Heart, Zap, BadgePercent, Package, X, MapPin
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import { useLocationContext } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

import { storeCategories as categories, storeSubcategories as subcategories } from "@/config/categories";

const sortOptions = ["Relevance", "Price: Low to High", "Price: High to Low"];

const products = [
  { id: "p1", name: "USB-C Charger 65W GaN", cat: "tech", price: 349, mrp: 599, rating: 4.6, reviews: 128, emoji: "🔌", img: "/products/charger_real.png", badge: "Best Seller", inStock: true, express: true },
  { id: "p2", name: "Classmate A4 Notebook (200 pg)", cat: "stationery", subcat: "notebook", price: 65, mrp: 80, rating: 4.4, reviews: 240, emoji: "📓", img: "/products/notebook_real.png", badge: "Top Pick", inStock: true, express: true },
  { id: "p3", name: "Lab Coat White (L / XL)", cat: "stationery", subcat: "lab_apron", price: 280, mrp: 450, rating: 4.5, reviews: 90, emoji: "🥼", badge: "Practical Ready", inStock: true, express: false },
  { id: "p4", name: "Staedtler HB Pencils (12-pack)", cat: "stationery", subcat: "basic_stationery", price: 65, mrp: 90, rating: 4.7, reviews: 185, emoji: "✏️", img: "/products/pencils_real.png", badge: "Lab Approved", inStock: true, express: true },
  { id: "p5", name: "Maggi 2-Minute Noodles (4-pack)", cat: "hostel", price: 60, mrp: 72, rating: 4.8, reviews: 410, emoji: "🍜", badge: "Hostel Fave", inStock: true, express: true },
  { id: "p6", name: "A4 Printout – B&W (per page)", cat: "stationery", subcat: "printing", price: 2, mrp: 3, rating: 4.3, reviews: 310, emoji: "📄", badge: "Upload & Print", inStock: true, express: true },
  { id: "p7", name: "Scientific Calculator FX-82", cat: "stationery", subcat: "calc", price: 720, mrp: 950, rating: 4.9, reviews: 60, emoji: "🧮", badge: "Exam Essential", inStock: true, express: false },
  { id: "p8", name: "Dove Men Shampoo 180ml", cat: "personal_care", price: 145, mrp: 185, rating: 4.4, reviews: 78, emoji: "🧴", badge: null, inStock: true, express: false },
  { id: "p9", name: "Data Cable 1m (Type-C to C)", cat: "tech", price: 120, mrp: 249, rating: 4.3, reviews: 99, emoji: "🔋", badge: "Value Pick", inStock: true, express: true },
  { id: "p10", name: "Highlighter Set (5 colours)", cat: "stationery", subcat: "study_acc", price: 85, mrp: 120, rating: 4.6, reviews: 155, emoji: "🖊️", badge: null, inStock: false, express: false },
];

const priceRanges = [
  { label: "Under ₹100", max: 100 },
  { label: "₹100 – ₹300", max: 300, min: 100 },
  { label: "₹300 – ₹600", max: 600, min: 300 },
  { label: "Above ₹600", min: 600 },
];

import { useRouter } from "next/navigation";

let cachedState = {
  activeCats: [] as string[],
  activeSubCats: [] as string[],
  activeSort: "Relevance",
  searchQuery: "",
  priceRange: null as string | null,
  posterUrl: null as string | null,
  posterLink: null as string | null,
  posterLoaded: false
};

export default function EssentialsPage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Home Shop Essential";
  }, []);

  const [activeCats, setActiveCats] = useState<string[]>(cachedState.activeCats);
  const [activeSubCats, setActiveSubCats] = useState<string[]>(cachedState.activeSubCats);
  const [activeSort, setActiveSort] = useState(cachedState.activeSort);
  const [searchQuery, setSearchQuery] = useState(cachedState.searchQuery);
  const [priceRange, setPriceRange] = useState<string | null>(cachedState.priceRange);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const { locationName, landmark, pincode, setIsLocationModalOpen } = useLocationContext();
  const { isLoggedIn, openLoginModal } = useAuth();
  const [posterUrl, setPosterUrl] = useState<string | null>(cachedState.posterUrl);
  const [posterLink, setPosterLink] = useState<string | null>(cachedState.posterLink);
  const [posterLoading, setPosterLoading] = useState(!cachedState.posterLoaded);
  const [previewProduct, setPreviewProduct] = useState<any>(null);
  const [previewQuantity, setPreviewQuantity] = useState(1);

  useEffect(() => {
    if (previewProduct) setPreviewQuantity(1);
  }, [previewProduct]);

  // Update cache when state changes
  useEffect(() => { cachedState.activeCats = activeCats; }, [activeCats]);
  useEffect(() => { cachedState.activeSubCats = activeSubCats; }, [activeSubCats]);
  useEffect(() => { cachedState.activeSort = activeSort; }, [activeSort]);
  useEffect(() => { cachedState.searchQuery = searchQuery; }, [searchQuery]);
  useEffect(() => { cachedState.priceRange = priceRange; }, [priceRange]);

  useEffect(() => {
    if (cachedState.posterLoaded) return;
    async function fetchPoster() {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${API}/api/homepage-poster?type=store`);
        if (res.ok) {
          const data = await res.json();
          if (data.poster?.image_url) {
            setPosterUrl(data.poster.image_url);
            setPosterLink(data.poster.link || null);
            cachedState.posterUrl = data.poster.image_url;
            cachedState.posterLink = data.poster.link || null;
          } else if (data.posters && data.posters.length > 0) {
            setPosterUrl(data.posters[0].image_url);
            setPosterLink(data.posters[0].link || null);
            cachedState.posterUrl = data.posters[0].image_url;
            cachedState.posterLink = data.posters[0].link || null;
          }
        }
      } catch { /* silent */ } finally {
        setPosterLoading(false);
        cachedState.posterLoaded = true;
      }
    }
    fetchPoster();
  }, []);

  const filtered = products
    .filter((p) => {
      const matchCat = activeCats.length === 0 || activeCats.includes(p.cat);
      const matchSubCat = (() => {
        if (activeSubCats.length === 0) return true;
        const catSubcats = subcategories[p.cat]?.map(s => s.id) || [];
        const activeForThisCat = activeSubCats.filter(id => catSubcats.includes(id));
        if (activeForThisCat.length > 0) {
          return activeForThisCat.includes((p as any).subcat);
        }
        return true;
      })();
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
      return matchCat && matchSearch && matchPrice && matchSubCat;
    })
    .sort((a, b) => {
      if (activeSort === "Price: Low to High") return a.price - b.price;
      if (activeSort === "Price: High to Low") return b.price - a.price;
      if (activeSort === "Ratings") return b.rating - a.rating;
      return 0;
    });

  const discount = (p: number, m: number) => Math.round(((m - p) / m) * 100);

  return (
    <div className="min-h-screen bg-blue-50/40 dark:bg-[#0D0D17] flex flex-col pt-16">
      <Navbar />

      <main className="flex-1 pb-20 md:pb-0">
        {/* ══ STICKY TOP BAR (below blue navbar) ════════════════════════════ */}
        <div className="sticky top-16 z-40 bg-white dark:bg-[#0D0D17] border-b border-gray-100 dark:border-[#2A2A3A] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col gap-0">
            {/* ROW 1 — Location (full width, bordered) */}
            <div className="w-full pt-3 pb-3 border-b border-gray-100 dark:border-[#2A2A3A]">
              <button
                suppressHydrationWarning
                onClick={() => setIsLocationModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-[#151522] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-blue-400 transition-all duration-300 hover:shadow-[0_0_15px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-md active:scale-[0.99] transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0D0D17] shadow-sm flex items-center justify-center shrink-0 border border-gray-100 dark:border-[#2A2A3A]">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                {/* Location name + chevron */}
                <div className="flex flex-col items-start leading-none flex-1 min-w-0 text-left mr-3 md:mr-6">
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Deliver to
                  </span>
                  <span className="text-[14px] font-black text-gray-900 dark:text-gray-100 flex items-center gap-1 mt-1">
                    <span className="truncate max-w-[120px] sm:max-w-[200px]">
                      {landmark ? `${landmark}, ${locationName}` : locationName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-blue-600 shrink-0" />
                  </span>
                </div>
                {/* Pincode pushed to far right */}
                {pincode && (
                  <span className="ml-auto shrink-0 text-[12px] font-black text-blue-600 bg-blue-50 dark:bg-[#0D0D17] border border-blue-200 dark:border-blue-500/50 px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    📍 {pincode}
                  </span>
                )}
              </button>
            </div>

            {/* ROW 2 — Search bar + Filter (full width) */}
            <div className="w-full flex items-center gap-3 py-3">
              <div className="flex-1 flex items-center gap-2.5 bg-gray-50 dark:bg-[#151522] rounded-2xl px-4 py-3.5 border border-gray-200 dark:border-[#2A2A3A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-within:bg-white dark:focus-within:bg-[#0D0D17] dark:bg-[#0D0D17] focus-within:ring-4 focus-within:ring-blue-500/15 focus-within:border-blue-400 transition-all duration-200">
                <Search className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
                <input
                  suppressHydrationWarning
                  type="text"
                  placeholder="Search for chargers, notebooks..."
                  className="flex-1 bg-transparent text-[14px] text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-500 dark:text-gray-400 font-semibold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center shrink-0 hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>

              {/* Filter */}
              <div className="relative shrink-0 md:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3.5 rounded-2xl text-[14px] font-black border transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${showFilters || activeCats.length > 0 || priceRange
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30"
                    : "bg-gray-50 dark:bg-[#151522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2A2A3A] hover:bg-white dark:hover:bg-[#0D0D17] hover:border-blue-300 transition-all duration-300 hover:shadow-[0_0_15px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:text-blue-600"
                    }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">Filter</span>
                  {(activeCats.length > 0 || priceRange) && (
                    <span className="w-2 h-2 rounded-full bg-white dark:bg-[#0D0D17] shadow-sm" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-4">
          {/* ── Visual Categories Section ── */}
          <div className="pb-2 overflow-x-auto scrollbar-hide">
            <div className="flex justify-start md:justify-center gap-4 md:gap-8 min-w-max px-2 py-2">
              {[
                { id: "stationery", name: "Student Stationary", src: "/categories/stationary_cat_v6.png", darkSrc: "/categories/stationary_dark.png" },
                { id: "tech", name: "Electronic Gadgets", src: "/categories/gadgets_cat_v4.png", darkSrc: "/categories/gadgets_dark.png" },
                { id: "snacks", name: "Snacks & Beverages", src: "/categories/snacks_cat_v4.png", darkSrc: "/categories/snacks_dark.png" },
                { id: "hostel", name: "Hostel Essentials", src: "/categories/hostel_cat_modern_v2.png", darkSrc: "/categories/hostel_dark.png" },
                { id: "personal_care", name: "Daily Need\nEssentials", src: "/categories/personal_care_items_ultra_modern.png", darkSrc: "/categories/personal_care_dark.png" },
              ].map((cat, i) => (
                <div key={i} onClick={() => router.push(`/store/category/${cat.id}`)} className="flex flex-col items-center gap-2 cursor-pointer group w-16 md:w-20">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-[3px] border-white shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 relative bg-white dark:bg-[#151522] dark:border-gray-800">
                    <Image src={cat.src} alt={cat.name} fill unoptimized className="object-cover hover:scale-110 transition-transform duration-500 dark:hidden" />
                    <Image src={cat.darkSrc} alt={cat.name} fill unoptimized className="object-cover hover:scale-110 transition-transform duration-500 hidden dark:block" />
                  </div>
                  <span className="text-[11px] md:text-[13px] font-bold text-gray-800 dark:text-gray-200 text-center leading-tight whitespace-pre-line group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Banner Section ── */}
          <div className="pb-4 md:pb-6 w-full flex justify-center">
            <div className="relative w-full max-w-6xl aspect-video md:aspect-[21/9] rounded-3xl overflow-hidden bg-transparent">
              {posterLoading ? (
                <div className="w-full h-full bg-blue-100/50 dark:bg-[#2A2A3A]/50 animate-pulse"></div>
              ) : posterUrl ? (
                posterLink ? (
                  <Link href={posterLink} className="block w-full h-full">
                    <Image src={posterUrl} alt="NearBuy Store Banner" fill priority={true} className="block object-cover object-center w-full h-full" style={{ display: 'block' }} />
                  </Link>
                ) : (
                  <Image src={posterUrl} alt="NearBuy Store Banner" fill priority={true} className="block object-cover object-center w-full h-full" style={{ display: 'block' }} />
                )
              ) : (
                <>
                  <Image
                    src="/store_hero_v5.png"
                    alt="NearBuy Store Banner"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                    className="block object-cover object-center w-full h-full dark:hidden"
                    priority
                    style={{ display: 'block' }}
                  />
                  <Image
                    src="/store_hero_16x9_dark.png"
                    alt="NearBuy Store Banner"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1280px"
                    className="hidden object-cover object-center w-full h-full dark:block"
                    priority
                    style={{ display: 'block' }}
                  />
                </>
              )}
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
              className={`fixed inset-y-0 right-0 z-[70] w-72 bg-white dark:bg-[#0D0D17] shadow-2xl transform transition-transform duration-300 flex flex-col md:relative md:z-0 md:w-64 md:transform-none md:bg-transparent md:shadow-none md:flex-shrink-0 ${showFilters ? "translate-x-0" : "translate-x-full md:translate-x-0"
                }`}
            >
              {/* Mobile Header */}
              <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="font-black text-lg text-gray-900 dark:text-gray-100">Filters</p>
                </div>
                <button onClick={() => setShowFilters(false)} className="p-1.5 bg-gray-100 dark:bg-[#1F1F2E] rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0D0D17] md:rounded-2xl md:border md:border-gray-200 dark:border-[#2A2A3A] md:sticky md:top-24 md:shadow-sm pb-24 md:pb-0 scrollbar-hide">
                <div className="hidden md:flex px-5 py-4 border-b border-gray-100 dark:border-[#2A2A3A] items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="font-black text-base text-gray-900 dark:text-gray-100">Filters</p>
                </div>

                {/* Category filter */}
                <div className="px-5 py-5 border-b border-gray-100 dark:border-[#2A2A3A]">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Category</p>
                  <div className="space-y-2">
                    {categories.filter(c => c.id !== "all").map((cat) => {
                      const isActive = activeCats.includes(cat.id);
                      return (
                        <div key={cat.id} className="space-y-1">
                          <button
                            onClick={() => {
                              if (isActive) {
                                setActiveCats(prev => prev.filter(id => id !== cat.id));
                                const catSubcatIds = subcategories[cat.id]?.map(s => s.id) || [];
                                setActiveSubCats(prev => prev.filter(id => !catSubcatIds.includes(id)));
                              } else {
                                setActiveCats(prev => [...prev, cat.id]);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isActive
                              ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 dark:bg-[#151522] dark:text-gray-400 dark:border-[#2A2A3A] hover:border-blue-300"
                              }`}
                          >
                            <span>{cat.label}</span>
                            <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out px-[2px] ${isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-[#2A2A3A]"}`}>
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-4" : "translate-x-0"}`} />
                            </div>
                          </button>
                          {isActive && subcategories[cat.id] && (
                            <div className="pl-3 pr-2 py-1 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                              {subcategories[cat.id].map(sub => {
                                const isSubActive = activeSubCats.includes(sub.id);
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      setActiveSubCats(prev =>
                                        prev.includes(sub.id) ? prev.filter(id => id !== sub.id) : [...prev, sub.id]
                                      );
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-semibold transition-all ${isSubActive
                                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                      : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#1F1F2E]"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${isSubActive
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "bg-transparent border-gray-300 dark:border-gray-600"
                                        }`}>
                                        {isSubActive && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                      </div>
                                      {sub.label}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price range */}
                <div className="px-5 py-5 border-b border-gray-100 dark:border-[#2A2A3A]">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Price Range</p>
                  <div className="space-y-2">
                    {priceRanges.map((r) => {
                      const isActive = priceRange === r.label;
                      return (
                        <button
                          key={r.label}
                          onClick={() => setPriceRange(isActive ? null : r.label)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isActive
                            ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 dark:bg-[#151522] dark:text-gray-400 dark:border-[#2A2A3A] hover:border-blue-300"
                            }`}
                        >
                          <span>{r.label}</span>
                          <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out px-[2px] ${isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-[#2A2A3A]"}`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-4" : "translate-x-0"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sort */}
                <div className="px-5 py-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Sort By</p>
                  <div className="space-y-2">
                    {sortOptions.map((s) => {
                      const isActive = activeSort === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setActiveSort(s)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${isActive
                            ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 dark:bg-[#151522] dark:text-gray-400 dark:border-[#2A2A3A] hover:border-blue-300"
                            }`}
                        >
                          <span>{s}</span>
                          <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out px-[2px] ${isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-[#2A2A3A]"}`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? "translate-x-4" : "translate-x-0"}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Product Grid ── */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4 md:mb-6 px-1.5 md:px-2">
                <h1 className="font-black text-xl md:text-2xl text-blue-600 tracking-tight">All Products</h1>

                {/* Desktop right side */}
                <div className="hidden md:flex items-center gap-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Showing <span className="text-gray-900 dark:text-gray-100 font-black">{filtered.length}</span> products
                  </p>
                  {(activeCats.length > 0 || priceRange) && (
                    <button
                      onClick={() => { setActiveCats([]); setPriceRange(null); }}
                      className="text-xs text-blue-600 font-bold hover:underline px-3 py-1.5 bg-blue-50 rounded-lg"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Mobile right side */}
                <div className="flex md:hidden items-center gap-2">
                  <p className="text-xs font-medium text-gray-500 mr-1">{filtered.length} items</p>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold border transition-all ${showFilters || activeCats.length > 0 || priceRange
                      ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30"
                      : "bg-white dark:bg-[#151522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2A2A3A]"
                      }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filter</span>
                    {(activeCats.length > 0 || priceRange) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    )}
                  </button>
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
                      onClick={() => setPreviewProduct(p)}
                      className="group bg-white dark:bg-[#0D0D17] rounded-xl border border-gray-100 dark:border-[#2A2A3A] overflow-hidden
                        shadow-sm hover:shadow-md transition-all duration-300 flex flex-col relative cursor-pointer"
                    >
                      {/* Image area */}
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1F1F2E] dark:to-[#151522] w-full aspect-[4/5] flex items-center justify-center text-5xl md:text-6xl overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          {(p as any).img ? (
                            <Image src={(p as any).img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <span className="group-hover:scale-110 transition-transform duration-500">{p.emoji}</span>
                          )}
                        </div>

                        {/* Optional Badge on top right */}
                        {p.badge && (
                          <div className="absolute top-2 right-2 bg-white/90 dark:bg-[#0D0D17]/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase shadow-sm border border-gray-100 dark:border-[#2A2A3A]">
                            {p.badge}
                          </div>
                        )}

                        {!p.inStock && (
                          <div className="absolute inset-0 bg-white/60 dark:bg-[#0D0D17]/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest px-3 py-1 bg-white/90 dark:bg-[#0D0D17]/90 rounded-full shadow-sm border border-gray-200 dark:border-[#2A2A3A]">Out of Stock</span>
                          </div>
                        )}

                        {/* Rating overlay (bottom left on image) */}
                        <div className="absolute bottom-2 left-2 bg-white/90 dark:bg-[#151522]/90 backdrop-blur-sm px-1.5 py-0.5 rounded-sm flex items-center gap-1 z-10 shadow-sm">
                          <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100">{p.rating}</span>
                          <Star className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                          <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium pl-1 border-l border-gray-300 dark:border-gray-600">
                            {(p.reviews >= 1000 ? (p.reviews / 1000).toFixed(1) + 'k' : p.reviews)}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 flex flex-col flex-1 bg-white dark:bg-[#0D0D17]">
                        {/* Title and Wishlist Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="text-[13px] font-black text-gray-900 dark:text-gray-100 leading-tight truncate">
                              {p.name.split(' ')[0]} {/* Brand/First Word */}
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-medium">
                              {p.name.split(' ').slice(1).join(' ') || p.name}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isLoggedIn) return openLoginModal();
                              setWishlist(w => w.includes(p.id) ? w.filter(i => i !== p.id) : [...w, p.id]);
                            }}
                            className="p-1 -mr-1 -mt-1 rounded-full hover:bg-gray-50 dark:hover:bg-[#1F1F2E] transition-colors shrink-0"
                          >
                            <Heart className={`w-4 h-4 transition-colors ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400 dark:text-gray-500"}`} />
                          </button>
                        </div>

                        {/* Prices */}
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[14px] font-black text-gray-900 dark:text-gray-100 tracking-tight">₹{p.price}</span>
                          <span className="text-[11px] text-gray-400 line-through font-medium">₹{p.mrp}</span>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                            {disc}% OFF
                          </span>
                        </div>

                        {/* Best Price Offer */}
                        <p className="text-[10px] font-semibold mt-1">
                          <span className="text-blue-600 dark:text-blue-400">Get At </span>
                          <span className="text-gray-900 dark:text-gray-100 font-bold">₹{Math.floor(p.price * 0.85)}</span>
                          <span className="text-gray-500 dark:text-gray-400"> with coupon</span>
                        </p>

                      </div>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-24 text-gray-400 bg-white dark:bg-[#0D0D17] rounded-3xl border border-gray-200 dark:border-[#2A2A3A] px-4">
                    <span className="text-6xl mb-4">📦</span>
                    <p className="font-black text-gray-700 dark:text-gray-300 text-xl text-center">No products found</p>
                    <p className="text-sm mt-2 font-medium text-center text-balance max-w-sm">Try changing your filters or searching for something else.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Details Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
            {/* Close Button at top-right */}
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 dark:bg-black/40 dark:hover:bg-black/60 text-gray-900 dark:text-white backdrop-blur-md transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image Area */}
            <div className="relative w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1F1F2E] dark:to-[#151522] flex items-center justify-center">
              {previewProduct.img ? (
                <Image src={previewProduct.img} alt={previewProduct.name} fill className="object-cover" />
              ) : (
                <span className="text-8xl">{previewProduct.emoji}</span>
              )}
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">{previewProduct.name}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                  <span className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded font-bold shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-white" />
                    {previewProduct.rating}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-2 py-0.5 rounded shadow-sm">{previewProduct.company || "NearBuy Essentials"}</span>
                  {previewProduct.cat === "stationery" && (
                    <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-2 py-0.5 rounded shadow-sm">Pages: {previewProduct.pages || "N/A"}</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {previewProduct.description || "High quality product brought to you by NearBuy. Enjoy fast delivery and the best prices on all campus essentials. Carefully curated to meet student needs perfectly."}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900 dark:text-gray-100">₹{previewProduct.price * previewQuantity}</span>
                    <span className="text-sm text-gray-400 line-through font-medium mb-1">₹{previewProduct.mrp * previewQuantity}</span>
                  </div>
                  {previewQuantity > 1 && (
                    <span className="text-[11px] text-gray-500 font-medium -mt-1">₹{previewProduct.price} / item</span>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#1F1F2E] rounded-xl p-1 border border-gray-100 dark:border-[#2A2A3A]">
                  <button
                    onClick={() => setPreviewQuantity(Math.max(1, previewQuantity - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#2A2A3A] hover:shadow-sm transition-all"
                  >
                    -
                  </button>
                  <span className="font-black text-[15px] text-gray-900 dark:text-gray-100 w-6 text-center select-none">{previewQuantity}</span>
                  <button
                    onClick={() => setPreviewQuantity(previewQuantity + 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-[#2A2A3A] hover:shadow-sm transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-[#2A2A3A]">
                <button
                  onClick={() => setPreviewProduct(null)}
                  className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-[#1F1F2E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2A2A3A] transition-colors"
                >
                  Close
                </button>
                <button
                  disabled={!previewProduct.inStock}
                  onClick={() => {
                    if (!isLoggedIn) return openLoginModal();
                    setCart(c => c.includes(previewProduct.id) ? c.filter(i => i !== previewProduct.id) : [...c, previewProduct.id]);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 group active:scale-[0.97] ${!previewProduct.inStock
                    ? "bg-gray-50 dark:bg-[#1F1F2E] text-gray-400 cursor-not-allowed border border-gray-200 dark:border-[#2A2A3A]"
                    : cart.includes(previewProduct.id)
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-500"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl hover:shadow-blue-600/30 border border-blue-600"
                    }`}
                >
                  <ShoppingCart className={`w-4 h-4 shrink-0 transition-transform duration-300 ${!previewProduct.inStock ? "" : cart.includes(previewProduct.id) ? "scale-110" : "group-hover:-rotate-12 group-hover:scale-110"}`} />
                  <span className="whitespace-nowrap">
                    {!previewProduct.inStock
                      ? "Out of Stock"
                      : cart.includes(previewProduct.id)
                        ? "Added ✓"
                        : "Add to Cart"
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
