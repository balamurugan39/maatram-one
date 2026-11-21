import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { PageHeader, Section, Field } from "@/components/portal/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/profile")({
  head: () => ({ meta: [{ title: "My Profile — MAATRAM ONE" }, { name: "description", content: "Your MAATRAM ONE account." }] }),
  component: Profile,
});

function Profile() {
  const me = useMe();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  useEffect(() => { if (me) { setName(me.fullName); setPhone(me.phone ?? ""); } }, [me]);

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="One identity across every MAATRAM ONE module." />
      <Section title="Personal details">
        <form className="grid gap-4 sm:grid-cols-3" onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.from("profiles").update({ full_name: name, phone: phone || null }).eq("id", me!.id);
          if (error) return void toast.error(error.message);
          toast.success("Profile updated");
          qc.invalidateQueries({ queryKey: ["me"] });
        }}>
          <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Mobile"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Email"><Input value={me?.email ?? ""} disabled /></Field>
          <div className="sm:col-span-3"><Button type="submit">Save</Button></div>
        </form>
      </Section>
      <Section title="Change password">
        <form className="grid gap-4 sm:grid-cols-3" onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) return void toast.error("Password must be at least 8 characters.");
          const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as { password: string });
          if (error) return void toast.error(error.message);
          toast.success("Password changed");
          setCur(""); setPw("");
        }}>
          <Field label="Current password"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required autoComplete="current-password" /></Field>
          <Field label="New password"><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="new-password" /></Field>
          <div className="flex items-end"><Button type="submit" variant="outline">Update password</Button></div>
        </form>
      </Section>
    </div>
  );
}
