import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Orders - Store",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
