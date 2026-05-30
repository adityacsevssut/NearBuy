import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Essentials – NearBuy",
  description: "Shop stationery, lab gear, tech accessories and daily essentials for campus life.",
};

export default function EssentialsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
