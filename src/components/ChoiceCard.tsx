import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ChoiceCard({
  label,
  description,
  icon,
  selected = false,
  hint,
  multi = false,
  onSelect,
}: {
  label: string;
  description?: string | undefined;
  icon?: ReactNode | undefined;
  selected?: boolean | undefined;
  hint?: string | undefined;
  multi?: boolean | undefined;
  onSelect?: (() => void) | undefined;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-primary/55 bg-primary/[0.08]"
          : "border-border bg-surface-raised hover:border-border-strong",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg border [&_svg]:size-4",
          selected
            ? "border-primary/45 bg-primary/12 text-primary"
            : "border-border bg-surface text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {icon ?? <span className="text-xs font-bold">{label.slice(0, 1)}</span>}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {description ? (
          <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
        {hint ? (
          <span className="mt-2 block text-[0.6875rem] font-medium tracking-wide text-sawaz">
            {hint}
          </span>
        ) : null}
      </span>

      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center border transition-colors",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
        )}
        aria-hidden="true"
      >
        {selected ? <Check className="size-3" /> : null}
      </span>
    </button>
  );
}
