import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { useMyGroup } from "@/lib/student-data";
import { fmtDate } from "@/lib/labels";
import { PageHeader, Empty } from "@/components/portal/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/student/messages")({
  validateSearch: (s: Record<string, unknown>): { staff?: string } => (typeof s["staff"] === "string" ? { staff: s["staff"] } : {}),
  head: () => ({ meta: [{ title: "Messages — MAATRAM ONE" }, { name: "description", content: "Chat with your Maatram support team." }] }),
  component: Messages,
});

function Messages() {
  const me = useMe();
  const qc = useQueryClient();
  const { staff } = Route.useSearch();
  const navigate = useNavigate({ from: "/student/messages" });
  const { data: group } = useMyGroup();
  const team = group?.team ?? [];
  const active = staff ?? team[0]?.id;
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: msgs = [] } = useQuery({
    queryKey: ["messages", me?.id, active],
    enabled: !!me && !!active,
    queryFn: async () => (await supabase.from("messages").select("*").eq("student_id", me!.id).eq("staff_id", active!).order("created_at")).data ?? [],
    refetchInterval: 15_000,
  });
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const { error } = await supabase.from("messages").insert({ student_id: me!.id, staff_id: active, sender: "student", body: text.trim() });
    if (error) return void toast.error(error.message);
    setText("");
    qc.invalidateQueries({ queryKey: ["messages"] });
  }

  return (
    <div>
      <PageHeader eyebrow="Module 02 · Mentorship" title="Messages" description="One-to-one chat with your support team. Authorised Maatram admins may also view conversations." />
      {team.length === 0 ? <Empty title="No support team yet" hint="Messaging opens once your support team is assigned." /> : (
        <div className="grid min-h-[520px] overflow-hidden rounded-xl border bg-card shadow-soft md:grid-cols-[240px_1fr]">
          <aside className="border-b md:border-b-0 md:border-r">
            {team.map((t) => (
              <button key={t.id} onClick={() => navigate({ search: { staff: t.id } })} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/60", active === t.id && "bg-secondary")}>
                <span className="grid size-9 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">{t.name.charAt(0)}</span>
                <span><span className="block text-sm font-semibold">{t.name}</span><span className="block text-xs text-muted-foreground">{t.slot}</span></span>
              </button>
            ))}
          </aside>
          <div className="flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4" style={{ maxHeight: 480 }}>
              {msgs.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Say hello 👋 — start the conversation.</p>}
              {msgs.map((m) => (
                <div key={m.id} className={cn("flex", m.sender === "student" ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-soft", m.sender === "student" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-card")}>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={cn("mt-1 text-[10px]", m.sender === "student" ? "text-primary-foreground/70" : "text-muted-foreground")}>{fmtDate(m.created_at, true)}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t p-3">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
              <Button type="submit"><Send /> Send</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
