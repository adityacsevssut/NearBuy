"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, MessageSquare, Loader2, Inbox } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Feedback {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function VendorFeedbacksPage() {
  const { user, accessToken, isLoggedIn, isInitializing } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auth guard
  useEffect(() => {
    if (!mounted || isInitializing) return;
    const t = setTimeout(() => {
      if (!isLoggedIn || (user?.role !== "vendor" && user?.role !== "admin")) {
        router.push("/");
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isLoggedIn, user, router, mounted, isInitializing]);

  const fetchFeedbacks = async (pageNum = 1, reset = false) => {
    if (pageNum === 1) setIsLoading(true);
    else setLoadingMore(true);

    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/feedback/vendor?page=${pageNum}&limit=15`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks((prev) => reset ? data.feedbacks : [...prev, ...data.feedbacks]);
        setTotalPages(data.pagination?.totalPages || 1);
        setPage(pageNum);
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks", err);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && accessToken) {
      fetchFeedbacks(1, true);
    }
  }, [isLoggedIn, accessToken]);

  if (!mounted || isInitializing || !isLoggedIn || (user?.role !== "vendor" && user?.role !== "admin")) {
    return <div className="min-h-screen bg-white dark:bg-[#0D0D17]" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#151522] flex flex-col font-sans">

      {/* Header */}
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/food/vendor")}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-black text-[15px] text-white tracking-tight">Customer Feedbacks</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-200">Vendor Portal</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-black uppercase tracking-widest text-purple-600">
            All Feedback
          </p>
          {!isLoading && (
            <span className="text-xs font-bold text-gray-400">
              {feedbacks.length} response{feedbacks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-100 dark:border-[#2A2A3A] p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#2A2A3A]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-28 bg-gray-200 dark:bg-[#2A2A3A] rounded-full" />
                    <div className="h-2.5 w-16 bg-gray-200 dark:bg-[#2A2A3A] rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 dark:bg-[#2A2A3A] rounded-full" />
                  <div className="h-3 w-5/6 bg-gray-200 dark:bg-[#2A2A3A] rounded-full" />
                  <div className="h-3 w-3/4 bg-gray-200 dark:bg-[#2A2A3A] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && feedbacks.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[55vh] text-center">
            <div className="w-20 h-20 rounded-full bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-5">
              <Inbox className="w-10 h-10 text-purple-300" />
            </div>
            <p className="text-xl font-black text-gray-800 dark:text-gray-200 mb-2">No feedback yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-[280px] leading-relaxed">
              When customers visit your restaurant page and submit feedback, it will appear here.
            </p>
          </div>
        )}

        {/* Feedback cards */}
        {!isLoading && feedbacks.length > 0 && (
          <AnimatePresence>
            <div className="space-y-4">
              {feedbacks.map((fb, i) => (
                <motion.div
                  key={fb.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.04 }}
                  className="bg-white dark:bg-[#0D0D17] rounded-2xl border border-gray-100 dark:border-[#2A2A3A] p-5 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200"
                >
                  {/* Header: avatar + name + time */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400 uppercase">
                          {fb.user_name.charAt(0) || "?"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 dark:text-gray-100 truncate">
                          {fb.user_name}
                        </p>
                        <p className="text-[11px] font-medium text-gray-400">{timeAgo(fb.created_at)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800 uppercase tracking-wider shrink-0">
                      Feedback
                    </span>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-purple-300 dark:border-purple-700 pl-3">
                    {fb.message}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Load More */}
        {!isLoading && page < totalPages && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchFeedbacks(page + 1, false)}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 font-bold text-sm hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors disabled:opacity-50"
            >
              {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-5 border-t border-gray-200 dark:border-[#2A2A3A] bg-white dark:bg-[#0D0D17]">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <p className="text-[11px] font-medium text-gray-400">© 2026 ZyphCart Technologies · Vendor Console</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-500 to-purple-700" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Feedbacks</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
