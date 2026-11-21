import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type StudentLite = { id: string; full_name: string; email: string | null; phone: string | null };

/** All registered student accounts (admin accounts excluded). */
export function useStudents() {
  return useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, phone").order("full_name"),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
      ]);
      if (error) throw error;
      const admins = new Set((roles ?? []).map((r) => r.user_id));
      return (profiles ?? []).filter((p) => !admins.has(p.id)) as StudentLite[];
    },
  });
}

export function useStudentLookup() {
  const { data = [] } = useStudents();
  const byId = Object.fromEntries(data.map((s) => [s.id, s]));
  return {
    students: data,
    options: data.map((s) => ({ value: s.id, label: `${s.full_name || "Unnamed"}${s.email ? ` (${s.email})` : ""}` })),
    name: (id: string | null | undefined) => (id ? byId[id]?.full_name || byId[id]?.email || "Student" : "—"),
  };
}

export function useStaffLookup() {
  const { data = [] } = useQuery({
    queryKey: ["support_staff", "lookup"],
    queryFn: async () => (await supabase.from("support_staff").select("*").order("name")).data ?? [],
  });
  const byId = Object.fromEntries(data.map((s) => [s.id, s]));
  return {
    staff: data,
    options: data.map((s) => ({ value: s.id, label: `${s.name} — ${s.role.replace(/_/g, " ")}` })),
    name: (id: string | null | undefined) => (id ? byId[id]?.name ?? "—" : "—"),
  };
}

export const opt = (...keys: string[]) => keys.map((k) => ({ value: k, label: k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) }));
