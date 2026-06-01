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

/**
 * Send an OTP email with Quota & Fallback logic
 * @param {string} to - recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} purpose - "verify" | "reset"
 */
async function sendOtpEmail(to, otp, purpose = "verify") {
  const subjectMap = {
    verify: "NearBuy – Verify Your Email",
    reset: "NearBuy – Reset Your Password",
  };

  const bodyMap = {
    verify: `Your OTP to verify your NearBuy account is: <b>${otp}</b>. It expires in 10 minutes.`,
    reset: `Your OTP to reset your NearBuy password is: <b>${otp}</b>. It expires in 10 minutes.`,
  };

  const htmlContent = `
      <div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px;background:#fff;border-radius:16px;border:1px solid #f1f1f1;">
        <div style="text-align:center;margin-bottom:24px;">
          <span style="font-size:28px;font-weight:900;letter-spacing:-1px;">
            <span style="color:#f97316;">Near</span><span style="color:#111;">Buy</span>
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
    from: `"${process.env.SMTP_FROM_NAME || "NearBuy"}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: subjectMap[purpose] || "NearBuy OTP",
    html: htmlContent,
  };

  const brevoQuota = parseInt(process.env.BREVO_QUOTA || "300");
  const sendgridQuota = parseInt(process.env.SENDGRID_QUOTA || "100");

  // Fetch or create today's quota row securely
  const { rows } = await pool.query(`
    INSERT INTO daily_email_quotas (date, brevo_count, sendgrid_count)
    VALUES (CURRENT_DATE, 0, 0)
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
      // If Brevo fails for some other reason, it will naturally fall through to SendGrid
    }
  }

  // Fallback to SendGrid
  if (currentQuota.sendgrid_count < sendgridQuota) {
    try {
      mailOptions.from = `"${process.env.SMTP_FROM_NAME || "NearBuy"}" <${process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL}>`;
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

// We only export the function now, exporting the transporter is no longer needed 
// since we handle the transporter logic internally based on quotas.
module.exports = { sendOtpEmail };
