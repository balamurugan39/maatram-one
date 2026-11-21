import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { useMyApplication, useMyGroup } from "@/lib/student-data";
import { JOURNEY, fmtDate, journeyIndex, label } from "@/lib/labels";
import { PageHeader, Section, StatCard, StatusBadge, Empty } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, CalendarDays, ClipboardList, GraduationCap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/")({
  head: () => ({ meta: [{ title: "Student Dashboard — MAATRAM ONE" }, { name: "description", content: "Your Maatram journey at a glance." }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const me = useMe();
  const { data: app } = useMyApplication();
  const { data: group } = useMyGroup();
  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications", "recent", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", me!.id).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });
  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", "upcoming"],
    queryFn: async () => (await supabase.from("meetings").select("*").eq("status", "published").gte("starts_at", new Date().toISOString()).order("starts_at").limit(4)).data ?? [],
  });
  const { data: sems = [] } = useQuery({
    queryKey: ["semesters", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("semesters").select("cgpa, semester_no").eq("user_id", me!.id).order("semester_no", { ascending: false })).data ?? [],
  });
  const { data: skillCount = 0 } = useQuery({
    queryKey: ["skills", "count", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("skills").select("id", { count: "exact", head: true }).eq("user_id", me!.id).eq("status", "verified")).count ?? 0,
  });

  const stage = app?.stage ?? "draft";
  const step = journeyIndex(stage);
  const progress = stage === "selected" ? 100 : step < 0 ? 5 : Math.round(((step + 1) / JOURNEY.length) * 100);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student dashboard" title={`Vanakkam, ${me?.fullName?.split(" ")[0] || "student"} 👋`} description="Here's where your Maatram journey stands today." />

      <div className="overflow-hidden rounded-2xl bg-hero p-6 text-primary-foreground shadow-lift md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Admission status</p>
            <h2 className="mt-2 text-3xl font-semibold">{stage === "draft" ? "Application not submitted" : label(stage)}</h2>
            <p className="mt-1 text-primary-foreground/75">{app?.ref_no ? `Reference ${app.ref_no}` : "Complete and submit your application to begin."}</p>
            <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-primary-foreground/15">
              <div className="h-full rounded-full bg-marigold transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <Button asChild variant="marigold" size="lg">
            <Link to="/student/admission">{stage === "draft" ? "Continue application" : "View details"} <ArrowRight /></Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Application" value={stage === "draft" ? "Draft" : `${progress}%`} hint={label(stage)} icon={<ClipboardList />} />
        <StatCard label="Latest CGPA" value={sems[0]?.cgpa ?? "—"} hint={sems[0] ? `Semester ${sems[0].semester_no}` : "Add semesters in Academics"} icon={<GraduationCap />} />
        <StatCard label="Verified skills" value={skillCount} hint="In your skill passport" icon={<Sparkles />} />
        <StatCard label="Upcoming events" value={meetings.length} hint="Meetings & activities" icon={<CalendarDays />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Upcoming meetings" className="lg:col-span-2" actions={<Button asChild variant="ghost" size="sm"><Link to="/student/support">All <ArrowRight /></Link></Button>}>
          {meetings.length === 0 ? <Empty title="No upcoming meetings" /> : (
            <ul className="divide-y">
              {meetings.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="text-sm text-muted-foreground">{fmtDate(m.starts_at, true)} · {label(m.mode)}</p>
                  </div>
                  <StatusBadge value={m.kind} />
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="My support team">
          {!group || group.team.length === 0 ? <Empty title="Not assigned yet" hint="The office will assign your Anchors, Zone Coordinator and Mentor." /> : (
            <ul className="space-y-3">
              {group.team.map((t) => (
                <li key={t.slot} className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-secondary font-display font-semibold text-primary">{t.name.charAt(0)}</span>
                  <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.slot}</p></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Section title="Recent notifications" actions={<Button asChild variant="ghost" size="sm"><Link to="/student/notifications"><Bell /> View all</Link></Button>}>
        {notifs.length === 0 ? <Empty title="You're all caught up" /> : (
          <ul className="divide-y">
            {notifs.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                <div><p className={n.is_read ? "text-sm" : "text-sm font-semibold"}>{n.title}</p>{n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}</div>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(n.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
