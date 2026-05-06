"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordOnly, setPasswordOnly] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setPasswordOnly(!!d.adminPasswordOnly))
      .catch(() => setPasswordOnly(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: passwordOnly ? undefined : username, password }),
    });

    setLoading(false);

    if (res.ok) {
      const from = searchParams.get("from") ?? "/admin";
      router.push(from);
      router.refresh();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "Login failed");
    }
  }

  if (passwordOnly === null) {
    return <div className="h-28 animate-pulse rounded bg-muted/40" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!passwordOnly && (
        <div className="space-y-2">
          <Label htmlFor="username" className="text-xs tracking-widest uppercase text-muted-foreground font-semibold">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-background border-border focus:border-primary transition-colors"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-xs tracking-widest uppercase text-muted-foreground font-semibold">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-background border-border focus:border-primary transition-colors"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wide"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      {/* Background mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.78_0.14_75/0.07),transparent)]"
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        {/* Logo link */}
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-semibold text-foreground hover:text-primary transition-colors">
            Pictures Please
          </Link>
        </div>

        <div className="bg-card border border-border rounded-sm shadow-sharp p-8">
          <div className="mb-7">
            <h1 className="font-display text-2xl font-semibold text-foreground mb-1">
              Admin Login
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your galleries
            </p>
            <div className="mt-4 h-px w-8 bg-primary" />
          </div>

          <Suspense fallback={<div className="h-28 animate-pulse rounded bg-muted/40" />}>
            <LoginForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
