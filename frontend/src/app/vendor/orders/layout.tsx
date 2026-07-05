import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Orders - ZyphCart",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
