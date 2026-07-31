import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Search, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CATEGORY_LABELS,
  formatDate,
  formatTime,
  money,
  useIsAdmin,
  useRealtimeAdmin,
} from "@/lib/bank";
import type { Profile, Transaction } from "@/lib/bank";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administrator Panel | Heritage Bank" },
      {
        name: "description",
        content:
          "Heritage Bank administrator console for approving deposits and withdrawals, funding accounts and managing customers.",
      },
      { property: "og:title", content: "Administrator Panel | Heritage Bank" },
      { property: "og:description", content: "Internal Heritage Bank administration console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPanel,
});

const STATUSES = ["Active", "Restricted", "Suspended"];

function AdminPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [term, setTerm] = useState("");

  useRealtimeAdmin(Boolean(isAdmin));

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: Boolean(isAdmin),
    queryFn: async (): Promise<Profile[]> => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["admin-transactions"],
    enabled: Boolean(isAdmin),
    queryFn: async (): Promise<Transaction[]> => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      return data ?? [];
    },
  });

  const nameById = useMemo(
    () => Object.fromEntries(profiles.map((p) => [p.id, p.full_name])),
    [profiles],
  );

  const review = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("admin_review_transaction", { _tx_id: id, _approve: approve });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request updated");
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("profiles").update({ account_status: status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Account status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });


  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-surface-deep text-muted-foreground">Checking access…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface-deep px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administrator access required</h1>
          <p className="mt-2 text-muted-foreground">This console is restricted to Heritage Bank staff.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/dashboard" })}>
            Back to dashboard
          </Button>
        </div>
      </main>
    );
  }

  const pending = transactions.filter((tx) => tx.status === "pending");
  const filteredProfiles = profiles.filter((p) =>
    [p.full_name, p.username, p.email, p.account_number]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term.toLowerCase())),
  );

  return (
    <main className="min-h-screen bg-surface-deep px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
              <ShieldCheck className="h-7 w-7 text-primary" /> Administrator Panel
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {profiles.length} customers · {pending.length} pending requests
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>

        <Tabs defaultValue="requests" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requests">Pending Requests</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6 space-y-3">
            {pending.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card p-5"
              >
                <div>
                  <p className="font-semibold text-foreground">
                    {nameById[tx.user_id] ?? tx.user_id.slice(0, 8)} · {CATEGORY_LABELS[tx.category]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.reference} · {formatDate(tx.created_at)} {formatTime(tx.created_at)}
                  </p>
                </div>
                <p className="text-lg font-bold text-foreground">{money(tx.amount, tx.currency)}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review.mutate({ id: tx.id, approve: true })}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => review.mutate({ id: tx.id, approve: false })}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No pending requests.</p>
            )}
          </TabsContent>

          <TabsContent value="customers" className="mt-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search customers"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
              />
            </div>
            {filteredProfiles.map((customer) => (
              <div key={customer.id} className="rounded-xl border border-border/50 bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{customer.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.email} · {customer.account_number} · {customer.customer_id}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {money(customer.balance, customer.currency)}
                  </p>
                  <Badge variant={customer.account_status === "Active" ? "default" : "destructive"}>
                    {customer.account_status}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <FundDialog customer={customer} />
                  <EditCustomerDialog customer={customer} />
                  <CustomerTransactionsDialog customer={customer} transactions={transactions} />
                  {STATUSES.filter((status) => status !== customer.account_status).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      onClick={() => setStatus.mutate({ id: customer.id, status })}
                    >
                      {status === "Active" ? "Unfreeze" : status === "Restricted" ? "Freeze" : "Suspend"}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="transactions" className="mt-6 space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {nameById[tx.user_id] ?? "—"} · {tx.description || CATEGORY_LABELS[tx.category]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.reference} · {formatDate(tx.created_at)} · {tx.status}
                  </p>
                </div>
                <p className={tx.direction === "credit" ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
                  {tx.direction === "credit" ? "+" : "−"}
                  {money(tx.amount, tx.currency)}
                </p>
                <EditTransactionDialog tx={tx} />

              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function FundDialog({ customer }: { customer: Profile }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [description, setDescription] = useState("Administrative adjustment");

  const run = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_adjust_balance", {
        _user_id: customer.id,
        _amount: Number(amount),
        _direction: direction,
        _description: description,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Balance updated");
      setOpen(false);
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Fund / Adjust</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {customer.full_name}'s balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Direction</Label>
            <select
              value={direction}
              onChange={(event) => setDirection(event.target.value as "credit" | "debit")}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="credit">Credit (increase balance)</option>
              <option value="debit">Debit (decrease balance)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(event) => setDescription(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCustomerDialog({ customer }: { customer: Profile }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: customer.full_name,
    username: customer.username ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    country: customer.country ?? "",
    account_type: customer.account_type,
    currency: customer.currency,
    credit_score: String(customer.credit_score),
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ ...form, credit_score: Number(form.credit_score) })
        .eq("id", customer.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Customer updated");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {customer.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {(Object.keys(form) as (keyof typeof form)[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
              <Input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TX_FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "amount", label: "Amount", type: "number" },
  { key: "fee", label: "Fee", type: "number" },
  { key: "currency", label: "Currency" },
  { key: "reference", label: "Transaction ID / Reference" },
  { key: "description", label: "Description" },
  { key: "narration", label: "Narration" },
  { key: "counterparty_name", label: "Recipient / Sender name" },
  { key: "counterparty_account", label: "Counterparty account" },
  { key: "counterparty_bank", label: "Counterparty bank" },
  { key: "counterparty_country", label: "Counterparty country" },
  { key: "swift_code", label: "SWIFT / BIC" },
  { key: "iban", label: "IBAN" },
  { key: "purpose", label: "Purpose" },
];

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditTransactionDialog({ tx }: { tx: Transaction }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(TX_FIELDS.map((f) => [f.key, String((tx as never as Record<string, unknown>)[f.key] ?? "")])),
    direction: tx.direction,
    category: tx.category,
    status: tx.status,
    created_at: toLocalInput(tx.created_at),
  }));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const save = useMutation({
    mutationFn: async () => {
      const patch: Record<string, string | number> = {
        direction: form.direction,
        category: form.category,
        status: form.status,
        amount: Number(form.amount),
        fee: Number(form.fee || 0),
        created_at: new Date(form.created_at).toISOString(),
      };
      TX_FIELDS.filter((f) => f.type !== "number").forEach((f) => {
        patch[f.key] = form[f.key] ?? "";
      });
      const { error } = await supabase.rpc("admin_update_transaction", { _tx_id: tx.id, _patch: patch });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transaction updated");
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_delete_transaction", { _tx_id: tx.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transaction deleted");
      setOpen(false);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit transaction {tx.reference}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Date &amp; time</Label>
            <Input
              type="datetime-local"
              value={form.created_at}
              onChange={(event) => setForm({ ...form, created_at: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <select
                value={form.direction}
                onChange={(event) => setForm({ ...form, direction: event.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                <option value="credit">Credit (money in)</option>
                <option value="debit">Debit (money out)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
              >
                {Object.keys(CATEGORY_LABELS).map((value) => (
                  <option key={value} value={value}>
                    {CATEGORY_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {TX_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}</Label>
              <Input
                type={field.type ?? "text"}
                value={form[field.key] ?? ""}
                onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {["pending", "completed", "failed", "rejected", "reversed"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              The customer's balance is recalculated automatically: completed transactions apply their amount,
              any other status removes it.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            disabled={remove.isPending}
            onClick={() => {
              if (confirm("Delete this transaction permanently?")) remove.mutate();
            }}
          >
            Delete
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomerTransactionsDialog({
  customer,
  transactions,
}: {
  customer: Profile;
  transactions: Transaction[];
}) {
  const [open, setOpen] = useState(false);
  const rows = transactions.filter((tx) => tx.user_id === customer.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          Transactions ({rows.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer.full_name}'s transactions</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet.</p>
          )}
          {rows.map((tx) => (
            <div
              key={tx.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-surface-deep p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {tx.description || CATEGORY_LABELS[tx.category] || tx.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tx.reference} · {formatDate(tx.created_at)} {formatTime(tx.created_at)} · {tx.status}
                </p>
              </div>
              <p
                className={
                  tx.direction === "credit" ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"
                }
              >
                {tx.direction === "credit" ? "+" : "−"}
                {money(tx.amount, tx.currency)}
              </p>
              <EditTransactionDialog tx={tx} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

