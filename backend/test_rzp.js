const Razorpay = require("razorpay");
const instance = new Razorpay({ 
  key_id: "rzp_test_T0DIaxckZRKMf0", 
  key_secret: "82Kx5SC7z3tLTjGmAAjD14H7" 
});

instance.orders.create({
  amount: 100,
  currency: "INR",
  receipt: "receipt_order_" + Date.now(),
}).then(order => console.log("Success:", order))
  .catch(err => console.error("Error:", err));
