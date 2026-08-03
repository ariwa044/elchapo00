/**
 * Email service for OTP sending
 * 
 * This is a client-side wrapper that calls the server API
 * to send OTP emails using Hostinger SMTP.
 */

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send OTP email to user via server API
 * 
 * @param email - User's email address
 * @param code - 6-digit OTP code
 * @returns Promise with success status
 */
export async function sendOtpEmail(email: string, code: string): Promise<EmailResult> {
  try {
    const response = await fetch('/api/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
