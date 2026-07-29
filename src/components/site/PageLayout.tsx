import type { ReactNode } from "react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Reveal } from "@/components/site/Reveal";

type PageLayoutProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  image: string;
  imageAlt: string;
  children: ReactNode;
};

export function PageLayout({
  eyebrow,
  title,
  subtitle,
  image,
  imageAlt,
  children,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src={image}
            alt={imageAlt}
            width={1024}
            height={640}
            className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-surface-deep/85" />
          <div className="mx-auto max-w-[1400px] px-6 py-24 text-center sm:py-32">
            <Reveal>
              <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                {title}
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {subtitle}
              </p>
            </Reveal>
          </div>
        </section>
        {children}
      </main>
      <Footer />
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  alt = false,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  alt?: boolean;
}) {
  return (
    <section className={`${alt ? "bg-surface-deep" : "bg-background"} py-20 sm:py-24`}>
      <div className="mx-auto max-w-[1400px] px-6">
        {title ? (
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h2>
              {description ? (
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">{description}</p>
              ) : null}
            </div>
          </Reveal>
        ) : null}
        <div className={title ? "mt-14" : ""}>{children}</div>
      </div>
    </section>
  );
}
