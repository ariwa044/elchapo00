import { useEffect, useRef, useState } from "react";
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
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCode("");
  }, [open]);

  function submitPin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const pin = (inputRef.current?.value ?? code).replace(/\D/g, "").slice(0, 6);
    if (pin.length === 6 && !verifying) onVerify(pin);
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Transfer PIN required
          </DialogTitle>
          <DialogDescription>
            No email or SMS code is sent. Enter your private 6-digit transfer PIN to authorise
            this transfer.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submitPin}>
          <div className="space-y-2">
            <Label htmlFor="transfer-pin">Transfer PIN</Label>
            <Input
              ref={inputRef}
              id="transfer-pin"
              name="transferPin"
              type="tel"
              inputMode="numeric"
              enterKeyHint="send"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              autoFocus
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em]"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="sm:flex-1" onClick={onCancel} disabled={verifying}>
              Cancel
            </Button>
            <Button type="submit" className="sm:flex-1" disabled={code.length !== 6 || verifying}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
