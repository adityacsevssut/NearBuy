/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package, MapPin, ChevronLeft, Clock,
  CheckCircle, Loader2, User, FileText, ChevronRight,
  Eye, Truck, AlertCircle, Settings2, X, Phone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity?: number;
  qty?: number;
  type: "veg" | "non-veg";
}

interface Order {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  items: OrderItem[];
  subtotal: string;
  gst: string;
  platform_fee: string;
  total_amount: string;
  payment_method: string;
  payment_status: string;
  delivery_address: any;
  status: string;
  created_at: string;
  customer_mobile?: string;
  alternate_mobile?: string;
  delivery_charge?: string;
  cancel_request_status?: string;
  cancel_request_reason?: string;
  advance_fee?: string;
  advance_paid?: boolean;
}

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipment",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function VendorOrdersPage() {
  const { user, isLoggedIn, accessToken } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<string | null>(null);
  const [deliveryChargeInput, setDeliveryChargeInput] = useState<string>("");
  const [advanceFeeInput, setAdvanceFeeInput] = useState<string>("");
  const [paymentTypeSelection, setPaymentTypeSelection] = useState<'advance' | 'full'>('advance');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);

  const fetchOrders = async (pageNum = 1) => {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const query = new URLSearchParams({ page: pageNum.toString(), limit: "20" });
      
      const res = await fetch(`${API}/api/orders/vendor?${query.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setHasMore(pageNum < (data.pagination?.totalPages || 1));
        setOrders(prev => pageNum === 1 ? (data.orders || []) : [...prev, ...(data.orders || [])]);
      } else {
        toast.error(data.error || "Failed to fetch orders");
      }
    } catch {
      toast.error("Network error while fetching orders");
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isLoading || loadingMore || !hasMore) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => {
            const next = prev + 1;
            fetchOrders(next);
            return next;
          });
        }
      },
      { threshold: 1.0 }
    );
    if (lastElementRef.current) observer.observe(lastElementRef.current);
    observerRef.current = observer;
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [isLoading, loadingMore, hasMore, lastElementRef.current]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      
      let finalAdvanceFee = parseFloat(advanceFeeInput || "0");
      if (statusModalOrder?.payment_method === 'online_on_delivery' && newStatus === "Confirmed") {
        const subtotal = parseFloat(statusModalOrder.subtotal || "0");
        const gst = parseFloat(statusModalOrder.gst || "0");
        const maxAdvanceFee = subtotal + gst;

        if (paymentTypeSelection === 'advance') {
          if (finalAdvanceFee >= maxAdvanceFee && maxAdvanceFee > 0) {
            const suggested = Math.max(0, Math.floor(maxAdvanceFee - 1));
            toast.error(`You can't set full amount. If you want full money switch to full payment mode or give value of ${suggested} which is lesser than ${maxAdvanceFee}`);
            setStatusLoading(false);
            return;
          }
        } else if (paymentTypeSelection === 'full') {
          finalAdvanceFee = maxAdvanceFee;
        }
      }

      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === "Confirmed" && { 
            delivery_charge: parseFloat(deliveryChargeInput || "0"),
            ...(statusModalOrder?.payment_method === 'online_on_delivery' && { advance_fee: finalAdvanceFee })
          })
        }),
      });
      if (res.ok) {
        const isOOD = statusModalOrder?.payment_method === 'online_on_delivery';
        if (newStatus === "Confirmed" && isOOD && finalAdvanceFee > 0) {
          toast.success(paymentTypeSelection === 'full' ? "Full payment requested." : "Confirmation requested. Waiting for advance payment.");
        } else {
          toast.success(`Order marked as ${newStatus}`);
        }
        setStatusModalOrder(null);
        setPendingStatusUpdate(null);
        setDeliveryChargeInput("");
        setAdvanceFeeInput("");
        setPaymentTypeSelection('advance');
        setPage(1);
        fetchOrders(1);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRespondToCancelRequest = async (orderId: string, action: 'approve' | 'reject') => {
    setIsLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/${orderId}/cancel-request/respond`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(`Cancellation request ${action}d successfully`);
        setPage(1);
        fetchOrders(1);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to respond");
        setIsLoading(false);
      }
    } catch {
      toast.error("Network error");
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
      fetchOrders();
    }
  }, [isLoggedIn, accessToken]);



  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
      case "confirmed": return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
      case "out for delivery": return "text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20";
      case "delivered": return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
      case "cancelled": return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
      default: return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1F1F2E] border-gray-200 dark:border-[#2A2A3A]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "shipment": return <Package className="w-4 h-4" />;
      case "out for delivery": return <Truck className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!mounted || (!isLoggedIn && mounted)) return null;

  const vType = (user?.manager_type || "food").toLowerCase();
  const tColor = vType === "store" ? "blue" : "orange";

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#151522] flex flex-col pt-4 pb-20">

      {/* Page Header */}
      <div className="bg-white dark:bg-[#0D0D17] border-b border-gray-200 dark:border-[#2A2A3A] sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/vendor" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#151522] text-gray-700 dark:text-gray-300 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-black text-gray-900 dark:text-gray-100 text-xl tracking-tight">Customer Orders</h1>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4 mt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className={`w-8 h-8 animate-spin text-${tColor}-500`} />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Fetching orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-20 h-20 bg-${tColor}-50 rounded-full flex items-center justify-center mb-4`}>
              <Package className={`w-10 h-10 text-${tColor}-400`} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Customers haven&apos;t placed any orders yet.</p>
          </div>
        ) : (
          orders.map((order) => {
            const customerName = `${order.first_name || "Guest"} ${order.last_name || ""}`.trim();
            const isAwaitingAdvance = order.payment_method === 'online_on_delivery' && parseFloat(order.advance_fee || "0") > 0 && !order.advance_paid;
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0D0D17] rounded-3xl border border-gray-100 dark:border-[#2A2A3A] shadow-sm overflow-hidden"
              >
                {/* Card Header (Customer Info) */}
                <div className="p-5 border-b border-gray-50 dark:border-[#1F1F2E] flex items-start gap-4">
                  <div className={`w-14 h-14 bg-${tColor}-50 dark:bg-${tColor}-500/10 rounded-2xl overflow-hidden shrink-0 border border-${tColor}-100 dark:border-${tColor}-500/20 shadow-sm flex items-center justify-center text-${tColor}-600 dark:text-${tColor}-400`}>
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg truncate leading-tight mb-1">
                      {customerName}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {order.delivery_address?.locationName || "Unknown Location"}
                          {order.delivery_address?.landmark ? `, ${order.delivery_address.landmark}` : ""}
                          {order.delivery_address?.pincode ? ` - ${order.delivery_address.pincode}` : ""}
                        </span>
                      </div>
                      {order.customer_mobile ? (
                        <a href={`tel:${order.customer_mobile}`} className={`inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 bg-${tColor}-50 dark:bg-${tColor}-500/10 hover:bg-${tColor}-100 dark:hover:bg-${tColor}-500/20 border border-${tColor}-200 dark:border-${tColor}-500/30 text-${tColor}-700 dark:text-${tColor}-400 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm w-fit`}>
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>Call: {order.customer_mobile}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>No mobile provided</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100">₹{(parseFloat(order.subtotal || "0") + parseFloat(order.delivery_charge || "0")).toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {order.cancel_request_status === 'pending' && order.status.toLowerCase() !== 'cancelled' && (
                  <div className="mx-5 mb-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black text-red-700 dark:text-red-400">Cancellation Requested</h4>
                        <p className="text-[10px] font-medium text-red-600 dark:text-red-500 mt-0.5">{order.cancel_request_reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespondToCancelRequest(order.id, 'approve')}
                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                      >
                        Approve Cancel
                      </button>
                      <button
                        onClick={() => handleRespondToCancelRequest(order.id, 'reject')}
                        className="flex-1 py-1.5 bg-white dark:bg-[#0D0D17] hover:bg-gray-50 border border-gray-200 dark:border-[#2A2A3A] text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Banner */}
                <div className={`px-5 py-3 border-b border-gray-50 dark:border-[#1F1F2E] flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                      isAwaitingAdvance ? "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20" : getStatusColor(order.status)
                    } font-bold text-xs uppercase tracking-wider`}>
                      {isAwaitingAdvance ? <Clock className="w-4 h-4" /> : getStatusIcon(order.status)}
                      {isAwaitingAdvance ? "AWAITING ADVANCE" : order.status}
                    </div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payment:</span>
                      <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-[#1F1F2E] px-2 py-0.5 rounded">
                        {order.payment_method.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border ${
                        order.payment_status === 'paid' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20' : 
                        order.payment_status === 'fees_paid' ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20' :
                        'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                      }`}>
                        {order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'fees_paid' ? 'Fees Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50 dark:bg-[#151522]/50 flex gap-3">
                  <button
                    onClick={() => setSelectedOrderForItems(order)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#0D0D17] border-2 border-gray-200 dark:border-[#2A2A3A] hover:border-gray-300 dark:hover:border-gray-500 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4" />
                    See Items
                  </button>
                  <button
                    onClick={() => setStatusModalOrder(order)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-${tColor}-50 dark:bg-${tColor}-500/10 hover:bg-${tColor}-100 dark:hover:bg-${tColor}-500/20 border-2 border-${tColor}-200 dark:border-${tColor}-500/30 rounded-xl text-sm font-bold text-${tColor}-600 dark:text-${tColor}-400 transition-all active:scale-[0.98]`}
                  >
                    <Settings2 className="w-4 h-4" />
                    Update Status
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
        
        {/* Infinite Scroll Loader */}
        {hasMore && orders.length > 0 && (
          <div ref={lastElementRef} className="w-full h-16 flex items-center justify-center mt-6">
            {loadingMore && <div className="w-8 h-8 border-4 border-gray-50 dark:border-[#1F1F2E]0 border-t-transparent rounded-full animate-spin"></div>}
          </div>
        )}
      </div>

      {/* Items Modal */}
      <AnimatePresence>
        {selectedOrderForItems && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderForItems(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0D0D17] rounded-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0D0D17] z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${tColor}-100 rounded-xl flex items-center justify-center text-${tColor}-600`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Order Items</h2>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{selectedOrderForItems.first_name} {selectedOrderForItems.last_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForItems(null)}
                  className="p-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="mb-6 p-5 bg-white dark:bg-[#0D0D17] rounded-2xl border-2 border-gray-100 dark:border-[#2A2A3A] shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-${tColor}-500`}></div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className={`w-4 h-4 text-${tColor}-500`} />
                    Delivery Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Address</p>
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200 leading-snug">
                        {selectedOrderForItems.delivery_address?.locationName || "Unknown Location"}
                        {selectedOrderForItems.delivery_address?.landmark ? `, ${selectedOrderForItems.delivery_address.landmark}` : ""}
                        {selectedOrderForItems.delivery_address?.pincode ? ` - ${selectedOrderForItems.delivery_address.pincode}` : ""}
                      </p>
                    </div>
                    {selectedOrderForItems.customer_mobile && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Number</p>
                        <a href={`tel:${selectedOrderForItems.customer_mobile}`} className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md w-fit`}>
                          <Phone className="w-4 h-4" />
                          Call Customer
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedOrderForItems.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${item.type === 'veg' ? 'border-green-500' : 'border-red-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.name}</p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">₹{item.price} × {item.quantity || item.qty}</p>
                        </div>
                      </div>
                      <div className="font-black text-gray-900 dark:text-gray-100">
                        ₹{(item.price * (item.quantity || item.qty || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#2A2A3A] border-dashed space-y-2">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span>Item Total</span>
                    <span>₹{selectedOrderForItems.subtotal}</span>
                  </div>
                  {selectedOrderForItems.delivery_charge && parseFloat(selectedOrderForItems.delivery_charge) > 0 && (
                    <div className="flex justify-between text-sm font-bold text-orange-600">
                      <span>Delivery Charge</span>
                      <span>+ ₹{selectedOrderForItems.delivery_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-gray-900 dark:text-gray-100 pt-3 border-t border-gray-100 dark:border-[#2A2A3A] mt-3">
                    <span>Grand Total</span>
                    <span>₹{(parseFloat(selectedOrderForItems.subtotal || "0") + parseFloat(selectedOrderForItems.delivery_charge || "0")).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50 dark:bg-[#151522] border-t border-gray-100 dark:border-[#2A2A3A]">
                <button
                  onClick={() => setSelectedOrderForItems(null)}
                  className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPDATE STATUS MODAL */}
      <AnimatePresence>
        {statusModalOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setStatusModalOrder(null);
                setPendingStatusUpdate(null);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">Update Status</h3>
                <button onClick={() => {
                  setStatusModalOrder(null);
                  setPendingStatusUpdate(null);
                }} className="p-1.5 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 rounded-full text-gray-500 dark:text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-5 p-5 bg-white dark:bg-[#0D0D17] rounded-2xl border-2 border-gray-100 dark:border-[#2A2A3A] shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-${tColor}-500`}></div>
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className={`w-4 h-4 text-${tColor}-500`} />
                  Delivery Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Address</p>
                    <p className="text-sm font-black text-gray-800 dark:text-gray-200 leading-snug">
                      {statusModalOrder.delivery_address?.locationName || "Unknown Location"}
                      {statusModalOrder.delivery_address?.landmark ? `, ${statusModalOrder.delivery_address.landmark}` : ""}
                      {statusModalOrder.delivery_address?.pincode ? ` - ${statusModalOrder.delivery_address.pincode}` : ""}
                    </p>
                  </div>
                  {statusModalOrder.customer_mobile && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Number</p>
                      <a href={`tel:${statusModalOrder.customer_mobile}`} className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md w-fit`}>
                        <Phone className="w-4 h-4" />
                        Call Customer
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                {ORDER_STATUSES.filter(status => {
                  if (status === "Cancelled" && statusModalOrder.status.toLowerCase() !== "pending") return false;
                  return true;
                }).map(status => {
                  let isBlocked = false;
                  let blockReason = "";
                  
                  const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.toLowerCase() === statusModalOrder.status.toLowerCase());
                  const thisStatusIndex = ORDER_STATUSES.findIndex(s => s.toLowerCase() === status.toLowerCase());
                  
                  const isAwaitingAdvanceModal = statusModalOrder.payment_method === 'online_on_delivery' && parseFloat(statusModalOrder.advance_fee || "0") > 0 && !statusModalOrder.advance_paid;

                  if (isAwaitingAdvanceModal) {
                    if (status !== "Cancelled") {
                      isBlocked = true;
                      blockReason = "User must pay advance";
                    }
                  } else if (status !== "Cancelled" && currentStatusIndex !== -1) {
                    if (thisStatusIndex < currentStatusIndex) {
                      isBlocked = true;
                      blockReason = "Cannot go back";
                    } else if (thisStatusIndex > currentStatusIndex + 1) {
                      isBlocked = true;
                      blockReason = "Cannot skip steps";
                    }
                  }

                  let isFullyPaidThroughAdvance = false;
                  if (statusModalOrder.advance_paid) {
                    const advancePaidAmount = parseFloat(statusModalOrder.platform_fee || "0") + parseFloat(statusModalOrder.delivery_charge || "0") + parseFloat(statusModalOrder.advance_fee || "0");
                    const totalAmount = parseFloat(statusModalOrder.total_amount || "0");
                    if (totalAmount - advancePaidAmount <= 0.01) {
                      isFullyPaidThroughAdvance = true;
                    }
                  }

                  if (status === "Delivered" && statusModalOrder.payment_method === 'online_on_delivery' && statusModalOrder.payment_status !== 'paid' && !isFullyPaidThroughAdvance) {
                    isBlocked = true;
                    blockReason = "User must pay first";
                  }

                  const isSelected = (statusModalOrder.status.toLowerCase() === status.toLowerCase() && pendingStatusUpdate !== status) || pendingStatusUpdate === status;

                  return (
                    <button
                      key={status}
                      onClick={() => {
                        if (isBlocked) return;
                        if (status === "Confirmed") {
                          setPendingStatusUpdate(status);
                        } else {
                          updateOrderStatus(statusModalOrder.id, status);
                        }
                      }}
                      disabled={statusLoading || isBlocked}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                        isBlocked 
                          ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-[#151522] dark:border-[#2A2A3A] opacity-60"
                          : isSelected
                            ? `border-${tColor}-500 bg-${tColor}-50 dark:bg-${tColor}-500/10`
                            : "border-gray-100 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17] text-gray-700 dark:text-gray-300 hover:border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:hover:bg-[#151522]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? `border-${tColor}-500 bg-${tColor}-500` 
                            : `border-gray-300 dark:border-[#4A4A5A] bg-transparent`
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className={isSelected ? `text-${tColor}-700 dark:text-${tColor}-400 font-black` : "font-semibold"}>{status}</span>
                          {isBlocked && <span className="text-[10px] uppercase text-red-500 font-bold">{blockReason}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {pendingStatusUpdate === "Confirmed" && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-[#151522] rounded-2xl border border-gray-200 dark:border-[#2A2A3A] animate-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={deliveryChargeInput}
                    onChange={(e) => setDeliveryChargeInput(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2A2A3A] dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium mb-3"
                  />
                  
                  {statusModalOrder?.payment_method === 'online_on_delivery' && (
                    <>
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setPaymentTypeSelection('full')}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${paymentTypeSelection === 'full' ? `border-${tColor}-500 bg-${tColor}-50 text-${tColor}-700` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          Full Payment
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentTypeSelection('advance')}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 transition-all ${paymentTypeSelection === 'advance' ? `border-${tColor}-500 bg-${tColor}-50 text-${tColor}-700` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          Adv Payment
                        </button>
                      </div>

                      {paymentTypeSelection === 'advance' && (
                        <>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Advance Payment Required (₹)
                          </label>
                          <input
                            type="number"
                            value={advanceFeeInput}
                            onChange={(e) => setAdvanceFeeInput(e.target.value)}
                            placeholder="e.g. 100"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2A2A3A] dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium mb-4"
                          />
                        </>
                      )}
                    </>
                  )}
                  
                  <button
                    onClick={() => updateOrderStatus(statusModalOrder.id, "Confirmed")}
                    disabled={statusLoading}
                    className={`w-full py-3 bg-${tColor}-600 hover:bg-${tColor}-700 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98]`}
                  >
                    {statusModalOrder?.payment_method === 'online_on_delivery' 
                      ? (paymentTypeSelection === 'full' ? "Confirm & Request Full Payment" : "Confirm & Request Advance") 
                      : "Confirm Order & Charge"}
                  </button>
                </div>
              )}
              
              {statusLoading && (
                <div className="absolute inset-0 bg-white dark:bg-[#0D0D17]/70 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
                  <Loader2 className={`w-8 h-8 animate-spin text-${tColor}-500`} />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
