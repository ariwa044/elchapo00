import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

import { requestTransferOtp } from "@/lib/otp.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  amount: number;
  purpose: string;
  verifying?: boolean;
  onCancel: () => void;
  onVerify: (code: string) => void;
};

export function OtpDialog({ open, amount, purpose, verifying, onCancel, onVerify }: Props) {
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const sendOtp = useServerFn(requestTransferOtp);

  async function request() {
    setSending(true);
    try {
      const result = await sendOtp({ data: { purpose, amount } });
      toast.success(
        result?.emailed
          ? "A 6-digit code was emailed to the bank administrator"
          : "A 6-digit code was sent to the bank administrator",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request a code");
    } finally {
      setSending(false);
    }
  }


  useEffect(() => {
    if (!open) {
      setCode("");
      return;
    }
    void request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Verify this transfer
          </DialogTitle>
          <DialogDescription>
            A 6-digit code was sent to the bank administrator. Contact support to receive it — it
            expires in 10 minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>One-time code</Label>
          <Input
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && code.length === 6) onVerify(code);
            }}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em]"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="sm:flex-1" onClick={onCancel} disabled={verifying}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            className="sm:flex-1"
            onClick={() => void request()}
            disabled={sending || verifying}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend code"}
          </Button>
          <Button
            className="sm:flex-1"
            disabled={code.length !== 6 || verifying}
            onClick={() => onVerify(code)}
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
