import { useState, useEffect } from "react";
import { Loader2, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/otp-input";
import { sendOtpEmailServer } from "@/lib/email-server-fn";
import { generateOtp, storeOtp, verifyOtp, clearOtp } from "@/lib/otp-client";

interface OtpVerificationProps {
  userId: string;
  userEmail: string;
  transactionSummary: {
    recipient: string;
    amount: string;
    description?: string;
  };
  onVerified: () => void;
  onCancel: () => void;
}

export function OtpVerification({
  userId,
  userEmail,
  transactionSummary,
  onVerified,
  onCancel,
}: OtpVerificationProps) {
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate OTP on mount
  const generateOtpCode = async () => {
    setIsGenerating(true);
    try {
      const code = generateOtp();
      storeOtp(userId, code);
      
      // Send OTP email via server function
      try {
        const emailResult = await sendOtpEmailServer({ data: { email: userEmail, code } });
        if (emailResult.success) {
          toast.success("OTP sent to your email");
        } else {
          toast.error("Failed to send email. Please try again.");
        }
      } catch (error) {
        console.error('Email sending error:', error);
        toast.error("Failed to send email. Please try again.");
      }
      
      // Show the code in console for development (remove in production)
      console.log(`Development OTP: ${code}`);
    } catch (error) {
      console.error('OTP generation error:', error);
      toast.error("Failed to generate OTP");
    } finally {
      setIsGenerating(false);
    }
  };

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Generate OTP on component mount
  useEffect(() => {
    generateOtpCode();
  }, []);

  const handleResend = () => {
    setCountdown(30);
    setCanResend(false);
    setOtp("");
    generateOtpCode();
  };

  const handleVerify = () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    
    // Verify OTP using client-side function
    const isValid = verifyOtp(userId, otp);
    if (isValid) {
      toast.success("OTP verified successfully");
      onVerified();
    } else {
      toast.error("Invalid or expired OTP code");
      setOtp("");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-border/50 bg-card p-6 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">Verify Transaction</h3>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="mb-6 rounded-lg border border-border/50 bg-surface-deep p-4">
        <h4 className="mb-3 text-sm font-semibold text-foreground">Transaction Details</h4>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Recipient</dt>
            <dd className="font-medium text-foreground">{transactionSummary.recipient}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium text-foreground">{transactionSummary.amount}</dd>
          </div>
          {transactionSummary.description && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="font-medium text-foreground">{transactionSummary.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* OTP Input */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-foreground">
          Enter verification code
        </label>
        <OtpInput
          value={otp}
          onChange={setOtp}
          length={6}
          disabled={isGenerating}
        />
      </div>

      {/* Resend Button */}
      <div className="mb-6 text-center">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={isGenerating}
            className="flex items-center gap-2 text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-4 w-4" />
            Resend code
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend code in <span className="font-medium text-foreground">{countdown}s</span>
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleVerify}
          disabled={otp.length !== 6 || isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verify & Complete"
          )}
        </Button>
      </div>
    </div>
  );
}
