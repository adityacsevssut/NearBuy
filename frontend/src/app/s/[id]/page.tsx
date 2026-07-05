"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function ShareRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  useEffect(() => {
    async function resolveLink() {
      try {
        const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
        const res = await fetch(`${API}/api/share/${id}`);
        
        if (res.ok) {
          const { data } = await res.json();
          if (data.type === "restaurant") {
            router.replace(`/vendor/${data.target_id}`);
          } else if (data.type === "item") {
            const extra = data.extra_data || {};
            // Assuming we route to the vendor page and optionally open an item modal.
            // Using query parameter to pass the item ID.
            if (extra.vendor_id) {
              router.replace(`/vendor/${extra.vendor_id}?item=${data.target_id}`);
            } else {
              router.replace("/");
            }
          } else {
            router.replace("/");
          }
        } else {
          router.replace("/");
        }
      } catch (err) {
        console.error("Failed to resolve share link:", err);
        router.replace("/");
      }
    }

    if (id) {
      resolveLink();
    } else {
      router.replace("/");
    }
  }, [id, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0D0D17] flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
      <h2 className="text-xl font-black text-gray-800 dark:text-gray-200">Opening link...</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">Taking you to ZyphCart.</p>
    </div>
  );
}
