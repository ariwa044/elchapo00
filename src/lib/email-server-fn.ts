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
          user: process.env.EMAIL_USER || "support@firstheritage.online",
          pass: process.env.EMAIL_PASSWORD || "Elchapo@@@0",
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || "support@firstheritage.online",
        to: data.email,
        subject: "Transfer Verification - Action Required",
        html: `
          <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 40px 20px; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 600;">Transfer Verification</h2>
              <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-bottom: 28px;">
                Are you sure about this transfer? To proceed, here is your six-digit OTP:
              </p>
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 28px; border: 1px dashed #cbd5e1;">
                <span style="font-size: 36px; font-weight: 700; color: #3b82f6; letter-spacing: 8px; display: inline-block; margin-left: 8px;">${data.code}</span>
              </div>
              <p style="color: #64748b; font-size: 14px; margin-bottom: 8px;">
                This code will expire in 10 minutes.
              </p>
              <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
                If you did not request this transfer, please contact support immediately to secure your account.
              </p>
            </div>
            <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Heritage Bank. All rights reserved.
            </div>
          </div>
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
