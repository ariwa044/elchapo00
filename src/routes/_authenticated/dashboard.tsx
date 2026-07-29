import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CreditCard,
  Landmark,
  PiggyBank,
  Send,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard | Heritage Bank" },
      {
        name: "description",
        content:
          "View your Heritage Bank account balance, send money, receive transfers and review your transaction history.",
      },
      { property: "og:title", content: "Your Dashboard | Heritage Bank" },
      {
        property: "og:description",
        content: "Secure online banking dashboard for Heritage Bank customers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const ACTIONS = [
  { icon: Send, title: "Send Money", desc: "Transfer to Heritage Bank users instantly" },
  { icon: ArrowUpRight, title: "Bank Transfer", desc: "Send to other banks locally or internationally" },
  { icon: ArrowDownLeft, title: "Receive Money", desc: "View account details for incoming transfers" },
  { icon: Clock, title: "Transaction History", desc: "View all your transactions" },
];

const SERVICES = [
  { icon: CreditCard, title: "Cards", desc: "Manage your debit and credit cards" },
  { icon: PiggyBank, title: "Savings & CDs", desc: "Grow your money at up to 4.8% APY" },
  { icon: Landmark, title: "Loans & Credit", desc: "Apply for personal, home or auto loans" },
  { icon: TrendingUp, title: "Investments", desc: "Build a portfolio with expert guidance" },
  { icon: ShieldCheck, title: "Security Centre", desc: "Alerts, devices and account protection" },
  { icon: Wallet, title: "Statements", desc: "Download monthly account statements" },
];

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, email, balance, account_number, country")
        .eq("id", user.id)
        .maybeSingle();
      return { ...data, email: data?.email ?? user.email ?? "" };
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const balance = Number(profile?.balance ?? 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <main className="min-h-screen bg-surface-deep px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-3 duration-500">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
            <p className="mt-1 text-sm text-muted-foreground">{profile?.email ?? ""}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="accounts" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6 space-y-6">
            <section className="animate-in fade-in slide-in-from-bottom-3 rounded-xl border border-border/50 bg-card p-6 duration-500">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                <Wallet className="h-4 w-4" />
                Account Balance
              </div>
              <p className="mt-3 text-5xl font-extrabold tracking-tight text-foreground">
                {balance}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Available Balance</p>
              <p className="mt-8 text-xs text-muted-foreground">
                Account number ••••{(profile?.account_number ?? "").slice(-4)}
              </p>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              {ACTIONS.map((action) => (
                <button
                  key={action.title}
                  type="button"
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

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Account holder", value: profile?.full_name || "—" },
                { label: "Username", value: profile?.username || "—" },
                { label: "Country", value: profile?.country || "—" },
                { label: "Account number", value: profile?.account_number || "—" },
                { label: "Available balance", value: balance },
                { label: "Account status", value: "Active" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/50 bg-card p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="rounded-xl border border-border/50 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <service.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 font-semibold text-foreground">{service.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{service.desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
