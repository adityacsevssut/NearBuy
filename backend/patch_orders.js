const fs = require('fs');

let content = fs.readFileSync('routes/orders.js', 'utf-8');

// 1. Add Razorpay and Crypto requires
if (!content.includes('const Razorpay')) {
  content = content.replace(
    /const express = require\("express"\);/,
    `const express = require("express");\nconst Razorpay = require("razorpay");\nconst crypto = require("crypto");`
  );
}

// 2. Add /create-razorpay-order route
if (!content.includes('/create-razorpay-order')) {
  const razorpayRoute = `
// POST /api/orders/create-razorpay-order
router.post("/create-razorpay-order", authenticate, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Razorpay keys not configured" });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: "receipt_order_" + Date.now(),
    };

    const order = await instance.orders.create(options);
    if (!order) return res.status(500).send("Some error occurred");

    res.json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).send("Error creating Razorpay order");
  }
});

`;
  
  content = content.replace(
    /\/\/ POST \/api\/orders\n\/\/ Create a new order/,
    razorpayRoute + `// POST /api/orders\n// Create a new order`
  );
}

// 3. Update POST /api/orders to verify signature and insert fields
const originalInsertCode = `const { rows } = await pool.query(
        \`INSERT INTO orders (
          user_id, vendor_id, items, subtotal, gst, platform_fee, total_amount, payment_method, delivery_address,
          customer_mobile, alternate_mobile, cooking_instructions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *\`,
        [
          req.user.id,
          vendor_id,
          JSON.stringify(items),
          subtotal,
          gst,
          platform_fee,
          total_amount,
          payment_method,
          JSON.stringify(delivery_address),
          customer_mobile,
          alternate_mobile || "",
          cooking_instructions || ""
        ]
      );`;

const newInsertCode = `let finalPaymentStatus = 'Pending';
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
      }

      const { rows } = await pool.query(
        \`INSERT INTO orders (
          user_id, vendor_id, items, subtotal, gst, platform_fee, total_amount, payment_method, delivery_address,
          customer_mobile, alternate_mobile, cooking_instructions, razorpay_order_id, razorpay_payment_id, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *\`,
        [
          req.user.id,
          vendor_id,
          JSON.stringify(items),
          subtotal,
          gst,
          platform_fee,
          total_amount,
          payment_method,
          JSON.stringify(delivery_address),
          customer_mobile,
          alternate_mobile || "",
          cooking_instructions || "",
          req.body.razorpay_order_id || null,
          req.body.razorpay_payment_id || null,
          finalPaymentStatus
        ]
      );`;

if (!content.includes('crypto.createHmac("sha256"')) {
  content = content.replace(originalInsertCode, newInsertCode);
}

fs.writeFileSync('routes/orders.js', content);
console.log('Successfully patched routes/orders.js');
