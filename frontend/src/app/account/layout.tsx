import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Account - ZyphCart",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
