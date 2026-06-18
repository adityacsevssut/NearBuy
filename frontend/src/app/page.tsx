"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoggedIn, isInitializing } = useAuth();

  useEffect(() => {
    // Wait until AuthContext finishes checking localStorage
    if (isInitializing) return;

    if (isLoggedIn && user) {
      if (user.role === "vendor") {
        router.replace("/vendor");
      } else if (user.role === "admin") {
        router.replace("/manager");
      } else {
        router.replace("/food");
      }
    } else {
      router.replace("/food");
    }
  }, [isLoggedIn, user, isInitializing, router]);

  // Render a blank screen while evaluating auth state to prevent flash of content
  return <div className="min-h-screen bg-white dark:bg-[#0D0D17]" />;
}
