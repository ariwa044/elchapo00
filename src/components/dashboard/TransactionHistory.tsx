import { useMemo, useState } from "react";
import { Download, FileText, Printer, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS, formatDate, formatTime, money } from "@/lib/bank";
import type { Profile, Transaction } from "@/lib/bank";
import { downloadReceipt, exportCsv, exportStatementPdf, printStatement } from "@/lib/receipt";

const FILTERS = ["all", "credit", "debit", "pending"] as const;

export function TransactionHistory({
  profile,
  transactions,
}: {
  profile: Profile;
  transactions: Transaction[];
}) {
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [month, setMonth] = useState("all");

  const months = useMemo(() => {
    const set = new Set(transactions.map((tx) => tx.created_at.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (filter === "credit" && tx.direction !== "credit") return false;
      if (filter === "debit" && tx.direction !== "debit") return false;
      if (filter === "pending" && tx.status !== "pending") return false;
      if (month !== "all" && !tx.created_at.startsWith(month)) return false;
      if (!needle) return true;
      return [tx.reference, tx.description, tx.counterparty_name, tx.category, tx.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [transactions, term, filter, month]);

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground">Transaction History</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => exportStatementPdf(filtered, profile)}>
            <FileText className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => exportCsv(filtered)}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => printStatement(filtered, profile)}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search transactions"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-md border border-border/50 p-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <select
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="all">All months</option>
          {months.map((value) => (
            <option key={value} value={value}>
              {new Date(`${value}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-2">
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">No transactions found.</p>
        )}
        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="animate-in fade-in grid gap-3 rounded-lg border border-border/50 bg-surface-deep p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">
                  {tx.description || CATEGORY_LABELS[tx.category] || tx.category}
                </p>
                <Badge variant={tx.status === "completed" ? "default" : "secondary"}>{tx.status}</Badge>
                <Badge variant="outline">{CATEGORY_LABELS[tx.category] ?? tx.category}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(tx.created_at)} · {formatTime(tx.created_at)} · ID {tx.reference}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tx.direction === "credit" ? "Sender" : "Recipient"}: {tx.counterparty_name ?? "—"}
                {tx.counterparty_bank ? ` · ${tx.counterparty_bank}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`text-lg font-bold ${tx.direction === "credit" ? "text-emerald-400" : "text-rose-400"}`}
              >
                {tx.direction === "credit" ? "+" : "−"}
                {money(Number(tx.amount) + Number(tx.fee ?? 0), tx.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                Balance: {tx.balance_after != null ? money(tx.balance_after, tx.currency) : "—"}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1 h-7 text-xs"
                onClick={() => downloadReceipt(tx, profile)}
              >
                Receipt
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
