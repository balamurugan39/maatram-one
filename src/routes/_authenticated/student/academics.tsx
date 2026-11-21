import type React from "react";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useMe } from "@/lib/session";
import { fmtDate, label } from "@/lib/labels";
import { openFile } from "@/lib/files";
import { PageHeader, Section, StatusBadge, Field, StatCard } from "@/components/portal/ui";
import { CrudManager } from "@/components/portal/CrudManager";
import { FileButton } from "@/components/portal/FileButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/academics")({
  head: () => ({ meta: [{ title: "Academic Record — MAATRAM ONE" }, { name: "description", content: "Your college profile, semesters, results and attendance." }] }),
  component: Academics,
});

type AP = Partial<Tables<"academic_profiles">>;

function Academics() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["academic_profile", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("academic_profiles").select("*").eq("user_id", me!.id).maybeSingle()).data,
  });
  const { data: sems = [] } = useQuery({
    queryKey: ["semesters", "*", "semester_no"],
    queryFn: async () => (await supabase.from("semesters").select("*").order("semester_no")).data ?? [],
  });
  const [p, setP] = useState<AP>({});
  useEffect(() => { if (profile) setP(profile); }, [profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("academic_profiles").upsert({
      user_id: me!.id, college: p.college ?? null, course: p.course ?? null, department: p.department ?? null, degree: p.degree ?? null,
      roll_no: p.roll_no ?? null, start_year: p.start_year ?? null, duration_years: p.duration_years ?? null, total_semesters: p.total_semesters ?? null,
      attendance_pct: p.attendance_pct ?? null,
      attendance_updated_at: p.attendance_pct !== profile?.attendance_pct ? new Date().toISOString() : profile?.attendance_updated_at ?? null,
      updated_at: new Date().toISOString(),
    });
    if (error) return void toast.error(error.message);
    toast.success("Academic profile saved");
    qc.invalidateQueries({ queryKey: ["academic_profile"] });
  }

  const num = (k: keyof AP) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.value === "" ? null : Number(e.target.value) });
  const txt = (k: keyof AP) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.value || null });
  const latest = [...sems].reverse().find((s) => s.cgpa != null);
  const arrears = sems.reduce((a, s) => a + (s.arrears ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Module 03 · Academics" title="Academic record" description="Keep your college details, semester results and attendance up to date." />
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Current CGPA" value={latest?.cgpa ?? "—"} />
        <StatCard label="Semesters recorded" value={`${sems.length}${p.total_semesters ? ` / ${p.total_semesters}` : ""}`} />
        <StatCard label="Attendance" value={p.attendance_pct != null ? `${p.attendance_pct}%` : "—"} hint={profile?.attendance_updated_at ? `Updated ${fmtDate(profile.attendance_updated_at)}` : undefined} tone={p.attendance_pct != null && p.attendance_pct < 75 ? "danger" : "default"} />
        <StatCard label="Arrears" value={arrears} tone={arrears > 0 ? "danger" : "success"} />
      </div>
      <Section title="Academic profile">
        <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="College" className="sm:col-span-2"><Input value={p.college ?? ""} onChange={txt("college")} /></Field>
          <Field label="Degree"><Input value={p.degree ?? ""} onChange={txt("degree")} placeholder="B.E. / B.Sc. / B.Com" /></Field>
          <Field label="Course / branch"><Input value={p.course ?? ""} onChange={txt("course")} /></Field>
          <Field label="Department"><Input value={p.department ?? ""} onChange={txt("department")} /></Field>
          <Field label="Roll / register no."><Input value={p.roll_no ?? ""} onChange={txt("roll_no")} /></Field>
          <Field label="Start year"><Input type="number" value={p.start_year ?? ""} onChange={num("start_year")} /></Field>
          <Field label="Duration (years)"><Input type="number" value={p.duration_years ?? ""} onChange={num("duration_years")} /></Field>
          <Field label="Total semesters"><Input type="number" value={p.total_semesters ?? ""} onChange={num("total_semesters")} /></Field>
          <Field label="Overall attendance %"><Input type="number" step="any" value={p.attendance_pct ?? ""} onChange={num("attendance_pct")} /></Field>
          <div className="flex items-end"><Button type="submit">Save profile</Button></div>
        </form>
      </Section>
      <Section title="Semesters" description="Add each semester's result and upload the result page or mark sheet. The office verifies uploads.">
        {me && (
          <CrudManager
            table="semesters"
            title="Semesters"
            addLabel="Add semester"
            orderBy="semester_no"
            ascending
            defaults={{ user_id: me.id }}
            fields={[
              { name: "semester_no", label: "Semester number", type: "number", required: true },
              { name: "academic_year", label: "Academic year", placeholder: "2025–26" },
              { name: "exam_status", label: "Exam status", type: "select", options: ["not_written", "written", "results_published"].map((v) => ({ value: v, label: label(v) })), required: true },
              { name: "completed", label: "Semester completed", type: "checkbox" },
              { name: "sgpa", label: "SGPA", type: "number" },
              { name: "cgpa", label: "CGPA", type: "number" },
              { name: "arrears", label: "Arrears", type: "number" },
            ]}
            columns={[
              { key: "semester_no", label: "Sem" },
              { key: "academic_year", label: "Year" },
              { key: "exam_status", label: "Exam", render: (r) => label(r["exam_status"]) },
              { key: "sgpa", label: "SGPA" },
              { key: "cgpa", label: "CGPA" },
              { key: "arrears", label: "Arrears" },
              { key: "verification_status", label: "Verification", render: (r) => <div><StatusBadge value={r["verification_status"]} />{r["remarks"] && <p className="mt-1 text-xs text-destructive">{r["remarks"]}</p>}</div> },
            ]}
            rowActions={(r) => (
              <>
                {r["result_file_path"] && <Button size="icon" variant="ghost" aria-label="View result" onClick={() => openFile(r["result_file_path"])}><Eye /></Button>}
                <FileButton ownerId={me.id} folder="semesters" label={r["result_file_path"] ? "Replace" : "Result"} onUploaded={async (f) => {
                  const { error } = await supabase.from("semesters").update({ result_file_path: f.path, result_file_name: f.name }).eq("id", r["id"]);
                  if (error) return void toast.error(error.message);
                  toast.success("Result uploaded");
                  qc.invalidateQueries({ queryKey: ["semesters"] });
                }} />
              </>
            )}
          />
        )}
      </Section>
    </div>
  );
}
