"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import {
  MapPin, ChevronRight, ChevronLeft, Plus, Minus, Trash2,
  Tag, CheckCircle, Bike, ShoppingBag, Utensils, Store,
  CreditCard, Smartphone, Wallet, ChevronDown, ChevronUp,
  Phone, FileText, MessageSquare
} from "lucide-react";
import { Checkout } from 'capacitor-razorpay';
import { Capacitor } from '@capacitor/core';
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/context/CartContext";
import { useLocationContext } from "@/context/LocationContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useEffect } from "react";

// Platform fee and GST are now fetched dynamically from the backend

function deg2rad(d: number) { return d * (Math.PI / 180); }
function getDistance(lat1: number | null, lon1: number | null, lat2: number | null, lon2: number | null) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371, dLat = deg2rad(lat2 - lat1), dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  platformFee,
  gst,
  canPlaceOrder,
  onPlaceOrder,
  userLat,
  userLon,
  userPin,
  locationName,
  landmark,
  setIsLocationModalOpen,
  accessToken,
  settingsLoaded,
}: {
  restId: string;
  restItems: ReturnType<typeof useCart>["items"];
  onUpdateQty: (uid: string, qty: number) => void;
  onRemove: (uid: string) => void;
  platformFee: number;
  gst: number;
  canPlaceOrder: boolean;
  onPlaceOrder: (restId: string, items: any[], subtotal: number, gst: number, platformFee: number, total: number, customerMobile: string, alternateMobile: string, cookingInstructions: string, paymentMethod: string, razorpayData?: any) => void;
  userLat: number | null;
  userLon: number | null;
  userPin: string | null;
  locationName: string;
  landmark: string;
  setIsLocationModalOpen: (v: boolean) => void;
  accessToken: string | null;
  settingsLoaded: boolean;
}) {
  const restName = restItems[0].restaurantName;
  const subtotal = restItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalQty = restItems.reduce((s, i) => s + i.quantity, 0);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [showBill, setShowBill] = useState(true);
  const discount = (couponApplied && paymentMethod !== 'cod') ? Math.floor(subtotal * 0.1) : 0;

  // Calculate actual fee amounts based on percentage of subtotal, capped at ₹8 each
  let calculatedPlatformFee = Math.min((subtotal * platformFee) / 100, 8);
  const calculatedGst = Math.min((subtotal * gst) / 100, 8);
  let totalFees = calculatedPlatformFee + calculatedGst;

  // Razorpay requires a minimum amount of ₹1. Enforce this if fees are non-zero.
  // Add any deficit to the platform fee so the UI matches the total.
  if (totalFees > 0 && totalFees < 1) {
    calculatedPlatformFee += (1 - totalFees);
    totalFees = 1;
  }

  const mainOrderTotal = subtotal - discount;
  const grandTotal = mainOrderTotal + totalFees;

  const [customerMobile, setCustomerMobile] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [cookingInstructions, setCookingInstructions] = useState("");

  const isMobileValid = /^[6-9]\d{9}$/.test(customerMobile);
  const isAltMobileValid = alternateMobile === "" || /^[6-9]\d{9}$/.test(alternateMobile);

  const [minOrder, setMinOrder] = useState<number>(0);
  const [feesPaid, setFeesPaid] = useState(false);
  const [isPayingTaxes, setIsPayingTaxes] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);
  const [vendorData, setVendorData] = useState<any>(null);

  useEffect(() => {
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    fetch(`${API}/api/public/vendors/${restId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.minOrder !== undefined) setMinOrder(data.minOrder);
          setVendorData(data);
        }
      })
      .catch(console.error);
  }, [restId]);

  useEffect(() => {
    if (!settingsLoaded) return;
    try {
      const saved = localStorage.getItem(`fees_${restId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Math.abs(parsed.amount - totalFees) < 0.01) {
          setRazorpayData(parsed.razorpayData);
          setFeesPaid(true);
        } else {
          localStorage.removeItem(`fees_${restId}`);
          setFeesPaid(false);
          setRazorpayData(null);
        }
      }
    } catch (e) {}
  }, [restId, totalFees, settingsLoaded]);

  let outOfRange = false;
  if (vendorData) {
    if (userLat !== null && userLon !== null && vendorData.latitude && vendorData.longitude) {
      const vLat = parseFloat(vendorData.latitude);
      const vLon = parseFloat(vendorData.longitude);
      const d = getDistance(userLat, userLon, vLat, vLon);
      const limit = vendorData.deliveryRange ? parseFloat(vendorData.deliveryRange) : 5;
      if (d != null) {
        outOfRange = d > limit;
      }
    } else if (userPin && vendorData.pincode) {
      outOfRange = userPin !== vendorData.pincode;
    }
  }

  const meetsMinOrder = subtotal >= minOrder;
  const isAddressValid = locationName !== "Select Location";
  const finalCanPlaceOrder = canPlaceOrder && meetsMinOrder && (paymentMethod !== 'cod' || feesPaid || totalFees === 0) && !outOfRange && paymentMethod !== "" && isMobileValid && isAltMobileValid && isAddressValid;

  let missingFieldsText = "Select Address & Payment";
  if (!isAddressValid) missingFieldsText = "Add Delivery Address";
  else if (!isMobileValid) missingFieldsText = "Enter Mobile Number";
  else if (!isAltMobileValid) missingFieldsText = "Enter Valid Alt Mobile";
  else if (paymentMethod === "") missingFieldsText = "Select Payment Method";
  else missingFieldsText = "Complete Details";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-[#0D0D17] rounded-3xl overflow-hidden shadow-xl shadow-orange-500/5 border border-orange-100/50 dark:border-white/20"
    >
      {/* ── Restaurant header ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-orange-100/50 bg-gradient-to-r from-orange-50/50 dark:from-[#1F1F2E] to-transparent dark:to-transparent">
        <div className="w-1 h-5 rounded-full bg-orange-500 shrink-0" />
        <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-[#0D0D17] flex items-center justify-center shrink-0">
          <Utensils className="w-4 h-4 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 dark:text-gray-100 text-xl tracking-tight truncate">{restName}</p>
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
              className="flex items-center gap-4 px-5 py-4 hover:bg-orange-50/30 dark:hover:bg-[#0D0D17] transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-[#1F1F2E] border border-gray-200 dark:border-[#2A2A3A] overflow-hidden shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1">
                  <div
                    className={`w-3 h-3 rounded-sm border bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] flex items-center justify-center ${item.type === "veg" ? "border-green-600" : "border-red-600"
                      }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${item.type === "veg" ? "bg-green-600" : "bg-red-600"
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
                <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">₹{item.price} / pc</p>
              </div>

              {/* Price + Controls */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <p className="font-black text-gray-900 dark:text-gray-100 text-sm">
                  ₹{item.price * item.quantity}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.uid, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border-2 border-orange-500 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-black text-gray-900 dark:text-gray-100 text-sm">
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
      <div className="flex items-center justify-between px-5 py-3.5 bg-orange-50/30 dark:bg-[#0D0D17] border-t border-orange-100/50">
        <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">Items subtotal</span>
        <span className="text-sm font-black text-gray-900 dark:text-gray-100">₹{subtotal}</span>
      </div>

      {/* ── Coupon ── */}
      {paymentMethod !== 'cod' && (
        <div className="px-5 py-4 border-t border-dashed border-orange-200">
          <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 border border-gray-200 dark:border-[#2A2A3A] rounded-xl px-3 py-2">
            <Tag className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="Promo code (NEARBUY10)"
              disabled={couponApplied}
              className="flex-1 text-xs font-semibold tracking-wider outline-none bg-transparent disabled:text-gray-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => {
              if (couponApplied) { setCouponApplied(false); setCoupon(""); }
              else if (coupon === "NEARBUY10") setCouponApplied(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${couponApplied
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
      )}

      {/* ── Bill breakdown (collapsible) ── */}
      <div className="border-t border-orange-100/50">
        <button
          onClick={() => setShowBill(!showBill)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-black text-gray-900 dark:text-gray-100 hover:bg-orange-50/30 dark:hover:bg-[#0D0D17] transition-colors"
        >
          <span className="flex items-center gap-2">
            Bill Details
            <span className="text-xs font-semibold text-gray-400">(items only)</span>
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
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Item total</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">₹{subtotal}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Coupon discount</span>
                    <span className="font-semibold text-green-600">− ₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-dashed border-gray-200 dark:border-[#2A2A3A]">
                  <span className="font-black text-gray-900 dark:text-gray-100">Item subtotal after discount</span>
                  <span className="font-black text-gray-900 dark:text-gray-100 text-base">₹{mainOrderTotal}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Delivery Address ── */}
      <div
        onClick={() => setIsLocationModalOpen(true)}
        className="px-5 py-4 border-t border-orange-100/50 cursor-pointer hover:bg-orange-50/30 dark:hover:bg-[#0D0D17] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-50 dark:bg-[#0D0D17] flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Delivery Address <span className="text-red-500 text-xs">*</span></p>
            <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
              {landmark ? `${landmark}, ${locationName}` : locationName}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        </div>
      </div>

      {/* ── Contact & Instructions ── */}
      <div className="px-5 py-4 border-t border-orange-100/50 bg-gray-50/50 dark:bg-[#0D0D17]/50">
        <h3 className="font-black text-gray-900 dark:text-gray-100 mb-4 text-[15px]">Contact & Instructions</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3 h-3" /> Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              value={customerMobile}
              onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, ''))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#0D0D17] focus:outline-none transition-all ${customerMobile && !isMobileValid ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 dark:border-[#2A2A3A] focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                }`}
            />
            {customerMobile && !isMobileValid && (
              <p className="text-[10px] text-red-500 font-bold mt-1.5">Must be a valid 10-digit Indian number starting with 6-9</p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3 h-3" /> Alternate Mobile (Optional)
            </label>
            <input
              type="tel"
              maxLength={10}
              placeholder="Enter alternate 10-digit number"
              value={alternateMobile}
              onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, ''))}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#0D0D17] focus:outline-none transition-all ${alternateMobile && !isAltMobileValid ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 dark:border-[#2A2A3A] focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                }`}
            />
            {alternateMobile && !isAltMobileValid && (
              <p className="text-[10px] text-red-500 font-bold mt-1.5">Must be a valid 10-digit Indian number</p>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3 h-3" /> Cooking Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Make it spicy, no onions, etc."
              value={cookingInstructions}
              onChange={(e) => setCookingInstructions(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2A2A3A] text-sm font-semibold text-gray-900 dark:text-gray-100 bg-white dark:bg-[#0D0D17] focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all custom-scrollbar resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Payment Method ── */}
      <div className="px-5 py-4 border-t border-orange-100/50">
        <h3 className="font-black text-gray-900 dark:text-gray-100 mb-3 text-[15px]">Payment Method <span className="text-red-500">*</span></h3>
        <div className="space-y-2.5">
          <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 dark:border-[#2A2A3A] hover:border-gray-200 dark:border-[#2A2A3A]'}`}>
            <input
              type="radio"
              name={`payment-${restId}`}
              checked={paymentMethod === 'cod'}
              onChange={() => setPaymentMethod('cod')}
              className="w-4 h-4 text-orange-500 accent-orange-500"
            />
            <Wallet className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm flex-1">Cash on Delivery</span>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'online_on_delivery' ? 'border-orange-500 bg-orange-50/30' : 'border-gray-100 dark:border-[#2A2A3A] hover:border-gray-200 dark:border-[#2A2A3A]'}`}>
            <input
              type="radio"
              name={`payment-${restId}`}
              checked={paymentMethod === 'online_on_delivery'}
              onChange={() => setPaymentMethod('online_on_delivery')}
              className="w-4 h-4 text-orange-500 accent-orange-500"
            />
            <CreditCard className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm flex-1">Online On Delivery</span>
          </label>


        </div>
      </div>

      {/* ── Taxes & Platform Fee (Separate Section) ── */}
      {(totalFees > 0 || paymentMethod !== 'cod') && (
        <div className="px-5 py-4 border-t border-orange-100/50 bg-gray-50 dark:bg-[#0D0D17] dark:bg-[#0D0D17]/50">
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {paymentMethod === 'cod' ? "Taxes & Platform Fees" : "Final Breakdown"}
          </p>
          <div className="space-y-2">
            {paymentMethod !== 'cod' && (
              <>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Item Total</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-green-600">Promo Discount</span>
                      <span className="font-semibold text-green-600">− ₹{discount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-bold text-gray-800 dark:text-gray-200">Total after promo code</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">₹{mainOrderTotal.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>GST ({gst}%)</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">₹{calculatedGst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Platform fee ({platformFee}%)</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">₹{calculatedPlatformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 mt-1 border-t border-dashed border-gray-200 dark:border-[#2A2A3A]">
              <span className="font-black text-gray-900 dark:text-gray-100 text-lg">{paymentMethod === 'cod' ? "Total Fees" : "Grand Total"}</span>
              <span className="font-black text-gray-900 dark:text-gray-100 text-lg">₹{(paymentMethod === 'cod' ? totalFees : grandTotal).toFixed(2)}</span>
            </div>
          </div>

          {paymentMethod === 'cod' && (
            !feesPaid ? (
              <button
              disabled={outOfRange}
              onClick={async () => {
                if (outOfRange) return;
                if (!meetsMinOrder && minOrder > 0) {
                  toast.error(`Minimum order amount is ₹${minOrder}`);
                  return;
                }
                setIsPayingTaxes(true);



                /* Original Razorpay Code Below */
                const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
                try {
                  const res = await fetch(`${API}/api/orders/create-razorpay-order`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
                    body: JSON.stringify({ amount: totalFees }),
                  });
                  const rzpOrder = await res.json();
                  if (!res.ok) throw new Error(rzpOrder.error || "Failed to initiate tax payment");

                  const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
                    amount: rzpOrder.amount,
                    currency: rzpOrder.currency,
                    name: "NearBuy Platform Fees",
                    description: "Tax and Platform Fees",
                    order_id: rzpOrder.id,
                    config: {
                      display: {
                        blocks: { upi: { name: "Pay using UPI", instruments: [{ method: "upi" }] } },
                        sequence: ["block.upi"],
                        preferences: { show_default_blocks: false },
                      },
                    },
                    handler: async function (response: any) {
                      try {
                        const verifyRes = await fetch(`${API}/api/orders/verify-payment`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
                          body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                          })
                        });
                        const verifyData = await verifyRes.json();
                        if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
                        
                        const rzpData = {
                          razorpay_order_id: response.razorpay_order_id,
                          razorpay_payment_id: response.razorpay_payment_id,
                          razorpay_signature: response.razorpay_signature,
                        };
                        setRazorpayData(rzpData);
                        localStorage.setItem(`fees_${restId}`, JSON.stringify({ amount: totalFees, razorpayData: rzpData }));
                        toast.success("Fees paid and verified successfully!");
                        setFeesPaid(true);
                      } catch (err: any) {
                        toast.error(err.message || "Payment verification failed");
                      } finally {
                        setIsPayingTaxes(false);
                      }
                    },
                    theme: { color: "#f97316" },
                    modal: { ondismiss: function () { setIsPayingTaxes(false); toast.error("Tax payment cancelled"); } }
                  };
                  if (Capacitor.isNativePlatform()) {
                    try {
                      const nativeOptions = { ...options };
                      delete (nativeOptions as any).config;
          delete (nativeOptions as any).handler;
          delete (nativeOptions as any).modal;
          const data = await Checkout.open(nativeOptions);
          let responseData = data;
          if (data && data.response) {
            responseData = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
          }
          options.handler(responseData);
                    } catch (error: any) {
                      toast.error(error.description || "Payment failed");
                      if (options.modal && options.modal.ondismiss) {
                        options.modal.ondismiss();
                      }
                    }
                  } else {
                    const rzp = new (window as any).Razorpay(options);
                    rzp.on("payment.failed", function (response: any) {
                      toast.error(response.error.description || "Payment failed");
                    });
                    rzp.open();
                  }
                } catch (err: any) {
                  toast.error(err.message || "Error initiating Razorpay");
                  setIsPayingTaxes(false);
                }
              }}
              className={`w-full mt-4 py-3 font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 ${outOfRange
                  ? "bg-gray-200 dark:bg-[#1F1F2E] text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-gray-900 dark:bg-green-600 text-white hover:bg-black dark:hover:bg-green-700 active:scale-[0.98]"
                }`}
            >
              Pay Taxes & Fees (₹{totalFees.toFixed(2)})
            </button>
          ) : (
            <div className="mt-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-black text-green-700">Fees Paid Successfully</span>
            </div>
            )
          )}
        </div>
      )}

      {/* ── Place Order button for THIS restaurant ── */}
      <div className="px-5 pb-5 pt-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/30 dark:from-[#0D0D17] dark:to-[#0D0D17]">
        {outOfRange ? (
          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-500 font-black text-xs">!</span>
            </div>
            <p className="text-xs text-red-600 font-semibold leading-snug flex-1">
              Not deliverable at your address. This store is out of range.
            </p>
          </div>
        ) : !meetsMinOrder && minOrder > 0 ? (
          <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-red-500 font-black text-xs">!</span>
            </div>
            <p className="text-xs text-red-600 font-semibold leading-snug flex-1">
              The Minimum Amount To order from the vendor is ₹{minOrder}. Add more items to exceed min value.
            </p>
          </div>
        ) : null}

        <button
          disabled={!finalCanPlaceOrder}
          onClick={() => {
            if (finalCanPlaceOrder) {
              onPlaceOrder(restId, restItems, subtotal, calculatedGst, calculatedPlatformFee, grandTotal, customerMobile, alternateMobile, cookingInstructions, paymentMethod, razorpayData);
            }
          }}
          className={`w-full py-4 font-black rounded-2xl text-[15px] shadow-xl transition-all flex items-center justify-center gap-2 group relative overflow-hidden ${finalCanPlaceOrder
              ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/30 active:scale-[0.98]"
              : "bg-gray-200 dark:bg-[#1F1F2E] text-gray-400 dark:text-gray-500 cursor-not-allowed"
            }`}
        >
          {finalCanPlaceOrder && <div className="absolute inset-0 w-full h-full bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17]/20 -translate-x-full skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]" />}
          <CreditCard className="w-4 h-4" />
          {outOfRange
            ? "Out of Delivery Range"
            : finalCanPlaceOrder
              ? `Place Order · ₹${mainOrderTotal}`
              : !(feesPaid || totalFees === 0 || paymentMethod !== 'cod') && meetsMinOrder
                ? "Pay Fees to Place Order"
                : !meetsMinOrder && minOrder > 0
                  ? `Minimum Amount is ₹${minOrder}`
                  : missingFieldsText}
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
  const router = useRouter();
  const { items, updateQty, removeItem, clearCart, restaurantCount } = useCart();
  const { locationName, landmark, pincode, latitude, longitude, setIsLocationModalOpen } = useLocationContext();
  const { isLoggedIn, accessToken, openLoginModal } = useAuth();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "Food cart";
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/");
    }
  }, [mounted, isLoggedIn, router]);

  const foodItems = items.filter((i) => i.section === "food");
  const groups = groupByRestaurant(foodItems);
  const restaurantIds = Object.keys(groups);
  const totalQty = foodItems.reduce((s, i) => s + i.quantity, 0);

  const [platformFee, setPlatformFee] = useState(0);
  const [gst, setGst] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    fetch(`${API}/api/public/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.platform_fee !== undefined) setPlatformFee(data.platform_fee);
        if (data.gst !== undefined) setGst(data.gst);
        setSettingsLoaded(true);
      })
      .catch((err) => {
        console.error(err);
        setSettingsLoaded(true);
      });
  }, []);

  const handlePlaceOrder = async (restId: string, orderItems: any[], subtotal: number, gstAmount: number, platformFeeAmount: number, totalAmount: number, customerMobile: string, alternateMobile: string, cookingInstructions: string, paymentMethod: string, razorpayData: any = null) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }

    setIsPlacingOrder(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    const addressDetails = { locationName, landmark, pincode, latitude, longitude };

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          vendor_id: restId,
          items: orderItems.map((item: any) => ({
            id: String(item.id),
            name: item.name,
            price: item.price,
            qty: item.quantity,       // backend expects `qty`, cart uses `quantity`
            image: item.image ?? "",
            type: item.type,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            section: item.section,
          })),
          subtotal,
          gst: gstAmount,
          platform_fee: platformFeeAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          delivery_address: addressDetails,
          customer_mobile: customerMobile,
          alternate_mobile: alternateMobile,
          cooking_instructions: cookingInstructions,
          ...(razorpayData || {})
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      toast.success("Order placed! Wait for confirmation.");
      orderItems.forEach(item => removeItem(item.uid));
      localStorage.removeItem(`fees_${restId}`);
      router.push("/food/orders");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!mounted || (!isLoggedIn && mounted)) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col pt-16 pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navbar />

      {/* Page Header */}
      <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] border-b border-gray-200 dark:border-[#2A2A3A] sticky top-16 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Back button */}
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 -ml-2 rounded-xl bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:bg-[#0D0D17] dark:hover:bg-[#0D0D17] text-gray-700 dark:text-gray-300 font-bold text-sm transition-all active:scale-95 shadow-sm">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {/* Clear All button */}
          {foodItems.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 px-3 py-1.5 m-[10px] rounded-lg bg-red-50 text-red-500 hover:bg-red-100 text-xs font-black transition-all active:scale-[0.97]"
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
            <div className="w-24 h-24 bg-orange-50 dark:bg-[#0D0D17] rounded-full flex items-center justify-center mb-5">
              <ShoppingBag className="w-12 h-12 text-orange-300" />
            </div>
            <h2 className="font-black text-xl text-gray-800 dark:text-gray-200 mb-1">Your cart is empty</h2>
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
            {/* Notice about independent delivery */}

            {/* Notice about independent delivery */}
            <div className="flex items-start gap-2.5 bg-orange-50 dark:bg-[#0D0D17] border border-orange-100 dark:border-orange-500/20 rounded-xl px-4 py-3">
              <Store className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-xs text-orange-gradient dark:text-orange-gradient font-medium leading-relaxed">
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
                  platformFee={platformFee}
                  gst={gst}
                  canPlaceOrder={!isPlacingOrder || !isLoggedIn}
                  onPlaceOrder={handlePlaceOrder}
                  userLat={latitude}
                  userLon={longitude}
                  userPin={pincode}
                  locationName={locationName}
                  landmark={landmark}
                  setIsLocationModalOpen={setIsLocationModalOpen}
                  accessToken={accessToken}
                  settingsLoaded={settingsLoaded}
                />
              ))}
            </AnimatePresence>


          </>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
}
