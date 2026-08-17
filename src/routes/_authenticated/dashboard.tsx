import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CreditCard,
  LayoutGrid,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  money,
  useBeneficiaries,
  useCards,
  useIsAdmin,
  useProfile,
  useRealtimeBanking,
  useTransactions,
} from "@/lib/bank";
import { SendMoney } from "@/components/dashboard/SendMoney";
import { BankTransfer } from "@/components/dashboard/BankTransfer";
import { ReceiveMoney } from "@/components/dashboard/ReceiveMoney";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { CardsPanel } from "@/components/dashboard/CardsPanel";
import { Beneficiaries, Faqs } from "@/components/dashboard/Extras";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard | Heritage Bank" },
      {
        name: "description",
        content:
          "View your Heritage Bank balance in real time, send money, transfer to any bank, download receipts and track every transaction.",
      },
      { property: "og:title", content: "Your Dashboard | Heritage Bank" },
      {
        property: "og:description",
        content: "Secure real-time online banking dashboard for Heritage Bank customers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const ACTIONS = [
  { key: "send", icon: Send, title: "Send Money", desc: "Transfer to Heritage Bank users instantly" },
  { key: "transfer", icon: ArrowUpRight, title: "Bank Transfer", desc: "Send to other banks locally or internationally" },
  { key: "receive", icon: ArrowDownLeft, title: "Receive Money", desc: "View account details for incoming transfers" },
  { key: "history", icon: Clock, title: "Transaction History", desc: "View all your transactions" },
];

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("accounts");

  useRealtimeBanking();

  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();
  const { data: cards = [] } = useCards();
  const { data: beneficiaries = [] } = useBeneficiaries();
  const { data: isAdmin } = useIsAdmin();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (!profile) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface-deep text-muted-foreground">
        Loading your account…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-deep px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-3 duration-500">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
            <p className="mt-1 text-sm text-muted-foreground">{profile.authEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button asChild variant="secondary">
                <Link to="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-8">
          <TabsList className="flex w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="send">Send Money</TabsTrigger>
            <TabsTrigger value="transfer">Bank Transfer</TabsTrigger>
            <TabsTrigger value="receive">Receive</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="extras">More</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="animate-in fade-in mt-6 space-y-6 duration-300">
            <section className="animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-border/50 bg-card p-6 duration-500">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                <Wallet className="h-4 w-4" /> Account Balance
              </div>
              <p className="mt-3 text-5xl font-extrabold tracking-tight text-foreground transition-all duration-500">
                {money(profile.balance, profile.currency)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Available Balance</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Account number", profile.account_number],
                  ["Account type", profile.account_type],
                  ["Currency", profile.currency],
                  ["Account status", profile.account_status],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border/50 bg-surface-deep px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
                    <p className="font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              {ACTIONS.map((action) => (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => setTab(action.key)}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground">{action.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{action.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="send" className="animate-in fade-in mt-6 duration-300">
            <SendMoney profile={profile} />
          </TabsContent>

          <TabsContent value="transfer" className="animate-in fade-in mt-6 duration-300">
            <BankTransfer profile={profile} />
          </TabsContent>

          <TabsContent value="receive" className="animate-in fade-in mt-6 duration-300">
            <ReceiveMoney profile={profile} />
          </TabsContent>

          <TabsContent value="history" className="animate-in fade-in mt-6 duration-300">
            <TransactionHistory profile={profile} transactions={transactions} />
          </TabsContent>

          <TabsContent value="overview" className="animate-in fade-in mt-6 duration-300">
            <OverviewTab
              profile={profile}
              transactions={transactions}
              cards={cards}
              onNavigate={setTab}
            />
          </TabsContent>

          <TabsContent value="cards" className="animate-in fade-in mt-6 duration-300">
            <CardsPanel cards={cards} />
          </TabsContent>

          <TabsContent value="extras" className="animate-in fade-in mt-6 space-y-6 duration-300">
            <Beneficiaries profile={profile} beneficiaries={beneficiaries} />
            <Faqs />
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-5">
              <CreditCard className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Need more? Visit the{" "}
                <Link to="/contact" className="text-primary underline">
                  support centre
                </Link>{" "}
                for 24/7 assistance.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-5">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                Customer ID {profile.customer_id} · Routing {profile.routing_number} · SWIFT{" "}
                {profile.swift_code}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
