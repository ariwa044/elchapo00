import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowDownLeft, Check, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/bank";

export function ReceiveMoney({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState<string | null>(null);

  const details: [string, string][] = [
    ["Account Holder Name", profile.full_name],
    ["Bank Name", "Heritage Bank"],
    ["Account Number", profile.account_number],
    ["Account Type", profile.account_type],
    ["Routing Number", profile.routing_number],
    ["SWIFT Code", profile.swift_code],
    ["IBAN", profile.iban ?? `HB${profile.account_number}${profile.routing_number.slice(0, 4)}`],
    ["Currency", profile.currency],
  ];

  const summary = details.map(([k, v]) => `${k}: ${v}`).join("\n");

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <ArrowDownLeft className="h-5 w-5 text-primary" /> Receive Money
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Share these details to receive funds from any bank worldwide.
        </p>

        <div className="mt-5 space-y-2">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-surface-deep px-4 py-3 transition-colors duration-300 hover:border-primary/50"
            >
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="truncate font-semibold text-foreground">{value}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => copy(value, label)}>
                {copied === label ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>

        <Button
          className="mt-5 w-full"
          onClick={async () => {
            const nav = navigator as Navigator;
            if (nav.share) {
              await nav.share({ title: "Heritage Bank account details", text: summary });
            } else {
              await copy(summary, "all");
            }
          }}
        >
          <Share2 className="mr-2 h-4 w-4" /> Share Account Details
        </Button>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-card p-6 text-center">
          <p className="text-sm font-semibold text-foreground">Scan to pay</p>
          <div className="mt-4 inline-block rounded-lg bg-white p-4">
            <QRCodeSVG value={summary} size={168} level="M" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            QR contains your full account information.
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <p className="font-semibold text-foreground">Incoming transfer instructions</p>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>1. Heritage Bank customers can send instantly using your account number or username.</li>
            <li>2. Domestic senders need the routing number and your 10-digit account number.</li>
            <li>3. International senders need the SWIFT code {profile.swift_code} and your IBAN.</li>
            <li>4. Funds normally settle within minutes; international wires within 1–3 business days.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
