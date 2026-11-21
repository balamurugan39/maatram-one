import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ADMISSION_STAGES, DOC_TYPES, fmtDate, label } from "@/lib/labels";
import { openFile } from "@/lib/files";
import { suggestVolunteers } from "@/lib/volunteer-match";
import { PageHeader, Section, StatusBadge, Field, Loading, KV, Empty, selectClass } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Eye, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/applications/$id")({
  head: () => ({ meta: [{ title: "Review Application — MAATRAM ONE Office" }, { name: "description", content: "Review a student's admission application." }] }),
  component: ReviewPage,
});

type App = Tables<"applications">;
type Stage = App["stage"];

function useApp(id: string) {
  return useQuery({
    queryKey: ["admin-app", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useSetStage(app: App) {
  const qc = useQueryClient();
  return async (stage: Stage, extra: Partial<App> = {}) => {
    const { error } = await supabase.from("applications").update({ ...extra, stage }).eq("id", app.id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["admin-app", app.id] });
    qc.invalidateQueries({ queryKey: ["admin-applications"] });
  };
}

function ReviewPage() {
  const { id } = Route.useParams();
  const { data: app, isLoading } = useApp(id);
  if (isLoading) return <Loading />;
  if (!app) return <Empty title="Application not found"><Button asChild variant="outline"><Link to="/admin/applications">Back to applications</Link></Button></Empty>;
  return <Review app={app} />;
}

function Review({ app }: { app: App }) {
  const setStage = useSetStage(app);
  const [stage, setStageValue] = useState<string>(app.stage);
  const [assigned, setAssigned] = useState(app.assigned_to ?? "");
  const [busy, setBusy] = useState(false);

  async function saveStage() {
    setBusy(true);
    try {
      await setStage(stage, { assigned_to: assigned || null });
      toast.success("Application updated — the student has been notified");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not update"); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/admin/applications"><ArrowLeft /> All applications</Link></Button>
      <PageHeader eyebrow={app.ref_no ?? "Application"} title={app.full_name} description={`${app.district ?? "—"} · ${app.mobile ?? app.email ?? ""} · submitted ${fmtDate(app.submitted_at)}`}
        actions={<StatusBadge value={app.stage} />} />

      <Section title="Stage & owner" description="Moving the stage sends the student a notification.">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Current stage">
            <select className={selectClass} value={stage} onChange={(e) => setStageValue(e.target.value)}>
              {ADMISSION_STAGES.filter((s) => s.key !== "draft").map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Assigned office member"><Input value={assigned} onChange={(e) => setAssigned(e.target.value)} placeholder="e.g. Kavitha" /></Field>
          <Button onClick={saveStage} disabled={busy}><Save /> Save</Button>
        </div>
      </Section>

      <Tabs defaultValue="details">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tele">Tele-verification</TabsTrigger>
          <TabsTrigger value="pv">Physical verification</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="decision">Decision & notes</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4"><Details app={app} /></TabsContent>
        <TabsContent value="documents"><Documents app={app} /></TabsContent>
        <TabsContent value="tele"><Tele app={app} /></TabsContent>
        <TabsContent value="pv"><PV app={app} /></TabsContent>
        <TabsContent value="interviews"><Interviews app={app} /></TabsContent>
        <TabsContent value="decision"><Decision app={app} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Details({ app }: { app: App }) {
  const yes = (b: boolean | null) => (b === null ? "—" : b ? "Yes" : "No");
  return (
    <>
      <Section title="A · Personal"><KV items={[["Full name", app.full_name], ["Date of birth", fmtDate(app.dob)], ["Gender", app.gender], ["Mobile", app.mobile], ["Email", app.email]]} /></Section>
      <Section title="B · Address"><KV items={[["Address", app.address], ["Locality", app.locality], ["District", app.district], ["Pincode", app.pincode]]} /></Section>
      <Section title="C · Academics"><KV items={[["School", app.school_name], ["Board", app.board], ["Stream", app.stream], ["Subjects", app.subjects], ["Completion year", app.completion_year], ["Marks", app.marks_obtained !== null ? `${app.marks_obtained} / ${app.total_marks ?? "—"}` : null], ["Percentage", app.percentage !== null ? `${app.percentage}%` : null]]} /></Section>
      <Section title="D · Family"><KV items={[["Father", app.father_name], ["Father's occupation", app.father_occupation], ["Mother", app.mother_name], ["Mother's occupation", app.mother_occupation], ["Guardian", app.guardian_name ? `${app.guardian_name} (${app.guardian_relation ?? ""}) ${app.guardian_phone ?? ""}` : null], ["Family members", app.family_members], ["Annual income (₹)", app.family_income], ["Background", app.family_background]]} /></Section>
      <Section title="E · Preferences"><KV items={[["Interested course", app.interested_course], ["Preferred stream", app.preferred_stream], ["Preferred area", app.preferred_area], ["Willing — Chennai", yes(app.willing_chennai)], ["Willing — outside Chennai", yes(app.willing_outside_chennai)], ["Willing to relocate", yes(app.willing_relocate)], ["Other preferences", app.other_preferences]]} /></Section>
    </>
  );
}

/* ---------- Documents ---------- */
function Documents({ app }: { app: App }) {
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["admin-docs", app.id],
    queryFn: async () => (await supabase.from("application_documents").select("*").eq("application_id", app.id)).data ?? [],
  });
  const byType = Object.fromEntries(docs.map((d) => [d.doc_type, d]));
  const types = [...DOC_TYPES.map((d) => d.key), ...docs.map((d) => d.doc_type).filter((t) => !DOC_TYPES.some((d) => d.key === t))];
  const setStage = useSetStage(app);
  const allRequiredVerified = DOC_TYPES.filter((d) => d.required).every((d) => byType[d.key]?.status === "verified");

  if (isLoading) return <Loading />;
  return (
    <Section title="Documents" description="Mark each document verified, or request a correction. The student is notified automatically."
      actions={<div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setStage("doc_correction").then(() => toast.success("Correction requested")).catch((e: Error) => toast.error(e.message))}>Request corrections</Button>
        <Button size="sm" disabled={!allRequiredVerified} onClick={() => setStage("tele_verification").then(() => toast.success("Moved to tele-verification")).catch((e: Error) => toast.error(e.message))}>All clear → tele-verification</Button>
      </div>}>
      <ul className="divide-y">
        {types.map((t) => <DocRow key={t} app={app} type={t} doc={byType[t]} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-docs", app.id] })} />)}
      </ul>
    </Section>
  );
}

function DocRow({ app, type, doc, onSaved }: { app: App; type: string; doc: Tables<"application_documents"> | undefined; onSaved: () => void }) {
  const [status, setStatus] = useState(doc?.status ?? "missing");
  const [remarks, setRemarks] = useState(doc?.remarks ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const res = doc
        ? await supabase.from("application_documents").update({ status, remarks: remarks || null }).eq("id", doc.id)
        : await supabase.from("application_documents").insert({ application_id: app.id, user_id: app.user_id, doc_type: type, status, remarks: remarks || null });
      if (res.error) throw res.error;
    },
    onSuccess: () => { toast.success(`${type} saved`); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <li className="grid gap-3 py-3 md:grid-cols-[1.3fr_1fr_1.5fr_auto] md:items-center">
      <div>
        <p className="font-semibold">{type}</p>
        <p className="text-xs text-muted-foreground">{doc?.file_name ? `${doc.file_name} · ${fmtDate(doc.uploaded_at, true)}` : "Not uploaded"}</p>
      </div>
      <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>
        {["pending_review", "verified", "invalid", "missing", "reupload_required"].map((s) => <option key={s} value={s}>{label(s)}</option>)}
      </select>
      <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks for the student" />
      <div className="flex gap-1">
        {doc?.file_path && <Button size="icon" variant="outline" aria-label="View file" onClick={() => openFile(doc.file_path)}><Eye /></Button>}
        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
      </div>
    </li>
  );
}

/* ---------- Tele-verification ---------- */
function Tele({ app }: { app: App }) {
  const qc = useQueryClient();
  const setStage = useSetStage(app);
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-tele", app.id],
    queryFn: async () => (await supabase.from("tele_verifications").select("*").eq("application_id", app.id).order("conducted_at", { ascending: false })).data ?? [],
  });
  const [f, setF] = useState({ conducted_by: "", contacted: true, outcome: "successful", remarks: "", clarification: "" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tele_verifications").insert({
        application_id: app.id, conducted_by: f.conducted_by, contacted: f.contacted, outcome: f.outcome, remarks: f.remarks || null, clarification: f.clarification || null,
      });
      if (error) throw error;
      if (f.outcome === "successful") await setStage("pv_eligible");
    },
    onSuccess: () => {
      toast.success(f.outcome === "successful" ? "Recorded — student moved to PV eligible" : "Tele-verification recorded");
      setF({ conducted_by: f.conducted_by, contacted: true, outcome: "successful", remarks: "", clarification: "" });
      qc.invalidateQueries({ queryKey: ["admin-tele", app.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Record a call" description="A successful call moves the student to PV eligible.">
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Field label="Conducted by" required><Input required value={f.conducted_by} onChange={(e) => setF({ ...f, conducted_by: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={f.contacted} onChange={(e) => setF({ ...f, contacted: e.target.checked })} /> Student / family reached</label>
          <Field label="Outcome" required>
            <select className={selectClass} value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })}>
              {["successful", "clarification_required", "pending", "unsuccessful"].map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </Field>
          <Field label="Remarks"><Textarea value={f.remarks} onChange={(e) => setF({ ...f, remarks: e.target.value })} /></Field>
          {f.outcome === "clarification_required" && <Field label="Clarification needed"><Textarea value={f.clarification} onChange={(e) => setF({ ...f, clarification: e.target.value })} /></Field>}
          <Button type="submit" disabled={add.isPending}>Save call record</Button>
        </form>
      </Section>
      <Section title="Call history">
        {rows.length === 0 ? <Empty title="No calls recorded yet" /> : (
          <ul className="divide-y">{rows.map((r) => (
            <li key={r.id} className="py-3">
              <div className="flex items-center justify-between gap-2"><p className="font-semibold">{r.conducted_by}</p><StatusBadge value={r.outcome} /></div>
              <p className="text-xs text-muted-foreground">{fmtDate(r.conducted_at, true)} · {r.contacted ? "Reached" : "Not reached"}</p>
              {r.remarks && <p className="mt-1 text-sm">{r.remarks}</p>}
              {r.clarification && <p className="mt-1 text-sm text-warning-foreground">Clarification: {r.clarification}</p>}
            </li>
          ))}</ul>
        )}
      </Section>
    </div>
  );
}

/* ---------- Physical verification ---------- */
function PV({ app }: { app: App }) {
  const qc = useQueryClient();
  const setStage = useSetStage(app);
  const { data: vols = [] } = useQuery({ queryKey: ["volunteers"], queryFn: async () => (await supabase.from("volunteers").select("*").order("name")).data ?? [] });
  const { data: allPv = [] } = useQuery({ queryKey: ["pv_assignments", "all"], queryFn: async () => (await supabase.from("pv_assignments").select("*")).data ?? [] });
  const mine = allPv.filter((p) => p.application_id === app.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const workload: Record<string, number> = {};
  for (const p of allPv) if (p.volunteer_id && (p.status === "assigned" || p.status === "scheduled")) workload[p.volunteer_id] = (workload[p.volunteer_id] ?? 0) + 1;
  const suggested = suggestVolunteers(vols, { district: app.district, locality: app.locality, pincode: app.pincode }, workload);
  const [volId, setVolId] = useState("");
  const [date, setDate] = useState("");

  const assign = useMutation({
    mutationFn: async () => {
      const v = vols.find((x) => x.id === volId);
      if (!v) throw new Error("Choose a volunteer");
      const { error } = await supabase.from("pv_assignments").insert({
        application_id: app.id, user_id: app.user_id, volunteer_id: v.id, volunteer_name: v.name, volunteer_phone: v.phone, visit_date: date || null, status: date ? "scheduled" : "assigned",
      });
      if (error) throw error;
      await setStage("pv_scheduled");
    },
    onSuccess: () => { toast.success("Volunteer assigned — student notified"); setVolId(""); setDate(""); qc.invalidateQueries({ queryKey: ["pv_assignments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Section title="Assign a PV volunteer" description={`Suggestions match ${app.locality ?? "locality"}, ${app.district ?? "district"} ${app.pincode ?? ""} and current workload.`}>
        {suggested.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {suggested.slice(0, 5).map((v) => (
              <button key={v.id} type="button" onClick={() => setVolId(v.id)} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${volId === v.id ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
                <p className="font-semibold">{v.name}</p><p className="text-xs text-muted-foreground">{v.locality ?? v.district} · {workload[v.id] ?? 0} active</p>
              </button>
            ))}
          </div>
        )}
        <form className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); assign.mutate(); }}>
          <Field label="Volunteer" required>
            <select className={selectClass} required value={volId} onChange={(e) => setVolId(e.target.value)}>
              <option value="">Select…</option>
              {vols.filter((v) => v.available).map((v) => <option key={v.id} value={v.id}>{v.name} — {v.locality ?? v.district ?? ""}</option>)}
            </select>
          </Field>
          <Field label="Visit date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Button type="submit" disabled={assign.isPending}>Assign</Button>
        </form>
        {vols.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No volunteers yet. Add them under <Link to="/admin/volunteers" className="font-semibold text-primary">PV volunteers</Link>.</p>}
      </Section>
      <Section title="Visits & reports">
        {mine.length === 0 ? <Empty title="No visits assigned yet" /> : <div className="space-y-3">{mine.map((p) => <PvReport key={p.id} pv={p} app={app} />)}</div>}
      </Section>
    </div>
  );
}

function PvReport({ pv, app }: { pv: Tables<"pv_assignments">; app: App }) {
  const qc = useQueryClient();
  const setStage = useSetStage(app);
  const [f, setF] = useState({ visit_date: pv.visit_date ?? "", status: pv.status, outcome: pv.outcome ?? "", findings: pv.findings ?? "", recommendations: pv.recommendations ?? "", office_decision: pv.office_decision ?? "" });
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pv_assignments").update({
        visit_date: f.visit_date || null, status: f.status, outcome: f.outcome || null, findings: f.findings || null, recommendations: f.recommendations || null, office_decision: f.office_decision || null,
      }).eq("id", pv.id);
      if (error) throw error;
      if (f.status === "completed" && pv.status !== "completed") {
        if (pv.volunteer_id) {
          const { data: v } = await supabase.from("volunteers").select("completed_visits").eq("id", pv.volunteer_id).maybeSingle();
          if (v) await supabase.from("volunteers").update({ completed_visits: v.completed_visits + 1 }).eq("id", pv.volunteer_id);
        }
        if (app.stage === "pv_scheduled") await setStage("pv_review");
      }
    },
    onSuccess: () => { toast.success("Report saved"); qc.invalidateQueries({ queryKey: ["pv_assignments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><p className="font-semibold">{pv.volunteer_name ?? "Volunteer"}</p><p className="text-xs text-muted-foreground">{pv.volunteer_phone ?? ""} · assigned {fmtDate(pv.created_at)}</p></div>
        <StatusBadge value={pv.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Visit date"><Input type="date" value={f.visit_date} onChange={(e) => setF({ ...f, visit_date: e.target.value })} /></Field>
        <Field label="Status"><select className={selectClass} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{["assigned", "scheduled", "completed", "cancelled"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
        <Field label="Outcome"><select className={selectClass} value={f.outcome} onChange={(e) => setF({ ...f, outcome: e.target.value })}><option value="">—</option>{["successful", "clarification_required", "incomplete", "unsuccessful"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
        <Field label="Findings" className="sm:col-span-3"><Textarea value={f.findings} onChange={(e) => setF({ ...f, findings: e.target.value })} /></Field>
        <Field label="Volunteer recommendation" className="sm:col-span-3"><Textarea value={f.recommendations} onChange={(e) => setF({ ...f, recommendations: e.target.value })} /></Field>
        <Field label="Office decision on report" className="sm:col-span-3"><Input value={f.office_decision} onChange={(e) => setF({ ...f, office_decision: e.target.value })} /></Field>
      </div>
      <Button className="mt-3" size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save report</Button>
    </div>
  );
}

/* ---------- Interviews ---------- */
function Interviews({ app }: { app: App }) {
  const qc = useQueryClient();
  const setStage = useSetStage(app);
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-interviews", app.id],
    queryFn: async () => (await supabase.from("interviews").select("*").eq("application_id", app.id).order("scheduled_at", { ascending: false })).data ?? [],
  });
  const [f, setF] = useState({ kind: "online", scheduled_at: "", mode_detail: "", panel: "" });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("interviews").insert({
        application_id: app.id, user_id: app.user_id, kind: f.kind, scheduled_at: f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null, mode_detail: f.mode_detail || null, panel: f.panel || null,
      });
      if (error) throw error;
      await setStage(f.kind === "online" ? "online_interview" : "final_interview");
    },
    onSuccess: () => { toast.success("Interview scheduled — student notified"); setF({ kind: f.kind, scheduled_at: "", mode_detail: "", panel: "" }); qc.invalidateQueries({ queryKey: ["admin-interviews", app.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="space-y-4">
      <Section title="Schedule an interview">
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); add.mutate(); }}>
          <Field label="Round" required><select className={selectClass} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="online">Online interview</option><option value="final">Final interview</option></select></Field>
          <Field label="Date & time" required><Input required type="datetime-local" value={f.scheduled_at} onChange={(e) => setF({ ...f, scheduled_at: e.target.value })} /></Field>
          <Field label="Meeting link / venue"><Input value={f.mode_detail} onChange={(e) => setF({ ...f, mode_detail: e.target.value })} placeholder="Google Meet link or office address" /></Field>
          <Field label="Panel"><Input value={f.panel} onChange={(e) => setF({ ...f, panel: e.target.value })} placeholder="Interviewer names" /></Field>
          <div className="sm:col-span-2"><Button type="submit" disabled={add.isPending}>Schedule</Button></div>
        </form>
      </Section>
      <Section title="Interview history">
        {rows.length === 0 ? <Empty title="No interviews yet" /> : <div className="space-y-3">{rows.map((r) => <InterviewRow key={r.id} iv={r} />)}</div>}
      </Section>
    </div>
  );
}

function InterviewRow({ iv }: { iv: Tables<"interviews"> }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(iv.status);
  const [outcome, setOutcome] = useState(iv.outcome ?? "");
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("interviews").update({ status, outcome: outcome || null }).eq("id", iv.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Interview updated"); qc.invalidateQueries({ queryKey: ["admin-interviews", iv.application_id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
      <div><p className="font-semibold">{label(iv.kind)} interview</p><p className="text-xs text-muted-foreground">{fmtDate(iv.scheduled_at, true)} · {iv.mode_detail ?? ""} {iv.panel ? `· Panel: ${iv.panel}` : ""}</p></div>
      <Field label="Status"><select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)}>{["scheduled", "completed", "rescheduled", "absent", "cancelled"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
      <Field label="Outcome"><select className={selectClass} value={outcome} onChange={(e) => setOutcome(e.target.value)}><option value="">—</option>{["recommended", "not_recommended", "hold"].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></Field>
      <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
    </div>
  );
}

/* ---------- Decision & notes ---------- */
function Decision({ app }: { app: App }) {
  const qc = useQueryClient();
  const setStage = useSetStage(app);
  const [decision, setDecision] = useState(app.final_decision ?? "");
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState(app.assigned_to ?? "");
  const { data: notes = [] } = useQuery({
    queryKey: ["admin-notes", app.id],
    queryFn: async () => (await supabase.from("internal_notes").select("*").eq("application_id", app.id).order("created_at", { ascending: false })).data ?? [],
  });
  const decide = useMutation({
    mutationFn: async () => {
      if (!decision) throw new Error("Choose a decision");
      await setStage(decision, { final_decision: decision });
    },
    onSuccess: () => toast.success("Final decision recorded — student notified"),
    onError: (e: Error) => toast.error(e.message),
  });
  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("internal_notes").insert({ application_id: app.id, note, author: author || null, stage: app.stage });
      if (error) throw error;
    },
    onSuccess: () => { setNote(""); qc.invalidateQueries({ queryKey: ["admin-notes", app.id] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Section title="Final decision" description={app.decided_at ? `Last decided ${fmtDate(app.decided_at, true)}` : "Selected students unlock the full student portal."}>
        <div className="flex flex-wrap gap-2">
          {(["selected", "not_selected", "on_hold"] as const).map((d) => (
            <Button key={d} type="button" variant={decision === d ? "default" : "outline"} onClick={() => setDecision(d)}>{label(d)}</Button>
          ))}
        </div>
        <Button className="mt-4" onClick={() => decide.mutate()} disabled={decide.isPending || !decision}>Record decision</Button>
      </Section>
      <Section title="Internal notes" description="Only the office can see these.">
        <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); addNote.mutate(); }}>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
          <Textarea required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" />
          <Button type="submit" size="sm" disabled={addNote.isPending}>Add note</Button>
        </form>
        <ul className="mt-4 divide-y">
          {notes.map((n) => (
            <li key={n.id} className="py-2"><p className="text-sm">{n.note}</p><p className="text-xs text-muted-foreground">{n.author ?? "Office"} · {label(n.stage)} · {fmtDate(n.created_at, true)}</p></li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
