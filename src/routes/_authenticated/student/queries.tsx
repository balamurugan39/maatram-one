import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { useMyGroup } from "@/lib/student-data";
import { fmtDate } from "@/lib/labels";
import { PageHeader, Section, StatusBadge, Empty, Field, selectClass } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/queries")({
  head: () => ({ meta: [{ title: "My Queries — MAATRAM ONE" }, { name: "description", content: "Raise issues that need a response and resolution." }] }),
  component: Queries,
});

function Queries() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: group } = useMyGroup();
  const { data: allStaff = [] } = useQuery({ queryKey: ["support_staff"], queryFn: async () => (await supabase.from("support_staff").select("*").order("name")).data ?? [] });
  const staff = group?.team.length ? group.team : allStaff;
  const [form, setForm] = useState({ staff_id: "", title: "", description: "" });
  const { data = [] } = useQuery({
    queryKey: ["queries", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("queries").select("*").eq("user_id", me!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const staffName = Object.fromEntries(allStaff.map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Module 02 · Mentorship" title="Queries" description="For specific issues — fee doubts, college problems, document help — that need a clear response." />
      <Section title="Raise a new query">
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.from("queries").insert({ user_id: me!.id, staff_id: form.staff_id || null, title: form.title, description: form.description });
          if (error) return void toast.error(error.message);
          toast.success("Query submitted");
          setForm({ staff_id: "", title: "", description: "" });
          qc.invalidateQueries({ queryKey: ["queries"] });
        }}>
          <Field label="Send to">
            <select className={selectClass} value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })}>
              <option value="">Maatram office</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Describe the issue" required className="sm:col-span-2"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field>
          <div className="sm:col-span-2"><Button type="submit"><Send /> Submit query</Button></div>
        </form>
      </Section>
      <Section title="My queries">
        {data.length === 0 ? <Empty title="No queries yet" /> : (
          <ul className="space-y-3">
            {data.map((q) => (
              <li key={q.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{q.title}</p>
                  <StatusBadge value={q.status} />
                </div>
                <p className="text-xs text-muted-foreground">To {q.staff_id ? staffName[q.staff_id] : "Maatram office"} · {fmtDate(q.created_at, true)}</p>
                <p className="mt-2 text-sm">{q.description}</p>
                {q.response && (
                  <div className="mt-3 rounded-md border-l-4 border-accent bg-accent/10 p-3 text-sm">
                    <p className="text-xs font-semibold text-muted-foreground">Response · {fmtDate(q.responded_at, true)}</p>
                    <p className="mt-1">{q.response}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
