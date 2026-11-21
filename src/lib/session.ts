import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type Me = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "admin" | "student";
};

export async function fetchMe(): Promise<Me | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const [{ data: roles }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
  ]);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name || (user.user_metadata?.["full_name"] as string | undefined) || "",
    phone: profile?.phone ?? null,
    role: isAdmin ? "admin" : "student",
  };
}

export const meQuery = { queryKey: ["me"], queryFn: fetchMe, staleTime: 60_000 };

export function useMe() {
  const q = useQuery(meQuery);
  return q.data ?? null;
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async (to: "/login/student" | "/login/admin" = "/login/student") => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to, replace: true });
  };
}
