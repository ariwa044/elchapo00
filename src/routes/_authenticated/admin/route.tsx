import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administrator Panel | Heritage Bank" },
      {
        name: "description",
        content:
          "Heritage Bank administrator console for approving deposits and withdrawals, funding accounts and managing customers.",
      },
      { property: "og:title", content: "Administrator Panel | Heritage Bank" },
      { property: "og:description", content: "Internal Heritage Bank administration console." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <main className="min-h-screen bg-surface-deep px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight text-foreground">
              <ShieldCheck className="h-7 w-7 text-primary" /> Administrator Panel
            </h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/admin/migrate">Database Migrations</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>

        <Outlet />
      </div>
    </main>
  );
}
