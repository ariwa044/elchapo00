import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, ShieldPlus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type PinStatus = { has_pin: boolean; locked_until: string | null; failed_attempts: number };

/** 4 single-digit boxes with auto-advance. */
function PinBoxes({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  return (
    <div className="flex justify-center gap-3">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(event) => {
            const digit = event.target.value.replace(/\D/g, "").slice(-1);
            const next = (value.padEnd(4, " ").substring(0, i) + (digit || " ") + value.padEnd(4, " ").substring(i + 1))
              .trimEnd()
              .replace(/ /g, "");
            onChange(next.slice(0, 4));
            if (digit && i < 3) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className="h-14 w-12 rounded-lg border border-border bg-background text-center text-2xl font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      ))}
    </div>
  );
}

/**
 * Blocks a transfer until the user has a payment PIN.
 * - No PIN yet  -> "Create your payment PIN" (enter + confirm)
 * - PIN exists  -> "Enter your payment PIN"
 * Calls onVerified(pin); the PIN is then passed to the transfer RPC,
 * which verifies it server-side before moving any money.
 */
export function PaymentPin({
  onVerified,
  onCancel,
  summary,
}: {
  onVerified: (pin: string) => void;
  onCancel: () => void;
  summary?: string;
}) {
  const [status, setStatus] = useState<PinStatus | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("payment_pin_status").then(({ data, error }) => {
      if (error) {
        toast.error(error.message);
        onCancel();
        return;
      }
      setStatus(data as unknown as PinStatus);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!status) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border/50 bg-card p-10">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const locked = status.locked_until && new Date(status.locked_until) > new Date();

  async function createPin() {
    setBusy(true);
    const { error } = await supabase.rpc("set_payment_pin", { _pin: pin, _confirm_pin: confirmPin });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      setPin("");
      setConfirmPin("");
      setStage("enter");
      return;
    }
    toast.success("Payment PIN created");
    onVerified(pin);
  }

  // ---- First-time creation ----
  if (!status.has_pin) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-border/50 bg-card p-6 text-center duration-300">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ShieldPlus className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-foreground">Create your payment PIN</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Before your first transfer, set a 4-digit PIN. You will use it to authorise every payment.
        </p>

        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium text-foreground">
            {stage === "enter" ? "Enter a 4-digit PIN" : "Re-enter to confirm"}
          </p>
          {stage === "enter" ? (
            <PinBoxes value={pin} onChange={setPin} autoFocus />
          ) : (
            <PinBoxes value={confirmPin} onChange={setConfirmPin} autoFocus />
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          {stage === "enter" ? (
            <Button className="flex-1" disabled={pin.length !== 4} onClick={() => setStage("confirm")}>
              Continue
            </Button>
          ) : (
            <Button className="flex-1" disabled={confirmPin.length !== 4 || busy} onClick={createPin}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create PIN"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ---- Existing PIN ----
  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-border/50 bg-card p-6 text-center duration-300">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <ShieldCheck className="h-7 w-7" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-foreground">Enter your payment PIN</h3>
      {summary && <p className="mt-2 text-sm text-muted-foreground">{summary}</p>}

      {locked ? (
        <p className="mt-6 text-sm font-medium text-destructive">
          Too many wrong attempts. Try again after {new Date(status.locked_until!).toLocaleTimeString()}.
        </p>
      ) : (
        <div className="mt-6">
          <PinBoxes value={pin} onChange={setPin} autoFocus />
          {status.failed_attempts > 0 && (
            <p className="mt-3 text-xs text-destructive">
              {5 - status.failed_attempts} attempt(s) left before your PIN is locked.
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={pin.length !== 4 || !!locked} onClick={() => onVerified(pin)}>
          Authorise
        </Button>
      </div>
    </div>
  );
}
