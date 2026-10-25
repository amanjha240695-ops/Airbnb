import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT) || 465;
const isSecure = smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: smtpPort,
  secure: isSecure, // 465 के लिए true (SSL direct)
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

export const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    const sender = process.env.SMTP_USER || process.env.EMAIL_USER;

    const mailOptions = {
      from: `"Airbnb Clone" <${sender}>`,
      to: toEmail,
      subject: `Your Airbnb Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="color: #ff385c; font-size: 24px; font-weight: 800; margin-bottom: 16px;">airbnb</div>
          <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Verify your email address</h2>
          <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Use the verification code below to complete your login. This code expires in 10 minutes.</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ff385c;">${otpCode}</span>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Email sent to ${toEmail}. MessageId:`, info.messageId);
    return info;
  } catch (error) {
    console.error("[SMTP Error] Failed to send email:", error.message);
    throw error; // एरर छुपाएं मत, ताकि साफ़ पता चले
  }
};