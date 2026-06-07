const fs = require('fs');

let content = fs.readFileSync('routes/orders.js', 'utf-8');

const oldCode = `      let finalPaymentStatus = 'Pending';
      if (payment_method === 'online') {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return res.status(400).json({ error: "Missing Razorpay payment details." });
        }
        
        const generated_signature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest("hex");

        if (generated_signature !== razorpay_signature) {
          return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
        }
        finalPaymentStatus = 'Paid';
      }`;

const newCode = `      let finalPaymentStatus = 'Pending';
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
        const generated_signature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(razorpay_order_id + "|" + razorpay_payment_id)
          .digest("hex");

        if (generated_signature !== razorpay_signature) {
          return res.status(400).json({ error: "Payment verification failed. Invalid signature." });
        }
        finalPaymentStatus = 'Tax Paid Online';
      } else if (payment_method === 'online') {
        return res.status(400).json({ error: "Missing Razorpay payment details." });
      }`;

if (content.includes("finalPaymentStatus = 'Paid';")) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('routes/orders.js', content);
  console.log('Successfully updated backend verification logic.');
} else {
  console.log('Could not find the target code to replace.');
}
