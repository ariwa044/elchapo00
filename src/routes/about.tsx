import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  Building2,
  Globe2,
  HandHeart,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { PageLayout, Section } from "@/components/site/PageLayout";
import { Reveal } from "@/components/site/Reveal";
import { Counter } from "@/components/site/Counter";
import aboutTeam from "@/assets/about-team.jpg";
import heritageLegacy from "@/assets/heritage-legacy.jpg";

const title = "About Heritage Bank — Our Mission, Vision & History";
const description =
  "Since 1885 Heritage Bank has served millions of customers worldwide. Discover our mission, vision, core values, history and why customers choose us.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

const VALUES = [
  { icon: ShieldCheck, title: "Integrity", text: "We do the right thing, every time, for every customer." },
  { icon: HandHeart, title: "Customer First", text: "Every decision starts with the people we serve." },
  { icon: Sparkles, title: "Innovation", text: "Modern technology in service of timeless banking values." },
  { icon: Globe2, title: "Inclusion", text: "Accessible banking for every community we operate in." },
  { icon: Award, title: "Excellence", text: "Relentless standards across advice, service and security." },
  { icon: Landmark, title: "Stewardship", text: "Protecting and growing wealth across generations." },
];

const STATS = [
  { to: 2.5, suffix: "M+", decimals: 1, label: "Customers" },
  { to: 45, suffix: "+", decimals: 0, label: "Countries Served" },
  { to: 1240, suffix: "", decimals: 0, label: "Branches" },
  { to: 139, suffix: "", decimals: 0, label: "Years in Business" },
];

const TIMELINE = [
  { year: "1885", title: "Founded in New York", text: "Heritage Bank opens its first branch on Financial Avenue with 12 employees." },
  { year: "1929", title: "Weathering the storm", text: "One of the few banks to honour every deposit through the Great Depression." },
  { year: "1968", title: "National expansion", text: "Branch network crosses 200 locations across the United States." },
  { year: "1995", title: "Going global", text: "First international offices open in London, Frankfurt and Singapore." },
  { year: "2008", title: "Digital banking", text: "Launch of online banking with round-the-clock account access." },
  { year: "2018", title: "Mobile-first", text: "Award-winning mobile app with biometric security reaches 1M users." },
  { year: "2024", title: "$145B under management", text: "Serving 2.5M customers across 45 countries with 1,240 branches." },
];

const WHY = [
  { title: "135+ years of stability", text: "A balance sheet built to endure every economic cycle." },
  { title: "Bank-grade security", text: "Military-grade encryption, 24/7 fraud monitoring and FDIC insurance." },
  { title: "Personalised advice", text: "Dedicated relationship managers for personal and business clients." },
  { title: "Award-winning digital", text: "Best-in-class mobile and online banking, rated 4.9/5 by customers." },
];

function AboutPage() {
  return (
    <PageLayout
      eyebrow="About Us"
      title={
        <>
          Banking Built on <span className="text-primary">Trust</span>
        </>
      }
      subtitle="Heritage Bank has helped families, founders and institutions build lasting wealth since 1885 — combining the discipline of a legacy institution with the speed of modern technology."
      image={aboutTeam}
      imageAlt="Heritage Bank executives meeting in a boardroom"
    >
      <Section>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <img
              src={heritageLegacy}
              alt="Heritage Bank headquarters at dusk"
              width={1024}
              height={640}
              loading="lazy"
              className="w-full rounded-xl border border-border/60 object-cover shadow-lg transition-transform duration-500 hover:scale-[1.02]"
            />
          </Reveal>
          <Reveal delay={120}>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A Company Introduction
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              Heritage Bank is a full-service financial institution offering personal banking,
              business banking, lending, investment advisory and wealth management. What began as a
              single branch in downtown New York now spans 45 countries and 1,240 branches, with
              $145 billion of assets under management.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Our approach is simple: pair generations of financial expertise with the technology
              customers expect today, and never compromise on security, transparency or service.
            </p>
            <a
              href="#heritage-history"
              className="mt-8 inline-flex items-center rounded-md bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 hover:opacity-90 hover:shadow-lg"
            >
              Learn More
            </a>
          </Reveal>
        </div>
      </Section>

      <Section alt>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {[
            {
              icon: Building2,
              title: "Our Mission",
              text: "To empower every customer with secure, transparent and accessible financial services that help them build a stronger future — whether that is a first savings account, a family home or a global business.",
            },
            {
              icon: Globe2,
              title: "Our Vision",
              text: "To be the world's most trusted bank: a institution where technology serves people, where advice is always in the customer's interest, and where prosperity is shared with the communities we serve.",
            },
          ].map(({ icon: Icon, title: t, text }, i) => (
            <Reveal key={t} delay={i * 120}>
              <div className="h-full rounded-xl border border-border/70 bg-card/60 p-10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/70">
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="mt-6 text-2xl font-bold text-foreground">{t}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        title="Core Values"
        description="Six principles that shape every account we open and every loan we approve."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(({ icon: Icon, title: t, text }, i) => (
            <Reveal key={t} delay={i * 80}>
              <div className="group h-full rounded-xl border border-border/70 p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary hover:bg-card/60">
                <Icon className="h-7 w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                <h3 className="mt-5 text-lg font-bold text-foreground">{t}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section
        alt
        title="Heritage Bank by the Numbers"
        description="Scale that comes from a century and a half of earned trust."
      >
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 100}>
              <div className="rounded-xl border border-border/70 bg-background/40 px-6 py-12 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary">
                <div className="text-4xl font-bold text-primary sm:text-5xl">
                  <Counter to={stat.to} suffix={stat.suffix} decimals={stat.decimals} />
                </div>
                <div className="mt-4 font-semibold text-foreground">{stat.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section title="A Message from Our CEO">
        <Reveal>
          <div className="mx-auto max-w-4xl rounded-xl border border-primary/60 bg-card/60 p-10 sm:p-14">
            <Users className="h-8 w-8 text-primary" />
            <blockquote className="mt-6 text-lg leading-relaxed text-foreground sm:text-xl">
              "When I joined Heritage Bank, I inherited a promise made in 1885: that a bank should
              be the steadiest thing in a customer's life. That promise still guides us. We invest
              in technology so your money moves faster, and in people so your questions are always
              answered by someone who cares. Thank you for trusting us with your financial future."
            </blockquote>
            <div className="mt-8">
              <div className="font-semibold text-primary">Margaret A. Whitfield</div>
              <div className="text-sm text-muted-foreground">
                Chief Executive Officer, Heritage Bank
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section
        alt
        title="Our Company History"
        description="A timeline of the moments that built Heritage Bank."
      >
        <div id="heritage-history" className="relative mx-auto max-w-3xl">
          <div className="absolute top-0 bottom-0 left-4 w-px bg-border sm:left-1/2" />
          <div className="space-y-10">
            {TIMELINE.map((item, i) => (
              <Reveal key={item.year} delay={i * 70}>
                <div
                  className={`relative pl-12 sm:w-1/2 sm:pl-0 ${
                    i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:ml-auto sm:pl-12"
                  }`}
                >
                  <span
                    className={`absolute top-2 left-[9px] h-3 w-3 rounded-full bg-primary sm:left-auto ${
                      i % 2 === 0 ? "sm:-right-[6px]" : "sm:-left-[6px]"
                    }`}
                  />
                  <div className="text-sm font-bold tracking-widest text-primary">{item.year}</div>
                  <h3 className="mt-2 text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Why Choose Heritage Bank">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {WHY.map((item, i) => (
            <Reveal key={item.title} delay={i * 90}>
              <div className="h-full rounded-xl border border-border/70 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary">
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>
    </PageLayout>
  );
}
