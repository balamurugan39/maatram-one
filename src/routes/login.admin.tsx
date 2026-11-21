import type React from "react";
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/portal/ui";
import { fetchMe } from "@/lib/session";
import { toast } from "sonner";
import { ShieldCheck, MailCheck } from "lucide-react";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "Office Admin Login — MAATRAM ONE" },
      { name: "description", content: "Secure sign-in for the Maatram Foundation office team." },
      { property: "og:title", content: "Office Admin Login — MAATRAM ONE" },
      {
        property: "og:description",
        content: "Secure sign-in for the Maatram Foundation office team.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [sent, setSent] = useState(false);

  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    fetchMe().then((me) => {
      if (me?.role === "admin") navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      if (forgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        setSent(true);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const me = await fetchMe();

      if (me?.role !== "admin") {
        await supabase.auth.signOut();
        throw new Error(
          "This account does not have office access. Students should use the Student login.",
        );
      }

      qc.setQueryData(["me"], me);
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      side={{
        eyebrow: "Maatram office",
        title: "Manage every student journey in one place.",
        text: "Applications, verification, mentorship, academics, placements, volunteering and alumni.",
      }}
    >
      <div className="mb-6 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
        <ShieldCheck className="size-6" />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
        Office admin
      </p>

      <h1 className="mt-1 text-3xl font-semibold">
        {forgot ? "Reset your password" : "Admin sign in"}
      </h1>

      <p className="mt-1 text-sm text-muted-foreground">
        {forgot
          ? "Enter your office email to receive a password reset link."
          : "Restricted to the authorised Maatram office account."}
      </p>

      {sent ? (
        <div className="mt-6 rounded-2xl border bg-card p-6 text-center">
          <MailCheck className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 text-xl font-semibold">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for {email}, you'll receive a password reset link.
          </p>
          <Button
            className="mt-6 w-full"
            variant="outline"
            onClick={() => {
              setSent(false);
              setForgot(false);
            }}
          >
            Back to admin login
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Field label="Email address" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </Field>

          {!forgot && (
            <Field label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
          )}

          {!forgot && (
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setForgot(true)}
            >
              Forgot password?
            </button>
          )}

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : forgot ? "Send reset link" : "Sign in to office portal"}
          </Button>

          {forgot && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setForgot(false)}
            >
              Back to admin login
            </Button>
          )}
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Are you a student?{" "}
        <Link to="/login/student" className="font-semibold text-primary hover:underline">
          Student login
        </Link>
      </p>
    </AuthLayout>
  );
}
