"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, Package, MapPin, Truck, CheckCircle,
  Clock, Store, Phone, Info, Loader2, Navigation, FileText, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Order {
  id: string;
  vendor_id: string;
  restaurant_name: string;
  image_url: string;
  gps_address: string;
  manual_address: string;
  vendor_pincode: string;
  items: any[];
  subtotal: string;
  gst: string;
  platform_fee: string;
  delivery_charge?: string;
  total_amount: string;
  payment_method: string;
  delivery_address: any;
  status: string;
  created_at: string;
  owner_number?: string;
  delivery_boy_number?: string;
}

const STATUS_STEPS = ["pending", "confirmed", "shipment", "out for delivery", "delivered"];

export default function OrderStatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken, isLoggedIn } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBilling, setShowBilling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/");
    }
  }, [mounted, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && accessToken && id) {
      fetchOrderDetails();
    }
  }, [isLoggedIn, accessToken, id]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data.order);
      } else {
        toast.error(data.error || "Failed to fetch order details");
        router.push("/orders");
      }
    } catch (err) {
      toast.error("Network error while fetching order details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    setIsLoading(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/${id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Order cancelled successfully");
        fetchOrderDetails();
      } else {
        toast.error(data.error || "Failed to cancel order");
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Network error");
      setIsLoading(false);
    }
  };

  if (!mounted || (!isLoggedIn && mounted)) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) return null;

  const currentStepIndex = STATUS_STEPS.indexOf(order.status.toLowerCase());
  const isCancelled = order.status.toLowerCase() === "cancelled";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col pb-20">
      {/* Dynamic Header based on status */}
      <div className={`${isCancelled ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'} pt-8 pb-12 px-4 rounded-b-[40px] shadow-sm relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Package className="w-32 h-32" />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/orders" className="p-2 -ml-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Order ID</p>
              <h1 className="font-black text-white text-sm tracking-tight opacity-90 truncate max-w-[200px] sm:max-w-xs">{order.id}</h1>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
                {isCancelled ? "Order Cancelled" : 
                 currentStepIndex === 0 ? "Awaiting Confirmation" :
                 currentStepIndex === 1 ? "Preparing your order" :
                 currentStepIndex === 2 ? "Order has been Shipped" :
                 currentStepIndex === 3 ? "Out for Delivery" :
                 currentStepIndex === 4 ? "Order Delivered!" : "Processing..."}
              </h2>
              <p className="text-white/80 font-medium text-sm">
                Placed on {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            {!isCancelled && currentStepIndex < 3 && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="w-4 h-4 text-white animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">In Progress</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 -mt-6 space-y-4">
        
        {/* Status Tracker */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative z-20">
          {isCancelled ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <Info className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-900 font-black text-lg mb-1">This order was cancelled</p>
              <p className="text-sm text-gray-500 font-medium">If you have already paid, your refund will be processed within 3-5 business days.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100" />
              
              <div className="space-y-6 relative">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  
                  return (
                    <div key={step} className="flex gap-4">
                      <div className="relative z-10 shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${
                          isCompleted ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-orange-500/20 scale-110' : ''}`}>
                          {index === 0 ? <Clock className="w-4 h-4" /> :
                           index === 1 ? <CheckCircle className="w-4 h-4" /> :
                           index === 2 ? <Package className="w-4 h-4" /> :
                           index === 3 ? <Truck className="w-4 h-4" /> :
                           <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className={`pt-2 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                        <p className={`font-black uppercase tracking-wider text-sm ${isCurrent ? 'text-orange-600' : 'text-gray-900'}`}>
                          {step}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {index === 0 ? "Vendor is reviewing your order" :
                             index === 1 ? "Your items are being packed" :
                             index === 2 ? "Order has been shipped" :
                             index === 3 ? "Delivery partner is on the way" :
                             "Hope you enjoyed it!"}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Store & Delivery Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Vendor Details */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ordered From</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                {order.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-full h-full p-3 text-gray-300" />
                )}
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg leading-tight">{order.restaurant_name}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5 line-clamp-1">{order.manual_address || order.gps_address}</p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivering To</h3>
            </div>
            
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-gray-900 leading-tight">
                  {order.delivery_address?.landmark ? `${order.delivery_address.landmark}, ` : ''}{order.delivery_address?.locationName || 'Saved Location'}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-1">PIN: {order.delivery_address?.pincode || 'N/A'}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded">
                  {order.delivery_address?.latitude?.toFixed(4)}, {order.delivery_address?.longitude?.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {currentStepIndex <= 1 && !isCancelled && (
            <button 
              onClick={handleCancelOrder}
              className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold text-sm transition-colors shadow-sm"
            >
              Cancel Order
            </button>
          )}
          
          {currentStepIndex >= 1 && !isCancelled && (
            <button 
              onClick={() => setShowBilling(true)}
              className={`w-full py-4 bg-gray-900 hover:bg-black border border-gray-900 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-sm transition-colors shadow-sm ${currentStepIndex <= 1 ? 'col-span-1' : 'col-span-2'}`}
            >
              <FileText className="w-4 h-4" />
              Final Billing
            </button>
          )}
          
          <a 
            href={order.owner_number ? `tel:${order.owner_number}` : "#"}
            className={`w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl flex items-center justify-center gap-2 text-gray-600 font-bold text-sm transition-colors shadow-sm ${currentStepIndex > 1 || isCancelled ? 'col-span-2 sm:col-span-1' : 'col-span-2'}`}
          >
            <Phone className="w-4 h-4" />
            Need help?
          </a>

          {currentStepIndex >= 1 && !isCancelled && order.delivery_boy_number && (
            <a 
              href={`tel:${order.delivery_boy_number}`}
              className="w-full py-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-2xl flex items-center justify-center gap-2 text-orange-600 font-bold text-sm transition-colors shadow-sm col-span-2 sm:col-span-1"
            >
              <Phone className="w-4 h-4" />
              Call Delivery Boy
            </a>
          )}
        </div>

      </div>

      {/* Billing Modal */}
      <AnimatePresence>
        {showBilling && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBilling(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-800">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">Final Billing</h2>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Order Breakdown</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBilling(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>GST & Taxes</span>
                    <span>₹{order.gst}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium text-gray-600">
                    <span>Platform Fee</span>
                    <span>₹{order.platform_fee}</span>
                  </div>
                  {order.delivery_charge && parseFloat(order.delivery_charge) > 0 && (
                    <div className="flex justify-between text-sm font-bold text-orange-600">
                      <span>Delivery Charge</span>
                      <span>+ ₹{order.delivery_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-4 border-t border-gray-100 mt-4">
                    <span>Grand Total</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setShowBilling(false)}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
