import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Port 465 ke liye true direct SSL
  auth: {
    user: process.env.SMTP_USER || "amanjha240695@gmail.com",
    pass: process.env.SMTP_PASS || "buefyqbgpnawteoz",
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: "TLSv1.2",
  },
  family: 4, // ⭐ CRITICAL FOR RENDER: Force IPv4 (IPv6 hangs on Render)
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

export const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    const sender = process.env.SMTP_USER || "amanjha240695@gmail.com";

    const mailOptions = {
      from: `"Airbnb Clone" <${sender}>`,
      to: toEmail,
      subject: `Your Airbnb Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="color: #ff385c; font-size: 24px; font-weight: 800; margin-bottom: 16px;">airbnb</div>
          <h2 style="color: #1e293b; font-size: 20px; font-weight: 700;">Verify your email address</h2>
          <p style="color: #64748b; font-size: 14px;">Use the verification code below to complete your login. Valid for 10 minutes.</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ff385c;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    };

    console.log(`[SMTP] Attempting to send OTP email to ${toEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Email sent to ${toEmail}. MessageId:`, info.messageId);
    return info;
  } catch (error) {
    console.error("[SMTP Error Details]:", {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    throw error;
  }
};