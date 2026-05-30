/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
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
  delivery_address: any;
  status: string;
  created_at: string;
  customer_mobile?: string;
  alternate_mobile?: string;
  delivery_charge?: string;
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

  const [mounted, setMounted] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/vendor`, {
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setStatusLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          ...(newStatus === "Confirmed" && { delivery_charge: parseFloat(deliveryChargeInput || "0") })
        }),
      });
      if (res.ok) {
        toast.success(`Order marked as ${newStatus}`);
        setStatusModalOrder(null);
        setPendingStatusUpdate(null);
        setDeliveryChargeInput("");
        fetchOrders();
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
      case "pending": return "text-orange-600 bg-orange-100 border-orange-200";
      case "confirmed": return "text-blue-600 bg-blue-100 border-blue-200";
      case "out for delivery": return "text-violet-600 bg-violet-100 border-violet-200";
      case "delivered": return "text-green-600 bg-green-100 border-green-200";
      case "cancelled": return "text-red-600 bg-red-100 border-red-200";
      default: return "text-gray-600 bg-gray-100 border-gray-200";
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
  const tColor = vType === "store" ? "blue" : vType === "medicine" ? "emerald" : "orange";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col pt-4 pb-20">

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/vendor" className="p-2 -ml-2 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="font-black text-gray-900 text-xl tracking-tight">Customer Orders</h1>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4 mt-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className={`w-8 h-8 animate-spin text-${tColor}-500`} />
            <p className="text-gray-500 font-medium">Fetching orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-20 h-20 bg-${tColor}-50 rounded-full flex items-center justify-center mb-4`}>
              <Package className={`w-10 h-10 text-${tColor}-400`} />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6 text-sm">Customers haven&apos;t placed any orders yet.</p>
          </div>
        ) : (
          orders.map((order) => {
            const customerName = `${order.first_name || "Guest"} ${order.last_name || ""}`.trim();
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Card Header (Customer Info) */}
                <div className="p-5 border-b border-gray-50 flex items-start gap-4">
                  <div className={`w-14 h-14 bg-${tColor}-50 rounded-2xl overflow-hidden shrink-0 border border-${tColor}-100 shadow-sm flex items-center justify-center text-${tColor}-600`}>
                    <User className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-black text-gray-900 text-lg truncate leading-tight mb-1">
                      {customerName}
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-start gap-1.5 text-xs text-gray-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {order.delivery_address?.locationName || "Unknown Location"}
                          {order.delivery_address?.landmark ? `, ${order.delivery_address.landmark}` : ""}
                          {order.delivery_address?.pincode ? ` - ${order.delivery_address.pincode}` : ""}
                        </span>
                      </div>
                      {order.customer_mobile ? (
                        <a href={`tel:${order.customer_mobile}`} className={`inline-flex items-center gap-1.5 px-3 py-1.5 mt-1 bg-${tColor}-50 hover:bg-${tColor}-100 border border-${tColor}-200 text-${tColor}-700 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm w-fit`}>
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>Call: {order.customer_mobile}</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>No mobile provided</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-gray-900">₹{order.total_amount}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* Status Banner */}
                <div className={`px-5 py-3 border-b border-gray-50 flex items-center justify-between`}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getStatusColor(order.status)} font-bold text-xs uppercase tracking-wider`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                  <p className="text-xs font-semibold text-gray-500">
                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-gray-50/50 flex gap-3">
                  <button
                    onClick={() => setSelectedOrderForItems(order)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-4 h-4" />
                    See Items
                  </button>
                  <button
                    onClick={() => setStatusModalOrder(order)}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-${tColor}-50 hover:bg-${tColor}-100 border-2 border-${tColor}-200 rounded-xl text-sm font-bold text-${tColor}-600 transition-all active:scale-[0.98]`}
                  >
                    <Settings2 className="w-4 h-4" />
                    Update Status
                  </button>
                </div>
              </motion.div>
            );
          })
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
              className="relative w-full max-w-md bg-white rounded-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-${tColor}-100 rounded-xl flex items-center justify-center text-${tColor}-600`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">Order Items</h2>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{selectedOrderForItems.first_name} {selectedOrderForItems.last_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderForItems(null)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="mb-6 p-5 bg-white rounded-2xl border-2 border-gray-100 shadow-sm relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-${tColor}-500`}></div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin className={`w-4 h-4 text-${tColor}-500`} />
                    Delivery Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Address</p>
                      <p className="text-sm font-black text-gray-800 leading-snug">
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
                          <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
                          <p className="text-xs font-medium text-gray-500 mt-0.5">₹{item.price} × {item.quantity || item.qty}</p>
                        </div>
                      </div>
                      <div className="font-black text-gray-900">
                        ₹{(item.price * (item.quantity || item.qty || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 border-dashed space-y-2">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Item Total</span>
                    <span>₹{selectedOrderForItems.subtotal}</span>
                  </div>
                  {selectedOrderForItems.delivery_charge && parseFloat(selectedOrderForItems.delivery_charge) > 0 && (
                    <div className="flex justify-between text-sm font-bold text-orange-600">
                      <span>Delivery Charge</span>
                      <span>+ ₹{selectedOrderForItems.delivery_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-gray-900 pt-3 border-t border-gray-100 mt-3">
                    <span>Grand Total</span>
                    <span>₹{selectedOrderForItems.total_amount}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50 border-t border-gray-100">
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
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-gray-900">Update Status</h3>
                <button onClick={() => {
                  setStatusModalOrder(null);
                  setPendingStatusUpdate(null);
                }} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-5 p-5 bg-white rounded-2xl border-2 border-gray-100 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full bg-${tColor}-500`}></div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MapPin className={`w-4 h-4 text-${tColor}-500`} />
                  Delivery Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Address</p>
                    <p className="text-sm font-black text-gray-800 leading-snug">
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
                {ORDER_STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => {
                      if (status === "Confirmed") {
                        setPendingStatusUpdate(status);
                      } else {
                        updateOrderStatus(statusModalOrder.id, status);
                      }
                    }}
                    disabled={statusLoading}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all font-bold ${
                      (statusModalOrder.status.toLowerCase() === status.toLowerCase() && pendingStatusUpdate !== status) || pendingStatusUpdate === status
                        ? `border-${tColor}-500 bg-${tColor}-50 text-${tColor}-700`
                        : "border-gray-100 bg-white text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {status}
                    {((statusModalOrder.status.toLowerCase() === status.toLowerCase() && pendingStatusUpdate !== status) || pendingStatusUpdate === status) && (
                      <CheckCircle className={`w-5 h-5 text-${tColor}-500`} />
                    )}
                  </button>
                ))}
              </div>

              {pendingStatusUpdate === "Confirmed" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 animate-in slide-in-from-top-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={deliveryChargeInput}
                    onChange={(e) => setDeliveryChargeInput(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium mb-3"
                  />
                  <button
                    onClick={() => updateOrderStatus(statusModalOrder.id, "Confirmed")}
                    disabled={statusLoading}
                    className={`w-full py-3 bg-${tColor}-600 hover:bg-${tColor}-700 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98]`}
                  >
                    Confirm Order & Charge
                  </button>
                </div>
              )}
              
              {statusLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10">
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
