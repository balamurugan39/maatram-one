import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/labels";
import { PageHeader, Section, Empty } from "@/components/portal/ui";

export const Route = createFileRoute("/_authenticated/student/alumni")({
  head: () => ({ meta: [{ title: "Sangamam Alumni — MAATRAM ONE" }, { name: "description", content: "Maatram alumni events and community." }] }),
  component: Alumni,
});

function Alumni() {
  const { data: events = [] } = useQuery({ queryKey: ["sangamam_events"], queryFn: async () => (await supabase.from("sangamam_events").select("*").order("event_date")).data ?? [] });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Module 06 · Alumni" title="Sangamam alumni" description="Alumni events and community." />
      <Section title="Sangamam events">
        {events.length === 0 ? <Empty title="No events yet" /> : (
          <ul className="divide-y">
            {events.map((e) => (
              <li key={e.id} className="py-3"><p className="font-semibold">{e.title}</p><p className="text-xs text-muted-foreground">{fmtDate(e.event_date, true)} · {e.venue}</p></li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
