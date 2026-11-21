import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { label, tone } from "@/lib/labels";
import { Loader2, Inbox } from "lucide-react";

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string | undefined; actions?: ReactNode; eyebrow?: string | undefined }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between fade-up">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label: l, value, hint, icon, tone: t = "default" }: { label: string; value: ReactNode; hint?: string | undefined; icon?: ReactNode; tone?: "default" | "accent" | "success" | "danger" }) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-4 shadow-soft",
      t === "accent" && "border-accent/50",
      t === "success" && "border-success/30",
      t === "danger" && "border-destructive/30",
    )}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{l}</p>
        {icon && <span className="text-primary-glow [&_svg]:size-4">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ value, text }: { value: string | null | undefined; text?: string | undefined }) {
  const t = tone(value);
  return <Badge variant={t === "default" ? "outline" : t}>{text ?? label(value)}</Badge>;
}

export function Section({ title, description, actions, children, className }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-soft", className)}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ title, hint, children }: { title: string; hint?: string | undefined; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 px-6 py-10 text-center">
      <Inbox className="mb-2 size-6 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground justify-center">
      <Loader2 className="size-4 animate-spin" /> {text}
    </div>
  );
}

export function Field({ label: l, children, hint, className, required }: { label: string; children: ReactNode; hint?: string | undefined; className?: string | undefined; required?: boolean | undefined }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold text-foreground/80">
        {l}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-muted-foreground">{k}</dt>
          <dd className="text-sm font-medium text-foreground">{v === null || v === undefined || v === "" ? "—" : v}</dd>
        </div>
      ))}
    </dl>
  );
}

export const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
