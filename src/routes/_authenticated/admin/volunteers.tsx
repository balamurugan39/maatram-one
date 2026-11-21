import { createFileRoute } from "@tanstack/react-router";
import { CrudManager } from "@/components/portal/CrudManager";
import { PageHeader, StatusBadge } from "@/components/portal/ui";
import { DISTRICTS } from "@/lib/labels";

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  head: () => ({ meta: [{ title: "PV Volunteers — MAATRAM ONE Office" }, { name: "description", content: "Manage physical-verification volunteers." }] }),
  component: Volunteers,
});

function Volunteers() {
  return (
    <div>
      <PageHeader eyebrow="Module 01 · Admission" title="PV volunteers" description="Volunteers who visit students' homes for physical verification. Locality, pincode and areas power the suggestions on each application." />
      <CrudManager
        table="volunteers" title="Volunteers" addLabel="Add volunteer" orderBy="name" ascending searchKeys={["name", "district", "locality", "pincode", "areas"]}
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email", type: "email" },
          { name: "district", label: "District", type: "select", options: DISTRICTS.map((d) => ({ value: d, label: d })) },
          { name: "locality", label: "Locality" },
          { name: "pincode", label: "Pincode" },
          { name: "areas", label: "Areas covered (comma separated)", full: true },
          { name: "available", label: "Available for visits", type: "checkbox" },
        ]}
        defaults={{ available: true }}
        columns={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "locality", label: "Area", render: (r) => [r["locality"], r["district"], r["pincode"]].filter(Boolean).join(", ") || "—" },
          { key: "completed_visits", label: "Visits done" },
          { key: "available", label: "Status", render: (r) => <StatusBadge value={r["available"] ? "open" : "not_available"} text={r["available"] ? "Available" : "Unavailable"} /> },
        ]}
      />
    </div>
  );
}
