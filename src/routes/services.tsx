import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Banknote,
  Briefcase,
  CreditCard,
  Globe2,
  Home,
  Landmark,
  LineChart,
  PiggyBank,
  Smartphone,
  TrendingUp,
  Wallet,
  Laptop,
} from "lucide-react";
import { PageLayout, Section } from "@/components/site/PageLayout";
import { Reveal } from "@/components/site/Reveal";
import servicesAdvisor from "@/assets/services-advisor.jpg";

const title = "Banking Services — Heritage Bank";
const description =
  "Explore Heritage Bank services: personal and business banking, savings, current accounts, fixed deposits, transfers, cards, mortgages, wealth management and more.";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

const SERVICES = [
  { icon: Wallet, title: "Personal Banking", text: "Everyday accounts with zero monthly fees, global ATM access and instant notifications." },
  { icon: Briefcase, title: "Business Banking", text: "Accounts, payroll and merchant solutions built for startups through to enterprises." },
  { icon: PiggyBank, title: "Savings Accounts", text: "High-yield savings with competitive APY, no minimum balance and automated goals." },
  { icon: Banknote, title: "Current Accounts", text: "Unlimited transactions, overdraft protection and same-day domestic settlement." },
  { icon: Landmark, title: "Fixed Deposits", text: "Guaranteed returns with flexible 3-month to 10-year terms and FDIC insurance." },
  { icon: Globe2, title: "International Transfers", text: "Send money to 180+ countries with transparent FX rates and same-day delivery." },
  { icon: Laptop, title: "Online Banking", text: "Full account control in the browser: payments, statements and secure messaging." },
  { icon: Smartphone, title: "Mobile Banking", text: "Biometric login, mobile check deposit and card freeze from anywhere in seconds." },
  { icon: CreditCard, title: "Credit Cards", text: "Premium rewards, cashback and travel cards with zero foreign transaction fees." },
  { icon: Home, title: "Mortgage Services", text: "Low-rate home financing with fast pre-approval and first-time buyer programs." },
  { icon: TrendingUp, title: "Wealth Management", text: "Bespoke strategies for high-net-worth clients, including trusts and estate planning." },
  { icon: LineChart, title: "Investment Advisory", text: "Dedicated advisors, portfolio reviews and research-backed market insights." },
];

function ServicesPage() {
  return (
    <PageLayout
      eyebrow="Services"
      title={
        <>
          Premium Banking <span className="text-primary">Services</span>
        </>
      }
      subtitle="Twelve complete service lines covering everyday banking, borrowing, and long-term wealth — all under one trusted roof."
      image={servicesAdvisor}
      imageAlt="Heritage Bank advisor meeting a client"
    >
      <Section
        title="Everything You Need in One Bank"
        description="Choose a service to see rates, eligibility and how to get started."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title: t, text }, i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <article className="group flex h-full flex-col rounded-xl border border-border/70 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:bg-card/60 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="mt-6 text-xl font-bold text-foreground">{t}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                <a
                  href="#"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-md border border-primary px-6 py-2.5 text-sm text-primary transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
                >
                  Learn More
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section alt>
        <Reveal>
          <div className="rounded-xl border border-primary/60 bg-card/60 p-10 text-center sm:p-14">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Not sure which service fits?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Speak with a Heritage Bank specialist and get a tailored recommendation in under 15
              minutes — free, with no obligation.
            </p>
            <a
              href="/contact"
              className="mt-8 inline-flex items-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg"
            >
              Talk to an Advisor
            </a>
          </div>
        </Reveal>
      </Section>
    </PageLayout>
  );
}
