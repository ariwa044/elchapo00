/**
 * Client-side OTP utilities for generating, storing, and verifying OTPs
 * 
 * This implementation uses localStorage to store OTPs with expiration times
 * as a workaround when database migrations cannot be applied.
 */

interface StoredOtp {
  code: string;
  expiresAt: number;
  createdAt: number;
}

const OTP_STORAGE_KEY = 'otp_codes';
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a 6-digit random OTP code
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in localStorage with expiration
 */
export function storeOtp(userId: string, code: string): void {
  const now = Date.now();
  const expiresAt = now + OTP_EXPIRY_MINUTES * 60 * 1000;
  
  const otpData: StoredOtp = {
    code,
    expiresAt,
    createdAt: now,
  };
  
  // Get existing OTPs for this user
  const existingData = localStorage.getItem(OTP_STORAGE_KEY);
  const allOtps: Record<string, StoredOtp> = existingData ? JSON.parse(existingData) : {};
  
  // Clean up expired OTPs for this user
  allOtps[userId] = otpData;
  
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));
}

/**
 * Verify OTP code for a user
 */
export function verifyOtp(userId: string, code: string): boolean {
  const existingData = localStorage.getItem(OTP_STORAGE_KEY);
  if (!existingData) return false;
  
  const allOtps: Record<string, StoredOtp> = JSON.parse(existingData);
  const otpData = allOtps[userId];
  
  if (!otpData) return false;
  
  // Check if OTP has expired
  const now = Date.now();
  if (now > otpData.expiresAt) {
    delete allOtps[userId];
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));
    return false;
  }
  
  // Check if code matches
  if (otpData.code !== code) return false;
  
  // OTP is valid, remove it after successful verification
  delete allOtps[userId];
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));
  
  return true;
}

/**
 * Clear OTP for a user
 */
export function clearOtp(userId: string): void {
  const existingData = localStorage.getItem(OTP_STORAGE_KEY);
  if (!existingData) return;
  
  const allOtps: Record<string, StoredOtp> = JSON.parse(existingData);
  delete allOtps[userId];
  localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(allOtps));
}

/**
 * Get remaining time in seconds for OTP
 */
export function getOtpRemainingTime(userId: string): number {
  const existingData = localStorage.getItem(OTP_STORAGE_KEY);
  if (!existingData) return 0;
  
  const allOtps: Record<string, StoredOtp> = JSON.parse(existingData);
  const otpData = allOtps[userId];
  
  if (!otpData) return 0;
  
  const now = Date.now();
  const remaining = otpData.expiresAt - now;
  
  return Math.max(0, Math.floor(remaining / 1000));
}
