/**
 * Server function for sending OTP emails using Hostinger SMTP
 * 
 * This server function uses nodemailer with Hostinger SMTP credentials
 * to send OTP emails to users for transaction verification.
 */

import { createServerFn } from '@tanstack/react-start';
import nodemailer from 'nodemailer';

export const sendOtpEmailServer = createServerFn({ method: 'POST' })
  .validator((data: { email: string; code: string }) => data)
  .handler(async ({ data }) => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER || 'support@heritagebanking.site',
          pass: process.env.EMAIL_PASSWORD || 'Elchapo@@@0',
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'support@heritagebanking.site',
        to: data.email,
        subject: 'Your Verification Code - Heritage Bank',
        html: `
          <h1>Your Verification Code</h1>
          <p>Your verification code is: <strong>${data.code}</strong></p>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${data.email}`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  });
