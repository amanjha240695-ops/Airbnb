import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendHostVerificationOtpEmail = async (email, name, otpCode) => {
  const mailOptions = {
    from: `"Airbnb Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Your Host Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px;">
        <h2 style="color: #ff385c; margin-bottom: 8px;">Airbnb Host Onboarding</h2>
        <p style="font-size: 15px; color: #333;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #555; line-height: 1.5;">
          You are one step away from publishing your stay and becoming an official Airbnb Host.
        </p>
        <div style="background-color: #f7f7f7; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #222;">${otpCode}</span>
        </div>
        <p style="font-size: 13px; color: #777;">
          This code is valid for 10 minutes. If you did not initiate this request, please secure your account immediately.
        </p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};