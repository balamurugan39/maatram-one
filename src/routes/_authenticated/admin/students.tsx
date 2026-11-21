import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStudents } from "@/lib/admin-data";
import { downloadCsv } from "@/lib/csv";
import { PageHeader, StatusBadge, Empty, Loading, StatCard } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/students")({
  head: () => ({ meta: [{ title: "Students — MAATRAM ONE Office" }, { name: "description", content: "All registered Maatram students." }] }),
  component: Students,
});

function Students() {
  const { data: students = [], isLoading } = useStudents();
  const { data: apps = [] } = useQuery({ queryKey: ["admin-applications", "all"], queryFn: async () => (await supabase.from("applications").select("id, user_id, stage, ref_no, district")).data ?? [] });
  const { data: groups = [] } = useQuery({ queryKey: ["group_members", "all"], queryFn: async () => (await supabase.from("group_members").select("user_id, group_id")).data ?? [] });
  const appBy = Object.fromEntries(apps.map((a) => [a.user_id, a]));
  const inGroup = new Set(groups.map((g) => g.user_id));
  const [q, setQ] = useState("");
  const rows = useMemo(() => students.filter((s) => !q || [s.full_name, s.email, s.phone].some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase()))), [students, q]);
  const selected = apps.filter((a) => a.stage === "selected").length;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Overview" title="Students" description="Everyone who has registered on MAATRAM ONE."
        actions={<Button variant="outline" disabled={!rows.length} onClick={() => downloadCsv(rows.map((s) => ({ name: s.full_name, email: s.email, phone: s.phone, ref_no: appBy[s.id]?.ref_no, stage: appBy[s.id]?.stage ?? "not_started", district: appBy[s.id]?.district })), "maatram-students.csv")}><Download /> Export CSV</Button>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registered" value={students.length} />
        <StatCard label="Selected scholars" value={selected} tone="success" />
        <StatCard label="In a mentorship group" value={inGroup.size} />
      </div>
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="bg-card pl-8" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        {isLoading ? <Loading /> : rows.length === 0 ? <div className="p-4"><Empty title="No students yet" hint="Students appear here after they register." /></div> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Application</TableHead><TableHead>Group</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const a = appBy[s.id];
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-semibold">{s.full_name || "—"}</TableCell>
                      <TableCell><p className="text-sm">{s.email}</p><p className="text-xs text-muted-foreground">{s.phone ?? ""}</p></TableCell>
                      <TableCell>{a && a.stage !== "draft" ? <Link to="/admin/applications/$id" params={{ id: a.id }}><StatusBadge value={a.stage} /></Link> : <StatusBadge value={a ? "draft" : "not_started"} text={a ? "Draft" : "Not started"} />}</TableCell>
                      <TableCell>{inGroup.has(s.id) ? "Yes" : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
