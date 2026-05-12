const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Gmail App Password
  },
  pool: true,
  maxConnections: 5,
});

/**
 * Send an OTP email
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

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || "NearBuy"}" <${process.env.SMTP_USER}>`,
    to,
    subject: subjectMap[purpose] || "NearBuy OTP",
    html: `
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
    `,
  });
}

module.exports = { transporter, sendOtpEmail };
