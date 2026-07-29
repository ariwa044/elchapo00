import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/home/Header";
import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { Experience } from "@/components/home/Experience";
import { Services } from "@/components/home/Services";
import { Footer } from "@/components/home/Footer";

const title = "Heritage Bank — Banking Excellence Since 1885";
const description =
  "Premium personal, business, and investment banking with cutting-edge technology, competitive rates, and the trust of generations.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Stats />
        <Experience />
        <Services />
      </main>
      <Footer />
    </div>
  );
}
