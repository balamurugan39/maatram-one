import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { PortalShell, type NavGroup } from "@/components/portal/PortalShell";
import { meQuery } from "@/lib/session";
import {
  Bell, BookOpen, Briefcase, ClipboardList, GraduationCap, HandHeart, LayoutDashboard, LifeBuoy, MessageCircle, Network, Sparkles, UserRound, Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery);
    if (!me) throw redirect({ to: "/login/student" });
    if (me.role === "admin") throw redirect({ to: "/admin" });
  },
  component: StudentLayout,
});

const GROUPS: NavGroup[] = [
  { title: "Overview", items: [
    { to: "/student", label: "Dashboard", icon: <LayoutDashboard />, exact: true },
    { to: "/student/notifications", label: "Notifications", icon: <Bell /> },
  ] },
  { title: "Admission", items: [{ to: "/student/admission", label: "My application", icon: <ClipboardList /> }] },
  { title: "Mentorship", items: [
    { to: "/student/support", label: "Support team & meetings", icon: <Users /> },
    { to: "/student/messages", label: "Messages", icon: <MessageCircle /> },
    { to: "/student/queries", label: "Queries", icon: <LifeBuoy /> },
  ] },
  { title: "Academics", items: [
    { to: "/student/academics", label: "Academic record", icon: <GraduationCap /> },
    { to: "/student/learning", label: "Learning & programmes", icon: <BookOpen /> },
  ] },
  { title: "Career", items: [
    { to: "/student/skills", label: "Skills & career profile", icon: <Sparkles /> },
    { to: "/student/placements", label: "Placements", icon: <Briefcase /> },
  ] },
  { title: "Community", items: [
    { to: "/student/volunteering", label: "Volunteering", icon: <HandHeart /> },
    { to: "/student/alumni", label: "Sangamam alumni", icon: <Network /> },
  ] },
  { title: "Account", items: [{ to: "/student/profile", label: "My profile", icon: <UserRound /> }] },
];

function StudentLayout() {
  return (
    <PortalShell groups={GROUPS} portal="student">
      <Outlet />
    </PortalShell>
  );
}
