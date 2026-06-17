import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Essentials – NearBuy",
  description: "Get your favourite food delivered to your campus.",
};

export default function FoodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
