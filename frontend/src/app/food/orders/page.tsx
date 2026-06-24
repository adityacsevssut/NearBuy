"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Package, MapPin, ChevronLeft, Clock,
  CheckCircle, Loader2, Store, FileText, ChevronRight,
  Eye, Truck, AlertCircle, Download
} from "lucide-react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: "veg" | "non-veg";
}

interface Order {
  id: string;
  vendor_id: string;
  restaurant_name: string;
  image_url: string;
  items: OrderItem[];
  subtotal: string;
  gst: string;
  platform_fee: string;
  total_amount: string;
  payment_method: string;
  delivery_address: any;
  status: string;
  created_at: string;
  updated_at?: string;
  delivery_charge?: string;
  gps_address?: string;
  manual_address?: string;
  vendor_pincode?: string;
}

function OrdersPageContent() {
  const { isLoggedIn, accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHistory = searchParams.get('history') === 'true';
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForItems, setSelectedOrderForItems] = useState<Order | null>(null);
  const [orderToDownload, setOrderToDownload] = useState<Order | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const lastElementRef = React.useRef<HTMLDivElement | null>(null);

  const [mounted, setMounted] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  useEffect(() => {
    setMounted(true);
    document.title = isHistory ? "Recently Ordered" : "Your Orders";
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    fetch(`${API}/api/public/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.gst !== undefined) setGstRate(data.gst);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push("/");
    }
  }, [mounted, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      fetchOrders();
    }
  }, [isLoggedIn, accessToken]);

  const fetchOrders = async (pageNum = 1) => {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);
    
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const query = new URLSearchParams({ page: pageNum.toString(), limit: "20" });
      
      const res = await fetch(`${API}/api/orders/me?${query.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setHasMore(pageNum < (data.pagination?.totalPages || 1));
        setOrders(prev => pageNum === 1 ? (data.orders || []) : [...prev, ...(data.orders || [])]);
      } else {
        toast.error(data.error || "Failed to fetch orders");
      }
    } catch (err) {
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

  useEffect(() => {
    if (orderToDownload) {
      // Give React a frame to render the hidden template with orderToDownload data
      setTimeout(async () => {
        const element = document.getElementById("pdf-receipt-template-wrapper");
        if (element) {
          try {
            const canvas = await html2canvas(element.querySelector("#pdf-receipt-template") as HTMLElement, { scale: 2 });
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt_NearBuy_${orderToDownload.id}.pdf`);
          } catch (err) {
            console.error("Failed to generate PDF", err);
          } finally {
            setOrderToDownload(null);
          }
        }
      }, 300);
    }
  }, [orderToDownload]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return "text-orange-600 bg-orange-100 border-orange-200";
      case "confirmed": return "text-blue-600 bg-blue-100 border-blue-200";
      case "out for delivery": return "text-violet-600 bg-violet-100 border-violet-200";
      case "delivered": return "text-green-600 bg-green-100 border-green-200";
      case "cancelled": return "text-red-600 bg-red-100 border-red-200";
      default: return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#1F1F2E] border-gray-200 dark:border-[#2A2A3A]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "confirmed": return <CheckCircle className="w-4 h-4" />;
      case "out for delivery": return <Truck className="w-4 h-4" />;
      case "delivered": return <Package className="w-4 h-4" />;
      case "cancelled": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!mounted || (!isLoggedIn && mounted)) return null;

  const displayedOrders = orders.filter((order) => {
    const isDeliveredOrCancelled = order.status.toLowerCase() === "delivered" || order.status.toLowerCase() === "cancelled";
    
    // Calculate if it has been 1 hour since update
    const lastUpdate = new Date(order.updated_at || order.created_at).getTime();
    const isOlderThanOneHour = (Date.now() - lastUpdate) > 60 * 60 * 1000;
    
    const shouldBeInHistory = isDeliveredOrCancelled && isOlderThanOneHour;

    return isHistory ? shouldBeInHistory : !shouldBeInHistory;
  });

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col pt-16 pb-20">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] border-b border-gray-200 dark:border-[#2A2A3A] sticky top-16 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={isHistory ? "/account" : "/"} className="p-2 -ml-2 rounded-xl hover:bg-gray-50 dark:bg-[#151522] dark:hover:bg-[#151522] text-gray-700 dark:text-gray-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-gray-900 dark:text-gray-100 text-lg tracking-tight">
            {isHistory ? "Recently Ordered" : "Your Orders"}
          </h1>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Fetching your orders...</p>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-[#1F1F2E] rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {isHistory ? "You have no past orders." : "Looks like you haven't placed any orders or they are all completed."}
            </p>
            <Link href="/" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95">
              Explore Nearby Shops
            </Link>
          </div>
        ) : (
          displayedOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl border border-gray-100 dark:border-[#2A2A3A] shadow-sm overflow-hidden"
            >
              {/* Card Header (Vendor Info) */}
              <div className="p-5 border-b border-gray-50 dark:border-[#1F1F2E] flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-100 dark:bg-[#1F1F2E] rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-[#2A2A3A] shadow-sm">
                  {order.image_url ? (
                    <img src={order.image_url} alt={order.restaurant_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-black text-gray-900 dark:text-gray-100 text-lg truncate leading-tight mb-1">
                    {order.restaurant_name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{order.delivery_address?.locationName || "Unknown Location"}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black text-gray-900 dark:text-gray-100">₹{order.total_amount}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-1">
                    {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded inline-block border border-orange-200/50 dark:border-orange-500/20">
                    {order.payment_method || "COD"}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`px-5 py-3 border-b border-gray-50 dark:border-[#1F1F2E] flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${getStatusColor(order.status)} font-bold text-xs uppercase tracking-wider`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </div>
                  {order.status.toLowerCase() === 'delivered' && (
                    <button
                      onClick={() => setOrderToDownload(order)}
                      className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors border border-orange-200/50 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-gray-50 dark:bg-[#151522] dark:bg-[#151522]/50 flex gap-3">
                <button
                  onClick={() => setSelectedOrderForItems(order)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] border-2 border-gray-200 dark:border-[#2A2A3A] hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-[0.98]"
                >
                  <Eye className="w-4 h-4" />
                  See Items
                </button>
                {!isHistory && (
                  <Link
                    href={`/food/orders/${order.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-xl text-sm font-bold text-orange-600 transition-all active:scale-[0.98]"
                  >
                    <Package className="w-4 h-4" />
                    {order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'cancelled' ? 'Order Timeline' : 'Track Status'}
                  </Link>
                )}
              </div>
            </motion.div>
          ))
        )}
        {/* Infinite Scroll Loader */}
        {hasMore && displayedOrders.length > 0 && (
          <div ref={lastElementRef} className="w-full h-16 flex items-center justify-center mt-6">
            {loadingMore && <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
          </div>
        )}
      </div>

      <MobileBottomNav />

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
              className="relative w-full max-w-md bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Order Items</h2>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{selectedOrderForItems.restaurant_name}</p>
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
                <div className="space-y-4">
                  {selectedOrderForItems.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${item.type === 'veg' ? 'border-green-500' : 'border-red-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.name}</p>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">₹{item.price} × {item.quantity || (item as any).qty}</p>
                        </div>
                      </div>
                      <div className="font-black text-gray-900 dark:text-gray-100">
                        ₹{(item.price * (item.quantity || (item as any).qty)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#2A2A3A] border-dashed space-y-2">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span>Item Total</span>
                    <span>₹{selectedOrderForItems.subtotal}</span>
                  </div>
                  {selectedOrderForItems.platform_fee && parseFloat(selectedOrderForItems.platform_fee) > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>Platform Fee</span>
                      <span>+ ₹{selectedOrderForItems.platform_fee}</span>
                    </div>
                  )}
                  {selectedOrderForItems.gst && parseFloat(selectedOrderForItems.gst) > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>GST ({gstRate}%)</span>
                      <span>+ ₹{selectedOrderForItems.gst}</span>
                    </div>
                  )}
                  {selectedOrderForItems.delivery_charge && parseFloat(selectedOrderForItems.delivery_charge) > 0 && (
                    <div className="flex justify-between text-sm font-bold text-orange-600">
                      <span>Delivery Charge</span>
                      <span>+ ₹{selectedOrderForItems.delivery_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-gray-900 dark:text-gray-100 pt-3 border-t border-gray-100 dark:border-[#2A2A3A] mt-3">
                    <span>Grand Total</span>
                    <span>₹{selectedOrderForItems.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-500 dark:text-gray-400 pt-1">
                    <span>Payment Method</span>
                    <span className="uppercase text-orange-600">{selectedOrderForItems.payment_method || "COD"}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50 dark:bg-[#151522] dark:bg-[#151522] border-t border-gray-100 dark:border-[#2A2A3A]">
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
      {/* Hidden Receipt Template for PDF */}
      {orderToDownload && (
        <div id="pdf-receipt-template-wrapper" style={{ position: "absolute", top: "-10000px", left: "-10000px", width: "800px" }}>
          <div id="pdf-receipt-template" className="mx-auto p-8 md:p-12" style={{ fontFamily: "sans-serif", backgroundColor: "#ffffff", color: "#111827", border: "1px solid #e5e7eb", width: "800px" }}>
            <div className="flex justify-between items-start pb-8 mb-8" style={{ borderBottom: "2px solid #f3f4f6" }}>
              <div>
                <h1 className="text-4xl font-black mb-1">
                  <span style={{ color: "#f97316" }}>Near</span><span style={{ color: "#000000" }}>Buy</span>
                </h1>
                <p className="font-medium" style={{ color: "#6b7280" }}>Official Order Receipt</p>
              </div>
              <div className="text-right max-w-[250px]">
                <p className="font-bold text-xl">{orderToDownload.restaurant_name}</p>
                <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
                  {orderToDownload.manual_address || orderToDownload.gps_address || "Address not provided"}
                  {orderToDownload.vendor_pincode ? ` - ${orderToDownload.vendor_pincode}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Order ID</p>
                <p className="font-black text-sm break-all">#{orderToDownload.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Date</p>
                <p className="font-black text-sm">
                  {new Date(orderToDownload.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Payment Method</p>
                <p className="font-black text-sm uppercase">{orderToDownload.payment_method}</p>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden mb-8" style={{ border: "1px solid #e5e7eb" }}>
              <table className="w-full text-left">
                <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: "#6b7280" }}>Item</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: "#6b7280" }}>Qty</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: "#6b7280" }}>Price</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-right" style={{ color: "#6b7280" }}>Total</th>
                  </tr>
                </thead>
                <tbody style={{ borderTop: "none" }}>
                  {orderToDownload.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td className="py-3 px-4 font-bold text-sm">{item.name}</td>
                      <td className="py-3 px-4 font-medium text-right text-sm" style={{ color: "#4b5563" }}>{item.quantity || (item as any).qty}</td>
                      <td className="py-3 px-4 font-medium text-right text-sm" style={{ color: "#4b5563" }}>₹{item.price.toFixed(2)}</td>
                      <td className="py-3 px-4 font-black text-right text-sm">₹{(item.price * (item.quantity || (item as any).qty)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-[300px] space-y-2">
                <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                  <span>Subtotal</span>
                  <span>₹{orderToDownload.subtotal}</span>
                </div>
                <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                  <span>Platform Fee</span>
                  <span>₹{orderToDownload.platform_fee}</span>
                </div>
                <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                  <span>GST ({gstRate}%)</span>
                  <span>₹{orderToDownload.gst}</span>
                </div>
                {orderToDownload.delivery_charge && parseFloat(orderToDownload.delivery_charge) > 0 && (
                  <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                    <span>Delivery Charge</span>
                    <span>₹{orderToDownload.delivery_charge}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black pt-3 mt-3" style={{ borderTop: "1px solid #e5e7eb", color: "#111827" }}>
                  <span>Grand Total</span>
                  <span>₹{orderToDownload.total_amount}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center font-medium text-xs" style={{ color: "#9ca3af" }}>
              <p>Thank you for shopping with NearBuy!</p>
              <p className="mt-1">This is a computer generated invoice and does not require a signature.</p>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles for Native PDF Generation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; }
          body * {
            visibility: hidden;
          }
          #pdf-receipt-template-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            opacity: 1 !important;
            z-index: 9999 !important;
          }
          #pdf-receipt-template, #pdf-receipt-template * {
            visibility: visible;
          }
          #pdf-receipt-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 40px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
        }
      `}} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
