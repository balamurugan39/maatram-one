import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { fmtDate } from "@/lib/labels";
import { PageHeader, Section, Empty, Loading } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/notifications")({
  head: () => ({ meta: [{ title: "Notifications — MAATRAM ONE" }, { name: "description", content: "Updates from the Maatram office." }] }),
  component: Notifications,
});

function Notifications() {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data = [], isLoading } = useQuery({
    queryKey: ["notifications", "all", me?.id],
    enabled: !!me,
    queryFn: async () => (await supabase.from("notifications").select("*").eq("user_id", me!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });

  return (
    <div>
      <PageHeader title="Notifications" description="Every important update about your application and activities."
        actions={<Button variant="outline" onClick={async () => { await supabase.from("notifications").update({ is_read: true }).eq("user_id", me!.id).eq("is_read", false); refresh(); }}><CheckCheck /> Mark all read</Button>} />
      <Section>
        {isLoading ? <Loading /> : data.length === 0 ? <Empty title="No notifications yet" /> : (
          <ul className="divide-y">
            {data.map((n) => (
              <li key={n.id}>
                <button
                  className={cn("flex w-full items-start gap-3 px-2 py-4 text-left hover:bg-muted/50", !n.is_read && "bg-accent/10")}
                  onClick={async () => {
                    if (!n.is_read) { await supabase.from("notifications").update({ is_read: true }).eq("id", n.id); refresh(); }
                    if (n.link?.startsWith("/student")) navigate({ to: n.link as "/student" });
                  }}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.is_read ? "bg-muted" : "bg-accent")} />
                  <span className="flex-1">
                    <span className={cn("block text-sm", !n.is_read && "font-semibold")}>{n.title}</span>
                    {n.body && <span className="block text-sm text-muted-foreground">{n.body}</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{fmtDate(n.created_at, true)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
