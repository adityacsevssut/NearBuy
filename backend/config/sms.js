/**
 * Fast2SMS OTP Sender
 * Route "otp" sends: "Your OTP is {otp}. Valid for 10 minutes. -FAST2SMS"
 * Free trial: ~₹50 credits (~300 SMS). Top up at fast2sms.com.
 * Only works with Indian mobile numbers (10 digits).
 */
async function sendOtpSms(mobile, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY is not configured on the server.");

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q",
      message: `Your ZyphCart login OTP is ${otp}. Valid for 10 minutes.`,
      language: "english",
      flash: 0,
      numbers: mobile,
    }),
  });

  const data = await response.json();

  if (!data.return) {
    const msg = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "SMS sending failed. Check FAST2SMS_API_KEY and credits.";
    throw new Error(msg);
  }

  return data;
}

module.exports = { sendOtpSms };
