const fs = require('fs');

let content = fs.readFileSync('routes/orders.js', 'utf8');

const helperCode = `
// Generalized helper to auto-generate refund request and optionally trigger Razorpay auto-refund
async function handleAutomatedRefundRequest(pool, order, reqUserId) {
  const isOwedRefund = order.advance_paid || order.payment_status === 'paid';
  if (!isOwedRefund) return;

  try {
    const userQ = await pool.query(\`SELECT manager_type FROM users WHERE id = $1\`, [order.vendor_id]);
    const reqType = userQ.rows[0]?.manager_type || 'general';
    const customerQ = await pool.query(\`SELECT first_name, last_name, email FROM users WHERE id = $1\`, [order.user_id]);
    const customer = customerQ.rows[0] || {};
    const userName = \`\${customer.first_name || ''} \${customer.last_name || ''}\`.trim() || 'User';

    const insertRefund = await pool.query(
      \`INSERT INTO refund_requests (user_id, email, order_id, user_name, type, status) VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING id\`,
      [order.user_id, customer.email || '', order.id, userName, reqType]
    );
    const refundReqId = insertRefund.rows[0].id;

    if (order.advance_paid && order.adv_payment_id && order.advance_fee > 0) {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const instance = new require('razorpay')({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
        const refundAmount = Math.round(Number(order.advance_fee) * 100);
        console.log(\`Triggering automated refund for order \${order.id}: ₹\${refundAmount / 100}\`);
        await instance.payments.refund(order.adv_payment_id, { amount: refundAmount, speed: "normal" });
        
        await pool.query(\`UPDATE orders SET adv_refund_processed = true WHERE id = $1\`, [order.id]);
        await pool.query(\`UPDATE refund_requests SET status = 'Completed' WHERE id = $1\`, [refundReqId]);
      }
    }
  } catch(err) {
    console.error("Auto refund request err:", err);
  }
}
`;

// Insert the helper at the top (after line 10 or so)
const poolIndex = content.indexOf('const pool = require("../config/db");');
if (poolIndex !== -1) {
  const nextLineIndex = content.indexOf('\n', poolIndex) + 1;
  content = content.substring(0, nextLineIndex) + helperCode + content.substring(nextLineIndex);
}

// In /:id/cancel, replace the old Automated Refund Logic with the new helper call
const cancelBlockStart = content.indexOf('    // Automated Refund Logic');
const cancelBlockEnd = content.indexOf('    // Notify vendor', cancelBlockStart);

if (cancelBlockStart !== -1 && cancelBlockEnd !== -1) {
  content = content.substring(0, cancelBlockStart) + `
    // Generate refund request & auto-refund
    await handleAutomatedRefundRequest(pool, { ...checkResult.rows[0], id: req.params.id }, req.user.id);
    
` + content.substring(cancelBlockEnd);
}

// In /:id/cancel-request/respond, after updating status to 'Cancelled', call the helper
const approveBlock = content.indexOf(`UPDATE orders SET status = 'Cancelled', cancel_request_status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *\`,
        [req.params.id]
      );`);
if (approveBlock !== -1) {
  const insertIndex = approveBlock + `UPDATE orders SET status = 'Cancelled', cancel_request_status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *\`,
        [req.params.id]
      );`.length;
  content = content.substring(0, insertIndex) + `
      
      const checkFullQuery = await pool.query(\`SELECT * FROM orders WHERE id = $1\`, [req.params.id]);
      await handleAutomatedRefundRequest(pool, checkFullQuery.rows[0], order.user_id);
` + content.substring(insertIndex);
}

fs.writeFileSync('routes/orders.js', content, 'utf8');
console.log('Fixed orders.js');
