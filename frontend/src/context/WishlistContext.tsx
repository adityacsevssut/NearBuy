"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type WishlistedRestaurant = {
  id: string;
  name: string;
  type: string;
  image_url: string;
  rating: string;
  distance: string;
  isClosed: boolean;
};

export type WishlistedFood = {
  id: string;
  name: string;
  price: number;
  actual_price?: number;
  type: string;
  badge: string;
  description: string;
  image_url: string;
  rating: string;
  prep_time: string;
  reviews: string;
  restaurantId: string;
  restaurantName: string;
  is_available?: boolean;
  isClosed?: boolean;
};

type WishlistContextType = {
  restaurantWishlist: WishlistedRestaurant[];
  foodWishlist: WishlistedFood[];
  toggleRestaurant: (restaurant: WishlistedRestaurant) => void;
  toggleFood: (food: WishlistedFood) => void;
  isRestaurantWished: (id: string) => boolean;
  isFoodWished: (id: string) => boolean;
  syncWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, openLoginModal } = useAuth();
  const [restaurantWishlist, setRestaurantWishlist] = useState<WishlistedRestaurant[]>([]);
  const [foodWishlist, setFoodWishlist] = useState<WishlistedFood[]>([]);

  useEffect(() => {
    const savedRest = localStorage.getItem("nb_rest_wishlist");
    const savedFood = localStorage.getItem("nb_food_wishlist");
    if (savedRest) setRestaurantWishlist(JSON.parse(savedRest));
    if (savedFood) setFoodWishlist(JSON.parse(savedFood));
  }, []);

  useEffect(() => {
    localStorage.setItem("nb_rest_wishlist", JSON.stringify(restaurantWishlist));
  }, [restaurantWishlist]);

  useEffect(() => {
    localStorage.setItem("nb_food_wishlist", JSON.stringify(foodWishlist));
  }, [foodWishlist]);

  const toggleRestaurant = (restaurant: WishlistedRestaurant) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setRestaurantWishlist(prev => {
      const exists = prev.some(r => r.id === restaurant.id);
      if (exists) return prev.filter(r => r.id !== restaurant.id);
      return [...prev, restaurant];
    });
  };

  const toggleFood = (food: WishlistedFood) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    setFoodWishlist(prev => {
      const exists = prev.some(f => f.id === food.id);
      if (exists) return prev.filter(f => f.id !== food.id);
      return [...prev, food];
    });
  };

  const syncWishlist = async () => {
    if (restaurantWishlist.length === 0 && foodWishlist.length === 0) return;
    
    try {
      const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const res = await fetch(`${API}/api/public/wishlist-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantIds: restaurantWishlist.map(r => r.id),
          foodIds: foodWishlist.map(f => f.id)
        })
      });

      if (res.ok) {
        const { restaurants, foods } = await res.json();
        
        let restsChanged = false;
        const newRests = restaurantWishlist.map(r => {
          const fresh = restaurants[r.id];
          if (fresh && fresh.is_open === r.isClosed) {
            restsChanged = true;
            return { ...r, isClosed: !fresh.is_open };
          }
          return r;
        });
        if (restsChanged) setRestaurantWishlist(newRests);

        let foodsChanged = false;
        const newFoods = foodWishlist.map(f => {
          const fresh = foods[f.id];
          if (fresh) {
            let updatedF = { ...f };
            let changed = false;
            
            if (fresh.is_available !== (f.is_available !== false)) {
              updatedF.is_available = fresh.is_available;
              changed = true;
            }
            if (!fresh.is_open !== (f.isClosed === true)) {
              updatedF.isClosed = !fresh.is_open;
              changed = true;
            }
            
            if (changed) {
              foodsChanged = true;
              return updatedF;
            }
          }
          return f;
        });
        if (foodsChanged) setFoodWishlist(newFoods);
      }
    } catch (err) {
      console.error("Failed to sync wishlist", err);
    }
  };

  const isRestaurantWished = (id: string) => restaurantWishlist.some(r => r.id === id);
  const isFoodWished = (id: string) => foodWishlist.some(f => f.id === id);

  return (
    <WishlistContext.Provider value={{
      restaurantWishlist, foodWishlist, toggleRestaurant, toggleFood, isRestaurantWished, isFoodWished, syncWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
};
