"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Loader2, Package, Clock, CheckCircle,
  AlertCircle, Truck, ReceiptText, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Order {
  id: string;
  first_name: string;
  last_name: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  subtotal: string;
  delivery_charge?: string;
  advance_fee?: string;
  platform_fee?: string;
  created_at: string;
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30";
    case "cancelled":
      return "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30";
    case "out for delivery":
      return "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
    case "confirmed":
      return "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    case "shipment":
      return "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
    default:
      return "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "delivered": return <CheckCircle className="w-3.5 h-3.5" />;
    case "cancelled": return <AlertCircle className="w-3.5 h-3.5" />;
    case "out for delivery": return <Truck className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
}

function timeStr(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function TodaysOrdersPage() {
  const { user, isLoggedIn, accessToken } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchTodaysOrders = async () => {
    setIsLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/vendor/todays`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.error || "Failed to fetch orders");
      }
    } catch {
      toast.error("Network error while fetching orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && (!isLoggedIn || (user?.role !== "vendor" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [mounted, isLoggedIn, user, router]);

  useEffect(() => {
    if (isLoggedIn && accessToken) fetchTodaysOrders();
  }, [isLoggedIn, accessToken]);

  if (!mounted || (!isLoggedIn && mounted)) return null;

  const vType = (user?.manager_type || "food").toLowerCase();

  // Summary stats
  const total = orders.length;
  const delivered = orders.filter(o => o.status.toLowerCase() === "delivered").length;
  const cancelled = orders.filter(o => o.status.toLowerCase() === "cancelled").length;
  const active = total - delivered - cancelled;
  const revenue = orders
    .filter(o => o.status.toLowerCase() === "delivered")
    .reduce((sum, o) => sum + parseFloat(o.subtotal || "0"), 0);

  const revenueOOD = orders
    .filter(o => o.status.toLowerCase() === "delivered" && o.payment_method === "online_on_delivery")
    .reduce((sum, o) => sum + parseFloat(o.subtotal || "0"), 0);

  const revenueCOD = orders
    .filter(o => o.status.toLowerCase() === "delivered" && o.payment_method === "cash_on_delivery")
    .reduce((sum, o) => sum + parseFloat(o.subtotal || "0"), 0);

  const cancelledOodDeliveryCharges = orders
    .filter(o => o.status.toLowerCase() === "cancelled" && o.payment_method === "online_on_delivery")
    .reduce((sum, o) => sum + parseFloat(o.delivery_charge || "0"), 0);

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col pb-12">

      {/* ── Navbar ── */}
      <div className={`sticky top-0 z-20 shadow-lg ${vType === "store" ? "bg-gradient-to-r from-blue-600 to-blue-700" : "bg-gradient-to-r from-orange-500 to-orange-600"}`}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/food/vendor"
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <ReceiptText className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="font-black text-[15px] text-white tracking-tight leading-tight">Today's Orders</h1>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Vendor Portal</span>
            </div>
          </div>
          <button
            onClick={fetchTodaysOrders}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-white ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Orders", value: total, color: "text-gray-900 dark:text-gray-100", bg: "bg-white dark:bg-[#0D0D17]" },
            { label: "Active", value: active, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
            { label: "Delivered", value: delivered, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
            { label: "Cancelled", value: cancelled, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl border border-gray-100 dark:border-[#2A2A3A] p-4 shadow-sm text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue banner */}
        <div className="space-y-3">
          <div className={`${vType === "store" ? "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-300" : "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-700 dark:text-orange-300"} border rounded-2xl px-5 py-3 flex items-center justify-between`}>
            <p className="text-xs font-black uppercase tracking-widest opacity-70">Today's Revenue (delivered)</p>
            <p className="text-xl font-black">₹{revenue.toFixed(0)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Online On Delivery (OOD)</p>
              <p className="text-lg font-black text-gray-900 dark:text-gray-100">₹{revenueOOD.toFixed(0)}</p>
            </div>
            <div className="bg-white dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Cash On Delivery (COD)</p>
              <p className="text-lg font-black text-gray-900 dark:text-gray-100">₹{revenueCOD.toFixed(0)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500/80 dark:text-red-400/80">User Cancellation</p>
                <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase">OOD</span>
              </div>
              <p className="text-xs font-medium text-gray-500 mt-0.5">Total delivery charges collected</p>
            </div>
            <p className="text-lg font-black text-red-600 dark:text-red-400">₹{cancelledOodDeliveryCharges.toFixed(0)}</p>
          </div>
        </div>

        {/* ── Orders Table ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className={`w-8 h-8 animate-spin ${vType === "store" ? "text-blue-500" : "text-orange-500"}`} />
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Loading today's orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-20 h-20 ${vType === "store" ? "bg-blue-50 dark:bg-blue-500/10" : "bg-orange-50 dark:bg-orange-500/10"} rounded-full flex items-center justify-center mb-4`}>
              <Package className={`w-10 h-10 ${vType === "store" ? "text-blue-400" : "text-orange-400"}`} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">No orders today</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">You haven't received any orders today.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">All Orders</p>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-[#1F1F2E] px-2.5 py-1 rounded-full">{total} total</span>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block bg-white dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#151522] border-b border-gray-200 dark:border-[#2A2A3A]">
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Order ID</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-[10px] font-black text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#1A1A2A]">
                    {orders.map((order, i) => (
                      <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-[#151522]/60 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs font-black text-gray-900 dark:text-gray-100">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          {order.first_name} {order.last_name}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                          {order.payment_method?.replace(/_/g, " ") || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm font-black text-gray-900 dark:text-gray-100">
                          ₹{parseFloat(order.total_amount).toFixed(0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusStyle(order.status)}`}>
                            <StatusIcon status={order.status} />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                          {timeStr(order.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {orders.map((order, i) => (
                <div key={order.id} className="bg-white dark:bg-[#0D0D17] border border-gray-100 dark:border-[#2A2A3A] rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-gray-400">#{i + 1}</span>
                      <span className="font-mono text-xs font-black text-gray-900 dark:text-gray-100">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusStyle(order.status)}`}>
                      <StatusIcon status={order.status} />
                      {order.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Customer</p>
                      <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{order.first_name} {order.last_name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Amount</p>
                      <p className="font-black text-gray-900 dark:text-gray-100 mt-0.5">₹{parseFloat(order.total_amount).toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Payment</p>
                      <p className="font-bold text-gray-600 dark:text-gray-400 uppercase mt-0.5">{order.payment_method?.replace(/_/g, " ") || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Time</p>
                      <p className="font-medium text-gray-500 dark:text-gray-400 mt-0.5">{timeStr(order.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
