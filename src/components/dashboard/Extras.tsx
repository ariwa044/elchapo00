import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatDate, formatTime } from "@/lib/bank";
import type { Beneficiary, Notification, Profile } from "@/lib/bank";

const FAQS = [
  ["How long do transfers take?", "Heritage-to-Heritage transfers are instant. Domestic wires settle same day; international wires take 1–3 business days."],
  ["What are the transfer fees?", "Local transfers cost $2.50. International transfers cost $25 plus 1.5% of the amount."],
  ["How do I receive money?", "Share your 10-digit account number, routing number or SWIFT code from the Receive Money tab."],
  ["Why is my account restricted?", "Restricted or suspended accounts cannot send funds. Contact support so an administrator can review your account."],
  ["Where can I get a statement?", "Open Transaction History and export a PDF or CSV statement, or filter by month for a monthly statement."],
];

export function Beneficiaries({ profile, beneficiaries }: { profile: Profile; beneficiaries: Beneficiary[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", account_number: "", bank_name: "" });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.account_number) throw new Error("Name and account number are required");
      const { error } = await supabase.from("beneficiaries").insert({
        user_id: profile.id,
        name: form.name,
        account_number: form.account_number,
        bank_name: form.bank_name || "Heritage Bank",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm({ name: "", account_number: "", bank_name: "" });
      toast.success("Beneficiary saved");
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["beneficiaries"] }),
  });

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <UserPlus className="h-5 w-5 text-primary" /> Beneficiaries
      </h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Account number</Label>
          <Input
            value={form.account_number}
            onChange={(e) => setForm({ ...form, account_number: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Bank</Label>
          <Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
        </div>
      </div>
      <Button className="mt-4" disabled={add.isPending} onClick={() => add.mutate()}>
        Save beneficiary
      </Button>

      <div className="mt-6 space-y-2">
        {beneficiaries.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-surface-deep px-4 py-3"
          >
            <div>
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.account_number} · {item.bank_name ?? "—"}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {beneficiaries.length === 0 && (
          <p className="text-sm text-muted-foreground">No saved beneficiaries yet.</p>
        )}
      </div>
    </div>
  );
}

export function Notifications({ notifications }: { notifications: Notification[] }) {
  const queryClient = useQueryClient();

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <Bell className="h-5 w-5 text-primary" /> Notifications
      </h3>
      <div className="mt-5 space-y-2">
        {notifications.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => markRead(item.id)}
            className={`flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition-colors ${
              item.read ? "border-border/40 bg-surface-deep" : "border-primary/50 bg-primary/5"
            }`}
          >
            <span>
              <span className="block font-semibold text-foreground">{item.title}</span>
              <span className="block text-sm text-muted-foreground">{item.body}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {formatDate(item.created_at)} · {formatTime(item.created_at)}
              </span>
            </span>
            {!item.read && <Badge>New</Badge>}
          </button>
        ))}
        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        )}
      </div>
    </div>
  );
}

export function Faqs() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h3 className="text-lg font-bold text-foreground">FAQs</h3>
      <Accordion type="single" collapsible className="mt-3">
        {FAQS.map(([question, answer]) => (
          <AccordionItem key={question} value={question}>
            <AccordionTrigger className="text-left">{question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
