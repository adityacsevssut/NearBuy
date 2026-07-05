import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - ZyphCart",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
