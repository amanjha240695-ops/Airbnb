export const sendOtpEmail = async (toEmail, otpCode) => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.error("❌ [EmailJS Error] Missing EmailJS configuration keys!");
    throw new Error("Email service is not configured");
  }

  // Fallback ke liye multiple common parameter keys provide kiye hain
  const templateParams = {
    to_email: toEmail.trim().toLowerCase(),
    email: toEmail.trim().toLowerCase(),
    otp_code: String(otpCode),
    otp: String(otpCode),
    to_name: toEmail.split("@")[0],
  };

  const payload = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey || undefined,
    template_params: templateParams,
  };

  try {
    console.log(`[EmailJS API] Dispatching OTP (${otpCode}) to: ${toEmail}...`);

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Node.js/Airbnb-Backend",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ [EmailJS API Error Status]:", response.status);
      console.error("❌ [EmailJS API Error Body]:", responseText);
      throw new Error(`Email delivery failed (${response.status}): ${responseText}`);
    }

    console.log(`✅ [EMAIL DELIVERED] EmailJS Response:`, responseText || "OK");
    return { success: true };
  } catch (error) {
    console.error("❌ [Dispatch Error]:", error.message);
    throw error;
  }
};