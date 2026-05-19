"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin, ChevronRight, Plus, Minus, Trash2,
  Tag, CheckCircle, Bike, ShoppingBag, Utensils, Store,
  CreditCard, Smartphone, Wallet, ChevronDown, ChevronUp
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";
import { motion, AnimatePresence } from "framer-motion";

const DELIVERY_FEE = 25;
const PLATFORM_FEE = 5;

function groupByRestaurant(items: ReturnType<typeof useCart>["items"]) {
  const map: Record<string, typeof items> = {};
  for (const item of items) {
    if (!map[item.restaurantId]) map[item.restaurantId] = [];
    map[item.restaurantId].push(item);
  }
  return map;
}

/* ── Per-restaurant order card ────────────────────────── */
function RestaurantOrderCard({
  restId,
  restItems,
  onUpdateQty,
  onRemove,
}: {
  restId: string;
  restItems: ReturnType<typeof useCart>["items"];
  onUpdateQty: (uid: string, qty: number) => void;
  onRemove: (uid: string) => void;
}) {
  const restName = restItems[0].restaurantName;
  const subtotal = restItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE + PLATFORM_FEE;
  const totalQty = restItems.reduce((s, i) => s + i.quantity, 0);

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showBill, setShowBill] = useState(true);
  const discount = couponApplied ? Math.floor(subtotal * 0.1) : 0;
  const grandTotal = total - discount;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white rounded-3xl overflow-hidden shadow-xl shadow-orange-500/5 border border-orange-100/50"
    >
      {/* ── Restaurant header ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-orange-100/50 bg-gradient-to-r from-orange-50/50 to-transparent">
        <div className="w-1 h-5 rounded-full bg-orange-500 shrink-0" />
        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <Utensils className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-xl tracking-tight truncate">{restName}</p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            {totalQty} {totalQty === 1 ? "item" : "items"} · Delivers independently
          </p>
        </div>
        <Link
          href={`/vendor/${restId}`}
          className="text-[11px] font-black text-orange-500 flex items-center shrink-0"
        >
          + Add <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* ── Item rows ── */}
      <div className="divide-y divide-gray-50">
        <AnimatePresence>
          {restItems.map((item) => (
            <motion.div
              key={item.uid}
              layout
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/30 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1">
                  <div
                    className={`w-3 h-3 rounded-sm border bg-white flex items-center justify-center ${
                      item.type === "veg" ? "border-green-600" : "border-red-600"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.type === "veg" ? "bg-green-600" : "bg-red-600"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  {item.type === "veg" ? "Veg" : "Non-veg"}
                </p>
                <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 font-medium">₹{item.price} / pc</p>
              </div>

              {/* Price + Controls */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="font-black text-gray-900 text-sm">
                  ₹{item.price * item.quantity}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.uid, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border-2 border-orange-500 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-black text-gray-900 text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.uid, item.quantity + 1)}
                    className="w-7 h-7 rounded-full bg-orange-500 border-2 border-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onRemove(item.uid)}
                    className="ml-1 w-6 h-6 text-gray-300 hover:text-red-500 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Subtotal row ── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-orange-50/30 border-t border-orange-100/50">
        <span className="text-sm text-gray-600 font-semibold">Items subtotal</span>
        <span className="text-sm font-black text-gray-900">₹{subtotal}</span>
      </div>

      {/* ── Coupon ── */}
      <div className="px-5 py-4 border-t border-dashed border-orange-200">
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 border border-gray-200 rounded-xl px-3 py-2">
            <Tag className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Promo code (NEARBUY10)"
              disabled={couponApplied}
              className="flex-1 text-xs font-semibold tracking-wider outline-none bg-transparent disabled:text-gray-400"
            />
          </div>
          <button
            onClick={() => {
              if (couponApplied) { setCouponApplied(false); setCoupon(""); }
              else if (coupon === "NEARBUY10") setCouponApplied(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              couponApplied
                ? "bg-red-50 text-red-500"
                : "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
            }`}
          >
            {couponApplied ? "Remove" : "Apply"}
          </button>
        </div>
        {couponApplied && (
          <p className="mt-1.5 text-[11px] font-bold text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> 10% off — You save ₹{discount}!
          </p>
        )}
      </div>

      {/* ── Bill breakdown (collapsible) ── */}
      <div className="border-t border-orange-100/50">
        <button
          onClick={() => setShowBill(!showBill)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-black text-gray-900 hover:bg-orange-50/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            Bill Details
            <span className="text-xs font-semibold text-gray-400">(incl. delivery)</span>
          </span>
          {showBill ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {showBill && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Item total</span>
                  <span className="font-semibold text-gray-900">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Coupon discount</span>
                    <span className="font-semibold text-green-600">− ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5" /> Delivery fee
                  </span>
                  <span className="font-semibold text-gray-900">₹{DELIVERY_FEE}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Platform fee</span>
                  <span className="font-semibold text-gray-900">₹{PLATFORM_FEE}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                  <span className="font-black text-gray-900">Total to pay</span>
                  <span className="font-black text-gray-900 text-base">₹{grandTotal}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Place Order button for THIS restaurant ── */}
      <div className="px-5 pb-5 pt-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/30">
        <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-2xl text-[15px] shadow-xl shadow-orange-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />
          <CreditCard className="w-4 h-4" />
          Place Order · ₹{grandTotal}
        </button>
        <p className="text-center text-[10px] text-gray-400 font-medium mt-1.5">
          Delivered by {restName} · Est. 15–25 min
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main Cart Page ───────────────────────────────────── */
export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, restaurantCount } = useCart();
  const { locationName } = useLocationContext();

  const foodItems = items.filter((i) => i.section === "food");
  const groups = groupByRestaurant(foodItems);
  const restaurantIds = Object.keys(groups);
  const totalQty = foodItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col pt-16 pb-20">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Back button */}
          <Link href="/" className="flex items-center gap-1.5 p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-700 font-bold text-sm transition-colors">
            Back to Home
          </Link>

          {/* Clear All button */}
          {foodItems.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 px-3 py-1.5 -mr-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-black transition-all active:scale-[0.97]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">

        {/* Empty State */}
        {foodItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-5">
              <ShoppingBag className="w-12 h-12 text-orange-300" />
            </div>
            <h2 className="font-black text-xl text-gray-800 mb-1">Your cart is empty</h2>
            <p className="text-sm text-gray-400 font-medium max-w-xs mb-7">
              Add items from a restaurant to get started.
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-[0.97]"
            >
              Browse Restaurants
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Delivery address bar */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Delivering to</p>
                  <p className="text-sm font-black text-gray-900 truncate">{locationName}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>

            {/* Notice about independent delivery */}
            <div className="flex items-start gap-2.5 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
              <Store className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-700 font-medium leading-relaxed">
                Each restaurant handles its own delivery. Place separate orders below for each restaurant.
              </p>
            </div>

            {/* Per-restaurant order cards */}
            <AnimatePresence>
              {restaurantIds.map((restId) => (
                <RestaurantOrderCard
                  key={restId}
                  restId={restId}
                  restItems={groups[restId]}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </AnimatePresence>

            {/* Essentials notice */}
            <p className="text-center text-[11px] text-gray-400 font-medium py-2">
              Store / essentials items are in a separate cart —{" "}
              <Link href="/essentials" className="text-blue-500 font-bold">view here</Link>
            </p>
          </>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
