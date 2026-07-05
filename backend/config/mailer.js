const nodemailer = require("nodemailer");
const pool = require("./db"); // Require the DB pool to track limits

// 1. Primary SMTP: Brevo (formerly Sendinblue)
const brevoTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Fallback SMTP: SendGrid
const sendgridTransporter = nodemailer.createTransport({
  host: process.env.SENDGRID_SMTP_HOST || "smtp.sendgrid.net",
  port: parseInt(process.env.SENDGRID_SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SENDGRID_SMTP_USER || "apikey",
    pass: process.env.SENDGRID_SMTP_PASS,
  },
});

// 3. ZeptoMail SMTP (Used for Welcome and Order Delivered emails)
const zeptoTransporter = nodemailer.createTransport({
  host: process.env.ZEPTOMAIL_SMTP_HOST || "smtp.zeptomail.in",
  port: parseInt(process.env.ZEPTOMAIL_SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.ZEPTOMAIL_SMTP_USER,
    pass: process.env.ZEPTOMAIL_SMTP_PASS,
  },
});

/**
 * Send an OTP email with Quota & Fallback logic
 */
async function sendOtpEmail(to, otp, purpose = "verify") {
  const subjectMap = {
    verify: "ZyphCart – Verify Your Email",
    reset: "ZyphCart – Reset Your Password",
  };

  const bodyMap = {
    verify: `Your OTP to verify your ZyphCart account is: <b>${otp}</b>. It expires in 10 minutes.`,
    reset: `Your OTP to reset your ZyphCart password is: <b>${otp}</b>. It expires in 10 minutes.`,
  };

  const htmlContent = `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #f1f1f1;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:28px;font-weight:900;letter-spacing:-1px;">
            <span style="color:#f97316;">Zyph</span><span style="color:#111;">Cart</span>
          </span>
        </div>
        <h2 style="font-size:20px;font-weight:700;color:#111;margin-bottom:8px;">${subjectMap[purpose]}</h2>
        <p style="color:#555;font-size:15px;margin-bottom:24px;">${bodyMap[purpose]}</p>
        <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#ea580c;">${otp}</span>
        </div>
        <p style="color:#aaa;font-size:12px;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "ZyphCart"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: subjectMap[purpose] || "ZyphCart OTP",
    html: htmlContent,
  };

  const brevoQuota = parseInt(process.env.BREVO_QUOTA || "300");
  const sendgridQuota = parseInt(process.env.SENDGRID_QUOTA || "100");

  const { rows } = await pool.query(`
    INSERT INTO daily_email_quotas (date, brevo_count, sendgrid_count, zepto_count)
    VALUES (CURRENT_DATE, 0, 0, 0)
    ON CONFLICT (date) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `);
  
  const currentQuota = rows[0];

  // Try Brevo first
  if (currentQuota.brevo_count < brevoQuota) {
    try {
      await brevoTransporter.sendMail(mailOptions);
      await pool.query('UPDATE daily_email_quotas SET brevo_count = brevo_count + 1 WHERE date = CURRENT_DATE');
      return;
    } catch (err) {
      console.error("Brevo sending failed, attempting fallback:", err.message);
    }
  }

  // Fallback to SendGrid
  if (currentQuota.sendgrid_count < sendgridQuota) {
    try {
      mailOptions.from = `"${process.env.SMTP_FROM_NAME || "ZyphCart"}" <${process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL}>`;
      await sendgridTransporter.sendMail(mailOptions);
      await pool.query('UPDATE daily_email_quotas SET sendgrid_count = sendgrid_count + 1 WHERE date = CURRENT_DATE');
      return;
    } catch (err) {
      console.error("SendGrid fallback failed:", err.message);
      throw new Error("Failed to send email via both primary and fallback servers.", { cause: err });
    }
  }

  throw new Error("Daily email quota exceeded across all providers.");
}

/**
 * Send Welcome Email via ZeptoMail on successful Signup
 */
async function sendWelcomeEmail(to, firstName) {
  const zeptoQuota = parseInt(process.env.ZEPTO_QUOTA || "100");
  
  const { rows } = await pool.query(`
    INSERT INTO daily_email_quotas (date, brevo_count, sendgrid_count, zepto_count)
    VALUES (CURRENT_DATE, 0, 0, 0)
    ON CONFLICT (date) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `);
  
  const currentQuota = rows[0];
  if (currentQuota.zepto_count >= zeptoQuota) {
    console.warn("ZeptoMail daily quota reached. Welcome email not sent.");
    return; // Fail silently so we don't break signup
  }

  const htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #f1f1f1;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:900;letter-spacing:-1px;">
          <span style="color:#f97316;">Zyph</span><span style="color:#111;">Cart</span>
        </span>
      </div>
      <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:12px;text-align:center;">Welcome To ZyphCart!</h2>
      <p style="color:#555;font-size:16px;margin-bottom:24px;text-align:center;line-height:1.5;">
        Hi ${firstName || 'there'},<br/><br/>
        Explore Your Nearest Market right from your screen. Fast delivery, great deals, and endless choices await!
      </p>
      
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:32px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/food" style="background:linear-gradient(160deg, #f97316 0%, #ea580c 100%);color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;box-shadow:0 4px 14px rgba(249, 115, 22, 0.35);text-align:center;flex:1;">Explore Food</a>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/store" style="background:#111;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;text-align:center;flex:1;">Explore Essentials</a>
      </div>
      <p style="color:#aaa;font-size:12px;text-align:center;">Thank you for joining our community.</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "ZyphCart"}" <${process.env.ZEPTOMAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: "Welcome to ZyphCart!",
    html: htmlContent,
  };

  try {
    await zeptoTransporter.sendMail(mailOptions);
    await pool.query('UPDATE daily_email_quotas SET zepto_count = zepto_count + 1 WHERE date = CURRENT_DATE');
  } catch (err) {
    console.error("ZeptoMail sending failed for welcome email:", err.message);
  }
}

/**
 * Send Order Delivered Email via ZeptoMail
 */
async function sendOrderDeliveredEmail(to, orderData, userDetails) {
  const zeptoQuota = parseInt(process.env.ZEPTO_QUOTA || "100");
  
  const { rows } = await pool.query(`
    INSERT INTO daily_email_quotas (date, brevo_count, sendgrid_count, zepto_count)
    VALUES (CURRENT_DATE, 0, 0, 0)
    ON CONFLICT (date) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `);
  
  const currentQuota = rows[0];
  if (currentQuota.zepto_count >= zeptoQuota) {
    console.warn("ZeptoMail daily quota reached. Order delivered email not sent.");
    return; // Fail silently so we don't break delivery status update
  }

  // Generate Items list HTML
  let itemsHtml = '';
  if (orderData.items && Array.isArray(orderData.items)) {
    itemsHtml = orderData.items.map(item => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
        <div>
          <span style="font-weight:bold;color:#333;">${item.item_name}</span>
          <br/><span style="color:#777;font-size:12px;">Qty: ${item.quantity}</span>
        </div>
        <div style="font-weight:bold;color:#111;">₹${item.price}</div>
      </div>
    `).join('');
  } else if (orderData.items && typeof orderData.items === 'string') {
    try {
      const parsedItems = JSON.parse(orderData.items);
      itemsHtml = parsedItems.map(item => `
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
          <div>
            <span style="font-weight:bold;color:#333;">${item.item_name}</span>
            <br/><span style="color:#777;font-size:12px;">Qty: ${item.quantity}</span>
          </div>
          <div style="font-weight:bold;color:#111;">₹${item.price}</div>
        </div>
      `).join('');
    } catch (e) {
      console.error("Failed to parse items json in email:", e);
    }
  }

  const htmlContent = `
    <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #f1f1f1;">
      <div style="text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;font-weight:900;letter-spacing:-1px;">
          <span style="color:#f97316;">Zyph</span><span style="color:#111;">Cart</span>
        </span>
      </div>
      <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:8px;text-align:center;">Order Delivered! 🎉</h2>
      <p style="color:#555;font-size:15px;margin-bottom:24px;text-align:center;">
        Hi ${userDetails.first_name || 'there'}, your order <b>#${orderData.id}</b> has been successfully delivered.
      </p>
      
      <div style="background:#fafafa;border-radius:12px;padding:20px;margin-bottom:24px;">
        <h3 style="font-size:16px;margin-top:0;margin-bottom:12px;color:#111;">Order Receipt</h3>
        ${itemsHtml}
        <div style="display:flex;justify-content:space-between;padding-top:12px;margin-top:12px;border-top:2px solid #ddd;font-size:18px;font-weight:900;">
          <span>Total Paid</span>
          <span style="color:#f97316;">₹${orderData.total_price}</span>
        </div>
      </div>

      <div style="background:#fff7ed;border-radius:12px;padding:16px;margin-bottom:24px;">
        <h3 style="font-size:14px;margin-top:0;margin-bottom:8px;color:#ea580c;">Delivery Address</h3>
        <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">${orderData.delivery_address || 'As per your profile'}</p>
      </div>

      <p style="color:#aaa;font-size:12px;text-align:center;">Enjoy your items! We hope to see you again soon.</p>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || "ZyphCart"}" <${process.env.ZEPTOMAIL_FROM_EMAIL || process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `Order #${orderData.id} Delivered - ZyphCart`,
    html: htmlContent,
  };

  try {
    await zeptoTransporter.sendMail(mailOptions);
    await pool.query('UPDATE daily_email_quotas SET zepto_count = zepto_count + 1 WHERE date = CURRENT_DATE');
  } catch (err) {
    console.error("ZeptoMail sending failed for order delivered email:", err.message);
  }
}

module.exports = { sendOtpEmail, sendWelcomeEmail, sendOrderDeliveredEmail };
