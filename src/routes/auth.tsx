import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Open an Account | Heritage Bank" },
      {
        name: "description",
        content:
          "Register for a Heritage Bank account or sign in to manage your balance, transfers and transactions securely.",
      },
      { property: "og:title", content: "Open an Account | Heritage Bank" },
      {
        property: "og:description",
        content: "Register or sign in to your secure Heritage Bank online banking dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(120),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, dot and underscore only"),
  date_of_birth: z.string().min(1, "Select your date of birth"),
  email: z.string().trim().email("Enter a valid email").max(255),
  country: z.string().trim().min(2, "Enter your country").max(80),
  house_address: z.string().trim().min(4, "Enter your house address").max(200),
  zip_code: z.string().trim().min(3, "Enter your zip code").max(20),
  gender: z.enum(["male", "female"], { errorMap: () => ({ message: "Select your gender" }) }),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries(form.entries());
    const parsed = registerSchema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    const { password, email, ...profile } = parsed.data;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: profile,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to Heritage Bank");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="min-h-screen bg-surface-deep px-4 py-14">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
            H
          </span>
          <span className="text-xl font-bold tracking-tight text-foreground">Heritage Bank</span>
        </Link>

        <div className="animate-in fade-in slide-in-from-bottom-4 rounded-xl border border-border/60 bg-card p-6 shadow-2xl duration-500 sm:p-8">
          <Tabs defaultValue="register">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Register</TabsTrigger>
              <TabsTrigger value="login">Sign In</TabsTrigger>
            </TabsList>

            <TabsContent value="register" className="mt-6">
              <h1 className="text-2xl font-bold text-foreground">Open your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                It only takes a minute to join 2.5M+ Heritage customers.
              </p>

              <form onSubmit={handleRegister} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="full_name" error={errors.full_name} />
                <Field label="Username" name="username" error={errors.username} />
                <Field
                  label="Date of birth"
                  name="date_of_birth"
                  type="date"
                  error={errors.date_of_birth}
                />
                <Field label="Email address" name="email" type="email" error={errors.email} />
                <Field label="Country" name="country" error={errors.country} />
                <Field label="Zip code" name="zip_code" error={errors.zip_code} />
                <div className="sm:col-span-2">
                  <Field label="House address" name="house_address" error={errors.house_address} />
                </div>
                <div>
                  <Label className="text-sm text-foreground/90">Gender</Label>
                  <div className="mt-2 flex gap-6 text-sm text-foreground/85">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="gender" value="male" className="accent-primary" />
                      Male
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="gender" value="female" className="accent-primary" />
                      Female
                    </label>
                  </div>
                  {errors.gender ? (
                    <p className="mt-1 text-xs text-destructive">{errors.gender}</p>
                  ) : null}
                </div>
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  error={errors.password}
                />

                <Button type="submit" disabled={loading} className="sm:col-span-2">
                  {loading ? "Creating account…" : "Create my account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login" className="mt-6">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to access your Heritage Bank dashboard.
              </p>
              <form onSubmit={handleLogin} className="mt-6 grid gap-4">
                <Field label="Email address" name="email" type="email" />
                <Field label="Password" name="password" type="password" />
                <Button type="submit" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  error,
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <Label htmlFor={name} className="text-sm text-foreground/90">
        {label}
      </Label>
      <Input id={name} name={name} type={type} className="mt-2" />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
