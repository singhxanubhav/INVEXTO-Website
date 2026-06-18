import nodemailer from "nodemailer";

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (email: string, otp: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"Invexto" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Invexto Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 8px;">
          <h2 style="color: #10b981; text-align: center;">Welcome to Invexto!</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Thank you for registering. Please use the verification code below to complete your registration.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f3f4f6; border: 1px dashed #9ca3af; border-radius: 8px; padding: 20px; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111827;">${otp}</span>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            This code will expire in 10 minutes. If you did not create an account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("OTP Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { success: false, error };
  }
};
