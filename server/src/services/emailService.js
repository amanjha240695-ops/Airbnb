import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // Port 465 ke liye direct SSL
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4, // Render par timeout rokne ke liye IPv4 force karega
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

export const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    const mailOptions = {
      from: `"Airbnb Security" <${smtpUser}>`,
      to: toEmail,
      subject: `Your Airbnb Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #ff385c; margin-bottom: 8px;">Airbnb Verification</h2>
          <p style="color: #555;">Use the verification code below to login:</p>
          <div style="background-color: #f7f7f7; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #ff385c;">${otpCode}</span>
          </div>
          <p style="color: #777; font-size: 13px;">This code is valid for 10 minutes. If you did not request this, please ignore.</p>
        </div>
      `,
    };

    console.log(`[SMTP] Sending OTP to: ${toEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[SMTP Error Details]:", error.message);
    throw error;
  }
};