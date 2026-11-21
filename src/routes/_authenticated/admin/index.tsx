import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/labels";
import { downloadCsv } from "@/lib/csv";
import { PageHeader, Section, StatCard, StatusBadge, Empty, Loading } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Office Dashboard — MAATRAM ONE" }, { name: "description", content: "Maatram office admission overview." }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => (await supabase.from("applications").select("*").neq("stage", "draft").order("submitted_at", { ascending: false })).data ?? [],
  });
  const count = (stages: string[]) => apps.filter((a) => stages.includes(a.stage)).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Maatram office" title="Admission dashboard" description="All submitted student applications."
        actions={<Button variant="outline" disabled={!apps.length} onClick={() => downloadCsv(apps.map((a) => ({ ref_no: a.ref_no, name: a.full_name, email: a.email, mobile: a.mobile, district: a.district, percentage: a.percentage, stage: a.stage, submitted: a.submitted_at })), "maatram-applications.csv")}><Download /> Export CSV</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total received" value={apps.length} />
        <StatCard label="Document review" value={count(["submitted", "doc_review"])} />
        <StatCard label="Corrections needed" value={count(["doc_correction"])} tone="danger" />
        <StatCard label="Verification & interviews" value={count(["tele_verification", "pv_eligible", "pv_scheduled", "pv_review", "online_interview", "final_interview"])} />
        <StatCard label="Selected" value={count(["selected"])} tone="success" />
      </div>
      <Section title="Latest applications" actions={<Button asChild size="sm" variant="outline"><Link to="/admin/applications">View all</Link></Button>}>
        {isLoading ? <Loading /> : apps.length === 0 ? <Empty title="No applications submitted yet" /> : (
          <ul className="divide-y">
            {apps.slice(0, 10).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div><Link to="/admin/applications/$id" params={{ id: a.id }} className="font-semibold hover:text-primary hover:underline">{a.full_name}</Link><p className="text-xs text-muted-foreground">{a.ref_no} · {a.district} · {a.percentage ?? "—"}% · {fmtDate(a.submitted_at)}</p></div>
                <StatusBadge value={a.stage} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
