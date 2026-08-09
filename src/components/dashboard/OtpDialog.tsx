import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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

  async function request() {
    setSending(true);
    const { error } = await supabase.rpc("request_transfer_otp", {
      _purpose: purpose,
      _amount: amount,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("A 6-digit code was sent to the bank administrator");
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
            {email
              ? `We sent a 6-digit code to ${maskEmail(email)}. It also appears in your notifications and expires in 10 minutes.`
              : "Enter the 6-digit code we sent you. It expires in 10 minutes."}
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
