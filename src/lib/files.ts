import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BUCKET = "student-files";
export const MAX_FILE_MB = 10;
export const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function validateFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Only PDF, JPG, PNG or WEBP files are allowed.";
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `File must be smaller than ${MAX_FILE_MB} MB.`;
  return null;
}

/** Uploads into the owner's folder (`<userId>/<folder>/...`) so storage rules can scope access. */
export async function uploadFile(ownerId: string, folder: string, file: File) {
  const err = validateFile(file);
  if (err) throw new Error(err);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${ownerId}/${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return { path, name: file.name };
}

export async function openFile(path: string | null | undefined) {
  if (!path) return;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data) {
    toast.error("Could not open the file");
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}
