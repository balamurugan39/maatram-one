import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { fmtDate, label } from "@/lib/labels";
import { PageHeader, Section, StatusBadge, Empty } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, CalendarClock, IndianRupee, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/placements")({
  head: () => ({ meta: [{ title: "Placements — MAATRAM ONE" }, { name: "description", content: "Jobs and internships shared by the Maatram placement team." }] }),
  component: Placements,
});

function Placements() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: ops = [] } = useQuery({ queryKey: ["opportunities", "student"], queryFn: async () => (await supabase.from("opportunities").select("*, companies(name)").order("deadline")).data ?? [] });
  const { data: apps = [] } = useQuery({ queryKey: ["opportunity_applications", me?.id], enabled: !!me, queryFn: async () => (await supabase.from("opportunity_applications").select("*").eq("user_id", me!.id)).data ?? [] });
  const { data: cgpa } = useQuery({
    queryKey: ["latest-cgpa", me?.id], enabled: !!me,
    queryFn: async () => (await supabase.from("semesters").select("cgpa").eq("user_id", me!.id).not("cgpa", "is", null).order("semester_no", { ascending: false }).limit(1)).data?.[0]?.cgpa ?? null,
  });
  const appBy = Object.fromEntries(apps.map((a) => [a.opportunity_id, a]));
  const refresh = () => qc.invalidateQueries({ queryKey: ["opportunity_applications"] });
  const open = ops.filter((o) => o.status === "open");
  const mine = ops.filter((o) => appBy[o.id]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Module 04 · Skills & Placement" title="Placements & internships" description={cgpa != null ? `Your latest CGPA: ${cgpa}` : "Add your semesters to check eligibility automatically."} />
      <Section title="My applications">
        {mine.length === 0 ? <Empty title="You haven't applied yet" /> : (
          <ul className="divide-y">
            {mine.map((o) => {
              const a = appBy[o.id]!;
              return (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div><p className="font-semibold">{o.title}</p><p className="text-xs text-muted-foreground">{o.companies?.name} · applied {fmtDate(a.created_at)}</p>{a.remarks && <p className="text-xs">{a.remarks}</p>}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={a.status} />
                    {a.status === "applied" && <Button size="sm" variant="ghost" onClick={async () => { await supabase.from("opportunity_applications").update({ status: "withdrawn" }).eq("id", a.id); refresh(); }}>Withdraw</Button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {open.length === 0 && <div className="md:col-span-3"><Empty title="No open opportunities right now" /></div>}
        {open.map((o) => {
          const eligible = o.min_cgpa == null || cgpa == null || Number(cgpa) >= Number(o.min_cgpa);
          const applied = appBy[o.id];
          return (
            <Section key={o.id} className="flex flex-col">
              <div className="flex items-center justify-between"><StatusBadge value={o.kind} text={label(o.kind)} />{o.min_cgpa && <span className="text-xs text-muted-foreground">Min CGPA {o.min_cgpa}</span>}</div>
              <h3 className="mt-3 text-lg font-semibold">{o.title}</h3>
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary"><Building2 className="size-4" />{o.companies?.name}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{o.description}</p>
              <div className="mt-3 space-y-1 text-sm">
                <p className="flex items-center gap-1.5"><MapPin className="size-3.5" />{o.location}</p>
                <p className="flex items-center gap-1.5"><IndianRupee className="size-3.5" />{o.package}</p>
                <p className="flex items-center gap-1.5"><CalendarClock className="size-3.5" />Apply by {fmtDate(o.deadline)}</p>
                {o.eligible_departments && <p className="text-xs text-muted-foreground">Eligible: {o.eligible_departments}</p>}
              </div>
              {applied ? <Button className="mt-4" variant="secondary" disabled>Applied · {label(applied.status)}</Button> : (
                <Button className="mt-4" disabled={!eligible} onClick={async () => {
                  const { error } = await supabase.from("opportunity_applications").insert({ opportunity_id: o.id, user_id: me!.id });
                  if (error) return void toast.error(error.message);
                  toast.success("Application sent"); refresh();
                }}>{eligible ? "Apply" : "Not eligible (CGPA)"}</Button>
              )}
            </Section>
          );
        })}
      </div>
    </div>
  );
}
