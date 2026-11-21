import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudentLookup } from "@/lib/admin-data";
import { fmtDate } from "@/lib/labels";
import { PageHeader, Section, Field, Empty, selectClass } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  head: () => ({ meta: [{ title: "Announcements — MAATRAM ONE Office" }, { name: "description", content: "Send notifications to Maatram students." }] }),
  component: Announcements,
});

function Announcements() {
  const qc = useQueryClient();
  const { students, options, name } = useStudentLookup();
  const [f, setF] = useState({ to: "all", title: "", body: "", link: "" });
  const { data: recent = [] } = useQuery({ queryKey: ["notifications", "recent"], queryFn: async () => (await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(40)).data ?? [] });
  const send = useMutation({
    mutationFn: async () => {
      const ids = f.to === "all" ? students.map((s) => s.id) : [f.to];
      if (!ids.length) throw new Error("No students to send to yet");
      const { error } = await supabase.from("notifications").insert(ids.map((user_id) => ({ user_id, title: f.title, body: f.body || null, link: f.link || null })));
      if (error) throw error;
      return ids.length;
    },
    onSuccess: (n) => { toast.success(`Sent to ${n} student${n === 1 ? "" : "s"}`); setF({ ...f, title: "", body: "" }); qc.invalidateQueries({ queryKey: ["notifications"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Overview" title="Announcements" description="Send a notification that appears in students' portal bell." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="New announcement">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
            <Field label="Send to" required>
              <select className={selectClass} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>
                <option value="all">All students ({students.length})</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Title" required><Input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
            <Field label="Message"><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
            <Field label="Open page (optional)">
              <select className={selectClass} value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })}>
                <option value="">None</option>
                {[["/student/admission", "My application"], ["/student/support", "Support & meetings"], ["/student/learning", "Learning & programmes"], ["/student/placements", "Placements"], ["/student/volunteering", "Volunteering"], ["/student/alumni", "Alumni"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Button type="submit" disabled={send.isPending}><Send /> Send</Button>
          </form>
        </Section>
        <Section title="Recently sent">
          {recent.length === 0 ? <Empty title="Nothing sent yet" /> : (
            <ul className="divide-y">{recent.map((n) => (
              <li key={n.id} className="py-2"><p className="text-sm font-semibold">{n.title}</p><p className="text-xs text-muted-foreground">{name(n.user_id)} · {fmtDate(n.created_at, true)}</p></li>
            ))}</ul>
          )}
        </Section>
      </div>
    </div>
  );
}
