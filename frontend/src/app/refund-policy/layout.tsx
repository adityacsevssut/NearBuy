import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - ZyphCart",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
