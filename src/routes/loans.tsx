import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Car, CreditCard, GraduationCap, Home, Briefcase, User, CheckCircle2, XCircle } from "lucide-react";
import { PageLayout, Section } from "@/components/site/PageLayout";
import { Reveal } from "@/components/site/Reveal";
import loansHome from "@/assets/loans-home.jpg";

const title = "Loans & Credit — Heritage Bank";
const description =
  "Personal, business, home, auto and education loans plus credit cards. Use our loan calculator, eligibility checker and compare Heritage Bank interest rates.";

export const Route = createFileRoute("/loans")({
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
  component: LoansPage,
});

const PRODUCTS = [
  { icon: User, title: "Personal Loan", text: "Up to $75,000 with fixed monthly repayments and no early-settlement penalty.", rate: "From 6.99% APR" },
  { icon: Briefcase, title: "Business Loan", text: "Working capital and expansion finance up to $2M with flexible drawdown.", rate: "From 7.45% APR" },
  { icon: Home, title: "Home Mortgage", text: "15 and 30-year fixed mortgages with fast pre-approval in 48 hours.", rate: "From 5.35% APR" },
  { icon: Car, title: "Auto Loan", text: "New and used vehicle finance with terms up to 84 months.", rate: "From 5.89% APR" },
  { icon: GraduationCap, title: "Education Loan", text: "Tuition and living cost funding with repayment deferred until graduation.", rate: "From 4.75% APR" },
  { icon: CreditCard, title: "Credit Cards", text: "Rewards, cashback and travel cards with 0% intro APR for 15 months.", rate: "From 14.99% APR" },
];

const RATE_TABLE = [
  { product: "Personal Loan", rate: "6.99% – 14.50%", term: "1 – 7 years", max: "$75,000" },
  { product: "Business Loan", rate: "7.45% – 15.20%", term: "1 – 10 years", max: "$2,000,000" },
  { product: "Home Mortgage", rate: "5.35% – 7.10%", term: "10 – 30 years", max: "$3,000,000" },
  { product: "Auto Loan", rate: "5.89% – 11.40%", term: "2 – 7 years", max: "$150,000" },
  { product: "Education Loan", rate: "4.75% – 9.25%", term: "5 – 15 years", max: "$200,000" },
  { product: "Credit Cards", rate: "14.99% – 24.99%", term: "Revolving", max: "$50,000" },
];

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function LoanCalculator() {
  const [amount, setAmount] = useState(50000);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(6.99);

  const { monthly, total, interest } = useMemo(() => {
    const r = rate / 100 / 12;
    const n = years * 12;
    const m = r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));
    return { monthly: m, total: m * n, interest: m * n - amount };
  }, [amount, years, rate]);

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-8">
      <h3 className="text-xl font-bold text-foreground">Loan Calculator</h3>
      <div className="mt-6 space-y-6">
        <label className="block">
          <span className="flex justify-between text-sm text-muted-foreground">
            Loan amount <span className="font-semibold text-primary">{usd(amount)}</span>
          </span>
          <input
            type="range"
            min={5000}
            max={500000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--primary)]"
          />
        </label>
        <label className="block">
          <span className="flex justify-between text-sm text-muted-foreground">
            Term <span className="font-semibold text-primary">{years} years</span>
          </span>
          <input
            type="range"
            min={1}
            max={30}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--primary)]"
          />
        </label>
        <label className="block">
          <span className="flex justify-between text-sm text-muted-foreground">
            Interest rate <span className="font-semibold text-primary">{rate.toFixed(2)}%</span>
          </span>
          <input
            type="range"
            min={3}
            max={25}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--primary)]"
          />
        </label>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-border/60 pt-6 text-center">
        <div>
          <div className="text-2xl font-bold text-primary">{usd(monthly)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Monthly payment</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{usd(interest)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total interest</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{usd(total)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Total repayable</div>
        </div>
      </div>
    </div>
  );
}

function EligibilityChecker() {
  const [income, setIncome] = useState(72000);
  const [debt, setDebt] = useState(950);
  const [score, setScore] = useState(710);
  const [employed, setEmployed] = useState(3);

  const ratio = (debt * 12) / income;
  const eligible = score >= 620 && ratio < 0.43 && employed >= 1;
  const maxLoan = Math.max(0, Math.round(((income * 0.36) / 12 - debt) * 12 * 4));

  return (
    <div className="rounded-xl border border-border/70 bg-card/60 p-8">
      <h3 className="text-xl font-bold text-foreground">Eligibility Checker</h3>
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {[
          { label: "Annual income ($)", value: income, set: setIncome, step: 1000 },
          { label: "Monthly debt payments ($)", value: debt, set: setDebt, step: 50 },
          { label: "Credit score", value: score, set: setScore, step: 5 },
          { label: "Years employed", value: employed, set: setEmployed, step: 1 },
        ].map((field) => (
          <label key={field.label} className="block text-sm">
            <span className="text-muted-foreground">{field.label}</span>
            <input
              type="number"
              step={field.step}
              value={field.value}
              onChange={(e) => field.set(Number(e.target.value))}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none transition-colors focus:border-primary"
            />
          </label>
        ))}
      </div>

      <div
        className={`mt-7 flex items-start gap-3 rounded-lg border p-5 transition-all duration-300 ${
          eligible ? "border-primary bg-primary/10" : "border-border bg-background/40"
        }`}
      >
        {eligible ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        ) : (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <div className="text-sm">
          <div className="font-semibold text-foreground">
            {eligible ? "You are likely eligible" : "Not likely eligible yet"}
          </div>
          <p className="mt-1 text-muted-foreground">
            {eligible
              ? `Based on a debt-to-income ratio of ${(ratio * 100).toFixed(1)}%, you could borrow up to ${usd(maxLoan)}.`
              : "Try reducing monthly debt, improving your credit score above 620, or extending employment history."}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Indicative only. Final decisions are subject to full application and credit assessment.
      </p>
    </div>
  );
}

function LoansPage() {
  return (
    <PageLayout
      eyebrow="Loans & Credit"
      title={
        <>
          Borrow with <span className="text-primary">Confidence</span>
        </>
      }
      subtitle="Competitive rates, transparent terms and decisions in as little as 48 hours — for homes, cars, studies and growing businesses."
      image={loansHome}
      imageAlt="Family receiving keys to their new home"
    >
      <Section
        title="Lending Products"
        description="Six borrowing options designed around real life milestones."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map(({ icon: Icon, title: t, text, rate }, i) => (
            <Reveal key={t} delay={(i % 3) * 90}>
              <article className="group flex h-full flex-col rounded-xl border border-border/70 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-primary hover:bg-card/60 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6 text-primary" />
                </span>
                <h3 className="mt-6 text-xl font-bold text-foreground">{t}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
                <div className="mt-5 text-sm font-semibold text-primary">{rate}</div>
                <a
                  href="#"
                  className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:opacity-90"
                >
                  Apply Now
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section alt title="Plan Your Loan" description="Estimate repayments and check eligibility instantly.">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal>
            <LoanCalculator />
          </Reveal>
          <Reveal delay={120}>
            <EligibilityChecker />
          </Reveal>
        </div>
      </Section>

      <Section title="Interest Rate Table" description="Representative rates, effective this month.">
        <Reveal>
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-card/60 text-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Interest Rate (APR)</th>
                  <th className="px-6 py-4 font-semibold">Term</th>
                  <th className="px-6 py-4 font-semibold">Maximum Amount</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {RATE_TABLE.map((row) => (
                  <tr
                    key={row.product}
                    className="border-t border-border/60 transition-colors hover:bg-card/40"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{row.product}</td>
                    <td className="px-6 py-4 text-primary">{row.rate}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.term}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.max}</td>
                    <td className="px-6 py-4">
                      <a
                        href="#"
                        className="inline-flex rounded-md border border-primary px-4 py-2 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Apply Now
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </Section>
    </PageLayout>
  );
}
