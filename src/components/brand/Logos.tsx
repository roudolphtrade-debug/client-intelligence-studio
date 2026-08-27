import { cn } from "@/lib/utils";

/** LFTC — dominant client mark. Typographic monogram inside a gold-edged tile. */
export function LftcLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-3", className)}
      aria-label="LFTC"
      role="img"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[var(--shadow-gold)]">
        <span className="font-display text-[0.8125rem] font-extrabold tracking-[0.08em]">
          LF
        </span>
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-lg font-extrabold tracking-[0.14em] text-foreground">
          LFTC
        </span>
        <span className="block text-[0.6875rem] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Client Intelligence
        </span>
      </span>
    </span>
  );
}

/** Sawaz — discreet accompaniment signature. */
export function SawazMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-label="Sawaz"
      role="img"
    >
      <span className="grid size-6 place-items-center rounded-md border border-sawaz/40 bg-sawaz/10">
        <span className="font-display text-[0.625rem] font-extrabold text-sawaz">S</span>
      </span>
      <span className="font-display text-xs font-bold tracking-[0.22em] text-sawaz uppercase">
        Sawaz
      </span>
    </span>
  );
}
