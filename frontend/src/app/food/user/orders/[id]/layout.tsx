import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details - Food",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
