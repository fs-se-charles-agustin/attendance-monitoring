import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Check if SMTP is configured
const isSmtpConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

// Create transporter only if SMTP is configured
const getTransporter = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendPasswordResetEmail = async (email: string, resetToken: string) => {
  if (!isSmtpConfigured()) {
    const errorMsg = "SMTP credentials (SMTP_USER, SMTP_PASS) are not configured. Please configure email settings in your .env file.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Failed to initialize email transporter");
  }

  // Normalize CLIENT_URL and ensure it has a proper URL
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    const errorMessage = error.response 
      ? `SMTP Error: ${error.response}` 
      : error.message 
      ? `Email Error: ${error.message}` 
      : "Failed to send email. Please check your SMTP configuration.";
    throw new Error(errorMessage);
  }
};

export const sendOtpEmail = async (email: string, otp: string) => {
  if (!isSmtpConfigured()) {
    const errorMsg = "SMTP credentials (SMTP_USER, SMTP_PASS) are not configured. Please configure email settings in your .env file.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const transporter = getTransporter();
  if (!transporter) {
    throw new Error("Failed to initialize email transporter");
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Verify Your Account - OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Account</h2>
        <p>Thank you for signing up! Please use the following OTP code to verify your account:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #007bff; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error("Error sending OTP email:", error);
    const errorMessage = error.response 
      ? `SMTP Error: ${error.response}` 
      : error.message 
      ? `Email Error: ${error.message}` 
      : "Failed to send OTP email. Please check your SMTP configuration.";
    throw new Error(errorMessage);
  }
};
