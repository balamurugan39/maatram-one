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
import { MailCheck } from "lucide-react";

type Mode = "signin" | "register" | "forgot";

export const Route = createFileRoute("/login/student")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => {
    const m = s["mode"];
    return m === "register" || m === "forgot" || m === "signin" ? { mode: m } : {};
  },
  head: () => ({
    meta: [
      { title: "Student Login — MAATRAM ONE" },
      { name: "description", content: "Sign in or register as a student to apply to Maatram Foundation and track your journey." },
      { property: "og:title", content: "Student Login — MAATRAM ONE" },
      { property: "og:description", content: "Sign in or register to apply to Maatram Foundation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentLogin,
});

function StudentLogin() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "register" | "forgot">(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    fetchMe().then((me) => {
      if (me?.role === "student") navigate({ to: "/student" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const me = await fetchMe();
        if (me?.role === "admin") {
          await supabase.auth.signOut();
          throw new Error("This is an office account. Please use the Admin login.");
        }
        qc.setQueryData(["me"], me);
        navigate({ to: "/student" });
      } else if (mode === "register") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters.");
        if (password !== confirm) throw new Error("Passwords do not match.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/login/student`, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/student" });
        else setSent("register");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("forgot");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout side={{ eyebrow: "Student portal", title: "Your education journey starts here.", text: "Register once and use the same account from admission to alumni." }}>
      {sent ? (
        <div className="rounded-2xl border bg-card p-8 text-center shadow-soft">
          <MailCheck className="mx-auto size-10 text-primary" />
          <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sent === "register"
              ? `We sent a confirmation link to ${email}. Click it to verify your email, then sign in.`
              : `If an account exists for ${email}, you'll get a link to set a new password.`}
          </p>
          <Button className="mt-6" variant="outline" onClick={() => { setSent(null); setMode("signin"); }}>Back to sign in</Button>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">Student</p>
          <h1 className="mt-1 text-3xl font-semibold">
            {mode === "signin" ? "Welcome back" : mode === "register" ? "Create your account" : "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to continue your application." : mode === "register" ? "Apply for Maatram Foundation's educational support." : "Enter your email and we'll send a reset link."}
          </p>

          {mode !== "forgot" && (
            <div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-semibold">
              {(["signin", "register"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-md py-2 transition-colors ${mode === m ? "bg-card text-foreground shadow-soft" : "text-muted-foreground"}`}>
                  {m === "signin" ? "Sign in" : "Register"}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <Field label="Full name" required><Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Priya Ramesh" /></Field>
            )}
            <Field label="Email address" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></Field>
            {mode !== "forgot" && (
              <Field label="Password" required>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              </Field>
            )}
            {mode === "register" && (
              <Field label="Confirm password" required><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" /></Field>
            )}
            {mode === "signin" && (
              <button type="button" className="text-sm font-medium text-primary hover:underline" onClick={() => setMode("forgot")}>Forgot password?</button>
            )}
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
            </Button>
            {mode === "forgot" && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("signin")}>Back to sign in</Button>
            )}
          </form>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Maatram office member? <Link to="/login/admin" className="font-semibold text-primary hover:underline">Admin login</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
