"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface RateItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onRatingSubmitted?: () => void;
}

export default function RateItemsModal({ isOpen, onClose, order, onRatingSubmitted }: RateItemsModalProps) {
  const { accessToken } = useAuth();
  const [existingRatings, setExistingRatings] = useState<Record<string, number>>({});
  const [newRatings, setNewRatings] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && order?.id) {
      fetchExistingRatings();
      setNewRatings({});
      setShowSuccess(false);
    }
  }, [isOpen, order]);

  const fetchExistingRatings = async () => {
    setIsLoading(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    try {
      const res = await fetch(`${API}/api/orders/${order.id}/item-ratings`, {
        headers: { "Authorization": `Bearer ${accessToken || ""}` }
      });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, number> = {};
        if (data.ratings && Array.isArray(data.ratings)) {
          data.ratings.forEach((r: any) => {
            map[r.menu_item_id] = parseFloat(r.rating);
          });
        }
        setExistingRatings(map);
      }
    } catch (err) {
      console.error("Failed to fetch existing ratings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = (itemId: string, rating: number) => {
    if (existingRatings[itemId]) return; // Already rated
    setNewRatings(prev => ({ ...prev, [itemId]: rating }));
  };

  const handleSubmit = async () => {
    const itemsToRate = Object.entries(newRatings);
    if (itemsToRate.length === 0) return;

    setIsSubmitting(true);
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    let successCount = 0;

    try {
      await Promise.all(
        itemsToRate.map(async ([itemId, rating]) => {
          const res = await fetch(`${API}/api/orders/${order.id}/rate-item`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken || ""}`
            },
            body: JSON.stringify({ menu_item_id: itemId, rating })
          });
          if (res.ok) {
            successCount++;
          }
        })
      );

      if (successCount > 0) {
        setShowSuccess(true);
        toast.success(`Successfully rated ${successCount} item(s)!`, {
          style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
        });
        if (onRatingSubmitted) onRatingSubmitted();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.error("Failed to submit ratings.");
      }
    } catch (err) {
      console.error("Submit ratings error", err);
      toast.error("An error occurred while submitting ratings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const items = order?.items || [];
  const hasUnratedItems = items.some((item: any) => !existingRatings[item.id]);
  const hasSelectedRatings = Object.keys(newRatings).length > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-[#0D0D17] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2A2A3A] flex items-center justify-between sticky top-0 bg-white dark:bg-[#0D0D17] z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-500">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h2 className="font-black text-gray-900 dark:text-gray-100 text-lg">Rate Items</h2>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{order?.restaurant_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-[#1F1F2E] hover:bg-gray-200 rounded-full text-gray-600 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : showSuccess ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-4 text-green-500">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Thank You!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your ratings help other foodies make better choices.</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-2">
                  How was the food? Tap the stars to rate.
                </p>
                
                {items.map((item: any, idx: number) => {
                  const ratedValue = existingRatings[item.id];
                  const isRated = ratedValue !== undefined;
                  const currentRating = isRated ? ratedValue : (newRatings[item.id] || 0);

                  return (
                    <div key={`${item.id}-${idx}`} className="bg-gray-50 dark:bg-[#151522] rounded-2xl p-4 border border-gray-100 dark:border-[#2A2A3A]">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 ${item.type === 'veg' ? 'border-green-500' : 'border-red-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${item.type === 'veg' ? 'bg-green-500' : 'bg-red-500'}`} />
                          </div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{item.name}</p>
                        </div>
                        {isRated && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-md">
                            <CheckCircle className="w-3 h-3" /> Rated
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            disabled={isRated || isSubmitting}
                            onClick={() => handleRate(item.id, star)}
                            className={`p-1 transition-transform ${!isRated && !isSubmitting ? 'hover:scale-110 active:scale-95' : ''}`}
                          >
                            <Star 
                              className={`w-8 h-8 transition-colors ${
                                star <= currentRating 
                                  ? (isRated ? 'text-amber-500 fill-amber-500 opacity-70' : 'text-orange-500 fill-orange-500') 
                                  : 'text-gray-300 dark:text-gray-700'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isLoading && !showSuccess && (
            <div className="p-5 bg-white dark:bg-[#0D0D17] border-t border-gray-100 dark:border-[#2A2A3A]">
              {hasUnratedItems ? (
                <button
                  onClick={handleSubmit}
                  disabled={!hasSelectedRatings || isSubmitting}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isSubmitting ? "Submitting..." : "Submit Ratings"}
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-md transition-all active:scale-[0.98]"
                >
                  Close
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
