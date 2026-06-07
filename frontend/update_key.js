const fs = require("fs");
const file = "src/app/food/cart/page.tsx";
let content = fs.readFileSync(file, "utf8");
content = content.replace(/"rzp_test_YOUR_KEY_ID"/g, '"rzp_test_SyPFlFXJf4zf14"');
fs.writeFileSync(file, content);
console.log("Updated Razorpay key in frontend.");
