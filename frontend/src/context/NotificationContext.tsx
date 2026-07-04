"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";
import { getToken } from "firebase/messaging";
import { getMessagingInstance } from "../config/firebase";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch initial notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("nb_access");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };
    
    fetchNotifications();
  }, [user]);

  // Setup Socket.io
  useEffect(() => {
    if (!user) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const newSocket = io(backendUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to notification server");
      newSocket.emit("join_user_room", user.id);
    });

    newSocket.on("notification", (newNotification: Notification) => {
      setNotifications(prev => [newNotification, ...prev]);
      
      // Real-time Notification Bar UI (Classic Toast)
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#0D0D17] shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-lg pointer-events-auto flex ring-1 ring-black/5 overflow-hidden transform transition-all duration-300 items-center`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{newNotification.title}</p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-snug">{newNotification.message}</p>
            </div>
          </div>
          <div className="flex border-l border-gray-100 dark:border-[#2A2A3A] h-full">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full h-full border border-transparent rounded-none px-4 py-3 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition-colors focus:outline-none"
            >
              Dismiss
            </button>
          </div>
        </div>
      ), { duration: 2000, position: 'top-center' });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Setup Firebase Cloud Messaging
  useEffect(() => {
    if (!user) return;

    const setupFCM = async () => {
      try {
        if (!("Notification" in window)) {
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
          if (isIOS) {
            if (!sessionStorage.getItem('ios_pwa_prompt')) {
              toast('To receive notifications on iOS, tap Share and "Add to Home Screen".', { duration: 2000, icon: '📱' });
              sessionStorage.setItem('ios_pwa_prompt', 'true');
            }
          }
          return;
        }
        if (!("serviceWorker" in navigator)) return;

        const messaging = await getMessagingInstance();
        if (!messaging) return; // Not supported

        // Explicitly register SW for Vercel/mobile deployments
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

        const registerToken = async () => {
          try {
            const currentToken = await getToken(messaging, { 
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
              serviceWorkerRegistration: registration 
            });
            if (currentToken) {
              const token = localStorage.getItem("nb_access");
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/fcm-token`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ token: currentToken, device_type: 'web' })
              });
              console.log("FCM token registered");
            }
          } catch (error: any) {
            console.warn("FCM Token Registration Failed. Please check your Firebase API Key in .env:", error.message);
          }
        };

        if (Notification.permission === 'granted') {
          await registerToken();
        } else if (Notification.permission === 'default') {
          // Show toast to ask for permission via user gesture
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#0D0D17] shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black/5 p-4 items-center`}>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Enable Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get real-time updates for your orders.</p>
              </div>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                      registerToken();
                    } else {
                      toast.error("Push notifications were denied.");
                    }
                  });
                }}
                className="ml-4 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-orange-600"
              >
                Enable
              </button>
            </div>
          ), { duration: 2000, id: 'push-permission', position: 'top-center' });
        }
      } catch (error) {
        console.error("FCM Setup failed:", error);
      }
    };

    setupFCM();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const token = localStorage.getItem("nb_access");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      const token = localStorage.getItem("nb_access");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const token = localStorage.getItem("nb_access");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
