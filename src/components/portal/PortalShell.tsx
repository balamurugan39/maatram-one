import { useState, type ReactNode } from "react";
import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "./Logo";
import { useMe, useSignOut } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Bell, LogOut, Menu } from "lucide-react";

export type NavItem = { to: NonNullable<LinkProps["to"]>; label: string; icon: ReactNode; exact?: boolean };
export type NavGroup = { title: string; items: NavItem[] };

function NavList({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const to = String(it.to);
              const active = it.exact ? path === to : path === to || path.startsWith(to + "/");
              return (
                <li key={to}>
                  <Link
                    to={it.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors [&_svg]:size-4",
                      active
                        ? "bg-sidebar-primary font-semibold text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {it.icon}
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function PortalShell({ groups, portal, children }: { groups: NavGroup[]; portal: "student" | "admin"; children: ReactNode }) {
  const me = useMe();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread", me?.id],
    enabled: portal === "student" && !!me,
    queryFn: async () => {
      const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me!.id).eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-5 pt-5">
        <Logo light />
        <p className="mt-4 inline-flex rounded-full bg-sidebar-accent px-2.5 py-1 text-[11px] font-semibold text-sidebar-primary">
          {portal === "admin" ? "Maatram Office Portal" : "Student Portal"}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        <NavList groups={groups} onNavigate={() => setOpen(false)} />
      </div>
      <div className="border-t border-sidebar-border p-3">
        <p className="truncate px-2 text-sm font-semibold text-sidebar-foreground">{me?.fullName || (portal === "admin" ? "Office Admin" : "Student")}</p>
        <p className="truncate px-2 text-xs text-sidebar-foreground/60">{me?.email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => signOut(portal === "admin" ? "/login/admin" : "/login/student")}
        >
          <LogOut /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-sidebar lg:block">{sidebar}</aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/85 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu />
            </Button>
            <span className="lg:hidden"><Logo /></span>
          </div>
          <div className="flex items-center gap-2">
            {portal === "student" && (
              <Button asChild variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Link to="/student/notifications">
                  <Bell />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {unread}
                    </span>
                  )}
                </Link>
              </Button>
            )}
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Hi, <span className="font-semibold text-foreground">{me?.fullName?.split(" ")[0] || "there"}</span>
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
