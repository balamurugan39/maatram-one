import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { useMyGroup } from "@/lib/student-data";
import { fmtDate, label } from "@/lib/labels";
import { PageHeader, Section, StatusBadge, Empty } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Mail, MapPin, MessageCircle, Phone, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/support")({
  head: () => ({ meta: [{ title: "My Support Team & Meetings — MAATRAM ONE" }, { name: "description", content: "Your Anchors, Zone Coordinator, Mentor and upcoming meetings." }] }),
  component: Support,
});

function Support() {
  const me = useMe();
  const qc = useQueryClient();
  const { data: group } = useMyGroup();
  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", "student", group?.group.id ?? "none"],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("*").neq("status", "cancelled").order("starts_at", { ascending: false });
      return (data ?? []).filter((m) => !m.group_id || m.group_id === group?.group.id);
    },
  });
  const { data: rsvps = [] } = useQuery({
    queryKey: ["rsvps", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("meeting_rsvps").select("*").eq("user_id", me!.id)).data ?? [],
  });
  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("meeting_attendance").select("*").eq("user_id", me!.id)).data ?? [],
  });
  const rsvpBy = Object.fromEntries(rsvps.map((r) => [r.meeting_id, r.response]));
  const attBy = Object.fromEntries(attendance.map((a) => [a.meeting_id, a.status]));
  const now = Date.now();
  const upcoming = meetings.filter((m) => new Date(m.starts_at).getTime() >= now).reverse();
  const past = meetings.filter((m) => new Date(m.starts_at).getTime() < now);

  async function respond(meetingId: string, response: "going" | "maybe" | "not_going") {
    const { error } = await supabase.from("meeting_rsvps").upsert({ meeting_id: meetingId, user_id: me!.id, response, updated_at: new Date().toISOString() });
    if (error) return void toast.error(error.message);
    toast.success(`RSVP: ${label(response)}`);
    qc.invalidateQueries({ queryKey: ["rsvps"] });
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Module 02 · Mentorship" title="My Maatram Support Team" description="Contact any of them directly — there's no fixed order." />
      {!group || group.team.length === 0 ? (
        <Section><Empty title="Support team not assigned yet" hint="Once the office assigns your college group, your Anchors, Zone Coordinator and Core Team Mentor appear here." /></Section>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Group: <span className="font-semibold text-foreground">{group.group.college} · {group.group.batch}</span></p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {group.team.map((t) => (
              <div key={t.slot} className="rounded-xl border bg-card p-5 shadow-soft">
                <span className="grid size-14 place-items-center rounded-full bg-marigold font-display text-xl font-semibold text-accent-foreground">
                  {t.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-primary-glow">{t.slot}</p>
                <p className="font-display text-lg font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.designation}</p>
                <div className="mt-3 space-y-1 text-sm">
                  {t.phone && <a href={`tel:${t.phone}`} className="flex items-center gap-2 hover:text-primary"><Phone className="size-3.5" /> {t.phone}</a>}
                  {t.email && <a href={`mailto:${t.email}`} className="flex items-center gap-2 break-all hover:text-primary"><Mail className="size-3.5" /> {t.email}</a>}
                </div>
                <Button asChild size="sm" variant="outline" className="mt-4 w-full"><Link to="/student/messages" search={{ staff: t.id }}><MessageCircle /> Message</Link></Button>
              </div>
            ))}
          </div>
        </>
      )}

      <Section title="Upcoming meetings & activities" description="Let your organiser know if you're coming. Attendance is marked separately after the event.">
        {upcoming.length === 0 ? <Empty title="No upcoming events" /> : (
          <ul className="space-y-3">
            {upcoming.map((m) => (
              <li key={m.id} className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2"><p className="font-semibold">{m.title}</p><StatusBadge value={m.kind} /></div>
                  <p className="text-sm text-muted-foreground">{fmtDate(m.starts_at, true)}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm">{m.mode === "online" ? <Video className="size-3.5" /> : <MapPin className="size-3.5" />}{m.location ?? label(m.mode)}</p>
                  {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                </div>
                <div className="flex gap-1">
                  {(["going", "maybe", "not_going"] as const).map((r) => (
                    <Button key={r} size="sm" variant={rsvpBy[m.id] === r ? "default" : "outline"} onClick={() => respond(m.id, r)}>{label(r)}</Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="My attendance history">
        {past.length === 0 ? <Empty title="No past events yet" /> : (
          <ul className="divide-y">
            {past.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div><p className="font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{fmtDate(m.starts_at, true)}</p></div>
                <div className="flex items-center gap-2">
                  {rsvpBy[m.id] && <span className={cn("text-xs text-muted-foreground")}>RSVP: {label(rsvpBy[m.id])}</span>}
                  <StatusBadge value={attBy[m.id] ?? "not_marked"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
