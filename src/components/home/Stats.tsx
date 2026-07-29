const STATS = [
  { value: "2.5M+", label: "Trusted Customers", note: "Banking with confidence" },
  { value: "$145B", label: "Assets Under Management", note: "Growing your wealth" },
  { value: "4.8%", label: "Average Savings APY", note: "Competitive returns" },
  { value: "135+", label: "Years of Excellence", note: "Banking heritage since 1885" },
];

export function Stats() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Banking Excellence by the Numbers
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Our commitment to financial excellence is reflected in our growth, customer
            satisfaction, and the trust placed in us by millions.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-border/70 px-6 py-10 text-center"
            >
              <div className="text-4xl font-bold text-primary sm:text-5xl">{stat.value}</div>
              <div className="mt-4 font-semibold text-foreground">{stat.label}</div>
              <p className="mt-2 text-sm text-muted-foreground">{stat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
