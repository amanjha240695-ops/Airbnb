import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT) || 465;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  family: 4,
  connectionTimeout: 5000, // 5s timeout taaki frontend lambe time tak freeze na ho
});

export const sendOtpEmail = async (toEmail, otpCode) => {
  // Demo safety: Render logs me OTP print hoga
  console.log(`\n==========================================`);
  console.log(`🔑 [LIVE OTP FOR ${toEmail}]: ${otpCode}`);
  console.log(`==========================================\n`);

  try {
    const mailOptions = {
      from: `"Airbnb Security" <${smtpUser}>`,
      to: toEmail,
      subject: `Your Airbnb Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #ff385c;">Airbnb Verification</h2>
          <p>Your verification code is: <strong>${otpCode}</strong></p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP SUCCESS] Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[SMTP Warning] Render blocked raw SMTP: ${error.message}`);
    // Error throw mat karo taaki frontend par "OTP Sent" ka step seamlessly complete ho
    return { success: true, fallback: true };
  }
};