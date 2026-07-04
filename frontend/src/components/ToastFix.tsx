"use client";
import { useEffect } from "react";
import { useToasterStore, toast } from "react-hot-toast";

export default function ToastFix() {
  const { toasts } = useToasterStore();

  useEffect(() => {
    toasts
      .filter((t) => t.visible)
      .forEach((t) => {
        // Skip toasts that are meant to be permanent (like dialog boxes)
        if (t.duration === Infinity) return;
        
        // Force dismiss the toast after its duration (default 2000)
        // This fixes a known bug with react-hot-toast and React 19 where toasts get stuck
        setTimeout(() => toast.dismiss(t.id), t.duration || 2000);
      });
  }, [toasts]);

  return null;
}
