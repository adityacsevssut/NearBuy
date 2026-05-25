"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Trash2, Pencil, Save, Loader2, Image as ImageIcon,
  ChevronRight, Utensils, Check, ArrowLeft, Package,
  Leaf, Drumstick, LayoutTemplate, AlertTriangle,
  Star, Clock, Heart,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  type: "veg" | "non-veg";
  badge: string;
  image_url: string;
  is_available: boolean;
  rating: number;
  prep_time: string;
  reviews: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vendorType: string;
  /** Called when owner clicks "Design Home Page" so vendor/page.tsx can open ManageFrontPageModal */
  onOpenFrontPage: () => void;
}

// ─── Steps ────────────────────────────────────────────────────────────────────
type Step = "checking" | "no-profile" | "category-count" | "category-names" | "manage";

// ─── Blank item form ──────────────────────────────────────────────────────────
const blankItem = () => ({
  name: "",
  description: "",
  price: "",
  type: "veg" as "veg" | "non-veg",
  badge: "",
  rating: "4.5",
  prep_time: "15 min",
  reviews: "0",
  imageFile: null as File | null,
  imagePreview: null as string | null,
});

// ─── Live food item preview card — exact replica of customer view ─────────────
function FoodItemPreviewCard({
  item,
  shopName,
  actions,
}: {
  item: ReturnType<typeof blankItem> & { is_available?: boolean };
  shopName?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={`bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex gap-4 select-none relative ${item.is_available === false ? 'opacity-75' : ''}`}>
      {actions && (
        <div className="absolute top-2 right-2 z-20">
          {actions}
        </div>
      )}
      {/* ── Left: info ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Veg/Non-veg dot + badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center bg-white flex-shrink-0 ${item.type === "veg" ? "border-green-600" : "border-red-600"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${item.type === "veg" ? "bg-green-600" : "bg-red-600"}`} />
            </span>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded text-orange-700 bg-orange-100 font-bold uppercase tracking-wider">
                {item.badge}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-black text-gray-900 text-lg tracking-tight leading-tight mb-0.5">
            {item.name || <span className="text-gray-300">Item Name</span>}
          </h3>

          {/* By shop */}
          {shopName && (
            <p className="text-xs font-semibold text-gray-400 mb-1">
              by <span className="text-orange-500 font-bold">{shopName}</span>
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-1.5 mt-1.5 mb-2">
            <span className="text-base font-black text-gray-900">₹{item.price || "0"}</span>
          </div>

          {/* Rating + reviews + time */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
            {item.rating && parseFloat(item.rating) > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {item.rating}
                {item.reviews && parseInt(item.reviews) > 0 && (
                  <span className="text-gray-400 font-medium ml-0.5">({item.reviews})</span>
                )}
              </span>
            )}
            {item.prep_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                {item.prep_time}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed max-w-xs">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* ── Right: image + controls ── */}
      <div className="relative flex flex-col items-center justify-start w-32 flex-shrink-0 mb-10">
        <div className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm relative flex items-center justify-center">
          {item.imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imagePreview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-10 h-10 text-gray-300" />
          )}
          {/* Heart button (decorative in preview) */}
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm">
            <Heart className="w-3.5 h-3.5 text-gray-300" />
          </div>
        </div>
        
        {item.is_available === false && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-xl">
             <span className="bg-red-600 text-white font-black text-[10px] px-2 py-1 rounded shadow-sm uppercase tracking-widest text-center">Out of<br/>Stock</span>
          </div>
        )}

        {/* Qty + ADD button (decorative) */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-28 flex flex-col gap-1.5 items-center z-10">
          <div className="flex items-center justify-between w-20 bg-white border border-gray-200 rounded-full shadow-sm overflow-hidden h-6">
            <span className="flex-1 h-full flex items-center justify-center text-gray-500 font-bold text-xs select-none">−</span>
            <span className="font-bold text-xs text-gray-800 w-6 text-center">1</span>
            <span className="flex-1 h-full flex items-center justify-center text-gray-500 font-bold text-xs select-none">+</span>
          </div>
          <div className="w-full py-1 border border-gray-200 font-black text-xs rounded-lg shadow-sm bg-white text-orange-600 text-center uppercase tracking-wide">
            ADD
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function ManageFoodsModal({ isOpen, onClose, vendorType, onOpenFrontPage }: Props) {
  const { accessToken } = useAuth();

  // Theme colours
  const tColor = vendorType === "store" ? "blue" : vendorType === "medicine" ? "emerald" : "orange";
  const btnCls  = `bg-${tColor}-500 hover:bg-${tColor}-600 text-white`;
  const ringCls = `focus:ring-${tColor}-500/20 focus:border-${tColor}-500`;

  // ── Step & profile ────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("checking");
  const [profile, setProfile] = useState<any>(null);

  // ── Category state ────────────────────────────────────────────────────────
  const [catCount, setCatCount] = useState<number | "">("");
  const [catNames, setCatNames] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState("");

  // ── Menu items ────────────────────────────────────────────────────────────
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // ── Add / edit form ───────────────────────────────────────────────────────
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(blankItem());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── On open: check if vendor has a Front Page profile ────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setStep("checking");
    setItems([]);
    setShowForm(false);
    setEditingItem(null);
    checkProfile();
  }, [isOpen]);

  const checkProfile = async () => {
    try {
      const res = await fetch(`${API}/api/vendor-profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const p = data.profile;
        setProfile(p);

        if (!p || !p.restaurant_name) {
          // Owner hasn't set up Front Page yet
          setStep("no-profile");
        } else {
          // Profile exists — load items, then go to manage or category setup
          await loadItems();
        }
      } else {
        setStep("no-profile");
      }
    } catch {
      toast.error("Failed to load profile. Try again.");
      onClose();
    }
  };

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch(`${API}/api/vendor-menu`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const loaded: MenuItem[] = data.items || [];
        setItems(loaded);

        const existingCats = [...new Set(loaded.map((i) => i.category))] as string[];
        if (existingCats.length > 0) {
          setCatNames(existingCats);
          setActiveCat(existingCats[0]);
          setStep("manage");
        } else {
          // No items yet → guide through category setup
          setStep("category-count");
        }
      } else {
        setStep("category-count");
      }
    } catch {
      toast.error("Failed to load menu.");
      setStep("category-count");
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch(`${API}/api/vendor-menu`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        const loaded: MenuItem[] = data.items || [];
        setItems(loaded);
        // Merge new categories from DB into local catNames
        const dbCats = [...new Set(loaded.map((i) => i.category))] as string[];
        setCatNames(prev => [...new Set([...prev, ...dbCats])]);
      }
    } catch {
      toast.error("Failed to reload menu.");
    } finally {
      setLoadingItems(false);
    }
  };

  // ── Category setup handlers ───────────────────────────────────────────────
  const handleSetupCategories = () => {
    if (!catCount || catCount < 1 || catCount > 20) {
      toast.error("Enter a number between 1 and 20.");
      return;
    }
    setCatNames(Array(Number(catCount)).fill(""));
    setStep("category-names");
  };

  const handleConfirmCategories = () => {
    const cleaned = catNames.map((n) => n.trim()).filter(Boolean);
    if (cleaned.length === 0) { toast.error("Enter at least one category name."); return; }
    const unique = new Set(cleaned.map((c) => c.toLowerCase()));
    if (unique.size !== cleaned.length) { toast.error("Duplicate category names detected."); return; }
    setCatNames(cleaned);
    setActiveCat(cleaned[0]);
    setStep("manage");
    fetchItems();
  };

  // ── Image handler ─────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
      setForm((f) => ({ ...f, imageFile: file }));
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, imagePreview: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  // ── Save item ─────────────────────────────────────────────────────────────
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Item name is required."); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast.error("Enter a valid price."); return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("category", activeCat);
      fd.append("name", form.name.trim());
      fd.append("description", form.description.trim());
      fd.append("price", form.price);
      fd.append("type", form.type);
      fd.append("badge", form.badge.trim());
      fd.append("rating", form.rating || "0");
      fd.append("prep_time", form.prep_time || "");
      fd.append("reviews", form.reviews || "0");
      if (form.imageFile) fd.append("image", form.imageFile);

      const url = editingItem ? `${API}/api/vendor-menu/${editingItem.id}` : `${API}/api/vendor-menu`;
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${accessToken}` }, body: fd });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Save failed"); }

      toast.success(editingItem ? "Item updated! ✅" : "Item added! ✅");
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const handleDelete = async (id: string, category: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/vendor-menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) { 
        toast.success("Item removed.");
        
        // Auto-delete category if empty
        const remainingInCat = items.filter(i => i.category === category && i.id !== id);
        if (remainingInCat.length === 0) {
          setCatNames(prev => prev.filter(c => c !== category));
          // Switch to another category if available
          const otherCats = catNames.filter(c => c !== category);
          if (otherCats.length > 0) setActiveCat(otherCats[0]);
        }
        
        fetchItems(); 
      }
      else { const d = await res.json(); toast.error(d.error || "Delete failed."); }
    } catch { toast.error("Network error."); }
    finally { setDeletingId(null); }
  };

  // ── Toggle Availability ───────────────────────────────────────────────────
  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const fd = new FormData();
      fd.append("is_available", String(!currentStatus));
      const res = await fetch(`${API}/api/vendor-menu/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: fd
      });
      if (res.ok) {
        toast.success(!currentStatus ? "Marked as Available" : "Marked as Out of Stock");
        fetchItems();
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Network error.");
    }
  };

  if (!isOpen) return null;

  const itemsInCat = items.filter((i) => i.category === activeCat);
  const allCats = catNames.length > 0
    ? [...new Set([...catNames, ...items.map((i) => i.category)])]
    : [...new Set(items.map((i) => i.category))];

  const headerSubtitle =
    step === "checking"       ? "Verifying your account…" :
    step === "no-profile"     ? "Home Page setup required" :
    step === "category-count" ? "Set up your categories" :
    step === "category-names" ? "Name your categories" :
    activeCat                 ? `Category: ${activeCat}` : "Your menu";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          transition={{ type: "spring", bounce: 0.25 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden"
        >

          {/* ═══════ HEADER ═══════ */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-${tColor}-100 flex items-center justify-center`}>
                <Utensils className={`w-5 h-5 text-${tColor}-600`} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 leading-tight">Manage Foods</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{headerSubtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ═══════ BODY ═══════ */}
          <div className="flex-1 overflow-y-auto">

            {/* ──────────────────────────────────────── CHECKING ── */}
            {step === "checking" && (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
                <Loader2 className={`w-10 h-10 animate-spin text-${tColor}-500`} />
                <p className="text-sm font-bold text-gray-500">Loading your store info…</p>
              </div>
            )}

            {/* ──────────────────────────────── NO PROFILE GATE ── */}
            {step === "no-profile" && (
              <div className="flex flex-col items-center justify-center min-h-[420px] px-6 py-10 text-center">
                {/* Illustration area */}
                <div className="relative mb-6">
                  <div className={`w-24 h-24 rounded-3xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center shadow-sm`}>
                    <LayoutTemplate className="w-12 h-12 text-amber-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center shadow-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 mb-2">Home Page Not Set Up</h3>
                <p className="text-sm text-gray-500 font-medium max-w-sm mb-2 leading-relaxed">
                  Before you can add food items, you must first design your{" "}
                  <span className="font-black text-gray-800">Vendor Home Page</span>.
                </p>
                <p className="text-xs text-gray-400 font-medium max-w-xs mb-8 leading-relaxed">
                  This sets your shop name, banner image, ratings, and address — which customers see before browsing your menu.
                </p>

                {/* Steps visual */}
                <div className="flex items-center gap-2 mb-8">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200`}>
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">1</div>
                    <span className="text-xs font-black text-amber-700">Design Home Page</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200">
                    <div className="w-5 h-5 rounded-full bg-gray-300 text-white text-[10px] font-black flex items-center justify-center">2</div>
                    <span className="text-xs font-black text-gray-400">Add Foods</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <button
                    onClick={() => {
                      onClose();
                      // Small delay so this modal closes before front page modal opens
                      setTimeout(onOpenFrontPage, 150);
                    }}
                    className={`w-full py-3.5 ${btnCls} rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    <LayoutTemplate className="w-5 h-5" />
                    Design Home Page
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-colors text-sm"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            )}

            {/* ──────────────────────────────── CATEGORY COUNT ── */}
            {step === "category-count" && (
              <div className="flex flex-col items-center justify-center min-h-[380px] px-6 py-10">
                <div className={`w-16 h-16 rounded-2xl bg-${tColor}-50 border-2 border-${tColor}-200 flex items-center justify-center mb-5 shadow-sm`}>
                  <Package className={`w-8 h-8 text-${tColor}-500`} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">How many categories?</h3>
                <p className="text-sm text-gray-500 text-center mb-6 max-w-xs font-medium">
                  Tell us how many food categories your menu has (e.g. Biryani, Starters, Desserts…)
                </p>
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => setCatCount((c) => Math.max(1, (Number(c) || 1) - 1))}
                    className="w-12 h-12 rounded-2xl border-2 border-gray-200 bg-gray-50 text-2xl font-black text-gray-600 hover:border-gray-400 hover:bg-gray-100 transition-all active:scale-95"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={catCount}
                    onChange={(e) => setCatCount(e.target.value === "" ? "" : Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                    className={`w-24 h-14 text-center text-3xl font-black border-2 border-gray-200 rounded-2xl bg-gray-50 text-gray-900 outline-none ${ringCls} transition-all`}
                  />
                  <button
                    onClick={() => setCatCount((c) => Math.min(20, (Number(c) || 0) + 1))}
                    className={`w-12 h-12 rounded-2xl border-2 border-${tColor}-300 bg-${tColor}-50 text-2xl font-black text-${tColor}-600 hover:bg-${tColor}-100 transition-all active:scale-95`}
                  >+</button>
                </div>
                <button
                  onClick={handleSetupCategories}
                  disabled={!catCount || catCount < 1}
                  className={`px-8 py-3 ${btnCls} rounded-2xl font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2`}
                >
                  Next <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* ──────────────────────────────── CATEGORY NAMES ── */}
            {step === "category-names" && (
              <div className="px-6 py-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setStep("category-count")} className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-lg font-black text-gray-900">Name your {catNames.length} categories</h3>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  e.g. <span className="font-bold text-gray-700">Biryani</span>, <span className="font-bold text-gray-700">Starters</span>, <span className="font-bold text-gray-700">Desserts</span>
                </p>
                <div className="space-y-3">
                  {catNames.map((name, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full bg-${tColor}-100 text-${tColor}-700 text-xs font-black flex items-center justify-center shrink-0`}>
                        {i + 1}
                      </span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const n = [...catNames];
                          n[i] = e.target.value;
                          setCatNames(n);
                        }}
                        placeholder={`Category ${i + 1} name…`}
                        className={`flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all`}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <button
                    onClick={handleConfirmCategories}
                    className={`w-full py-3.5 ${btnCls} rounded-2xl font-black shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2`}
                  >
                    <Check className="w-5 h-5" /> Confirm &amp; Start Adding Foods
                  </button>
                </div>
              </div>
            )}

            {/* ──────────────────────────────────────── MANAGE ── */}
            {step === "manage" && (
              <div className="flex flex-col h-full">
                {/* Category tabs */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {allCats.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setActiveCat(cat); setShowForm(false); }}
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all border
                          ${activeCat === cat
                            ? `bg-${tColor}-500 text-white border-${tColor}-500 shadow-sm`
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          }`}
                      >
                        {cat}
                        <span className={`ml-1.5 text-[10px] ${activeCat === cat ? "text-white/70" : "text-gray-400"}`}>
                          ({items.filter((i) => i.category === cat).length})
                        </span>
                      </button>
                    ))}
                    {/* Add more categories */}
                    <button
                      onClick={() => { setCatCount(""); setStep("category-count"); }}
                      className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black text-gray-400 border border-dashed border-gray-300 hover:border-gray-500 hover:text-gray-600 transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                </div>

                {/* Items list + form */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
                  {loadingItems ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className={`w-8 h-8 animate-spin text-${tColor}-500`} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Existing items */}
                      {itemsInCat.length > 0 && (
                        <div className="space-y-3">
                          {itemsInCat.map((item) => (
                            <FoodItemPreviewCard
                              key={item.id}
                              item={{
                                ...item,
                                price: String(item.price),
                                imageFile: null,
                                imagePreview: item.image_url || null,
                                rating: item.rating ? String(item.rating) : "0",
                                prep_time: item.prep_time || "",
                                reviews: item.reviews ? String(item.reviews) : "0",
                              }}
                              actions={
                                <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-gray-100">
                                  <button
                                    onClick={() => handleToggleAvailability(item.id, item.is_available)}
                                    className={`px-2 h-7 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                                      item.is_available 
                                        ? "bg-green-50 text-green-600 hover:bg-green-100" 
                                        : "bg-red-50 text-red-600 hover:bg-red-100"
                                    }`}
                                  >
                                    {item.is_available ? "In Stock" : "Out of Stock"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setForm({
                                        name: item.name,
                                        description: item.description,
                                        price: String(item.price),
                                        type: item.type,
                                        badge: item.badge,
                                        rating: item.rating ? String(item.rating) : "4.5",
                                        prep_time: item.prep_time || "15 min",
                                        reviews: item.reviews ? String(item.reviews) : "0",
                                        imageFile: null,
                                        imagePreview: item.image_url || null
                                      });
                                      setShowForm(true);
                                    }}
                                    className={`w-7 h-7 rounded-lg bg-${tColor}-50 hover:bg-${tColor}-100 text-${tColor}-600 flex items-center justify-center transition-colors`}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id, item.category)}
                                    disabled={deletingId === item.id}
                                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                                  >
                                    {deletingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  </button>
                                </div>
                              }
                            />
                          ))}
                        </div>
                      )}

                      {itemsInCat.length === 0 && !showForm && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                          <Utensils className="w-10 h-10 mb-3 opacity-30" />
                          <p className="font-bold text-gray-500">No items in <span className="text-gray-700">{activeCat}</span> yet</p>
                          <p className="text-sm mt-1">Click "Add Item" below to start building this category.</p>
                        </div>
                      )}

                      {/* ── ADD / EDIT FORM ── */}
                      <AnimatePresence>
                        {showForm && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`bg-gray-50/80 border-2 border-${tColor}-200 rounded-2xl p-5 shadow-sm`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-black text-gray-900 text-base">
                                {editingItem ? "Edit Item" : `Add to "${activeCat}"`}
                              </h4>
                              <button
                                onClick={() => { setShowForm(false); setEditingItem(null); }}
                                className="p-1.5 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Live preview */}
                            <div className="mb-5">
                              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                                Customer Preview
                              </label>
                              <FoodItemPreviewCard item={form} shopName={profile?.restaurant_name} />
                            </div>

                            <form id="itemForm" onSubmit={handleSaveItem} className="space-y-4">
                              {/* Image */}
                              <div>
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 block">Item Photo</label>
                                <div className="relative w-full h-36 rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden hover:bg-gray-50 transition-colors group cursor-pointer">
                                  {form.imagePreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-1.5">
                                      <ImageIcon className="w-8 h-8" />
                                      <span className="text-sm font-medium">Click to upload photo</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                  {form.imagePreview && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                      <span className="text-white font-bold bg-black/50 px-3 py-1.5 rounded-full text-sm">Change</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Name */}
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Item Name *</label>
                                  <input
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Chicken Biryani"
                                    className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all`}
                                  />
                                </div>
                                {/* Price */}
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Price (₹) *</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={form.price}
                                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                                    placeholder="e.g. 180"
                                    className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all`}
                                  />
                                </div>
                              </div>

                              {/* Description */}
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Description</label>
                                <textarea
                                  value={form.description}
                                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                  placeholder="e.g. Fragrant basmati rice cooked with tender chicken and aromatic spices"
                                  className={`w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all resize-none h-20 text-sm`}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Type toggle */}
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Type *</label>
                                  <div className="flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                                    <button
                                      type="button"
                                      onClick={() => setForm((f) => ({ ...f, type: "veg" }))}
                                      className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${form.type === "veg" ? "bg-green-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                                    >
                                      <Leaf className="w-3.5 h-3.5" /> Veg
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setForm((f) => ({ ...f, type: "non-veg" }))}
                                      className={`flex-1 py-2.5 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${form.type === "non-veg" ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                                    >
                                      <Drumstick className="w-3.5 h-3.5" /> Non-Veg
                                    </button>
                                  </div>
                                </div>

                                {/* Badge chips */}
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Badge (optional)</label>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {["Bestseller", "Must Try", "New", "Spicy"].map((b) => (
                                      <button
                                        key={b}
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, badge: f.badge === b ? "" : b }))}
                                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${form.badge === b ? "bg-orange-500 text-white border-orange-500" : "bg-white border-gray-200 text-gray-600 hover:border-orange-300"}`}
                                      >
                                        {b}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Rating · Prep Time · Reviews */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400" /> Rating
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={5}
                                    step={0.1}
                                    value={form.rating}
                                    onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                                    placeholder="4.5"
                                    className={`w-full px-3 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all text-sm`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-gray-400" /> Prep Time
                                  </label>
                                  <input
                                    value={form.prep_time}
                                    onChange={(e) => setForm((f) => ({ ...f, prep_time: e.target.value }))}
                                    placeholder="15 min"
                                    className={`w-full px-3 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all text-sm`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Reviews</label>
                                  <input
                                    type="number"
                                    min={0}
                                    value={form.reviews}
                                    onChange={(e) => setForm((f) => ({ ...f, reviews: e.target.value }))}
                                    placeholder="0"
                                    className={`w-full px-3 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 outline-none ${ringCls} transition-all text-sm`}
                                  />
                                </div>
                              </div>

                              {/* Save */}
                              <div className="pt-2">
                                <button
                                  type="submit"
                                  form="itemForm"
                                  disabled={saving}
                                  className={`w-full py-3.5 ${btnCls} rounded-2xl font-black shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                  {editingItem ? "Update Item" : "Add to Menu"}
                                </button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ═══════ FOOTER (only on manage step, when form is hidden) ═══════ */}
          {step === "manage" && !showForm && (
            <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0 flex items-center justify-between">
              <p className={`text-xs font-bold text-${tColor}-600`}>
                {activeCat && `${itemsInCat.length} item${itemsInCat.length !== 1 ? "s" : ""} in "${activeCat}"`}
              </p>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                  Close
                </button>
                <button
                  onClick={() => { setEditingItem(null); setForm(blankItem()); setShowForm(true); }}
                  className={`px-5 py-2.5 ${btnCls} rounded-xl font-black shadow-md transition-all active:scale-95 flex items-center gap-2`}
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
