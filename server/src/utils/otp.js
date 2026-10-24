import crypto from "crypto";

export const OTP_EXPIRY_MINUTES = 2;

export const generateOtp = () => {
  return crypto.randomInt(1000, 10000).toString();
};

export const getOtpExpiry = () => {
  const expiry = new Date();

  expiry.setMinutes(
    expiry.getMinutes() + OTP_EXPIRY_MINUTES
  );

  return expiry;
};
