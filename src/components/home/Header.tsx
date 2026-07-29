const NAV = [
  "Home",
  "About Us",
  "Services",
  "Loans & Credit",
  "Investments",
  "Contact & Support",
  "Dashboard",
];

export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30 bg-surface-deep/80 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-6">
        <a href="#" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            H
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">Heritage Bank</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-foreground/85 transition-colors hover:text-primary"
            >
              {item}
            </a>
          ))}
        </nav>

        <a
          href="#"
          className="rounded-md border border-primary px-5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Login
        </a>
      </div>
    </header>
  );
}
