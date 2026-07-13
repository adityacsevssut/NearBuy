"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export default function CapacitorHardwareBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: any = null;
    
    const setupListener = async () => {
      listener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        // If we are at a root tab or home page, we might want to exit
        if (pathname === "/" || pathname === "/food/user" || pathname === "/store" || pathname === "/food/manager" || pathname === "/food/vendor") {
          CapacitorApp.exitApp();
        } else if (canGoBack) {
          router.back();
        } else {
          CapacitorApp.exitApp();
        }
      });
    };

    setupListener();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [router, pathname]);

  return null;
}
