"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Receipt, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function RefundsPage() {
  const { isLoggedIn, accessToken, isInitializing } = useAuth();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(true);
  const [upiInputs, setUpiInputs] = useState<Record<string, string>>({});
  const [submittingUpi, setSubmittingUpi] = useState<Record<string, boolean>>({});

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [isStore, setIsStore] = useState(false);

  useEffect(() => {
    setIsStore(typeof window !== "undefined" && window.location.search.includes("theme=blue"));
  }, []);

  useEffect(() => {
    if (!isInitializing && !isLoggedIn) {
      router.push("/login");
    }
  }, [isInitializing, isLoggedIn, router]);

  useEffect(() => {
    const fetchRefunds = async () => {
      if (!isLoggedIn) return;
      try {
        const res = await fetch(`${API}/api/public/refunds`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const data = await res.json();
        if (res.ok) {
          setRefunds(data.refunds || []);
        } else {
          toast.error("Failed to load refund requests");
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred while fetching refunds.");
      } finally {
        setLoadingRefunds(false);
      }
    };

    fetchRefunds();
  }, [isLoggedIn, accessToken, API]);

  const handleUPISubmit = async (id: string) => {
    const upi_id = upiInputs[id];
    if (!upi_id || !upi_id.trim()) {
      toast.error("Please enter a valid UPI ID");
      return;
    }

    setSubmittingUpi(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API}/api/public/refunds/${id}/upi`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ upi_id: upi_id.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit UPI ID");
      toast.success(data.message);
      // Update local state
      setRefunds(prev => prev.map(r => r.id === id ? { ...r, status: 'UPI Provided', upi_id: upi_id.trim() } : r));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingUpi(prev => ({ ...prev, [id]: false }));
    }
  };

  if (isInitializing || !isLoggedIn) {
    return <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D0D17]" />;
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 rounded-full text-xs font-bold tracking-wide">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      case "upi provided":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 rounded-full text-xs font-bold tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" /> UPI Submitted
          </span>
        );
      case "awaiting upi":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-gradient dark:bg-orange-500/20 dark:text-orange-gradient rounded-full text-xs font-bold tracking-wide">
            <Clock className="w-3.5 h-3.5" /> Action Required
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 rounded-full text-xs font-bold tracking-wide">
            <CheckCircle className="w-3.5 h-3.5" /> Refund Done
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 rounded-full text-xs font-bold tracking-wide">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D0D17] text-gray-900 dark:text-gray-100 font-sans flex flex-col">
      <Navbar />
      
      <main className="flex-1 w-full px-4 sm:px-8 pt-32 pb-10 max-w-5xl mx-auto">
        <Link href="/" className={`inline-flex items-center justify-center px-5 py-2 rounded-xl text-white font-bold transition-all shadow-sm mb-6 ${isStore ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
            My Refunds
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Track the status of your refund requests.</p>
        </div>

        {loadingRefunds ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : refunds.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-3xl p-12 text-center shadow-sm"
          >
            <Receipt className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Refund Requests</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">You haven&apos;t submitted any refund requests yet.</p>
            <Link href="/" className={`inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-white font-bold transition-all shadow-sm ${isStore ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}>
              Back to Home
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {refunds.map((req, index) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#151522] border border-gray-200 dark:border-[#2A2A3A] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gray-100 dark:bg-[#2A2A3A] p-2.5 rounded-xl">
                    <Receipt className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  {getStatusBadge(req.status)}
                </div>
                
                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{req.user_name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{req.email}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-[#2A2A3A] flex justify-between items-end mb-2">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Order ID</p>
                    <p className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-[#0D0D17] px-2 py-1 rounded">
                      #{req.order_id?.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100">
                      ₹{Number(req.amount || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end mb-4">
                  <p className="text-[10px] font-bold text-gray-400">
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>

                {req.status === 'Awaiting UPI' && (
                  <div className="mt-2 pt-4 border-t border-gray-100 dark:border-[#2A2A3A]">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Enter your UPI ID for refund</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="e.g. user@upi" 
                        value={upiInputs[req.id] || ''}
                        onChange={(e) => setUpiInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-[#0D0D17] border border-gray-200 dark:border-[#2A2A3A] rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button 
                        onClick={() => handleUPISubmit(req.id)}
                        disabled={submittingUpi[req.id]}
                        className={`px-4 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-sm ${isStore ? 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'} ${submittingUpi[req.id] ? 'opacity-50' : ''}`}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}

                {req.status === 'Rejected' && req.rejection_reason && (
                  <div className="mt-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1 relative z-10">Cancellation Reason</p>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400 relative z-10">{req.rejection_reason}</p>
                  </div>
                )}

                {req.status === 'Completed' && (
                  <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-500/10 dark:to-emerald-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-center">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Refund of ₹{Number(req.amount || 0).toFixed(2)} has been successfully processed and will be credited to your account in the next 3-4 working days.</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
