"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Package, User, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Order {
  id: string;
  first_name: string;
  last_name: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export default function TodaysOrdersPage() {
  const { user, isLoggedIn, accessToken } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const fetchTodaysOrders = async () => {
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isLoggedIn || (user?.role !== "vendor" && user?.role !== "admin"))) {
      router.push("/");
    }
  }, [mounted, isLoggedIn, user, router]);

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      fetchTodaysOrders();
    }
  }, [isLoggedIn, accessToken]);

  if (!mounted || (!isLoggedIn && mounted)) return null;

  const vType = (user?.manager_type || "food").toLowerCase();
  const tColor = vType === "store" ? "blue" : "orange";

  const deliveredOrders = orders.filter(o => o.status.toLowerCase() === 'delivered');
  const cancelledOrders = orders.filter(o => o.status.toLowerCase() === 'cancelled');

  const OrderCard = ({ order, isDelivered }: { order: Order, isDelivered: boolean }) => {
    const customerName = `${order.first_name || "Guest"} ${order.last_name || ""}`.trim();
    const payMethod = order.payment_method.replace(/_/g, ' ');
    
    return (
      <div className="bg-white dark:bg-[#151522] rounded-2xl p-4 border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-gray-50 dark:border-[#1F1F2E] pb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDelivered ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {isDelivered ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
              <p className="text-xs font-black text-gray-900 dark:text-gray-100 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${tColor}-50 dark:bg-${tColor}-500/10 rounded-xl flex items-center justify-center text-${tColor}-600 dark:text-${tColor}-400 shrink-0`}>
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Customer</p>
            <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{customerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0D0D17] p-2.5 rounded-xl">
          <CreditCard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment</p>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">{payMethod}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col pt-4 pb-20">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#151522] border-b border-gray-200 dark:border-[#2A2A3A] sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/food/vendor" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1F1F2E] text-gray-700 dark:text-gray-300 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl tracking-tight">Today's Orders</h1>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full p-4 mt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className={`w-8 h-8 animate-spin text-${tColor}-500`} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading today's orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-20 h-20 bg-${tColor}-50 dark:bg-${tColor}-500/10 rounded-full flex items-center justify-center mb-4`}>
              <Package className={`w-10 h-10 text-${tColor}-400`} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">No orders today</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">You haven't received any orders today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Delivered Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2A2A3A] pb-2">
                <h2 className="text-lg font-black text-green-600 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Delivered Successfully
                </h2>
                <span className="text-sm font-bold bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                  {deliveredOrders.length}
                </span>
              </div>
              
              {deliveredOrders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No orders delivered today yet.</p>
              ) : (
                <div className="space-y-3">
                  {deliveredOrders.map(order => (
                    <OrderCard key={order.id} order={order} isDelivered={true} />
                  ))}
                </div>
              )}
            </div>

            {/* Cancelled Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2A2A3A] pb-2">
                <h2 className="text-lg font-black text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Cancelled Orders
                </h2>
                <span className="text-sm font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {cancelledOrders.length}
                </span>
              </div>
              
              {cancelledOrders.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No orders cancelled today.</p>
              ) : (
                <div className="space-y-3">
                  {cancelledOrders.map(order => (
                    <OrderCard key={order.id} order={order} isDelivered={false} />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
