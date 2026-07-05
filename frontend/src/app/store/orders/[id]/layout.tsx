import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Details - Store",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
