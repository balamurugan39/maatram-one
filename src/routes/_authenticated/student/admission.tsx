import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { useMe } from "@/lib/session";
import { useMyApplication, type Application } from "@/lib/student-data";
import { DISTRICTS, DOC_TYPES, JOURNEY, calcPercentage, fmtDate, journeyIndex, label } from "@/lib/labels";
import { openFile } from "@/lib/files";
import { PageHeader, Section, StatusBadge, Field, Loading, KV, selectClass, Empty } from "@/components/portal/ui";
import { FileButton } from "@/components/portal/FileButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AlertTriangle, Check, CheckCircle2, Eye, FileText, PartyPopper, Phone, Save, Send, UserCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/admission")({
  head: () => ({ meta: [{ title: "My Application — MAATRAM ONE" }, { name: "description", content: "Fill, submit and track your Maatram admission application." }] }),
  component: AdmissionPage,
});

function AdmissionPage() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: app, isLoading } = useMyApplication();

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").insert({ user_id: me!.id, full_name: me!.fullName, email: me!.email, stage: "draft" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-application"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!isLoading && app === null && me && !create.isPending && !create.isSuccess) create.mutate();
  }, [isLoading, app, me, create]);

  if (isLoading || !app) return <Loading text="Preparing your application…" />;
  return app.stage === "draft" ? <ApplicationForm app={app} /> : <ApplicationStatus app={app} />;
}

/* ---------------- Documents ---------------- */

function useDocs(appId: string) {
  return useQuery({
    queryKey: ["my-docs", appId],
    queryFn: async () => {
      const { data, error } = await supabase.from("application_documents").select("*").eq("application_id", appId);
      if (error) throw error;
      return data;
    },
  });
}

function DocumentsTable({ app, editable }: { app: Application; editable: boolean }) {
  const me = useMe();
  const qc = useQueryClient();
  const { data: docs = [] } = useDocs(app.id);
  const byType = Object.fromEntries(docs.map((d) => [d.doc_type, d]));

  async function onUploaded(docType: string, f: { path: string; name: string }) {
    const { error } = await supabase
      .from("application_documents")
      .upsert({ application_id: app.id, user_id: me!.id, doc_type: docType, file_path: f.path, file_name: f.name }, { onConflict: "application_id,doc_type" });
    if (error) return void toast.error(error.message);
    toast.success(`${docType} uploaded`);
    qc.invalidateQueries({ queryKey: ["my-docs", app.id] });
  }

  return (
    <div className="divide-y rounded-lg border">
      {DOC_TYPES.map((t) => {
        const d = byType[t.key];
        const needsAction = d && ["invalid", "missing", "reupload_required"].includes(d.status);
        const canUpload = editable || !d || needsAction;
        return (
          <div key={t.key} className={cn("flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between", needsAction && "bg-destructive/5")}>
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-semibold">{t.key} {t.required && <span className="text-xs font-normal text-destructive">required</span>}</p>
                <p className="text-xs text-muted-foreground">{d?.file_name ? `${d.file_name} · uploaded ${fmtDate(d.uploaded_at)}` : "Not uploaded yet · PDF/JPG/PNG up to 10 MB"}</p>
                {d?.remarks && <p className="mt-1 text-sm text-destructive">Office remark: {d.remarks}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {d?.file_path ? <StatusBadge value={d.status} /> : <StatusBadge value="missing" text="Not uploaded" />}
              {d?.file_path && <Button size="sm" variant="ghost" onClick={() => openFile(d.file_path)}><Eye /> View</Button>}
              {canUpload && me && (
                <FileButton ownerId={me.id} folder="admission" label={d?.file_path ? "Replace" : "Upload"} onUploaded={async (f) => { await onUploaded(t.key, f); }} variant={needsAction ? "default" : "outline"} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Draft form ---------------- */

type FormState = Partial<Application>;
const SECTIONS = ["personal", "education", "family", "preferences", "documents", "review"] as const;

function ApplicationForm({ app }: { app: Application }) {
  const qc = useQueryClient();
  const [f, setF] = useState<FormState>(app);
  const [tab, setTab] = useState<(typeof SECTIONS)[number]>("personal");
  const { data: docs = [] } = useDocs(app.id);
  const set = (k: keyof Application, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const pct = useMemo(() => calcPercentage(Number(f.marks_obtained) || null, Number(f.total_marks) || null), [f.marks_obtained, f.total_marks]);

  const save = useMutation({
    mutationFn: async (submit: boolean) => {
      const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ref_no: _r, stage: _s, final_decision: _fd, assigned_to: _a, submitted_at: _sa, decided_at: _da, ...rest } = f as Application;
      const patch: TablesUpdate<"applications"> = { ...rest, percentage: pct ?? f.percentage ?? null };
      if (submit) patch.stage = "submitted";
      const { error } = await supabase.from("applications").update(patch).eq("id", app.id);
      if (error) throw error;
      return submit;
    },
    onSuccess: (submitted) => {
      toast.success(submitted ? "Application submitted! You'll see your reference number now." : "Draft saved");
      qc.invalidateQueries({ queryKey: ["my-application"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const missing: string[] = [];
  const req: [keyof Application, string][] = [
    ["full_name", "Full name"], ["dob", "Date of birth"], ["mobile", "Mobile number"], ["guardian_name", "Parent/guardian name"],
    ["guardian_phone", "Parent/guardian phone"], ["address", "Address"], ["district", "District"], ["pincode", "PIN code"],
    ["school_name", "School name"], ["board", "Board"], ["completion_year", "Class 12 year"], ["stream", "Academic stream"],
    ["marks_obtained", "Marks obtained"], ["total_marks", "Total marks"], ["family_income", "Family income"], ["family_members", "Family members"],
    ["interested_course", "Interested course"],
  ];
  for (const [k, l] of req) if (f[k] === null || f[k] === undefined || f[k] === "") missing.push(l);
  for (const t of DOC_TYPES) if (t.required && !docs.find((d) => d.doc_type === t.key && d.file_path)) missing.push(t.key);

  const T = (k: keyof Application, type = "text", props: Record<string, unknown> = {}) => (
    <Input type={type} value={(f[k] as string | number | null) ?? ""} onChange={(e) => set(k, type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value || null)} {...props} />
  );
  const YesNo = (k: keyof Application) => (
    <select className={selectClass} value={f[k] === null || f[k] === undefined ? "" : f[k] ? "yes" : "no"} onChange={(e) => set(k, e.target.value === "" ? null : e.target.value === "yes")}>
      <option value="">Select…</option><option value="yes">Yes</option><option value="no">No</option>
    </select>
  );

  const idx = SECTIONS.indexOf(tab);
  const nav = (
    <div className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-4">
      <Button variant="outline" disabled={idx === 0} onClick={() => setTab(SECTIONS[idx - 1]!)}>Previous</Button>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => save.mutate(false)} disabled={save.isPending}><Save /> Save draft</Button>
        {idx < SECTIONS.length - 1 && <Button onClick={() => { save.mutate(false); setTab(SECTIONS[idx + 1]!); }}>Save & continue</Button>}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Module 01 · Admission" title="Admission application" description="Fill each section, upload your certificates and submit. You can save a draft anytime." />
      <Tabs value={tab} onValueChange={(v) => setTab(v as (typeof SECTIONS)[number])}>
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-secondary p-1">
          {([["personal", "A · Personal"], ["education", "B · Education"], ["family", "C · Family"], ["preferences", "D · Preferences"], ["documents", "E · Documents"], ["review", "F · Review & submit"]] as const).map(([k, l]) => (
            <TabsTrigger key={k} value={k} className="data-[state=active]:bg-card">{l}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="personal">
          <Section title="Personal information">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full name" required>{T("full_name")}</Field>
              <Field label="Date of birth" required>{T("dob", "date")}</Field>
              <Field label="Gender">
                <select className={selectClass} value={f.gender ?? ""} onChange={(e) => set("gender", e.target.value || null)}>
                  <option value="">Select…</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option>
                </select>
              </Field>
              <Field label="Email">{T("email", "email")}</Field>
              <Field label="Mobile number" required>{T("mobile", "tel", { placeholder: "10-digit mobile" })}</Field>
              <Field label="Parent / guardian name" required>{T("guardian_name")}</Field>
              <Field label="Relation">{T("guardian_relation", "text", { placeholder: "Father / Mother / Guardian" })}</Field>
              <Field label="Parent / guardian phone" required>{T("guardian_phone", "tel")}</Field>
              <Field label="Residential address" required className="sm:col-span-2 lg:col-span-3">
                <Textarea value={f.address ?? ""} onChange={(e) => set("address", e.target.value || null)} />
              </Field>
              <Field label="District" required>
                <select className={selectClass} value={f.district ?? ""} onChange={(e) => set("district", e.target.value || null)}>
                  <option value="">Select district…</option>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Locality / area">{T("locality", "text", { placeholder: "e.g. Anna Nagar" })}</Field>
              <Field label="PIN code" required>{T("pincode", "text", { inputMode: "numeric", maxLength: 6 })}</Field>
            </div>
            {nav}
          </Section>
        </TabsContent>

        <TabsContent value="education">
          <Section title="Educational information">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="School name" required className="sm:col-span-2">{T("school_name")}</Field>
              <Field label="Education board" required>
                <select className={selectClass} value={f.board ?? ""} onChange={(e) => set("board", e.target.value || null)}>
                  <option value="">Select…</option><option>Tamil Nadu State Board</option><option>CBSE</option><option>ICSE / ISC</option><option>Other</option>
                </select>
              </Field>
              <Field label="Class 12 completion year" required>{T("completion_year", "number")}</Field>
              <Field label="Academic stream" required>
                <select className={selectClass} value={f.stream ?? ""} onChange={(e) => set("stream", e.target.value || null)}>
                  <option value="">Select…</option><option>Maths – Biology</option><option>Maths – Computer Science</option><option>Pure Science</option><option>Commerce</option><option>Arts / Humanities</option><option>Vocational</option>
                </select>
              </Field>
              <Field label="Subjects studied">{T("subjects", "text", { placeholder: "Tamil, English, Maths, Physics…" })}</Field>
              <Field label="Marks obtained" required>{T("marks_obtained", "number")}</Field>
              <Field label="Total (maximum) marks" required>{T("total_marks", "number", { placeholder: "e.g. 600" })}</Field>
              <Field label="Percentage" hint="Calculated automatically">
                <div className="flex h-9 items-center rounded-md border bg-muted px-3 font-semibold">{pct !== null ? `${pct}%` : "—"}</div>
              </Field>
            </div>
            {nav}
          </Section>
        </TabsContent>

        <TabsContent value="family">
          <Section title="Family & socio-economic background">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Father's name">{T("father_name")}</Field>
              <Field label="Father's occupation">{T("father_occupation")}</Field>
              <Field label="Mother's name">{T("mother_name")}</Field>
              <Field label="Mother's occupation">{T("mother_occupation")}</Field>
              <Field label="Annual family income (₹)" required>{T("family_income", "number")}</Field>
              <Field label="Number of family members" required>{T("family_members", "number")}</Field>
              <Field label="Family background" className="sm:col-span-2 lg:col-span-3" hint="Tell us briefly about your family's situation.">
                <Textarea rows={4} value={f.family_background ?? ""} onChange={(e) => set("family_background", e.target.value || null)} />
              </Field>
            </div>
            {nav}
          </Section>
        </TabsContent>

        <TabsContent value="preferences">
          <Section title="College & course preferences">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Preferred academic stream">{T("preferred_stream", "text", { placeholder: "Engineering / Arts & Science / …" })}</Field>
              <Field label="Interested course or branch" required>{T("interested_course", "text", { placeholder: "B.E. CSE, B.Sc. Nursing…" })}</Field>
              <Field label="Preferred area of study">{T("preferred_area")}</Field>
              <Field label="Willing to study in Chennai?">{YesNo("willing_chennai")}</Field>
              <Field label="Willing to study outside Chennai?">{YesNo("willing_outside_chennai")}</Field>
              <Field label="Comfortable moving to another district/city?">{YesNo("willing_relocate")}</Field>
              <Field label="Other preferences" className="sm:col-span-2 lg:col-span-3">
                <Textarea value={f.other_preferences ?? ""} onChange={(e) => set("other_preferences", e.target.value || null)} />
              </Field>
            </div>
            {nav}
          </Section>
        </TabsContent>

        <TabsContent value="documents">
          <Section title="Document upload" description="Upload clear scans or photos. Supported: PDF, JPG, PNG (max 10 MB).">
            <DocumentsTable app={app} editable />
            {nav}
          </Section>
        </TabsContent>

        <TabsContent value="review">
          <Section title="Review & submit">
            <div className="space-y-6">
              <KV items={[
                ["Full name", f.full_name], ["Date of birth", fmtDate(f.dob)], ["Mobile", f.mobile], ["Email", f.email],
                ["District", f.district], ["Locality", f.locality], ["PIN code", f.pincode], ["Guardian", f.guardian_name],
                ["School", f.school_name], ["Board", f.board], ["Stream", f.stream], ["Percentage", pct !== null ? `${pct}%` : null],
                ["Family income", f.family_income ? `₹${Number(f.family_income).toLocaleString("en-IN")}` : null], ["Family members", f.family_members],
                ["Interested course", f.interested_course], ["Willing — Chennai", f.willing_chennai == null ? null : f.willing_chennai ? "Yes" : "No"],
              ]} />
              {missing.length > 0 ? (
                <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 text-sm">
                  <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" /> Complete these before submitting:</p>
                  <p className="mt-1 text-muted-foreground">{missing.join(" · ")}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm font-medium text-success"><Check className="mr-1 inline size-4" /> Everything looks complete.</div>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="secondary" onClick={() => save.mutate(false)} disabled={save.isPending}><Save /> Save draft</Button>
                <Button variant="marigold" size="lg" disabled={missing.length > 0 || save.isPending} onClick={() => { if (confirm("Submit your application? You won't be able to change form details after this.")) save.mutate(true); }}>
                  <Send /> Submit application
                </Button>
              </div>
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- After submission ---------------- */

function ApplicationStatus({ app }: { app: Application }) {
  const qc = useQueryClient();
  const current = journeyIndex(app.stage);
  const { data: pv = [] } = useQuery({
    queryKey: ["my-pv", app.id],
    queryFn: async () => (await supabase.from("pv_assignments").select("*").eq("application_id", app.id).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: interviews = [] } = useQuery({
    queryKey: ["my-interviews", app.id],
    queryFn: async () => (await supabase.from("interviews").select("*").eq("application_id", app.id).order("scheduled_at", { ascending: true })).data ?? [],
  });
  const { data: docs = [] } = useDocs(app.id);

  const resubmit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("applications").update({ stage: "doc_review" }).eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sent back to the office for review"); qc.invalidateQueries({ queryKey: ["my-application"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendingFix = docs.some((d) => ["invalid", "missing", "reupload_required"].includes(d.status));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Module 01 · Admission"
        title="Application status"
        description={`Reference ${app.ref_no ?? "—"} · submitted ${fmtDate(app.submitted_at)}`}
        actions={<StatusBadge value={app.stage} />}
      />

      {app.stage === "selected" && (
        <div className="flex items-center gap-4 rounded-xl bg-hero p-6 text-primary-foreground shadow-lift">
          <PartyPopper className="size-10 text-accent" />
          <div>
            <h2 className="text-2xl font-semibold">Congratulations, you're selected!</h2>
            <p className="text-primary-foreground/80">Welcome to the Maatram family. Your mentorship, academics and career modules are now active.</p>
          </div>
        </div>
      )}
      {app.stage === "not_selected" && (
        <Section><p className="text-sm">The Maatram team has recorded a final decision on your application. Thank you for applying — we wish you the very best for your studies.</p></Section>
      )}
      {app.stage === "on_hold" && (
        <Section><p className="text-sm">Your application is on hold while the office reviews it. You'll get a notification when there's an update.</p></Section>
      )}

      <Section title="Your journey">
        <ol className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {JOURNEY.map((j, i) => {
            const done = current > i || app.stage === "selected";
            const active = current === i && app.stage !== "selected";
            return (
              <li key={j.key} className={cn("rounded-lg border p-3", done && "border-success/40 bg-success/10", active && "border-accent bg-accent/15")}>
                <span className={cn("grid size-7 place-items-center rounded-full text-xs font-bold", done ? "bg-success text-success-foreground" : active ? "bg-marigold text-accent-foreground" : "bg-muted text-muted-foreground")}>
                  {done ? <Check className="size-4" /> : i + 1}
                </span>
                <p className="mt-2 text-sm font-semibold">{j.label}</p>
                {active && <p className="text-xs text-muted-foreground">{label(app.stage)}</p>}
              </li>
            );
          })}
        </ol>
      </Section>

      <Section
        title="Documents"
        description={pendingFix ? "Some documents need your attention. Upload the corrected files, then send them for review." : "Verification status of your certificates."}
        actions={app.stage === "doc_correction" && (
          <Button variant="marigold" onClick={() => resubmit.mutate()} disabled={pendingFix || resubmit.isPending}>
            <Send /> Resubmit for review
          </Button>
        )}
      >
        {app.stage === "doc_correction" && pendingFix && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 text-destructive" /> Re-upload the highlighted documents. You do not need to fill the form again.
          </div>
        )}
        <DocumentsTable app={app} editable={false} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Physical verification">
          {pv.length === 0 ? (
            <Empty title="Not scheduled yet" hint="After tele-verification, an authorised Maatram volunteer will visit your home." />
          ) : (
            pv.map((p) => (
              <div key={p.id} className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
                  <UserCheck className="size-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Authorised volunteer</p>
                    <p className="font-semibold">{p.volunteer_name ?? "To be confirmed"}</p>
                    {p.volunteer_phone && <p className="flex items-center gap-1 text-sm"><Phone className="size-3" /> {p.volunteer_phone}</p>}
                  </div>
                </div>
                <KV items={[["Visit date", fmtDate(p.visit_date)], ["Status", <StatusBadge key="s" value={p.status} />]]} />
              </div>
            ))
          )}
        </Section>
        <Section title="Interviews">
          {interviews.length === 0 ? (
            <Empty title="No interviews scheduled" hint="Interview details will appear here once the office schedules them." />
          ) : (
            <ul className="space-y-3">
              {interviews.map((iv) => (
                <li key={iv.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{iv.kind === "online" ? "Online interview" : "Final physical interview"}</p>
                    <StatusBadge value={iv.status} />
                  </div>
                  <p className="mt-1 text-sm">{fmtDate(iv.scheduled_at, true)}</p>
                  {iv.mode_detail && <p className="text-sm text-muted-foreground break-all">{iv.mode_detail}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Submitted details">
        <KV items={[
          ["Full name", app.full_name], ["Mobile", app.mobile], ["District", app.district], ["PIN code", app.pincode],
          ["School", app.school_name], ["Stream", app.stream], ["Percentage", app.percentage ? `${app.percentage}%` : null], ["Course interest", app.interested_course],
        ]} />
        {app.stage === "selected" && <p className="mt-4 flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" /> Final decision recorded on {fmtDate(app.decided_at)}</p>}
      </Section>
    </div>
  );
}
