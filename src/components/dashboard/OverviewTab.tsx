import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CreditCard,
  FileText,
  Gauge,
  LifeBuoy,
  Pencil,
  Send,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CATEGORY_LABELS, formatDate, formatTime, money } from "@/lib/bank";
import type { Card, Profile, Transaction } from "@/lib/bank";
import { VisaCard } from "@/components/dashboard/CardsPanel";
import { PhotoUpload } from "@/components/dashboard/PhotoUpload";

export function OverviewTab({
  profile,
  transactions,
  cards,
  onNavigate,
}: {
  profile: Profile & { authEmail: string };
  transactions: Transaction[];
  cards: Card[];
  onNavigate: (tab: string) => void;
}) {
  const queryClient = useQueryClient();
  const recent = transactions.slice(0, 5);
  const pending = transactions.filter((tx) => tx.status === "pending");

  const request = useMutation({
    mutationFn: async ({ direction, amount }: { direction: "credit" | "debit"; amount: number }) => {
      if (!amount || amount <= 0) throw new Error("Enter a valid amount");
      const { error } = await supabase.from("transactions").insert({
        user_id: profile.id,
        direction,
        amount,
        currency: profile.currency,
        category: direction === "credit" ? "deposit" : "withdrawal",
        description: direction === "credit" ? "Deposit request" : "Withdrawal request",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request submitted for approval");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-border/50 bg-card p-6 duration-500">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xl font-bold text-primary">
                {profile.photo_url ? (
                  <img src={profile.photo_url} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  profile.full_name.slice(0, 2).toUpperCase()
                )}
              </span>
              <div>
                <p className="text-xl font-bold text-foreground">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground">@{profile.username ?? "customer"}</p>
                <Badge className="mt-1" variant={profile.account_status === "Active" ? "default" : "destructive"}>
                  {profile.account_status}
                </Badge>
              </div>
            </div>
            <EditProfileDialog profile={profile} />
          </div>

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Email", profile.authEmail],
              ["Phone number", profile.phone ?? "—"],
              ["Country", profile.country ?? "—"],
              ["State", profile.state ?? "—"],
              ["City", profile.city ?? "—"],
              ["Residential address", profile.house_address ?? "—"],
              ["Zip code", profile.zip_code ?? "—"],
              ["Date of birth", profile.date_of_birth ?? "—"],
              ["Account number", profile.account_number],
              ["Customer ID", profile.customer_id],
              ["Account type", profile.account_type],
              ["Preferred currency", profile.currency],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border/50 bg-surface-deep px-4 py-3">
                <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
                <dd className="truncate font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight text-foreground">
              {money(profile.balance, profile.currency)}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <QuickAction icon={ArrowDownToLine} label="Deposit" onClick={() => promptAmount("Deposit amount", (v) => request.mutate({ direction: "credit", amount: v }))} />
              <QuickAction icon={ArrowUpFromLine} label="Withdraw" onClick={() => promptAmount("Withdrawal amount", (v) => request.mutate({ direction: "debit", amount: v }))} />
              <QuickAction icon={Send} label="Transfer" onClick={() => onNavigate("send")} />
            </div>
          </section>

          <section className="rounded-xl border border-border/50 bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <Gauge className="h-4 w-4 text-primary" /> Credit Score
              </p>
              <span className="text-2xl font-bold text-primary">{profile.credit_score}</span>
            </div>
            <Progress className="mt-3" value={((profile.credit_score - 300) / 550) * 100} />
            <p className="mt-2 text-xs text-muted-foreground">Range 300–850 · Updated monthly</p>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/50 bg-card p-6">
          <p className="font-semibold text-foreground">Recent Transactions</p>
          <div className="mt-4 space-y-2">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-deep px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {tx.description || CATEGORY_LABELS[tx.category]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(tx.created_at)} · {formatTime(tx.created_at)}
                  </p>
                </div>
                <p className={tx.direction === "credit" ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
                  {tx.direction === "credit" ? "+" : "−"}
                  {money(tx.amount, tx.currency)}
                </p>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
          </div>
        </section>

        <section className="rounded-xl border border-border/50 bg-card p-6">
          <p className="font-semibold text-foreground">Pending Transfers & Requests</p>
          <div className="mt-4 space-y-2">
            {pending.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{CATEGORY_LABELS[tx.category]}</p>
                  <p className="text-xs text-muted-foreground">Awaiting approval · {tx.reference}</p>
                </div>
                <p className="font-semibold text-foreground">{money(tx.amount, tx.currency)}</p>
              </div>
            ))}
            {pending.length === 0 && <p className="text-sm text-muted-foreground">Nothing pending.</p>}
          </div>
        </section>
      </div>

      {cards[0] && (
        <section className="rounded-xl border border-border/50 bg-card p-6">
          <p className="font-semibold text-foreground">Your Visa Debit Card</p>
          <div className="mt-4">
            <VisaCard card={cards[0]} />
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CreditCard, title: "Manage Cards", tab: "cards" },
          { icon: FileText, title: "Statements", tab: "history" },
          { icon: LifeBuoy, title: "Support", tab: "extras" },
          { icon: Settings, title: "Settings", tab: "extras" },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => onNavigate(item.tab)}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="font-semibold text-foreground">{item.title}</span>
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-border/50 bg-card p-6">
        <p className="flex items-center gap-2 font-semibold text-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Security Settings
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={async () => {
              const { error } = await supabase.auth.resetPasswordForEmail(profile.authEmail, {
                redirectTo: `${window.location.origin}/auth`,
              });
              if (error) toast.error(error.message);
              else toast.success("Password reset link sent to your email");
            }}
          >
            Change password
          </Button>
          <Button variant="outline" onClick={() => onNavigate("receive")}>
            Account details
          </Button>
          <Button variant="outline" onClick={() => onNavigate("extras")}>
            Notification preferences
          </Button>
        </div>
      </section>
    </div>
  );
}

function promptAmount(title: string, onValue: (value: number) => void) {
  const raw = window.prompt(title);
  if (raw === null) return;
  const value = Number(raw);
  if (!value || value <= 0) {
    toast.error("Enter a valid amount");
    return;
  }
  onValue(value);
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Send;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-surface-deep p-3 text-xs font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </button>
  );
}

function EditProfileDialog({ profile }: { profile: Profile }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: profile.full_name,
    phone: profile.phone ?? "",
    country: profile.country ?? "",
    state: profile.state ?? "",
    city: profile.city ?? "",
    house_address: profile.house_address ?? "",
    zip_code: profile.zip_code ?? "",
    photo_url: profile.photo_url ?? "",
    currency: profile.currency,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update(form).eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <PhotoUpload
            userId={profile.id}
            value={form.photo_url}
            onChange={(url) => setForm((prev) => ({ ...prev, photo_url: url }))}
          />
          {(
            [
              ["full_name", "Full name"],
              ["phone", "Phone number"],
              ["country", "Country"],
              ["state", "State"],
              ["city", "City"],
              ["house_address", "Residential address"],
              ["zip_code", "Zip code"],
              ["currency", "Preferred currency"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                value={form[key]}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
