import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

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

export function OtpDialog({ open, verifying, onCancel, onVerify }: Props) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!open) setPin("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Authorize this transfer
          </DialogTitle>
          <DialogDescription>
            Enter your 6-digit transfer PIN to complete this transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Transfer PIN</Label>
          <Input
            type="password"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && pin.length === 6) onVerify(pin);
            }}
            placeholder="••••••"
            className="text-center text-2xl tracking-[0.5em]"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="sm:flex-1" onClick={onCancel} disabled={verifying}>
            Cancel
          </Button>
          <Button
            className="sm:flex-1"
            disabled={pin.length !== 6 || verifying}
            onClick={() => onVerify(pin)}
          >
            {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Transfer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
