import { useState, useRef, useEffect } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, disabled = false }: OtpInputProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, length);
    onChange(digits);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Auto-focus next input after entering a digit
  useEffect(() => {
    if (value.length > 0 && value.length < length) {
      inputRefs.current[value.length]?.focus();
    }
  }, [value, length]);

  return (
    <div className="flex items-center justify-center gap-2">
      <InputOTP
        value={value}
        onChange={onChange}
        maxLength={length}
        disabled={disabled}
        onPaste={handlePaste}
      >
        <InputOTPGroup>
          {Array.from({ length }).map((_, index) => (
            <InputOTPSlot
              key={index}
              index={index}
              ref={(el) => {
                inputRefs.current[index] = el as HTMLInputElement;
              }}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
