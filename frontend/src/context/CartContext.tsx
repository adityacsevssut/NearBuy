"use client";

import {
  createContext, useContext, useState,
  useCallback, useEffect, ReactNode
} from "react";

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
  section: "food" | "essentials";
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity" | "uid">, qty?: number) => void;
  removeItem: (uid: string) => void;
  updateQty: (uid: string, qty: number) => void;
  clearCart: () => void;
  restaurantCount: number;   // unique restaurants (shown as badge)
  totalItems: number;        // total quantity across all items
  totalPrice: number;
  itemQty: (id: number, restaurantId: string) => number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "nearbuy_cart_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  // Persist to localStorage whenever items change (after first load)
  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, loaded]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity" | "uid">, qty = 1) => {
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
    []
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

  const foodItems = items.filter((i) => i.section === "food");
  const restaurantCount = new Set(foodItems.map((i) => i.restaurantId)).size;
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

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
        items, addItem, removeItem, updateQty, clearCart,
        restaurantCount, totalItems, totalPrice, itemQty,
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
