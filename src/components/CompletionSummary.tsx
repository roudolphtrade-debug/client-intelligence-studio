import { Check, CircleDashed } from "lucide-react";

import { StatusBadge } from "@/components/StatusBadge";
import { STEPS } from "@/lib/steps";

type SummaryItem = { stepId: string; answered: number; total: number; state: "complete" | "partial" };

export function CompletionSummary({ items }: { items: SummaryItem[] }) {
  const complete = items.filter((i) => i.state === "complete").length;

  return (
    <section className="surface-panel overflow-hidden shadow-[var(--shadow-elevated)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-5 sm:px-6">
        <div className="min-w-0">
          <p className="text-eyebrow text-primary">Récapitulatif</p>
          <h2 className="mt-2 font-display text-lg font-bold text-foreground">
            {complete} sections sur {items.length} finalisées
          </h2>
        </div>
        <StatusBadge tone="gold">Prêt à transmettre</StatusBadge>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => {
          const step = STEPS.find((s) => s.id === item.stepId);
          const done = item.state === "complete";
          return (
            <li
              key={item.stepId}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 sm:px-6"
            >
              <span
                className={
                  done
                    ? "grid size-8 shrink-0 place-items-center rounded-full border border-primary/45 bg-primary/10 text-primary"
                    : "grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface-raised text-muted-foreground"
                }
                aria-hidden="true"
              >
                {done ? <Check className="size-4" /> : <CircleDashed className="size-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {step?.label ?? item.stepId}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {step?.summary}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                {item.answered}/{item.total}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
