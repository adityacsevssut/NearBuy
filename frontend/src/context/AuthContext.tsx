"use client";
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import toast from "react-hot-toast";

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
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  login: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (u: AuthUser, token: string, refresh: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem("nb_user",    JSON.stringify(u));
    localStorage.setItem("nb_access",  token);
    localStorage.setItem("nb_refresh", refresh);
    scheduleRefresh();
    toast.success("Welcome to NearBuy!", {
      duration: 3000,
      style: {
        border: "1px solid #f97316",
        padding: "16px",
        color: "#f97316",
        fontWeight: "bold",
        borderRadius: "12px",
        background: "#fff",
      },
      iconTheme: { primary: "#f97316", secondary: "#FFFAEE" },
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
      duration: 3000,
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

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
