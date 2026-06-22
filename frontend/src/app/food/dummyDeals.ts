export const dummyHotDealsUnder50 = Array.from({ length: 30 }, (_, i) => ({
  id: `d50-${i}`,
  name: ["Veg Burger", "Aloo Samosa", "Cold Coffee", "French Fries", "Masala Dosa", "Chicken Roll"][i % 6] + ` ${i + 1}`,
  image: ["/burger_gemini.png", "/samosa_gemini.png", "/drinks_blue_mojito.png", "/pizza_gemini.png", "/dosa.png", "/roll.png"][i % 6],
  originalPrice: Math.floor(Math.random() * 30) + 60,
  discountPrice: Math.floor(Math.random() * 20) + 30,
  rating: (Math.random() * 1 + 4).toFixed(1),
  restaurantName: `Restaurant ${i + 1}`,
  restaurantId: i < 5 ? 'rest-123' : `rest-d50-${i}`,
}));

export const dummyHotDealsUnder100 = Array.from({ length: 30 }, (_, i) => ({
  id: `d100-${i}`,
  name: ["Chicken Biryani", "Paneer Tikka", "Hakka Noodles", "Cheese Pizza", "Special Thali", "Mutton Kabab"][i % 6] + ` ${i + 1}`,
  image: ["/biryani_gemini.png", "/chowmin_gemini.png", "/chicken_kabab.png", "/momo_gemini.png", "/pasta.png", "/sandwich.png"][i % 6],
  originalPrice: Math.floor(Math.random() * 50) + 120,
  discountPrice: Math.floor(Math.random() * 30) + 70,
  rating: (Math.random() * 1 + 4).toFixed(1),
  restaurantName: `Restaurant ${i + 1}`,
  restaurantId: i < 5 ? 'rest-123' : `rest-d100-${i}`,
}));
