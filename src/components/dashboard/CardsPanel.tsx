import { Nfc, Wifi } from "lucide-react";

import { maskCard } from "@/lib/bank";
import type { Card } from "@/lib/bank";

export function VisaCard({ card }: { card: Card }) {
  return (
    <div className="group relative h-[220px] w-full max-w-[380px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b1a33] via-[#132a4d] to-[#0b1a33] p-6 shadow-2xl transition-transform duration-500 hover:-translate-y-1 hover:rotate-1">
      <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary/20 blur-2xl" />
      <div className="relative flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            H
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">HERITAGE BANK</span>
        </div>
        <span className="text-xs font-medium uppercase tracking-widest text-primary">
          {card.card_type}
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-3">
        <div className="h-8 w-11 rounded-md bg-gradient-to-br from-[#e6c98a] to-[#b48b3c]">
          <div className="mx-auto mt-1.5 h-5 w-8 rounded-sm border border-[#8a6a2c]/60" />
        </div>
        <Nfc className="h-5 w-5 rotate-90 text-white/70" />
        <Wifi className="h-4 w-4 rotate-90 text-white/40" />
      </div>

      <p className="relative mt-4 font-mono text-xl tracking-[0.15em] text-white">
        {maskCard(card.card_number)}
      </p>

      <div className="relative mt-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50">Card Holder</p>
          <p className="text-sm font-semibold text-white">{card.card_holder}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50">Expires</p>
          <p className="text-sm font-semibold text-white">
            {String(card.expiry_month).padStart(2, "0")}/{String(card.expiry_year).slice(-2)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/50">CVV</p>
          <p className="text-sm font-semibold text-white">{card.cvv}</p>
        </div>
        <span className="text-2xl font-black italic tracking-tighter text-white">VISA</span>
      </div>
    </div>
  );
}

export function CardsPanel({ cards }: { cards: Card[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h3 className="text-lg font-bold text-foreground">Manage Cards</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Every Heritage Bank customer receives a Visa debit card on account opening.
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {cards.map((card) => (
          <div key={card.id} className="space-y-3">
            <VisaCard card={card} />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="Card status" value={card.status} />
              <Info label="Card type" value={`${card.brand} ${card.card_type}`} />
              <Info label="Design" value={card.design} />
              <Info label="Contactless" value="Enabled" />
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <p className="text-sm text-muted-foreground">Your card is being issued.</p>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-deep px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-semibold capitalize text-foreground">{value}</p>
    </div>
  );
}
