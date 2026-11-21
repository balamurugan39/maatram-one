export type MatchVolunteer = {
  id: string;
  name: string;
  district: string | null;
  locality: string | null;
  pincode: string | null;
  areas: string | null;
  available: boolean;
};

export type MatchTarget = { district?: string | null; locality?: string | null; pincode?: string | null };

/**
 * Basic location + availability + workload matching (no AI), per Module 01 §7.
 * Higher score = better suggestion. Unavailable volunteers are never suggested.
 */
export function scoreVolunteer(v: MatchVolunteer, t: MatchTarget, activeAssignments = 0) {
  if (!v.available) return -1;
  const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();
  let score = 0;
  if (t.pincode && norm(v.pincode) === norm(t.pincode)) score += 50;
  else if (t.pincode && v.pincode && norm(v.pincode).slice(0, 4) === norm(t.pincode).slice(0, 4)) score += 20;
  const loc = norm(t.locality);
  if (loc && (norm(v.locality) === loc || norm(v.areas).split(",").map((a) => a.trim()).includes(loc))) score += 40;
  else if (loc && norm(v.areas).includes(loc)) score += 25;
  if (t.district && norm(v.district) === norm(t.district)) score += 20;
  score -= Math.min(activeAssignments, 5) * 5;
  return score;
}

export function suggestVolunteers<T extends MatchVolunteer>(
  vols: T[],
  t: MatchTarget,
  workload: Record<string, number> = {},
) {
  return vols
    .map((v) => ({ v, score: scoreVolunteer(v, t, workload[v.id] ?? 0) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => ({ ...x.v, score: x.score }));
}
