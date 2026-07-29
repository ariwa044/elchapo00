import { ArrowRight, Globe, ShieldCheck, Smartphone, TrendingUp } from "lucide-react";
import heroSkyline from "@/assets/hero-skyline.jpg";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Bank-Grade Security",
    description: "Advanced encryption and fraud protection",
  },
  {
    icon: TrendingUp,
    title: "Investment Growth",
    description: "Portfolio management and wealth building",
  },
  {
    icon: Globe,
    title: "Global Banking",
    description: "International transfers and currency exchange",
  },
  {
    icon: Smartphone,
    title: "24/7 Digital Access",
    description: "Mobile banking and instant notifications",
  },
];

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroSkyline}
        alt="Skyscrapers viewed from below at night"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-surface-deep/80" />

      <div className="mx-auto max-w-4xl px-6 pt-20 pb-32 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
          Heritage <span className="text-primary">Bank</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">Banking Excellence Since 1885</p>

        <h2 className="mt-16 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          Your Financial Future <span className="text-primary">Starts Here</span>
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Experience premium banking with cutting-edge technology, personalized service, and the
          trust of generations.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-md bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Open an Account
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center rounded-md border border-border bg-surface-deep px-7 py-3 text-sm font-semibold tracking-wide text-foreground uppercase transition-colors hover:border-primary hover:text-primary"
          >
            View Account
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-lg border border-border/70 bg-card/70 px-6 py-8 text-center backdrop-blur-sm"
          >
            <Icon className="mx-auto h-7 w-7 text-primary" />
            <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
