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
};

type WishlistContextType = {
  restaurantWishlist: WishlistedRestaurant[];
  foodWishlist: WishlistedFood[];
  toggleRestaurant: (restaurant: WishlistedRestaurant) => void;
  toggleFood: (food: WishlistedFood) => void;
  isRestaurantWished: (id: string) => boolean;
  isFoodWished: (id: string) => boolean;
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

  const isRestaurantWished = (id: string) => restaurantWishlist.some(r => r.id === id);
  const isFoodWished = (id: string) => foodWishlist.some(f => f.id === id);

  return (
    <WishlistContext.Provider value={{
      restaurantWishlist, foodWishlist, toggleRestaurant, toggleFood, isRestaurantWished, isFoodWished
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
