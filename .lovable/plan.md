## Heritage Bank homepage

Rebuild `/` as the Heritage Bank landing page, matching the screenshots: dark navy background, gold accents, white headings.

### Design tokens (src/styles.css)
- Background `#1e293b`-family navy, card surface slightly lighter navy, gold accent `#e8b53c`, muted slate text — all as oklch semantic tokens (`--background`, `--card`, `--primary` = gold, `--muted-foreground`).
- Dark-first: page renders in the dark palette by default.

### Sections (top to bottom)
1. **Header** — gold circular "H" logo + "Heritage Bank", centered nav (Home, About Us, Services, Loans & Credit, Investments, Contact & Support, Dashboard), outlined gold Login button. Nav items are non-routing anchors for now (single page).
2. **Hero** — full-bleed generated image of a low-angle skyscraper cluster, dark overlay. "Heritage Bank" (Bank in gold), "Banking Excellence Since 1885", then "Your Financial Future Starts Here" (Starts Here in gold), subcopy, gold "Open an Account →" + outlined "VIEW ACCOUNT". Below: 4 feature tiles (Bank-Grade Security, Investment Growth, Global Banking, 24/7 Digital Access) with gold icons.
3. **Stats** — "Banking Excellence by the Numbers" + 4 bordered cards: 2.5M+, $145B, 4.8%, 135+.
4. **Experience** — "Experience Heritage Banking" + 3 image cards (branch exterior at dusk, teller helping customers, colleagues with phone/tablet) — generated images, middle card gold-bordered.
5. **Services** — "Premium Banking Services" + 6 cards in a 3×2 grid, each with title, description, 4 gold check-circle bullets, outlined "Learn More" button.
6. **Footer** — brand column + Services / Company / Legal link columns, copyright line.

All copy exactly as supplied.

### Technical
- Rewrite `src/routes/index.tsx` with the page composed of small components under `src/components/home/` (Header, Hero, Stats, Experience, Services, Footer).
- Add route `head()` with Heritage Bank title/description/og tags; single H1 in the hero.
- Generate 4 images into `src/assets/` (hero skyline + 3 experience photos) and import them as ES6 imports.
- Icons from lucide-react; no hardcoded color utilities — semantic tokens only.
