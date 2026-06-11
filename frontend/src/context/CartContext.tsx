"use client";

import {
  createContext, useContext, useState,
  useCallback, useEffect, ReactNode
} from "react";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: number;
  uid: string;          // unique key: `${restaurantId}__${id}`
  name: string;
  price: number;
  image: string;
  type: "veg" | "non-veg";
  quantity: number;
  restaurantId: string;
  restaurantName: string;
  section: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "uid">, qty?: number) => void;
  removeItem: (uid: string) => void;
  updateQty: (uid: string, qty: number) => void;
  clearCart: () => void;
  clearVendorCart: (vendorId: string) => void;
  restaurantCount: number;   // unique restaurants (shown as badge)
  totalItems: number;        // total quantity across all items
  totalPrice: number;
  itemQty: (id: number, restaurantId: string) => number;
  getCartCount: (domain: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "nearbuy_cart_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, openLoginModal, accessToken } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load cart on mount or when auth state changes
  useEffect(() => {
    let isMounted = true;
    const loadCart = async () => {
      if (isLoggedIn && accessToken) {
        try {
          const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
          const res = await fetch(`${API}/api/cart`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.items) {
              setItems(data.items);
            }
          }
        } catch (err) {
          console.error("Failed to load cart from server", err);
        }
      } else {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw && isMounted) setItems(JSON.parse(raw));
        } catch { /* ignore */ }
      }
      if (isMounted) setLoaded(true);
    };

    // If we transition from logged out to logged in, we should consider it not loaded temporarily
    // to avoid syncing the empty/local cart to the server immediately.
    setLoaded(false); 
    loadCart();

    return () => { isMounted = false; };
  }, [isLoggedIn, accessToken]);

  // Persist to backend or localStorage whenever items change
  useEffect(() => {
    if (!loaded) return;
    
    if (isLoggedIn && accessToken) {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      fetch(`${API}/api/cart`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ items }),
      }).catch(console.error);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded, isLoggedIn, accessToken]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity" | "uid">, qty = 1) => {
      if (!isLoggedIn) {
        openLoginModal();
        return;
      }
      const uid = `${newItem.restaurantId}__${newItem.id}`;
      setItems((prev) => {
        const existing = prev.find((i) => i.uid === uid);
        if (existing) {
          return prev.map((i) =>
            i.uid === uid ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [...prev, { ...newItem, uid, quantity: qty }];
      });
    },
    [isLoggedIn, openLoginModal]
  );

  const removeItem = useCallback((uid: string) => {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }, []);

  const updateQty = useCallback((uid: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.uid !== uid));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.uid === uid ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const clearVendorCart = useCallback((vendorId: string) => {
    setItems((prev) => prev.filter((i) => i.restaurantId !== vendorId));
  }, []);

  const foodItems = items.filter((i) => i.section === "food");
  const restaurantCount = new Set(foodItems.map((i) => i.restaurantId)).size;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const getCartCount = useCallback((domain: string) => {
    const domainItems = items.filter(i => i.section === domain || (domain === 'store' && i.section === 'essentials'));
    return new Set(domainItems.map(i => i.restaurantId)).size;
  }, [items]);

  const itemQty = useCallback(
    (id: number, restaurantId: string) => {
      const uid = `${restaurantId}__${id}`;
      return items.find((i) => i.uid === uid)?.quantity ?? 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items, addItem, removeItem, updateQty, clearCart, clearVendorCart,
        restaurantCount, totalItems, totalPrice, itemQty, getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
