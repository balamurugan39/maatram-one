import { useRef, useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ACCEPT, uploadFile } from "@/lib/files";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function FileButton({
  ownerId,
  folder,
  onUploaded,
  label = "Upload",
  variant = "outline",
  size = "sm",
}: {
  ownerId: string;
  folder: string;
  onUploaded: (f: { path: string; name: string }) => void | Promise<void>;
  label?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const res = await uploadFile(ownerId, folder, file);
            await onUploaded(res);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button type="button" variant={variant} size={size} disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? "Uploading…" : label}
      </Button>
    </>
  );
}
