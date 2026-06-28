"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ChevronLeft, Package, MapPin, Truck, CheckCircle,
  Clock, Store, Phone, Info, Loader2, Navigation, FileText, X, FileDown, AlertTriangle, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import Script from "next/script";
import { Checkout } from 'capacitor-razorpay';
import { Capacitor } from '@capacitor/core';

const blueToastStyle = {
  style: {
    background: '#eff6ff',
    color: '#1e3a8a',
    border: '1px solid #bfdbfe'
  },
  className: "dark:!bg-[#0D0D17] dark:!border-blue-500 dark:!text-white dark:!border",
  iconTheme: {
    primary: '#2563eb',
    secondary: '#ffffff'
  }
};

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
  payment_status: string;
  delivery_address: any;
  status: string;
  created_at: string;
  owner_number?: string;
  delivery_boy_number?: string;
  cancel_request_status?: string;
  cancel_request_reason?: string;
  advance_fee?: string;
  advance_paid?: boolean;
}

const STATUS_STEPS = ["pending", "confirmed", "shipment", "out for delivery", "delivered"];

export default function OrderStatusPage() {
  const { id } = useParams();
  const router = useRouter();
  const { accessToken, isLoggedIn } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBilling, setShowBilling] = useState(false);
  const [showCancelRequest, setShowCancelRequest] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gstRate, setGstRate] = useState(18);

  useEffect(() => {
    setMounted(true);
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
        toast.error(data.error || "Failed to fetch order details", blueToastStyle);
        router.push("/food/orders");
      }
    } catch (err) {
      toast.error("Network error while fetching order details", blueToastStyle);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && accessToken && id) {
      fetchOrderDetails();
    }
  }, [isLoggedIn, accessToken, id]);


  const handleCancelOrder = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 dark:text-gray-100 text-[15px]">Cancel Order?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">
              {order?.payment_method === 'online_on_delivery' && order?.advance_paid 
                ? "If you cancel this order, the Delivery Charge and Platform Fee will be deducted, and the rest of your Advance Amount will be refunded to you. Do you want to proceed?" 
                : "Are you sure you want to cancel this order? This action cannot be undone."}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-1">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 dark:hover:bg-[#2A2A3A] text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold transition-colors"
          >
            No, Keep It
          </button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              setIsLoading(true);
              try {
                const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
                const res = await fetch(`${API}/api/orders/${id}/cancel`, {
                  method: "PATCH",
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                const data = await res.json();
                if (res.ok) {
                  toast.success("Order cancelled successfully", blueToastStyle);
                  fetchOrderDetails();
                } else {
                  toast.error(data.error || "Failed to cancel order", blueToastStyle);
                  setIsLoading(false);
                }
              } catch (err) {
                toast.error("Network error", blueToastStyle);
                setIsLoading(false);
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-red-500/20 transition-colors"
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 2000,
      style: {
        border: "1px solid #bfdbfe",
        padding: "16px",
        borderRadius: "16px",
        background: "#eff6ff",
        color: "#1e3a8a",
        maxWidth: "340px"
      },
      className: "dark:!bg-[#0D0D17] dark:!border-red-500/20 dark:!text-white"
    });
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason", blueToastStyle);
      return;
    }
    setIsSubmittingCancel(true);
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/orders/${id}/cancel-request`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Cancellation request sent to vendor!", blueToastStyle);
        setShowCancelRequest(false);
        fetchOrderDetails();
      } else {
        toast.error(data.error || "Failed to send request", blueToastStyle);
      }
    } catch (err) {
      toast.error("Network error", blueToastStyle);
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handlePayNow = async () => {
    setIsPaying(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    try {
      const res = await fetch(`${API}/api/orders/${id}/initiate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
      });
      const rzpOrder = await res.json();
      if (!res.ok) throw new Error(rzpOrder.error || "Failed to initiate payment");


      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "NearBuy Order Payment",
        description: `Order ${id}`,
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
                order_id: id,
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
            
            toast.success("Payment successful!", blueToastStyle);
            fetchOrderDetails();
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed", blueToastStyle);
          } finally {
            setIsPaying(false);
          }
        },
        theme: { color: "#f97316" },
        modal: { ondismiss: function () { setIsPaying(false); toast.error("Payment cancelled", blueToastStyle); } }
      };
      if (Capacitor.isNativePlatform()) {
        try {
          const nativeOptions = { ...options };
          delete (nativeOptions as any).config;
          delete (nativeOptions as any).handler;
          delete (nativeOptions as any).modal;
          delete (nativeOptions as any).handler;
          delete (nativeOptions as any).modal;
          const data = await Checkout.open(nativeOptions);
          let responseData = data;
          if (data && data.response) {
            responseData = typeof data.response === 'string' ? JSON.parse(data.response) : data.response;
          }
          options.handler(responseData);
        } catch (error: any) {
          toast.error(error.description || "Payment failed", blueToastStyle);
          if (options.modal && options.modal.ondismiss) {
            options.modal.ondismiss();
          }
        }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(response.error.description || "Payment failed", blueToastStyle);
        });
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.message || "Error initiating Razorpay", blueToastStyle);
      setIsPaying(false);
    }
  };

  const handlePayAdvance = async () => {
    setIsPaying(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    try {
      const res = await fetch(`${API}/api/orders/${id}/initiate-advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
      });
      const rzpOrder = await res.json();
      if (!res.ok) throw new Error(rzpOrder.error || "Failed to initiate advance payment");


      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "NearBuy Advance Payment",
        description: `Order ${id}`,
        order_id: rzpOrder.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API}/api/orders/verify-advance`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: id,
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Advance payment verification failed");
            
            toast.success("Advance payment successful!", blueToastStyle);
            fetchOrderDetails();
          } catch (err: any) {
            toast.error(err.message || "Advance verification failed", blueToastStyle);
          } finally {
            setIsPaying(false);
          }
        },
        theme: { color: "#3b82f6" },
        modal: { ondismiss: function () { setIsPaying(false); toast.error("Advance payment cancelled", blueToastStyle); } }
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
          toast.error(error.description || "Payment failed", blueToastStyle);
          if (options.modal && options.modal.ondismiss) {
            options.modal.ondismiss();
          }
        }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(response.error.description || "Payment failed", blueToastStyle);
        });
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.message || "Error initiating Razorpay", blueToastStyle);
      setIsPaying(false);
    }
  };

  const handlePayRemaining = async () => {
    setIsPaying(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    try {
      const res = await fetch(`${API}/api/orders/${id}/initiate-remaining`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
      });
      const rzpOrder = await res.json();
      if (!res.ok) throw new Error(rzpOrder.error || "Failed to initiate remaining payment");


      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "NearBuy Final Payment",
        description: `Order ${id}`,
        order_id: rzpOrder.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${API}/api/orders/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${accessToken || ""}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: id,
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Final payment verification failed");
            
            toast.success("Final payment successful!", blueToastStyle);
            fetchOrderDetails();
          } catch (err: any) {
            toast.error(err.message || "Final payment verification failed", blueToastStyle);
          } finally {
            setIsPaying(false);
          }
        },
        theme: { color: "#3b82f6" },
        modal: { ondismiss: function () { setIsPaying(false); toast.error("Final payment cancelled", blueToastStyle); } }
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
          toast.error(error.description || "Payment failed", blueToastStyle);
          if (options.modal && options.modal.ondismiss) {
            options.modal.ondismiss();
          }
        }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          toast.error(response.error.description || "Payment failed", blueToastStyle);
        });
        rzp.open();
      }
    } catch (err: any) {
      toast.error(err.message || "Error initiating Razorpay", blueToastStyle);
      setIsPaying(false);
    }
  };

  const generateReceipt = async () => {
    const element = document.getElementById("pdf-receipt-template-wrapper");
    if (element) {
      try {
        const canvas = await html2canvas(element.querySelector("#pdf-receipt-template") as HTMLElement, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Receipt_NearBuy_${id}.pdf`);
      } catch (err) {
        console.error("Failed to generate PDF", err);
      }
    }
  };

  if (!mounted || (!isLoggedIn && mounted)) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) return null;

  const rawStepIndex = STATUS_STEPS.indexOf(order.status.toLowerCase());
  const isCancelled = order.status.toLowerCase() === "cancelled";
  
  const isAwaitingAdvance = order.payment_method === 'online_on_delivery' && parseFloat(order.advance_fee || "0") > 0 && !order.advance_paid;
  const currentStepIndex = isAwaitingAdvance ? 0 : rawStepIndex;

  const showPayNow = 
    order.payment_status !== 'paid' && 
    (
      (order.payment_method === 'online_payment' && currentStepIndex >= 1 && !isCancelled) || 
      (order.payment_method === 'online_on_delivery' && currentStepIndex >= 3 && !isCancelled)
    );
    
  const showAdvancePayNow = isAwaitingAdvance && !isCancelled;

  const isCOD = order.payment_method.toLowerCase().includes('cash') || order.payment_method.toLowerCase() === 'cod';
  const isOOD = order.payment_method === 'online_on_delivery';
  
  const canDirectCancel = (isCOD && currentStepIndex <= 1) || (isOOD && rawStepIndex < 4);
  const canRequestCancel = !canDirectCancel && currentStepIndex < 4 && !isCancelled && order.cancel_request_status !== 'pending' && !isOOD;

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0D0D17] flex flex-col pb-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      {/* Dynamic Header based on status */}
      <div className={`${isCancelled ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} pt-8 pb-12 px-4 rounded-b-[40px] shadow-sm relative overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Package className="w-32 h-32" />
        </div>
        
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/store/orders" className="p-2 -ml-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Order ID</p>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-white text-sm tracking-tight opacity-90 truncate max-w-[200px] sm:max-w-xs">#{order.id.slice(0, 8).toUpperCase()}</h1>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(order.id);
                    toast.success("Order ID copied to clipboard!", blueToastStyle);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors text-white/80 hover:text-white cursor-pointer"
                  title="Copy full Order ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-1">
                {isCancelled ? "Order Cancelled" : 
                 isAwaitingAdvance ? "Advance Payment Required" :
                 currentStepIndex === 0 ? "Awaiting Confirmation" :
                 currentStepIndex === 1 ? "Packing your items" :
                 currentStepIndex === 2 ? "Order has been Shipped" :
                 currentStepIndex === 3 ? "Out for Delivery" :
                 currentStepIndex === 4 ? "Order Delivered!" : "Processing..."}
              </h2>
              <p className="text-white/80 font-medium text-sm">
                Placed on {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            {!isCancelled && currentStepIndex < 3 && (
              <div className="flex items-center gap-2 bg-white/20 dark:bg-[#0D0D17]/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <Clock className="w-4 h-4 text-white animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">In Progress</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 -mt-6 space-y-4">
        
        {/* Payment Buttons Priority Display */}
        {(showAdvancePayNow || showPayNow) && (
          <div className="bg-white dark:bg-[#0D0D17] rounded-3xl p-6 border border-orange-200 dark:border-orange-500/30 shadow-lg relative z-30 mb-4 animate-pulse-slow">
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3 text-center">
              {showAdvancePayNow ? "Advance Payment Required" : "Final Payment Required"}
            </h3>
            {showAdvancePayNow && (
              <button 
                onClick={handlePayAdvance}
                disabled={isPaying}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-sm animate-pulse"
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isPaying ? "Processing..." : `Pay Advance ₹${(Number(order.platform_fee || 0) + Number(order.delivery_charge || 0) + Number(order.advance_fee || 0)).toFixed(2)}`}
              </button>
            )}
            {showPayNow && (
              <button 
                onClick={order.payment_method === 'online_on_delivery' ? handlePayRemaining : handlePayNow}
                disabled={isPaying}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-sm animate-pulse"
              >
                {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isPaying ? "Processing..." : `Pay ₹${
                  order.payment_method === 'online_on_delivery' 
                    ? (Number(order.total_amount) - (Number(order.platform_fee || 0) + Number(order.delivery_charge || 0) + Number(order.advance_fee || 0))).toFixed(2)
                    : order.total_amount
                } Now`}
              </button>
            )}
          </div>
        )}

        {/* Status Tracker */}
        <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl p-6 border border-gray-100 dark:border-[#2A2A3A] shadow-sm relative z-20">
          {order.cancel_request_status === 'pending' && !isCancelled && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-orange-700 dark:text-orange-400">Cancellation Requested</h4>
                <p className="text-xs text-orange-600 dark:text-orange-500/80 mt-1 font-medium">Awaiting vendor approval. Reason: {order.cancel_request_reason}</p>
              </div>
            </div>
          )}
          {isCancelled ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-3">
                <Info className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-900 dark:text-gray-100 font-black text-lg mb-1">This order was cancelled</p>
              {!isCOD && (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">If you have already paid, your refund will be processed within 3-5 business days.</p>
              )}
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line connecting steps */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-[#1F1F2E]" />
              
              <div className="space-y-6 relative">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = currentStepIndex >= index;
                  const isCurrent = currentStepIndex === index;
                  
                  return (
                    <div key={step} className="flex gap-4">
                      <div className="relative z-10 shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500 ${
                          isCompleted ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-[#1F1F2E] text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-orange-500/20 scale-110' : ''}`}>
                          {index === 0 ? <Clock className="w-4 h-4" /> :
                           index === 1 ? <CheckCircle className="w-4 h-4" /> :
                           index === 2 ? <Package className="w-4 h-4" /> :
                           index === 3 ? <Truck className="w-4 h-4" /> :
                           <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                      <div className={`pt-2 transition-opacity duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                        <p className={`font-black uppercase tracking-wider text-sm ${isCurrent ? 'text-orange-600' : 'text-gray-900 dark:text-gray-100'}`}>
                          {step}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                            {index === 0 ? "Vendor is reviewing your order" :
                             index === 1 ? "Your items are being packed" :
                             index === 2 ? "Order has been shipped" :
                             index === 3 ? "Delivery partner is on the way" :
                             "Hope you enjoyed it!"}
                          </p>
                        )}
                        {isCurrent && index === 4 && (
                          <button
                            onClick={generateReceipt}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 text-xs font-bold rounded-lg transition-all active:scale-95 shadow-sm w-fit"
                          >
                            <FileDown className="w-3.5 h-3.5" /> Download Receipt
                          </button>
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
          <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl p-5 border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ordered From</h3>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-[#151522] dark:bg-[#151522] border border-gray-100 dark:border-[#2A2A3A] overflow-hidden shrink-0">
                {order.image_url ? (
                  <img src={order.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-full h-full p-3 text-gray-300" />
                )}
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-gray-100 text-lg leading-tight">{order.restaurant_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 line-clamp-1">{order.manual_address || order.gps_address}</p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl p-5 border border-gray-100 dark:border-[#2A2A3A] shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Navigation className="w-4 h-4 text-gray-400" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Delivering To</h3>
            </div>
            
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0 text-orange-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-gray-900 dark:text-gray-100 leading-tight">
                  {order.delivery_address?.landmark ? `${order.delivery_address.landmark}, ` : ''}{order.delivery_address?.locationName || 'Saved Location'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">PIN: {order.delivery_address?.pincode || 'N/A'}</p>
                <div className="mt-2 inline-block px-2 py-0.5 bg-gray-100 dark:bg-[#1F1F2E] text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded">
                  {order.delivery_address?.latitude?.toFixed(4)}, {order.delivery_address?.longitude?.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {canDirectCancel && !isCancelled && (
            <button 
              onClick={handleCancelOrder}
              className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold text-sm transition-colors shadow-sm"
            >
              Cancel Order
            </button>
          )}

          {canRequestCancel && (
            <button 
              onClick={() => setShowCancelRequest(true)}
              className="w-full py-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center gap-2 text-red-600 font-bold text-sm transition-colors shadow-sm"
            >
              Request Cancellation
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
            className={`w-full py-4 bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] hover:bg-gray-50 dark:bg-[#151522] dark:hover:bg-[#151522] rounded-2xl flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 font-bold text-sm transition-colors shadow-sm ${currentStepIndex > 1 || isCancelled ? 'col-span-2 sm:col-span-1' : 'col-span-2'}`}
          >
            <Phone className="w-4 h-4" />
            Need help?
          </a>

          {currentStepIndex >= 3 && !isCancelled && order.delivery_boy_number && (
            <a 
              href={`tel:${order.delivery_boy_number}`}
              className={`w-full py-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl flex items-center justify-center gap-2 text-blue-600 font-bold text-sm transition-colors shadow-sm ${(showPayNow || showAdvancePayNow) ? 'col-span-1' : 'col-span-2 sm:col-span-1'}`}
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
              className="relative w-full max-w-md bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] flex items-center justify-between bg-white dark:bg-[#0D0D17] dark:bg-[#0D0D17] z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-[#1F1F2E] rounded-xl flex items-center justify-center text-gray-800 dark:text-gray-200">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Final Billing</h2>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Order Breakdown</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBilling(false)}
                  className="p-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  {order.platform_fee && parseFloat(order.platform_fee) > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>Platform Fee</span>
                      <span>+ ₹{order.platform_fee}</span>
                    </div>
                  )}
                  {order.gst && parseFloat(order.gst) > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
                      <span>GST ({gstRate}%)</span>
                      <span>+ ₹{order.gst}</span>
                    </div>
                  )}
                  {order.delivery_charge && parseFloat(order.delivery_charge) > 0 && (
                    <div className="flex justify-between text-sm font-bold text-orange-600">
                      <span>Delivery Charge</span>
                      <span>+ ₹{order.delivery_charge}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 dark:text-gray-100 pt-4 border-t border-gray-100 dark:border-[#2A2A3A] mt-4">
                    <span>Grand Total</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-5 bg-gray-50 dark:bg-[#151522] dark:bg-[#151522] border-t border-gray-100 dark:border-[#2A2A3A]">
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

      {/* Cancel Request Modal */}
      <AnimatePresence>
        {showCancelRequest && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-center items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelRequest(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0D0D17] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-500">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Request Cancel</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowCancelRequest(false)}
                  className="p-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">
                  Since your order is already being processed, cancellation must be approved by the vendor. Please provide a reason.
                </p>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Why do you want to cancel?"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-xl outline-none focus:ring-2 focus:ring-red-500/50 resize-none h-24 text-sm font-medium"
                />
              </div>
              
              <div className="p-5 bg-gray-50 dark:bg-[#151522] border-t border-gray-100 dark:border-[#2A2A3A] flex gap-3">
                <button
                  onClick={() => setShowCancelRequest(false)}
                  className="flex-1 py-3.5 bg-white dark:bg-[#0D0D17] hover:bg-gray-50 text-gray-700 dark:text-gray-300 font-bold rounded-xl border border-gray-200 dark:border-[#2A2A3A] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleCancelRequest}
                  disabled={isSubmittingCancel || !cancelReason.trim()}
                  className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  {isSubmittingCancel ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Send Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Receipt Template for PDF */}
      {order && (
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
                <p className="font-bold text-xl">{order.restaurant_name}</p>
                <p className="mt-1 text-sm" style={{ color: "#6b7280" }}>
                  {order.manual_address || order.gps_address || "Address not provided"}
                  {order.vendor_pincode ? ` - ${order.vendor_pincode}` : ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Order ID</p>
                <p className="font-black text-sm break-all">{order.id}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Date</p>
                <p className="font-black text-sm">
                  {new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#9ca3af" }}>Payment Method</p>
                <p className="font-black text-sm uppercase">{order.payment_method}</p>
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
                  {order.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td className="py-3 px-4 font-bold text-sm">{item.name}</td>
                      <td className="py-3 px-4 font-medium text-right text-sm" style={{ color: "#4b5563" }}>{item.quantity || (item as any).qty}</td>
                      <td className="py-3 px-4 font-medium text-right text-sm" style={{ color: "#4b5563" }}>₹{item.price}</td>
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
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                  <span>Platform Fee</span>
                  <span>₹{order.platform_fee}</span>
                </div>
                <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                  <span>GST ({gstRate}%)</span>
                  <span>₹{order.gst}</span>
                </div>
                {order.delivery_charge && parseFloat(order.delivery_charge) > 0 && (
                  <div className="flex justify-between font-medium" style={{ color: "#4b5563" }}>
                    <span>Delivery Charge</span>
                    <span>₹{order.delivery_charge}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-black pt-3 mt-3" style={{ borderTop: "1px solid #e5e7eb", color: "#111827" }}>
                  <span>Grand Total</span>
                  <span>₹{order.total_amount}</span>
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
