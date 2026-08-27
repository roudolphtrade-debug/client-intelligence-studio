import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { STEPS, type StepId } from "@/lib/steps";
import { cn } from "@/lib/utils";

export function ProgressBar({ current }: { current: StepId }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  const percent = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <nav aria-label="Progression du diagnostic" className="w-full">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <p className="text-eyebrow text-muted-foreground">
          Étape {currentIndex + 1} sur {STEPS.length}
        </p>
        <p className="text-xs font-semibold text-primary">{Math.round(percent)} %</p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-raised"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={currentIndex + 1}
        aria-valuetext={`Étape ${currentIndex + 1} sur ${STEPS.length} : ${STEPS[currentIndex]?.label ?? ""}`}
      >
        <div
          className="gold-rule h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:gap-2 sm:overflow-visible">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.id} className="min-w-0 shrink-0 snap-start sm:shrink">
              <Link
                to={step.to}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                  active && "border-primary/50 bg-primary/10 text-primary",
                  done && "border-border bg-surface text-foreground",
                  !active && !done && "border-border bg-surface/50 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border text-[0.625rem]",
                    active ? "border-primary text-primary" : "border-border-strong",
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-3" /> : step.index}
                </span>
                <span className="truncate">{step.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
