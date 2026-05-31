const pool = require("../config/db");
const socketUtil = require("./socket");

async function sendNotification(userId, title, message, type) {
  try {
    // 1. Save to database
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, message, type]
    );

    const notification = rows[0];

    // 2. Emit real-time event via Socket.io
    try {
      const io = socketUtil.getIO();
      // Emits to the specific user's room
      io.to(`user_${userId}`).emit("notification", notification);
    } catch (socketErr) {
      console.warn("Socket.io emit failed (server might not be initialized):", socketErr.message);
    }

    // 3. Firebase Push Notification
    try {
      const { admin, initialized } = require("../config/firebase");
      
      if (initialized) {
        // Find all FCM tokens for this user
        const tokensRes = await pool.query(
          `SELECT token FROM fcm_tokens WHERE user_id = $1`,
          [userId]
        );
        
        if (tokensRes.rows.length > 0) {
          const tokens = tokensRes.rows.map(row => row.token);
          
          const messagePayload = {
            notification: {
              title: title,
              body: message
            },
            data: {
              type: type,
              id: notification.id.toString(),
              url: "/food/orders" // Example deep link
            },
            tokens: tokens
          };
          
          const response = await admin.messaging().sendEachForMulticast(messagePayload);
          console.log(`FCM Sent: ${response.successCount} successful, ${response.failureCount} failed.`);
          
          // Cleanup invalid tokens
          if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                if (resp.error.code === 'messaging/invalid-registration-token' ||
                    resp.error.code === 'messaging/registration-token-not-registered') {
                  failedTokens.push(tokens[idx]);
                }
              }
            });
            if (failedTokens.length > 0) {
              await pool.query(
                `DELETE FROM fcm_tokens WHERE token = ANY($1)`,
                [failedTokens]
              );
              console.log(`Cleaned up ${failedTokens.length} invalid FCM tokens.`);
            }
          }
        }
      }
    } catch (fcmErr) {
      console.error("Firebase FCM push failed:", fcmErr);
    }

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    // Don't throw, we don't want to break the main flow (like placing an order) if notification fails
  }
}

module.exports = {
  sendNotification,
};
