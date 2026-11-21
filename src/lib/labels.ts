export type BadgeTone = "success" | "warning" | "info" | "danger" | "muted" | "default";

export const ADMISSION_STAGES = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "doc_review", label: "Document review" },
  { key: "doc_correction", label: "Correction needed" },
  { key: "tele_verification", label: "Tele-verification" },
  { key: "pv_eligible", label: "PV eligible" },
  { key: "pv_scheduled", label: "PV scheduled" },
  { key: "pv_review", label: "PV review" },
  { key: "online_interview", label: "Online interview" },
  { key: "final_interview", label: "Final interview" },
  { key: "selected", label: "Selected" },
  { key: "not_selected", label: "Not selected" },
  { key: "on_hold", label: "On hold" },
] as const;

/** Linear journey shown to students (on_hold / not_selected are off-track states). */
export const JOURNEY = [
  { key: "submitted", label: "Applied", stages: ["submitted"] },
  { key: "documents", label: "Documents", stages: ["doc_review", "doc_correction"] },
  { key: "tele", label: "Tele-verification", stages: ["tele_verification"] },
  { key: "pv", label: "Physical verification", stages: ["pv_eligible", "pv_scheduled", "pv_review"] },
  { key: "online", label: "Online interview", stages: ["online_interview"] },
  { key: "final", label: "Final interview", stages: ["final_interview"] },
  { key: "result", label: "Result", stages: ["selected", "not_selected"] },
];

export function journeyIndex(stage: string) {
  if (stage === "draft") return -1;
  return JOURNEY.findIndex((j) => j.stages.includes(stage));
}

const LABELS: Record<string, string> = {
  ...Object.fromEntries(ADMISSION_STAGES.map((s) => [s.key, s.label])),
  pending_review: "Pending review",
  verified: "Verified",
  invalid: "Incorrect / invalid",
  missing: "Missing",
  reupload_required: "Re-upload required",
  successful: "Successful",
  clarification_required: "Clarification required",
  pending: "Pending",
  unsuccessful: "Unsuccessful — office decision",
  incomplete: "Incomplete",
  assigned: "Assigned",
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
  absent: "Absent",
  present: "Present",
  not_marked: "Not marked",
  recommended: "Recommended",
  not_recommended: "Not recommended",
  hold: "Hold",
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  going: "Going",
  maybe: "Maybe",
  not_going: "Not going",
  submitted_skill: "Submitted",
  rejected: "Rejected",
  approved: "Approved",
  applied: "Applied",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offered: "Offered",
  joined: "Joined",
  withdrawn: "Withdrawn",
  interested: "Interested",
  not_available: "Not available",
  not_assigned: "Not assigned",
  published: "Published",
  closed: "Closed",
  upcoming: "Upcoming",
  anchor: "Anchor",
  zone_coordinator: "Zone Coordinator",
  mentor: "Core Team Mentor",
  not_written: "Not written",
  written: "Written",
  results_published: "Results published",
  tele_verification_act: "Tele-verification",
  physical_verification: "Physical verification",
  school_visit: "School visit",
  event_assistance: "Event assistance",
  karpom_karpippom: "Karpom Karpippom",
  outreach: "Outreach",
  job: "Job",
  internship: "Internship",
  online: "Online",
  final: "Final",
  offline: "In person",
  meeting: "Meeting",
  activity: "Activity",
  zone_activity: "Zone activity",
};

export function label(v: string | null | undefined) {
  if (!v) return "—";
  return LABELS[v] ?? v.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

const TONES: Record<string, BadgeTone> = {
  verified: "success", successful: "success", selected: "success", completed: "success", present: "success",
  recommended: "success", resolved: "success", approved: "success", offered: "success", joined: "success",
  assigned: "info", going: "success", published: "info", open: "info", upcoming: "info", scheduled: "info",
  pending_review: "warning", pending: "warning", in_progress: "warning", doc_review: "warning", submitted: "info",
  clarification_required: "warning", maybe: "warning", hold: "warning", on_hold: "warning", shortlisted: "info",
  interview: "info", applied: "info", interested: "info", rescheduled: "warning", doc_correction: "danger",
  invalid: "danger", missing: "danger", reupload_required: "danger", unsuccessful: "danger", rejected: "danger",
  not_selected: "danger", absent: "danger", not_recommended: "danger", cancelled: "muted", closed: "muted",
  draft: "muted", not_marked: "muted", not_going: "muted", withdrawn: "muted", not_available: "muted", not_assigned: "muted",
  incomplete: "warning",
};

export function tone(v: string | null | undefined): BadgeTone {
  if (!v) return "muted";
  return TONES[v] ?? "default";
}

export const DOC_TYPES = [
  { key: "Class 12 mark sheet", required: true },
  { key: "Community certificate", required: true },
  { key: "Income certificate", required: true },
  { key: "Date-of-birth proof", required: false },
  { key: "Aadhaar / ID proof", required: false },
];

export const DISTRICTS = [
  "Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri","Dindigul","Erode","Kallakurichi",
  "Kancheepuram","Kanniyakumari","Karur","Krishnagiri","Madurai","Mayiladuthurai","Nagapattinam","Namakkal",
  "Nilgiris","Perambalur","Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi","Thanjavur",
  "Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur","Tiruppur","Tiruvallur","Tiruvannamalai",
  "Tiruvarur","Vellore","Viluppuram","Virudhunagar",
];

export function fmtDate(v: string | null | undefined, withTime = false) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", withTime
    ? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short", year: "numeric" });
}

export function calcPercentage(obtained?: number | null, total?: number | null) {
  if (!obtained || !total || total <= 0) return null;
  return Math.round((obtained / total) * 10000) / 100;
}
