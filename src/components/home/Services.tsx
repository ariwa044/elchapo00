import { CircleCheck } from "lucide-react";

const SERVICES = [
  {
    title: "Personal Banking",
    description:
      "Checking, savings, and premium account options with competitive rates and no hidden fees.",
    items: ["Zero monthly fees", "Global ATM access", "Mobile check deposit", "24/7 customer support"],
  },
  {
    title: "Home Loans & Mortgages",
    description:
      "Competitive mortgage rates and personalized home financing solutions for your dream home.",
    items: ["Low interest rates", "Quick pre-approval", "First-time buyer programs", "Refinancing options"],
  },
  {
    title: "Investment Services",
    description:
      "Comprehensive wealth management and investment advisory services to grow your portfolio.",
    items: ["Portfolio management", "Retirement planning", "Risk assessment", "Market insights"],
  },
  {
    title: "Business Banking",
    description: "Tailored banking solutions for businesses of all sizes, from startups to enterprises.",
    items: ["Business accounts", "Commercial loans", "Payroll services", "Merchant solutions"],
  },
  {
    title: "Savings & CDs",
    description: "High-yield savings accounts and certificates of deposit to maximize your returns.",
    items: ["Competitive APY", "No minimum balance", "Flexible terms", "FDIC insured"],
  },
  {
    title: "Security & Insurance",
    description:
      "Comprehensive insurance products and advanced security features to protect what matters.",
    items: ["Identity protection", "Fraud monitoring", "Insurance coverage", "Secure transactions"],
  },
];

export function Services() {
  return (
    <section className="bg-background py-24">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Premium Banking Services
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            From everyday banking to complex financial planning, we provide comprehensive solutions
            tailored to your unique needs and goals.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service) => (
            <article
              key={service.title}
              className="flex flex-col rounded-lg border border-border/70 px-8 py-8"
            >
              <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <ul className="mt-6 space-y-3">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CircleCheck className="h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#"
                className="mt-8 inline-flex items-center justify-center rounded-md border border-primary bg-surface-deep px-6 py-2.5 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Learn More
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
