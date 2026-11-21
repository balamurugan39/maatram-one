import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { fmtDate, label } from "@/lib/labels";
import { openFile } from "@/lib/files";
import { PageHeader, Section, StatusBadge, Empty } from "@/components/portal/ui";
import { CrudManager } from "@/components/portal/CrudManager";
import { FileButton } from "@/components/portal/FileButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalendarDays, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/learning")({
  head: () => ({ meta: [{ title: "Learning & Programmes — MAATRAM ONE" }, { name: "description", content: "Monthly learning updates, Maatram training programmes and achievements." }] }),
  component: Learning,
});

function Learning() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: programmes = [] } = useQuery({ queryKey: ["training_programmes"], queryFn: async () => (await supabase.from("training_programmes").select("*").order("starts_on")).data ?? [] });
  const { data: regs = [] } = useQuery({ queryKey: ["programme_registrations", me?.id], enabled: !!me, queryFn: async () => (await supabase.from("programme_registrations").select("*").eq("user_id", me!.id)).data ?? [] });
  const regBy = Object.fromEntries(regs.map((r) => [r.programme_id, r]));
  if (!me) return null;

  return (
    <div>
      <PageHeader eyebrow="Module 03 · Academics" title="Learning & programmes" description="Track independent learning, join Maatram programmes and record your achievements." />
      <Tabs defaultValue="programmes">
        <TabsList className="mb-4 bg-secondary">
          <TabsTrigger value="programmes" className="data-[state=active]:bg-card">Maatram programmes</TabsTrigger>
          <TabsTrigger value="learning" className="data-[state=active]:bg-card">Monthly learning</TabsTrigger>
          <TabsTrigger value="achievements" className="data-[state=active]:bg-card">Achievements</TabsTrigger>
        </TabsList>
        <TabsContent value="programmes">
          {programmes.length === 0 ? <Empty title="No programmes yet" /> : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {programmes.map((p) => {
                const reg = regBy[p.id];
                return (
                  <Section key={p.id} className="flex flex-col">
                    <div className="flex items-center justify-between"><StatusBadge value={p.status} /><span className="text-xs font-semibold text-primary-glow">{p.category}</span></div>
                    <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
                    <p className="mt-3 flex items-center gap-1.5 text-sm"><CalendarDays className="size-4 text-primary" /> {fmtDate(p.starts_on)} – {fmtDate(p.ends_on)}</p>
                    <p className="text-xs text-muted-foreground">{p.schedule} · {p.mode}</p>
                    {reg ? (
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-success/10 p-2 text-sm"><span className="font-semibold text-success">Registered</span><span className="text-xs">Attendance: {label(reg.attendance)}</span></div>
                    ) : (
                      <Button className="mt-4" disabled={p.status !== "open"} onClick={async () => {
                        const { error } = await supabase.from("programme_registrations").insert({ programme_id: p.id, user_id: me.id });
                        if (error) return void toast.error(error.message);
                        toast.success("Registered!");
                        qc.invalidateQueries({ queryKey: ["programme_registrations"] });
                      }}>Register</Button>
                    )}
                  </Section>
                );
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="learning">
          <CrudManager
            table="learning_updates" title="Learning updates" addLabel="Add monthly update" defaults={{ user_id: me.id }}
            emptyHint="Log courses from Coursera, Udemy, YouTube, NPTEL or college classes."
            fields={[
              { name: "month", label: "Month", placeholder: "Nov 2026", required: true },
              { name: "platform", label: "Platform", type: "select", required: true, options: ["Coursera", "Udemy", "YouTube", "NPTEL", "College classes", "Other"].map((v) => ({ value: v, label: v })) },
              { name: "course_name", label: "Course / topic", required: true, full: true },
              { name: "status", label: "Status", type: "select", options: [{ value: "in_progress", label: "In progress" }, { value: "completed", label: "Completed" }], required: true },
              { name: "hours", label: "Hours spent", type: "number" },
              { name: "notes", label: "Notes", type: "textarea" },
            ]}
            columns={[
              { key: "month", label: "Month" }, { key: "platform", label: "Platform" }, { key: "course_name", label: "Course" },
              { key: "status", label: "Status", render: (r) => <StatusBadge value={r["status"]} /> }, { key: "hours", label: "Hours" },
            ]}
            rowActions={(r) => (
              <>
                {r["certificate_path"] && <Button size="icon" variant="ghost" aria-label="View certificate" onClick={() => openFile(r["certificate_path"])}><Eye /></Button>}
                <FileButton ownerId={me.id} folder="certificates" label="Certificate" onUploaded={async (f) => {
                  const { error } = await supabase.from("learning_updates").update({ certificate_path: f.path, certificate_name: f.name }).eq("id", r["id"]);
                  if (error) return void toast.error(error.message);
                  toast.success("Certificate uploaded"); qc.invalidateQueries({ queryKey: ["learning_updates"] });
                }} />
              </>
            )}
          />
        </TabsContent>
        <TabsContent value="achievements">
          <CrudManager
            table="achievements" title="Achievements" addLabel="Add achievement" defaults={{ user_id: me.id }}
            fields={[
              { name: "title", label: "Title", required: true, full: true },
              { name: "category", label: "Category", type: "select", options: ["Academic award", "Certification", "Research", "Paper presentation", "Competition", "Other"].map((v) => ({ value: v, label: v })) },
              { name: "achieved_on", label: "Date", type: "date" },
              { name: "description", label: "Description", type: "textarea" },
            ]}
            columns={[
              { key: "title", label: "Title" }, { key: "category", label: "Category" }, { key: "achieved_on", label: "Date", render: (r) => fmtDate(r["achieved_on"]) },
              { key: "verified", label: "Verified", render: (r) => <StatusBadge value={r["verified"] ? "verified" : "pending"} /> },
            ]}
            rowActions={(r) => (
              <>
                {r["file_path"] && <Button size="icon" variant="ghost" aria-label="View proof" onClick={() => openFile(r["file_path"])}><Eye /></Button>}
                <FileButton ownerId={me.id} folder="achievements" label="Proof" onUploaded={async (f) => {
                  const { error } = await supabase.from("achievements").update({ file_path: f.path, file_name: f.name }).eq("id", r["id"]);
                  if (error) return void toast.error(error.message);
                  toast.success("Uploaded"); qc.invalidateQueries({ queryKey: ["achievements"] });
                }} />
              </>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
