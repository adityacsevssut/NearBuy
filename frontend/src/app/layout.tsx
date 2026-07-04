import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

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

import { WishlistProvider } from "@/context/WishlistContext";
import { NotificationProvider } from "@/context/NotificationContext";
import ServiceGuard from "@/components/ServiceGuard";
import NetworkGuard from "@/components/NetworkGuard";
import { Toaster } from 'react-hot-toast';
import LocationModal from "@/components/LocationModal";
import CapacitorHardwareBackButton from "@/components/CapacitorHardwareBackButton";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <AuthProvider>
            <NotificationProvider>
              <CartProvider>
                <WishlistProvider>
                  <LocationProvider>
                    <Toaster 
                      position="top-center" 
                      reverseOrder={false} 
                      toastOptions={{
                        duration: 2000,
                        style: {
                          transition: 'all 0.3s ease-out'
                        }
                      }}
                    />
                    <CapacitorHardwareBackButton />
                    <NetworkGuard>
                      <ServiceGuard>
                        {children}
                      </ServiceGuard>
                      <LocationModal />
                    </NetworkGuard>
                  </LocationProvider>
                </WishlistProvider>
              </CartProvider>
            </NotificationProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
