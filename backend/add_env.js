require("dotenv").config();
const fs = require("fs");
let env = fs.readFileSync(".env", "utf-8");
if (!env.includes("RAZORPAY_KEY_ID")) {
  env += "\n# Razorpay\nRAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID\nRAZORPAY_KEY_SECRET=YOUR_KEY_SECRET\n";
  fs.writeFileSync(".env", env);
}
console.log("Added Razorpay keys to .env");
