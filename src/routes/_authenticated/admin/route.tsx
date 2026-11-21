import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PortalShell, type NavGroup } from "@/components/portal/PortalShell";
import { meQuery } from "@/lib/session";
import {
  BookOpen, Briefcase, ClipboardList, HandHeart, LayoutDashboard, Megaphone, Network, UserSearch, Users, UsersRound,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/login/admin" });
    if (me.role !== "admin") throw redirect({ to: "/student" });
  },
  component: AdminLayout,
});

const GROUPS: NavGroup[] = [
  { title: "Overview", items: [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard />, exact: true },
    { to: "/admin/students", label: "Students", icon: <UsersRound /> },
    { to: "/admin/announcements", label: "Announcements", icon: <Megaphone /> },
  ] },
  { title: "Admission", items: [
    { to: "/admin/applications", label: "Applications", icon: <ClipboardList /> },
    { to: "/admin/volunteers", label: "PV volunteers", icon: <UserSearch /> },
  ] },
  { title: "Student support", items: [
    { to: "/admin/mentorship", label: "Mentorship", icon: <Users /> },
    { to: "/admin/academics", label: "Academics", icon: <BookOpen /> },
    { to: "/admin/placements", label: "Skills & placements", icon: <Briefcase /> },
  ] },
  { title: "Community", items: [
    { to: "/admin/volunteering", label: "Volunteering", icon: <HandHeart /> },
    { to: "/admin/alumni", label: "Sangamam alumni", icon: <Network /> },
  ] },
];

function AdminLayout() {
  return (
    <PortalShell groups={GROUPS} portal="admin">
      <Outlet />
    </PortalShell>
  );
}
