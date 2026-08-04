/**
 * Server function for sending OTP emails using Hostinger SMTP
 *
 * nodemailer is imported *inside* the handler body — never at module top-level.
 * Top-level imports of Node.js-only CJS packages (like nodemailer) get pulled
 * into the SSR bundle's static module graph and break Vercel's ESM loader,
 * causing seemingly unrelated startup errors in the bundled server entry.
 */

import { createServerFn } from "@tanstack/react-start";

export const sendOtpEmailServer = createServerFn({ method: "POST" })
  .validator((data: { email: string; code: string }) => data)
  .handler(async ({ data }) => {
    // Dynamic import keeps nodemailer out of the static module graph.
    // It is only resolved at runtime on the server, never bundled into the
    // client or SSR initialisation chunks.
    const nodemailer = (await import("nodemailer")).default;

    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.hostinger.com",
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || "support@firstheritage.site",
          pass: process.env.EMAIL_PASSWORD || "Elchapo@@@0",
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || "support@firstheritage.site",
        to: data.email,
        subject: "Your Verification Code - Heritage Bank",
        html: `
          <h1>Your Verification Code</h1>
          <p>Your verification code is: <strong>${data.code}</strong></p>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${data.email}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });
