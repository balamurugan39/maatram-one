import type React from "react";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/portal/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "Set a new password — MAATRAM ONE" }, { name: "robots", content: "noindex" }],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (!error && data.session) {
        setReady(true);
      } else {
        setReady(false);
      }

      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated. Please sign in.");
    await supabase.auth.signOut();
    navigate({ to: "/login/student" });
  }

  if (checking) {
    return (
      <AuthLayout
        side={{ eyebrow: "Account recovery", title: "Verifying your link.", text: "Please wait." }}
      >
        <p>Checking your password recovery link…</p>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout
        side={{
          eyebrow: "Account recovery",
          title: "Recovery link required.",
          text: "Request a fresh password reset email.",
        }}
      >
        <p>Your recovery session is missing or expired.</p>
        <Button onClick={() => navigate({ to: "/login/student" })}>Back to login</Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      side={{
        eyebrow: "Account recovery",
        title: "Set a new password.",
        text: "Choose a strong password you haven't used before.",
      }}
    >
      <h1 className="text-3xl font-semibold">New password</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Field label="New password" required>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password" required>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
