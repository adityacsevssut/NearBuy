export const quickBites = [
  { label: "Biryani", image: "/biryani_new.jpg" },
  { label: "Roll", image: "/roll_new.jpg" },
  { label: "Dosa", image: "/dosa_new.jpg" },
  { label: "Chowmin", image: "/chowmin_gemini.png" },
  { label: "Momo", image: "/momo_gemini.png" },
  { label: "Pizza", image: "/pizza_gemini.png" },
  { label: "Burger", image: "/burger_new.jpg" },
  { label: "Chicken Kabab", image: "/kebab_new.jpg" },
  { label: "Pasta", image: "/pasta_new.jpg" },
  { label: "Sandwich", image: "/sandwich_new.jpg" },
  { label: "Chicken Pokoda", image: "/pakoda_new.jpg" },
  { label: "Vada", image: "/vada_new.jpg" },
  { label: "Manchurrian", image: "/manchurian_new.jpg" },
  { label: "Bakery", image: "/bakery_new.jpg" },
  { label: "Drinks", image: "/drinks_new.jpg" },
  { label: "Chole Bhature", image: "/chole_bhature_new.jpg" },
  { label: "Samosa", image: "/samosa_gemini.png" },
  { label: "Chicken", image: "/chicken_gemini.png" },
  { label: "Paneer", image: "/paneer_gemini.png" },
  { label: "Mutton", image: "/mutton_gemini.png" },
  { label: "Rice", image: "/rice_gemini.png" },
  { label: "Roti", image: "/roti_gemini.png" },
  { label: "Naan", image: "/naan_gemini.png" },
  { label: "Others", image: "/others_gemini.png" },
];

export const storeCategories = [
  { id: "all", label: "All", emoji: "🛒" },
  { id: "stationery", label: "Student Stationary", emoji: "✏️" },
  { id: "tech", label: "Electronic Gadgets", emoji: "🔌" },
  { id: "snacks", label: "Snacks & Beverages", emoji: "🍫" },
  { id: "hostel", label: "Hostel Essentials", emoji: "🛏️" },
  { id: "personal_care", label: "Daily Need", emoji: "🧴" },
];

export const storeSubcategories: Record<string, { id: string, label: string }[]> = {
  stationery: [
    { id: "basic_stationery", label: "Basic Stationary" },
    { id: "notebook", label: "Note Book" },
    { id: "lab_record", label: "Lab Record" },
    { id: "lab_apron", label: "Lab Apron" },
    { id: "calc", label: "Scientific calculator" },
    { id: "art_craft", label: "Art and Craft" },
    { id: "study_acc", label: "Study Accesories" },
    { id: "printing", label: "Printing And Project Supplies" },
    { id: "others", label: "Others" }
  ],
  tech: [
    { id: "charger", label: "Charger" },
    { id: "extension_board", label: "Extension Board" },
    { id: "small_fans", label: "Wired Small fans" },
    { id: "study_lamp", label: "Study lamp" },
    { id: "other", label: "Other Devices" }
  ],
  snacks: [
    { id: "biscuit", label: "Biscuit" },
    { id: "namkeen", label: "Namkeen Mix" },
    { id: "chatua", label: "Chatua" },
    { id: "chips", label: "Snacks And Chips" },
    { id: "sprite", label: "Sprite" },
    { id: "pepsi", label: "Pepsi" },
    { id: "thumsup", label: "Thumsup" },
    { id: "other_drinks", label: "Other Drinks" },
    { id: "other_snacks", label: "Other Snacks" }
  ],
  hostel: [
    { id: "bedsheet", label: "Bedsheet" },
    { id: "pillow_cover", label: "Pillow Cover" },
    { id: "bolster_pillow", label: "Bolster Pillow" },
    { id: "bucket", label: "Bucket" },
    { id: "mug", label: "Mug" },
    { id: "umbrella", label: "Umbrella" },
    { id: "hanger", label: "Hanger" },
    { id: "lock_key", label: "Lock and Key" },
    { id: "others", label: "Others" }
  ],
  personal_care: [
    { id: "handwash", label: "Handwash" },
    { id: "perfume", label: "Perfume" },
    { id: "daily_needs", label: "Daily Needs" },
    { id: "good_knight", label: "Good knight stick" },
    { id: "others", label: "Others" }
  ]
};
