import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Empty } from "@/components/portal/ui";

export const Route = createFileRoute("/_authenticated/admin/mentorship")({
  component: Mentorship,
});

function Mentorship() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Student support"
        title="Mentorship"
        description="Manage student mentorship groups, mentors and guidance activities."
      />
      <div className="rounded-xl border bg-card p-6">
        <Empty
          title="Mentorship management"
          hint="The mentorship workspace is ready. Group and mentor management can be added here."
        />
      </div>
    </div>
  );
}
