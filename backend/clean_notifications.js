require("dotenv").config();
const pool = require("./config/db");

async function cleanOldNotifications() {
  try {
    // Remove emojis and add !!! if missing
    await pool.query(`
      UPDATE notifications 
      SET title = REPLACE(REPLACE(REPLACE(REPLACE(title, '🎉', ''), '🛎️', ''), '✅', ''), '🎁', '');
      
      UPDATE notifications 
      SET title = REPLACE(title, '❌', '');
      
      UPDATE notifications 
      SET title = TRIM(title);
      
      UPDATE notifications
      SET title = title || ' !!!'
      WHERE title NOT LIKE '%!!!' AND title IN ('Order Placed successfully!', 'New Order Received!', 'Order Confirmed!', 'Out for Delivery!', 'Order Delivered!', 'Order Cancelled');
      
      UPDATE notifications
      SET title = REPLACE(title, 'successfully! !!!', '!!!');
      
      UPDATE notifications
      SET title = REPLACE(title, 'Received! !!!', '!!!');
      
      UPDATE notifications
      SET title = REPLACE(title, 'Confirmed! !!!', 'Confirmed !!!');
      
      UPDATE notifications
      SET title = REPLACE(title, 'Delivery! !!!', 'Delivery !!!');
      
      UPDATE notifications
      SET title = REPLACE(title, 'Delivered! !!!', 'Delivered !!!');
      
      UPDATE notifications
      SET title = REPLACE(title, 'Placed! !!!', 'Placed !!!');
      
      UPDATE notifications
      SET title = 'Order Placed !!!' WHERE title ILIKE '%Order Placed%';
      
      UPDATE notifications
      SET title = 'Order Delivered !!!' WHERE title ILIKE '%Order Delivered%';
    `);
    
    console.log("Database cleaned!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanOldNotifications();
