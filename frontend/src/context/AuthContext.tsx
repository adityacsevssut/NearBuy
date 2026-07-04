"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import toast from "react-hot-toast";
import LoginModal from "@/components/LoginModal";
import { usePathname } from "next/navigation";
import { initPushNotifications } from "@/utils/PushNotificationService";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  avatar?: string;
  role: string;
  manager_type?: string;
  service_center_id?: string | null;
  locationName?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number | null;
  longitude?: number | null;
  notifications_enabled?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  // ── Silently refresh the access token using the stored refresh token ──
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refresh = localStorage.getItem("nb_refresh");
      if (!refresh) return null;
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      const newToken = data.accessToken;
      setAccessToken(newToken);
      localStorage.setItem("nb_access", newToken);
      localStorage.setItem("nb_last_refresh", Date.now().toString());
      return newToken;
    } catch {
      return null;
    }
  };

  // ── Schedule auto-refresh every 12 min (access token expires in 15 min) ──
  const scheduleRefresh = () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    refreshTimerRef.current = setInterval(async () => {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        // Refresh token also expired — log out silently
        clearInterval(refreshTimerRef.current!);
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem("nb_user");
        localStorage.removeItem("nb_access");
        localStorage.removeItem("nb_refresh");
      }
    }, 12 * 60 * 1000); // every 12 minutes
  };

  // ── On mount: restore session and immediately get a fresh token ──
  useEffect(() => {
    const stored = localStorage.getItem("nb_user");
    const token  = localStorage.getItem("nb_access");
    const refresh = localStorage.getItem("nb_refresh");

    if (stored && refresh) {
      try { setUser(JSON.parse(stored)); } catch {}
      // Immediately get a fresh token (handles page reloads after 15+ min)
      refreshAccessToken().then(newToken => {
        if (newToken) {
          scheduleRefresh();
        } else if (token) {
          // Fallback: use stored token if refresh endpoint is temporarily down
          setAccessToken(token);
        }
      });
    }
    
    setIsInitializing(false);

    // Refresh token when app comes back to foreground (Capacitor background freezing fix)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const refresh = localStorage.getItem("nb_refresh");
        const lastRefresh = parseInt(localStorage.getItem("nb_last_refresh") || "0");
        // Only refresh if more than 5 minutes have passed since last refresh to avoid spam
        if (refresh && Date.now() - lastRefresh > 5 * 60 * 1000) {
          refreshAccessToken().then(newToken => {
             if (newToken) scheduleRefresh();
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initialize Native Push Notifications on Login ──
  useEffect(() => {
    if (accessToken) {
      initPushNotifications(accessToken);
    }
  }, [accessToken]);

  const pathname = usePathname();
  const isEssentials = pathname?.startsWith("/essentials") || pathname?.startsWith("/store") || (typeof window !== "undefined" && window.location.href.includes("theme=blue")) || false;

  const login = (u: AuthUser, token: string, refresh: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem("nb_user",    JSON.stringify(u));
    localStorage.setItem("nb_access",  token);
    localStorage.setItem("nb_refresh", refresh);
    scheduleRefresh();
    toast.success("Welcome to NearBuy!", {
      duration: 2000,
      style: {
        border: `1px solid ${isEssentials ? '#3b82f6' : '#f97316'}`,
        padding: "16px",
        color: isEssentials ? '#3b82f6' : '#f97316',
        fontWeight: "bold",
        borderRadius: "12px",
        background: "#fff",
      },
      iconTheme: { primary: isEssentials ? '#3b82f6' : '#f97316', secondary: "#FFFAEE" },
    });
  };

  const logout = () => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    const refresh = localStorage.getItem("nb_refresh");
    if (refresh) {
      fetch(`${API}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: refresh }),
      }).catch(() => {});
    }
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("nb_user");
    localStorage.removeItem("nb_access");
    localStorage.removeItem("nb_refresh");
    toast("Logged out. See you soon! 👋", {
      icon: "👋",
      duration: 2000,
      style: {
        border: "1px solid #e5e7eb",
        padding: "16px",
        color: "#374151",
        fontWeight: "bold",
        borderRadius: "12px",
        background: "#fff",
      },
    });
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("nb_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, updateUser, isLoggedIn: !!user, isLoginModalOpen, openLoginModal, closeLoginModal, isInitializing }}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
