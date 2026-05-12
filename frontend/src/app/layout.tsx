import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NearBuy – Campus life, simplified.",
  description:
    "From late-night snacks to lab equipment. Delivered to your hostel gate in 15 mins.",
  keywords: ["student delivery", "campus food", "hostel delivery", "VSSUT", "hyperlocal"],
  openGraph: {
    title: "NearBuy – Campus life, simplified.",
    description: "Hyperlocal student super app for food and essentials.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
