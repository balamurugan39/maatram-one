import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useMe } from "@/lib/session";
import { fmtDate, label } from "@/lib/labels";
import { openFile } from "@/lib/files";
import { PageHeader, Section, StatusBadge, Field, Empty } from "@/components/portal/ui";
import { CrudManager } from "@/components/portal/CrudManager";
import { FileButton } from "@/components/portal/FileButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BadgeCheck, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/skills")({
  head: () => ({ meta: [{ title: "Skills & Career Profile — MAATRAM ONE" }, { name: "description", content: "Your skill passport, career profile, resume and assessment results." }] }),
  component: Skills,
});

function Skills() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: skills = [] } = useQuery({ queryKey: ["skills", "*", "created_at"], queryFn: async () => (await supabase.from("skills").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: assessments = [] } = useQuery({ queryKey: ["assessments", me?.id], enabled: !!me, queryFn: async () => (await supabase.from("assessments").select("*").eq("user_id", me!.id).order("held_on", { ascending: false })).data ?? [] });
  const { data: cp } = useQuery({ queryKey: ["career_profile", me?.id], enabled: !!me, queryFn: async () => (await supabase.from("career_profiles").select("*").eq("user_id", me!.id).maybeSingle()).data });
  const [c, setC] = useState<Partial<Tables<"career_profiles">>>({});
  useEffect(() => { if (cp) setC(cp); }, [cp]);
  if (!me) return null;
  const verified = skills.filter((s) => s.status === "verified");

  async function saveCareer(patch: Partial<Tables<"career_profiles">> = {}) {
    const { error } = await supabase.from("career_profiles").upsert({
      user_id: me!.id, headline: c.headline ?? null, career_interests: c.career_interests ?? null, preferred_roles: c.preferred_roles ?? null,
      preferred_locations: c.preferred_locations ?? null, linkedin: c.linkedin ?? null, github: c.github ?? null, portfolio: c.portfolio ?? null,
      resume_path: c.resume_path ?? null, resume_name: c.resume_name ?? null, ...patch, updated_at: new Date().toISOString(),
    });
    if (error) return void toast.error(error.message);
    toast.success("Career profile saved");
    qc.invalidateQueries({ queryKey: ["career_profile"] });
  }
  const t = (k: keyof Tables<"career_profiles">) => ({ value: (c[k] as string) ?? "", onChange: (e: { target: { value: string } }) => setC({ ...c, [k]: e.target.value || null }) });

  return (
    <div>
      <PageHeader eyebrow="Module 04 · Skills & Placement" title="Skills & career profile" />
      <Tabs defaultValue="passport">
        <TabsList className="mb-4 bg-secondary">
          <TabsTrigger value="passport" className="data-[state=active]:bg-card">Skill passport</TabsTrigger>
          <TabsTrigger value="career" className="data-[state=active]:bg-card">Career profile</TabsTrigger>
          <TabsTrigger value="assessments" className="data-[state=active]:bg-card">Assessments</TabsTrigger>
        </TabsList>
        <TabsContent value="passport" className="space-y-6">
          <Section title="Maatram-verified skills">
            {verified.length === 0 ? <p className="text-sm text-muted-foreground">Skills verified by the Maatram office appear here as badges.</p> : (
              <div className="flex flex-wrap gap-2">
                {verified.map((s) => <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-marigold px-3 py-1 text-sm font-semibold text-accent-foreground"><BadgeCheck className="size-4" />{s.name} · {label(s.level)}</span>)}
              </div>
            )}
          </Section>
          <CrudManager
            table="skills" title="Skills" addLabel="Add skill" defaults={{ user_id: me.id }}
            fields={[
              { name: "name", label: "Skill", required: true, placeholder: "Python, Excel, Public speaking…" },
              { name: "category", label: "Category", type: "select", options: ["Technical", "Communication", "Language", "Soft skill", "Domain", "Other"].map((v) => ({ value: v, label: v })) },
              { name: "level", label: "Level", type: "select", options: ["beginner", "intermediate", "advanced"].map((v) => ({ value: v, label: label(v) })) },
              { name: "evidence_url", label: "Evidence link", placeholder: "Certificate / GitHub / portfolio URL" },
            ]}
            columns={[
              { key: "name", label: "Skill" }, { key: "category", label: "Category" }, { key: "level", label: "Level", render: (r) => label(r["level"]) },
              { key: "status", label: "Status", render: (r) => <div><StatusBadge value={r["status"] === "submitted" ? "pending" : r["status"]} text={r["status"] === "submitted" ? "Submitted" : undefined} />{r["remarks"] && <p className="mt-1 text-xs text-muted-foreground">{r["remarks"]}</p>}</div> },
            ]}
          />
        </TabsContent>
        <TabsContent value="career">
          <Section title="Career profile" description="Your academic and personal details are reused from other modules automatically.">
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); saveCareer(); }}>
              <Field label="Headline" className="sm:col-span-2"><Input {...t("headline")} placeholder="Final-year CSE student passionate about backend development" /></Field>
              <Field label="Career interests"><Textarea {...t("career_interests")} /></Field>
              <Field label="Preferred roles"><Textarea {...t("preferred_roles")} /></Field>
              <Field label="Preferred locations"><Input {...t("preferred_locations")} /></Field>
              <Field label="LinkedIn"><Input {...t("linkedin")} /></Field>
              <Field label="GitHub"><Input {...t("github")} /></Field>
              <Field label="Portfolio"><Input {...t("portfolio")} /></Field>
              <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                <Button type="submit">Save profile</Button>
                <FileButton ownerId={me.id} folder="resume" label={c.resume_path ? "Replace resume" : "Upload resume"} onUploaded={(f) => { setC({ ...c, resume_path: f.path, resume_name: f.name }); return saveCareer({ resume_path: f.path, resume_name: f.name }).then(() => undefined); }} />
                {c.resume_path && <Button type="button" variant="ghost" onClick={() => openFile(c.resume_path)}><Eye /> {c.resume_name}</Button>}
              </div>
            </form>
          </Section>
        </TabsContent>
        <TabsContent value="assessments">
          <Section title="Assessments & mock interviews" description="Results recorded by the Maatram placement team.">
            {assessments.length === 0 ? <Empty title="No assessments yet" /> : (
              <ul className="divide-y">
                {assessments.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div><p className="font-semibold">{a.title}</p><p className="text-xs text-muted-foreground">{label(a.kind)} · {fmtDate(a.held_on)}</p>{a.feedback && <p className="mt-1 text-sm">{a.feedback}</p>}</div>
                    <p className="font-display text-2xl font-semibold text-primary">{a.score ?? "—"}<span className="text-sm text-muted-foreground">{a.max_score ? ` / ${a.max_score}` : ""}</span></p>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
