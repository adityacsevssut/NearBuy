import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Food Delivery - ZyphCart",
  description: "Get your favourite food delivered blazing fast by ZyphCart.",
};

export default function FoodLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
