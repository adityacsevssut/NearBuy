// ════════════════════════════════════════════════════════════════════
// PATCH /api/managers/orders/:id/adv-refund
// Updates the adv_refund_processed status for a cancelled order
// ════════════════════════════════════════════════════════════════════
router.patch("/orders/:id/adv-refund", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const { id } = req.params;
    const { adv_refund_processed } = req.body;

    const { rows } = await pool.query(
      `UPDATE orders SET adv_refund_processed = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [adv_refund_processed, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.json({ message: "Refund status updated", order: rows[0] });
  } catch (err) {
    console.error("update adv refund status error:", err);
    return res.status(500).json({ error: "Failed to update refund status." });
  }
});
