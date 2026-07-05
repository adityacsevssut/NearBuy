import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Shop Essentials - ZyphCart",
  description: "Shop stationery, lab gear, tech accessories and daily essentials delivered instantly by ZyphCart.",
};

export default async function EssentialsLayout({ children }: { children: React.ReactNode }) {
  try {
    const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
    const res = await fetch(`${API}/api/public/settings`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.enable_store === false) {
        notFound();
      }
    }
  } catch (err) {
    // Ignore errors to not break the app if backend is temporarily unreachable
  }

  return <>{children}</>;
}
