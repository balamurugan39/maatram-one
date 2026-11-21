import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-lg bg-marigold shadow-soft">
        <svg viewBox="0 0 24 24" className="size-5 text-accent-foreground" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </svg>
      </span>
      <span className="leading-none">
        <span className={cn("block font-display text-lg font-semibold tracking-tight", light ? "text-sidebar-foreground" : "text-foreground")}>
          MAATRAM <span className="text-accent">ONE</span>
        </span>
        <span className={cn("block text-[10px] font-semibold uppercase tracking-[0.2em]", light ? "text-sidebar-foreground/60" : "text-muted-foreground")}>
          Maatram Foundation
        </span>
      </span>
    </span>
  );
}
