"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Search, Star, SlidersHorizontal, ChevronDown,
  ShoppingCart, Heart, Zap, BadgePercent, Package, X, MapPin, ArrowLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import { useLocationContext } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";

const categories = [
  { id: "all", label: "All", emoji: "🛒" },
  { id: "stationery", label: "Student Stationary", emoji: "✏️" },
  { id: "tech", label: "Electronic Gadgets", emoji: "🔌" },
  { id: "snacks", label: "Snacks & Beverages", emoji: "🍫" },
  { id: "hostel", label: "Hostel Essentials", emoji: "🛏️" },
  { id: "personal_care", label: "Daily Need", emoji: "🧴" },
];

const subcategories: Record<string, { id: string, label: string }[]> = {
  stationery: [
    { id: "basic_stationery", label: "Basic Stationary" },
    { id: "notebook", label: "Note Book" },
    { id: "lab_record", label: "Lab Record" },
    { id: "lab_apron", label: "Lab Apron" },
    { id: "calc", label: "Scientific calculator" },
    { id: "art_craft", label: "Art and Craft" },
    { id: "study_acc", label: "Study Accesories" },
    { id: "printing", label: "Printing And Project Supplies" },
    { id: "others", label: "Others" }
  ],
  tech: [
    { id: "charger", label: "Charger" },
    { id: "extension_board", label: "Extension Board" },
    { id: "small_fans", label: "Wired Small fans" },
    { id: "study_lamp", label: "Study lamp" },
    { id: "other", label: "Other Devices" }
  ],
  snacks: [
    { id: "biscuit", label: "Biscuit" },
    { id: "namkeen", label: "Namkeen Mix" },
    { id: "chatua", label: "Chatua" },
    { id: "chips", label: "Snacks And Chips" },
    { id: "sprite", label: "Sprite" },
    { id: "pepsi", label: "Pepsi" },
    { id: "thumsup", label: "Thumsup" },
    { id: "other_drinks", label: "Other Drinks" },
    { id: "other_snacks", label: "Other Snacks" }
  ],
  hostel: [
    { id: "bedsheet", label: "Bedsheet" },
    { id: "pillow_cover", label: "Pillow Cover" },
    { id: "bolster_pillow", label: "Bolster Pillow" },
    { id: "bucket", label: "Bucket" },
    { id: "mug", label: "Mug" },
    { id: "umbrella", label: "Umbrella" },
    { id: "hanger", label: "Hanger" },
    { id: "lock_key", label: "Lock and Key" },
    { id: "others", label: "Others" }
  ],
  personal_care: [
    { id: "handwash", label: "Handwash" },
    { id: "perfume", label: "Perfume" },
    { id: "daily_needs", label: "Daily Needs" },
    { id: "good_knight", label: "Good knight stick" },
    { id: "others", label: "Others" }
  ]
};

const products = [
  { id: "p1", name: "USB-C Charger 65W GaN", cat: "tech", subcat: "charger", price: 349, mrp: 599, rating: 4.6, reviews: 128, emoji: "🔌", img: "/products/charger_real.png", badge: "Best Seller", inStock: true, express: true },
  { id: "p2", name: "Classmate A4 Notebook (200 pg)", cat: "stationery", subcat: "notebook", price: 65, mrp: 80, rating: 4.4, reviews: 240, emoji: "📓", img: "/products/notebook_real.png", badge: "Top Pick", inStock: true, express: true },
  { id: "p3", name: "Lab Coat White (L / XL)", cat: "stationery", subcat: "lab_apron", price: 280, mrp: 450, rating: 4.5, reviews: 90, emoji: "🥼", badge: "Practical Ready", inStock: true, express: false },
  { id: "p4", name: "Staedtler HB Pencils (12-pack)", cat: "stationery", subcat: "basic_stationery", price: 65, mrp: 90, rating: 4.7, reviews: 185, emoji: "✏️", img: "/products/pencils_real.png", badge: "Lab Approved", inStock: true, express: true },
  { id: "p5", name: "Maggi 2-Minute Noodles (4-pack)", cat: "hostel", price: 60, mrp: 72, rating: 4.8, reviews: 410, emoji: "🍜", badge: "Hostel Fave", inStock: true, express: true },
  { id: "p6", name: "A4 Printout – B&W (per page)", cat: "stationery", subcat: "printing", price: 2, mrp: 3, rating: 4.3, reviews: 310, emoji: "📄", badge: "Upload & Print", inStock: true, express: true },
  { id: "p7", name: "Scientific Calculator FX-82", cat: "stationery", subcat: "calc", price: 720, mrp: 950, rating: 4.9, reviews: 60, emoji: "🧮", badge: "Exam Essential", inStock: true, express: false },
  { id: "p8", name: "Dove Men Shampoo 180ml", cat: "personal_care", subcat: "others", price: 145, mrp: 185, rating: 4.4, reviews: 78, emoji: "🧴", badge: null, inStock: true, express: false },
  { id: "p9", name: "Data Cable 1m (Type-C to C)", cat: "tech", subcat: "other", price: 120, mrp: 249, rating: 4.3, reviews: 99, emoji: "🔋", badge: "Value Pick", inStock: true, express: true },
  { id: "p10", name: "Highlighter Set (5 colours)", cat: "stationery", subcat: "study_acc", price: 85, mrp: 120, rating: 4.6, reviews: 155, emoji: "🖊️", badge: null, inStock: false, express: false },
  { id: "p11", name: "Parle-G Gold Biscuits", cat: "snacks", subcat: "biscuit", price: 20, mrp: 20, rating: 4.8, reviews: 540, emoji: "🍪", badge: "All Time Classic", inStock: true, express: true },
  { id: "p12", name: "Sprite Cold Drink 750ml", cat: "snacks", subcat: "sprite", price: 40, mrp: 40, rating: 4.6, reviews: 310, emoji: "🥤", badge: "Refreshing", inStock: true, express: true },
  { id: "p13", name: "Cotton Single Bedsheet (Blue)", cat: "hostel", subcat: "bedsheet", price: 350, mrp: 499, rating: 4.5, reviews: 142, emoji: "🛏️", badge: "Dorm Classic", inStock: true, express: false },
];

const sortOptions = ["Relevance", "Price: Low to High", "Price: High to Low"];

const priceRanges = [
  { label: "Under ₹100", max: 100 },
  { label: "₹100 – ₹300", max: 300, min: 100 },
  { label: "₹300 – ₹600", max: 600, min: 300 },
  { label: "Above ₹600", min: 600 },
];

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const catId = params.id as string;
  const mainCategory = categories.find(c => c.id === catId);

  const [activeSubCat, setActiveSubCat] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState("Relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const { locationName, landmark, pincode, setIsLocationModalOpen } = useLocationContext();
  const { isLoggedIn, openLoginModal } = useAuth();
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  const subs = subcategories[catId] || [];

  const filtered = products
    .filter((p) => {
      const matchCat = p.cat === catId;
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
      const matchSubCat = !activeSubCat || (p as any).subcat === activeSubCat;
      return matchCat && matchSearch && matchPrice && matchSubCat;
    })
    .sort((a, b) => {
      if (activeSort === "Price: Low to High") return a.price - b.price;
      if (activeSort === "Price: High to Low") return b.price - a.price;
      if (activeSort === "Ratings") return b.rating - a.rating;
      return 0;
    });

  const discount = (p: number, m: number) => Math.round(((m - p) / m) * 100);

  if (!mainCategory) {
    return (
      <div className="min-h-screen bg-blue-50/40 dark:bg-[#0D0D17] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-black mb-4">Category not found</h1>
        <button onClick={() => router.push("/store")} className="text-blue-600 font-bold hover:underline">Return to Store</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/40 dark:bg-[#0D0D17] flex flex-col pt-16">
      <Navbar />

      <main className="pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full mt-4">
          
          <div className="flex items-center justify-between mb-6 mt-2">
            <button onClick={() => router.push("/store")} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0D0D17] rounded-xl border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522] transition-colors text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
                Showing <span className="text-gray-900 dark:text-gray-100 font-black">{filtered.length}</span> items
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 sm:hidden">
                {filtered.length} items
              </p>
              
              {(priceRange || activeSubCat) && (
                <button
                  onClick={() => { setActiveSubCat(null); setPriceRange(null); }}
                  className="hidden md:block text-xs text-blue-600 font-bold hover:underline px-3 py-1.5 bg-blue-50 rounded-lg"
                >
                  Clear filters
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-bold border transition-all ${
                  showFilters || priceRange || activeSubCat
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30"
                    : "bg-white dark:bg-[#151522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2A2A3A]"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter</span>
                {(priceRange || activeSubCat) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-6 pb-0">
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

              <div className="flex-1 overflow-y-auto bg-white dark:bg-[#0D0D17] md:rounded-2xl md:border md:border-gray-200 dark:border-[#2A2A3A] md:sticky md:top-40 md:shadow-sm pb-24 md:pb-0 scrollbar-hide">
                <div className="hidden md:flex px-5 py-4 border-b border-gray-100 dark:border-[#2A2A3A] items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <p className="font-black text-base text-gray-900 dark:text-gray-100">Filters</p>
                </div>

                {/* Subcategory filter */}
                {subs.length > 0 && (
                  <div className="px-5 py-5 border-b border-gray-100 dark:border-[#2A2A3A]">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Subcategories</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => { setActiveSubCat(null); setShowFilters(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                          !activeSubCat
                            ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#151522]"
                        }`}
                      >
                        All {mainCategory.label}
                      </button>
                      {subs.map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => { setActiveSubCat(sub.id); setShowFilters(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                            activeSubCat === sub.id
                              ? "bg-blue-100/50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                              : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-[#151522]"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price range */}
                <div className="px-5 py-5 border-b border-gray-100 dark:border-[#2A2A3A]">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Price Range</p>
                  <div className="space-y-2">
                    {priceRanges.map((r) => {
                      const isActive = priceRange === r.label;
                      return (
                        <button
                          key={r.label}
                          onClick={() => { setPriceRange(isActive ? null : r.label); setShowFilters(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                            isActive
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
                          onClick={() => { setActiveSort(s); setShowFilters(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                            isActive
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
              {/* Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((p) => {
                  const disc = discount(p.price, p.mrp);
                  const wished = wishlist.includes(p.id);
                  const inCart = cart.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPreviewProduct(p)}
                      className="group bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] overflow-hidden
                        shadow-sm hover:shadow-lg hover:border-blue-500 hover:shadow-blue-500/10 transition-all duration-300 flex flex-col relative cursor-pointer"
                    >
                      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1F1F2E] dark:to-[#151522] flex items-center
                        justify-center h-24 md:h-28 text-5xl md:text-6xl border-b border-gray-100 dark:border-[#2A2A3A] p-2 overflow-hidden">
                        <div className="group-hover:scale-110 transition-transform duration-500 drop-shadow-md w-full h-full flex items-center justify-center">
                          {(p as any).img ? (
                            <Image src={(p as any).img} alt={p.name} fill className="object-cover" />
                          ) : (
                            p.emoji
                          )}
                        </div>
                        {!p.inStock && (
                          <div className="absolute inset-0 bg-white/80 dark:bg-[#0D0D17]/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest px-3 py-1 bg-white dark:bg-[#0D0D17] rounded-full shadow-sm">Out of Stock</span>
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLoggedIn) return openLoginModal();
                            setWishlist(w => w.includes(p.id) ? w.filter(i => i !== p.id) : [...w, p.id]);
                          }}
                          className="absolute top-3 right-3 p-2 rounded-full bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A]
                            shadow-sm hover:scale-110 transition-transform z-10"
                        >
                          <Heart className={`w-4 h-4 ${wished ? "fill-rose-500 text-rose-500" : "text-gray-400"}`} />
                        </button>
                      </div>

                      <div className="p-3.5 flex flex-col justify-between flex-1 bg-white dark:bg-[#0D0D17]">
                        <div>
                          {p.badge && (
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded w-fit mb-1.5 block shadow-sm">
                              {p.badge}
                            </span>
                          )}

                          <p className="text-[13px] font-bold text-gray-800 dark:text-gray-200 leading-snug mb-1.5 line-clamp-2">
                            {p.name}
                          </p>

                          <div className="flex items-center gap-1.5 mb-2.5">
                            <span className="inline-flex items-center gap-0.5 bg-blue-600 text-white
                              text-[11px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                              <Star className="w-3 h-3 fill-white" />
                              {p.rating}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium">({p.reviews})</span>
                          </div>

                          <div className="flex items-baseline gap-2 mb-3">
                            <span className="text-[17px] font-black text-gray-900 dark:text-gray-100 tracking-tight">₹{p.price}</span>
                            <span className="text-[11px] text-gray-400 line-through font-medium">₹{p.mrp}</span>
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded shadow-sm">
                              <BadgePercent className="w-3 h-3" />{disc}% off
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={!p.inStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isLoggedIn) return openLoginModal();
                            setCart(c => c.includes(p.id) ? c.filter(i => i !== p.id) : [...c, p.id]);
                          }}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 mt-auto group active:scale-[0.97] ${!p.inStock
                            ? "bg-gray-50 dark:bg-[#1F1F2E] text-gray-400 cursor-not-allowed border border-gray-100 dark:border-[#2A2A3A]"
                            : inCart
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 border border-emerald-500"
                              : "bg-white dark:bg-[#0D0D17] text-blue-600 border border-blue-200 dark:border-[#2A2A3A] hover:bg-blue-600 hover:border-blue-600 hover:text-white shadow-sm hover:shadow-lg hover:shadow-blue-500/25"
                            }`}
                        >
                          <ShoppingCart className={`w-4 h-4 transition-transform duration-300 ${!p.inStock ? "" : inCart ? "scale-110" : "group-hover:-rotate-12 group-hover:scale-110"}`} />
                          {!p.inStock ? "Out of Stock" : inCart ? "Added ✓" : "Add to Cart"}
                        </button>
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
            <button
              onClick={() => setPreviewProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 dark:bg-black/40 dark:hover:bg-black/60 text-gray-900 dark:text-white backdrop-blur-md transition-all shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#1F1F2E] dark:to-[#151522] flex items-center justify-center">
              {previewProduct.img ? (
                <Image src={previewProduct.img} alt={previewProduct.name} fill className="object-cover" />
              ) : (
                <span className="text-8xl">{previewProduct.emoji}</span>
              )}
            </div>

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

              <div className="flex items-end gap-3 mt-2">
                <span className="text-2xl font-black text-gray-900 dark:text-gray-100">₹{previewProduct.price}</span>
                <span className="text-sm text-gray-400 line-through font-medium mb-1">₹{previewProduct.mrp}</span>
              </div>

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
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all duration-300 group active:scale-[0.97] ${
                    !previewProduct.inStock
                      ? "bg-gray-50 dark:bg-[#1F1F2E] text-gray-400 cursor-not-allowed border border-gray-200 dark:border-[#2A2A3A]"
                      : cart.includes(previewProduct.id)
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 border border-emerald-500"
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl hover:shadow-blue-600/30 border border-blue-600"
                  }`}
                >
                  <ShoppingCart className={`w-4 h-4 transition-transform duration-300 ${!previewProduct.inStock ? "" : cart.includes(previewProduct.id) ? "scale-110" : "group-hover:-rotate-12 group-hover:scale-110"}`} />
                  {!previewProduct.inStock ? "Out of Stock" : cart.includes(previewProduct.id) ? "Added ✓" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
