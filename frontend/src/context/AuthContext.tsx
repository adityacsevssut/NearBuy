"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import toast from "react-hot-toast";

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  avatar?: string;
  role: string;
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("nb_user");
      const token  = localStorage.getItem("nb_access");
      if (stored && token) {
        setUser(JSON.parse(stored));
        setAccessToken(token);
      }
    } catch {}
  }, []);

  const login = (u: AuthUser, token: string, refresh: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem("nb_user",    JSON.stringify(u));
    localStorage.setItem("nb_access",  token);
    localStorage.setItem("nb_refresh", refresh);
    toast.success("Welcome to NearBuy!", {
      style: {
        border: '1px solid #f97316',
        padding: '16px',
        color: '#f97316',
        fontWeight: 'bold',
        borderRadius: '12px',
        background: '#fff'
      },
      iconTheme: {
        primary: '#f97316',
        secondary: '#FFFAEE',
      },
    });
  };

  const logout = () => {
    const refresh = localStorage.getItem("nb_refresh");
    if (refresh) {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      fetch(`${apiBase}/api/auth/logout`, {
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
