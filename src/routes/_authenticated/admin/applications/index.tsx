import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMISSION_STAGES, DISTRICTS, fmtDate } from "@/lib/labels";
import { downloadCsv } from "@/lib/csv";
import { PageHeader, StatusBadge, Empty, Loading, selectClass } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/applications/")({
  head: () => ({ meta: [{ title: "Applications — MAATRAM ONE Office" }, { name: "description", content: "Review and process student admission applications." }] }),
  component: ApplicationsList,
});

function ApplicationsList() {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [district, setDistrict] = useState("");
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => (await supabase.from("applications").select("*").neq("stage", "draft").order("submitted_at", { ascending: false })).data ?? [],
  });
  const rows = useMemo(() => apps.filter((a) => {
    if (stage && a.stage !== stage) return false;
    if (district && a.district !== district) return false;
    if (q) {
      const s = q.toLowerCase();
      return [a.full_name, a.ref_no, a.email, a.mobile, a.school_name].some((v) => String(v ?? "").toLowerCase().includes(s));
    }
    return true;
  }), [apps, q, stage, district]);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Module 01 · Admission" title="Applications" description="Open an application to verify documents, record tele-verification, assign PV volunteers, schedule interviews and record the decision."
        actions={<Button variant="outline" disabled={!rows.length} onClick={() => downloadCsv(rows.map((a) => ({
          ref_no: a.ref_no, name: a.full_name, email: a.email, mobile: a.mobile, gender: a.gender, dob: a.dob, district: a.district, locality: a.locality, pincode: a.pincode,
          school: a.school_name, board: a.board, stream: a.stream, percentage: a.percentage, family_income: a.family_income, interested_course: a.interested_course,
          stage: a.stage, final_decision: a.final_decision, assigned_to: a.assigned_to, submitted: a.submitted_at,
        })), "maatram-applications.csv")}><Download /> Export CSV</Button>} />
      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, reference, phone…" className="bg-card pl-8" />
        </div>
        <select className={`${selectClass} w-auto`} value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="">All stages</option>
          {ADMISSION_STAGES.filter((s) => s.key !== "draft").map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className={`${selectClass} w-auto`} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="">All districts</option>
          {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        {isLoading ? <Loading /> : rows.length === 0 ? <div className="p-4"><Empty title="No applications found" hint="Submitted student applications appear here." /></div> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead>Reference</TableHead><TableHead>Student</TableHead><TableHead>District</TableHead><TableHead>%</TableHead><TableHead>Submitted</TableHead><TableHead>Stage</TableHead><TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.ref_no ?? "—"}</TableCell>
                    <TableCell><p className="font-semibold">{a.full_name}</p><p className="text-xs text-muted-foreground">{a.mobile ?? a.email}</p></TableCell>
                    <TableCell>{a.district ?? "—"}</TableCell>
                    <TableCell>{a.percentage ?? "—"}</TableCell>
                    <TableCell>{fmtDate(a.submitted_at)}</TableCell>
                    <TableCell><StatusBadge value={a.stage} /></TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline"><Link to="/admin/applications/$id" params={{ id: a.id }}>Open <ChevronRight /></Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
