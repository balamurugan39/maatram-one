import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { fmtDate, label } from "@/lib/labels";
import { PageHeader, Section, StatusBadge, Empty, StatCard } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarDays, MapPin, Users } from "lucide-react";

const KIND: Record<string, string> = { tele_verification: "Tele-verification", physical_verification: "Physical verification", school_visit: "School visit", event_assistance: "Event assistance", karpom_karpippom: "Karpom Karpippom", outreach: "Outreach" };

export const Route = createFileRoute("/_authenticated/student/volunteering")({
  head: () => ({ meta: [{ title: "Volunteering — MAATRAM ONE" }, { name: "description", content: "Give back through Maatram volunteering activities." }] }),
  component: Volunteering,
});

function Volunteering() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: acts = [] } = useQuery({ queryKey: ["volunteer_activities", "student"], queryFn: async () => (await supabase.from("volunteer_activities").select("*").order("activity_date", { ascending: false })).data ?? [] });
  const { data: resp = [] } = useQuery({ queryKey: ["activity_responses", me?.id], enabled: !!me, queryFn: async () => (await supabase.from("activity_responses").select("*").eq("user_id", me!.id)).data ?? [] });
  const by = Object.fromEntries(resp.map((r) => [r.activity_id, r]));
  const published = acts.filter((a) => a.status === "published");
  const history = acts.filter((a) => by[a.id]);
  const completed = resp.filter((r) => r.assignment === "completed");
  const hours = completed.reduce((s, r) => s + Number(r.hours ?? 0), 0);

  async function respond(id: string, response: "interested" | "not_available") {
    const { error } = await supabase.from("activity_responses").upsert({ activity_id: id, user_id: me!.id, response });
    if (error) return void toast.error(error.message);
    toast.success(response === "interested" ? "Marked as interested" : "Marked not available");
    qc.invalidateQueries({ queryKey: ["activity_responses"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Module 05 · Volunteering" title="Volunteering" description="Respond to activities. The office assigns volunteers from those who are interested." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Activities responded" value={resp.length} />
        <StatCard label="Completed" value={completed.length} tone="success" />
        <StatCard label="Volunteer hours" value={hours} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {published.length === 0 && <div className="md:col-span-3"><Empty title="No open activities" /></div>}
        {published.map((a) => {
          const r = by[a.id];
          return (
            <Section key={a.id} className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-glow">{KIND[a.kind]}</span>
              <h3 className="mt-1 text-lg font-semibold">{a.title}</h3>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{a.description}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{fmtDate(a.activity_date)}</p>
                <p className="flex items-center gap-1.5"><MapPin className="size-3.5" />{a.location}</p>
                {a.slots && <p className="flex items-center gap-1.5"><Users className="size-3.5" />{a.slots} volunteers needed</p>}
              </div>
              {r && r.assignment !== "pending" ? (
                <div className="mt-4"><StatusBadge value={r.assignment} /></div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant={r?.response === "interested" ? "default" : "outline"} onClick={() => respond(a.id, "interested")}>Interested</Button>
                  <Button size="sm" variant={r?.response === "not_available" ? "secondary" : "ghost"} onClick={() => respond(a.id, "not_available")}>Not available</Button>
                </div>
              )}
            </Section>
          );
        })}
      </div>
      <Section title="My volunteering history">
        {history.length === 0 ? <Empty title="No history yet" /> : (
          <ul className="divide-y">
            {history.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{KIND[a.kind]} · {fmtDate(a.activity_date)}</p></div>
                <div className="flex items-center gap-2 text-xs"><span>{label(by[a.id]!.response)}</span><StatusBadge value={by[a.id]!.assignment} />{by[a.id]!.hours ? <span>{by[a.id]!.hours} h</span> : null}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
