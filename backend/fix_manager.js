const fs = require('fs');

const filePath = 'd:/Git Repo NearBuy/NearBuy/backend/routes/manager.js';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/\s*GET \/api\/managers\/vendors\/:vendorId\/orders[\s\S]*?Failed to fetch vendor orders\." \}\);\s*\}\s*\n\}\);/g;

const replacement = `// GET /api/managers/vendors/:vendorId/orders
// Returns orders for a specific vendor on a specific date, optionally filtered by status
// ====================================================================
router.get("/vendors/:vendorId/orders", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { vendorId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const status = req.query.status ? req.query.status.toLowerCase() : null;

    let query = \`
      SELECT o.id, o.status, o.total_amount, o.payment_method, o.payment_status, o.advance_paid, o.advance_fee, o.adv_refund_processed, u.first_name, u.last_name, o.created_at
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = $1 AND DATE(o.created_at) = $2
    \`;
    let params = [vendorId, date];

    if (status) {
      query += \` AND LOWER(o.status) = $3\`;
      params.push(status);
    }

    query += \` ORDER BY o.created_at DESC\`;

    const { rows } = await pool.query(query, params);
    return res.json({ orders: rows });
  } catch (err) {
    console.error("vendor orders error:", err);
    return res.status(500).json({ error: "Failed to fetch vendor orders." });
  }
});`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully fixed manager.js");
} else {
    console.log("Could not find the broken block in manager.js");
}
