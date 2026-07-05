import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Cart - Store",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
