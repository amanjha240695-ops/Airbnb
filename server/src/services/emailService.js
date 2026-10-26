export const sendOtpEmail = async (toEmail, otpCode) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error("❌ [Brevo Error] BREVO_API_KEY is missing in environment variables!");
    throw new Error("Email service is not configured properly");
  }

  // Brevo par verified sender email (fallback to amanjha240695@gmail.com)
  const senderEmail = process.env.SMTP_USER || "amanjha240695@gmail.com";

  const payload = {
    sender: {
      name: "Airbnb Security",
      email: senderEmail,
    },
    to: [
      {
        email: toEmail,
      },
    ],
    subject: `Your Airbnb Verification Code: ${otpCode}`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="color: #ff385c; font-size: 26px; font-weight: 800; margin-bottom: 16px;">airbnb</div>
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Confirm your email</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 24px; line-height: 1.5;">Your verification code is below. Enter this code to complete your verification and access your Airbnb account.</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #ff385c;">${otpCode}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code is valid for 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    console.log(`[Brevo API] Initiating OTP dispatch to: ${toEmail}...`);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ [Brevo API Error Response]:", data);
      throw new Error(data.message || "Failed to send email via Brevo API");
    }

    console.log(`✅ [BREVO DELIVERED] Email successfully sent to ${toEmail}. MessageId:`, data.messageId);
    return data;
  } catch (error) {
    console.error("❌ [Brevo Dispatch Error]:", error.message);
    throw error;
  }
};