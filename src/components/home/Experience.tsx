import heritageLegacy from "@/assets/heritage-legacy.jpg";
import personalService from "@/assets/personal-service.jpg";
import digitalBanking from "@/assets/digital-banking.jpg";

const CARDS = [
  {
    image: heritageLegacy,
    alt: "Classical Heritage Bank branch illuminated at dusk",
    title: "Our Heritage Legacy",
    description:
      "Heritage Bank stands as a symbol of trust and excellence, serving communities with premium banking services for generations.",
    featured: false,
  },
  {
    image: personalService,
    alt: "Bank staff assisting smiling customers at the counter",
    title: "Personal Service Excellence",
    description:
      "Experience personalized banking with our dedicated staff, ensuring every transaction is handled with care and professionalism.",
    featured: true,
  },
  {
    image: digitalBanking,
    alt: "Professionals using the Heritage Bank mobile app",
    title: "Digital Banking Innovation",
    description:
      "Access your Heritage Bank account anywhere, anytime with our cutting-edge mobile app designed for modern banking needs.",
    featured: false,
  },
];

export function Experience() {
  return (
    <section className="bg-surface-deep py-24">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Experience Heritage Banking
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Discover why millions trust Heritage Bank for their financial journey. From our
            impressive branches to innovative digital solutions.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className={`overflow-hidden rounded-lg border bg-background/40 ${
                card.featured ? "border-primary" : "border-border/60"
              }`}
            >
              <img
                src={card.image}
                alt={card.alt}
                width={1024}
                height={640}
                loading="lazy"
                className="h-56 w-full object-cover"
              />
              <div className="px-7 py-7">
                <h3 className="text-xl font-bold text-foreground">{card.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
