import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useMe } from "./session";

export type Application = Tables<"applications">;
export type AppDocument = Tables<"application_documents">;

export function useMyApplication() {
  const me = useMe();
  return useQuery({
    queryKey: ["my-application", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*").eq("user_id", me!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useMyGroup() {
  const me = useMe();
  return useQuery({
    queryKey: ["my-group", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data: gm } = await supabase.from("group_members").select("group_id").eq("user_id", me!.id).maybeSingle();
      if (!gm) return null;
      const { data: g } = await supabase.from("student_groups").select("*").eq("id", gm.group_id).maybeSingle();
      if (!g) return null;
      const ids = [g.anchor1_id, g.anchor2_id, g.zc_id, g.mentor_id].filter((x): x is string => !!x);
      const { data: staff } = ids.length ? await supabase.from("support_staff").select("*").in("id", ids) : { data: [] };
      const byId = Object.fromEntries((staff ?? []).map((s) => [s.id, s]));
      return {
        group: g,
        team: [
          g.anchor1_id ? { slot: "Anchor 1", ...byId[g.anchor1_id]! } : null,
          g.anchor2_id ? { slot: "Anchor 2", ...byId[g.anchor2_id]! } : null,
          g.zc_id ? { slot: "Zone Coordinator", ...byId[g.zc_id]! } : null,
          g.mentor_id ? { slot: "Core Team Mentor", ...byId[g.mentor_id]! } : null,
        ].filter((x) => x && x.id) as (Tables<"support_staff"> & { slot: string })[],
      };
    },
  });
}

/** Selected students unlock the post-admission modules (academics, mentorship, career…). */
export function useIsSelected() {
  const { data } = useMyApplication();
  return data?.stage === "selected";
}
