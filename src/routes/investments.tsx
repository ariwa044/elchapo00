import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Briefcase,
  Building2,
  Coins,
  LineChart,
  PieChart,
  ShieldAlert,
  TrendingUp,
  Umbrella,
} from "lucide-react";
import { PageLayout, Section } from "@/components/site/PageLayout";
import { Reveal } from "@/components/site/Reveal";
import { Counter } from "@/components/site/Counter";
import investmentsDesk from "@/assets/investments-desk.jpg";

const title = "Investments — Heritage Bank";
const description =
  "Mutual funds, fixed income, retirement plans, wealth and portfolio management, stocks, ETFs and bonds — with an investment calculator and market updates.";

export const Route = createFileRoute("/investments")({
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
  component: InvestmentsPage,
});

const PRODUCTS = [
  { icon: PieChart, title: "Mutual Funds", text: "Diversified funds across equity, balanced and sector strategies.", perf: 11.4 },
  { icon: Coins, title: "Fixed Income", text: "Predictable income from treasury, corporate and municipal instruments.", perf: 5.2 },
  { icon: Umbrella, title: "Retirement Plans", text: "401(k), IRA and pension planning with automated contributions.", perf: 8.1 },
  { icon: Briefcase, title: "Wealth Management", text: "Holistic planning for high-net-worth families, trusts and estates.", perf: 9.7 },
  { icon: Activity, title: "Portfolio Management", text: "Discretionary management with quarterly rebalancing and reporting.", perf: 10.3 },
  { icon: TrendingUp, title: "Stocks & ETFs", text: "Commission-free trading across global exchanges and index ETFs.", perf: 13.6 },
  { icon: Building2, title: "Bonds", text: "Investment-grade and sovereign bonds with laddered maturities.", perf: 4.6 },
  { icon: LineChart, title: "Investment Advisory", text: "Research-backed guidance from dedicated Heritage Bank advisors.", perf: 9.1 },
];

const MARKET = [
  { name: "S&P 500", value: "5,842.19", change: "+0.84%", up: true },
  { name: "NASDAQ", value: "19,204.55", change: "+1.12%", up: true },
  { name: "Dow Jones", value: "42,110.03", change: "-0.21%", up: false },
  { name: "US 10Y Treasury", value: "4.18%", change: "+0.03", up: true },
  { name: "Gold", value: "$2,418.60", change: "+0.47%", up: true },
  { name: "EUR / USD", value: "1.0912", change: "-0.11%", up: false },
];

const RISK = [
  { level: "Conservative", allocation: "20% equity / 80% fixed income", target: "4 – 6% p.a." },
  { level: "Balanced", allocation: "50% equity / 50% fixed income", target: "6 – 9% p.a." },
  { level: "Growth", allocation: "75% equity / 25% fixed income", target: "9 – 12% p.a." },
  { level: "Aggressive", allocation: "95% equity / 5% fixed income", target: "12%+ p.a." },
];

const SERIES = [42, 48, 45, 55, 61, 58, 67, 74, 71, 82, 89, 96];

function PerformanceChart() {
  const width = 640;
  const height = 220;
  const max = Math.max(...SERIES);
  const points = SERIES.map((v, i) => {
    const x = (i / (SERIES.length - 1)) * width;
    const y = height - (v / max) * (height - 20) - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Heritage Growth Portfolio</h3>
          <p className="mt-1 text-sm text-muted-foreground">12-month indexed performance</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            +<Counter to={12.8} decimals={1} suffix="%" />
          </div>
          <div className="text-xs text-muted-foreground">Trailing 12 months</div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Portfolio performance rising over twelve months"
        className="mt-8 h-56 w-full"
      >
        <defs>
          <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#perfFill)"
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="[stroke-dasharray:2000] [stroke-dashoffset:2000] motion-safe:animate-[dash_2.2s_ease-out_forwards]"
        />
      </svg>
      <style>{`@keyframes dash { to { stroke-dashoffset: 0; } }`}</style>
    </div>
  );
}

function InvestmentCalculator() {
  const [initial, setInitial] = useState(25000);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(8);

  const { future, contributed } = useMemo(() => {
    const r = rate / 100 / 12;
    const n = years * 12;
    const fvInitial = initial * Math.pow(1 + r, n);
    const fvMonthly = r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r);
    return { future: fvInitial + fvMonthly, contributed: initial + monthly * n };
  }, [initial, monthly, years, rate]);

  const usd = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-8">
      <h3 className="text-xl font-bold text-foreground">Investment Calculator</h3>
      <div className="mt-6 space-y-6">
        {[
          { label: "Initial investment", value: initial, set: setInitial, min: 0, max: 500000, step: 1000, fmt: usd },
          { label: "Monthly contribution", value: monthly, set: setMonthly, min: 0, max: 10000, step: 50, fmt: usd },
          { label: "Time horizon", value: years, set: setYears, min: 1, max: 40, step: 1, fmt: (v: number) => `${v} years` },
          { label: "Expected annual return", value: rate, set: setRate, min: 1, max: 15, step: 0.5, fmt: (v: number) => `${v}%` },
        ].map((f) => (
          <label key={f.label} className="block">
            <span className="flex justify-between text-sm text-muted-foreground">
              {f.label} <span className="font-semibold text-primary">{f.fmt(f.value)}</span>
            </span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </label>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border/60 pt-6 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{usd(future)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Projected value</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{usd(contributed)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total contributed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{usd(future - contributed)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Investment growth</div>
        </div>
      </div>
    </div>
  );
}

function InvestmentsPage() {
  return (
    <PageLayout
      eyebrow="Investments"
      title={
        <>
          Grow Wealth That <span className="text-primary">Lasts</span>
        </>
      }
      subtitle="From your first mutual fund to multi-generational wealth planning, Heritage Bank advisors build portfolios around your goals and risk appetite."
      image={investmentsDesk}
      imageAlt="Trading desk with market charts"
    >
      <Section
        title="Investment Products"
        description="Eight strategies covering income, growth and retirement."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map(({ icon: Icon, title: t, text, perf }, i) => (
            <Reveal key={t} delay={(i % 4) * 80}>
              <article className="group flex h-full flex-col rounded-xl border border-border/70 p-7 transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:bg-card/60 hover:shadow-xl">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5 text-primary" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{t}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                <div className="mt-5 flex items-baseline gap-2 border-t border-border/60 pt-4">
                  <span className="text-xl font-bold text-primary">+{perf}%</span>
                  <span className="text-xs text-muted-foreground">5-yr annualised</span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section alt title="Performance & Projections">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal>
            <PerformanceChart />
          </Reveal>
          <Reveal delay={120}>
            <InvestmentCalculator />
          </Reveal>
        </div>
      </Section>

      <Section title="Market Updates" description="Indicative closing levels, updated each trading day.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MARKET.map((m, i) => (
            <Reveal key={m.name} delay={(i % 3) * 80}>
              <div className="flex items-center justify-between rounded-xl border border-border/70 px-7 py-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary">
                <div>
                  <div className="font-semibold text-foreground">{m.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{m.value}</div>
                </div>
                <span
                  className={`flex items-center gap-1 text-sm font-semibold ${
                    m.up ? "text-primary" : "text-destructive"
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  {m.change}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section alt title="Risk Assessment" description="Find the allocation that matches your comfort with volatility.">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RISK.map((r, i) => (
            <Reveal key={r.level} delay={i * 90}>
              <div className="h-full rounded-xl border border-border/70 bg-background/40 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <h3 className="mt-5 text-lg font-bold text-foreground">{r.level}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{r.allocation}</p>
                <div className="mt-5 text-sm font-semibold text-primary">Target {r.target}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </PageLayout>
  );
}
