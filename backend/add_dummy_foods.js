require('dotenv').config();
const pool = require('./config/db');

async function addDummyFoods() {
  try {
    const { rows: vendors } = await pool.query("SELECT user_id FROM vendor_profiles");
    
    if (vendors.length === 0) {
      console.log("No vendors found.");
      return;
    }

    const dummyFoods = [
      {
        category: "Main Course",
        name: "Special Veg Biryani",
        description: "Aromatic basmati rice cooked with fresh vegetables and secret spices.",
        price: 150,
        actual_price: 180,
        type: "veg",
        badge: "Bestseller",
        image_url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&h=400",
        is_available: true,
        front_page_category: "Biryani",
        sort_order: 1,
        rating: 4.5,
        prep_time: "20 min",
        reviews: 120
      },
      {
        category: "Main Course",
        name: "Chicken Tikka Masala",
        description: "Tender chicken pieces cooked in a rich, creamy tomato gravy.",
        price: 250,
        actual_price: 280,
        type: "non-veg",
        badge: "Must Try",
        image_url: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=600&h=400",
        is_available: true,
        front_page_category: "Indian",
        sort_order: 2,
        rating: 4.8,
        prep_time: "25 min",
        reviews: 200
      },
      {
        category: "Starters",
        name: "Paneer Tikka",
        description: "Marinated cottage cheese cubes grilled to perfection.",
        price: 180,
        actual_price: null,
        type: "veg",
        badge: "",
        image_url: "https://images.unsplash.com/photo-1599487405270-20120150d032?auto=format&fit=crop&w=600&h=400",
        is_available: true,
        front_page_category: "Indian",
        sort_order: 3,
        rating: 4.2,
        prep_time: "15 min",
        reviews: 80
      },
      {
        category: "Desserts",
        name: "Chocolate Brownie",
        description: "Warm chocolate brownie served with vanilla ice cream.",
        price: 120,
        actual_price: 150,
        type: "veg",
        badge: "New",
        image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&h=400",
        is_available: true,
        front_page_category: "Desserts",
        sort_order: 4,
        rating: 4.6,
        prep_time: "10 min",
        reviews: 150
      },
      {
        category: "Beverages",
        name: "Mango Lassi",
        description: "Refreshing yogurt-based mango drink.",
        price: 80,
        actual_price: null,
        type: "veg",
        badge: "",
        image_url: "https://images.unsplash.com/photo-1615486171448-4fd0d8e8a32a?auto=format&fit=crop&w=600&h=400",
        is_available: true,
        front_page_category: "Beverages",
        sort_order: 5,
        rating: 4.3,
        prep_time: "5 min",
        reviews: 90
      }
    ];

    let count = 0;
    for (const vendor of vendors) {
      for (const food of dummyFoods) {
        await pool.query(
          `INSERT INTO vendor_menu_items (
            vendor_id, category, name, description, price, actual_price, type, badge, image_url, is_available, front_page_category, sort_order, rating, prep_time, reviews
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            vendor.user_id,
            food.category,
            food.name,
            food.description,
            food.price,
            food.actual_price,
            food.type,
            food.badge,
            food.image_url,
            food.is_available,
            food.front_page_category,
            food.sort_order,
            food.rating,
            food.prep_time,
            food.reviews
          ]
        );
        count++;
      }
    }

    console.log(`Successfully added ${count} dummy foods across ${vendors.length} vendors.`);

  } catch (err) {
    console.error("Error inserting dummy foods:", err);
  } finally {
    pool.end();
  }
}

addDummyFoods();
