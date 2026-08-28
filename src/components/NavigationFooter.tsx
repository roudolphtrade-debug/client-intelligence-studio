import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { Step } from "@/lib/steps";
import { cn } from "@/lib/utils";

export function NavigationFooter({
  previous,
  next,
  nextLabel,
  onNext,
  blocker = null,
  note = "Tes réponses sont enregistrées automatiquement sur cet appareil.",
}: {
  previous?: Step | null;
  next?: Step | null;
  nextLabel?: string;
  onNext?: (() => void) | undefined;
  blocker?: string | null;
  note?: string;
}) {
  const navigate = useNavigate();
  const blocked = Boolean(blocker);

  const nextClass = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90",
    blocked && "cursor-not-allowed opacity-40 hover:opacity-40",
  );

  return (
    <footer className="mt-10 border-t border-border pt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {previous ? (
          <Link
            to={previous.to}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-border-strong"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="truncate">{previous.label}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}

        {next ? (
          <button
            type="button"
            disabled={blocked}
            aria-disabled={blocked}
            onClick={() => {
              if (blocked) return;
              void navigate({ to: next.to });
            }}
            className={nextClass}
          >
            <span className="truncate">{nextLabel ?? `Continuer · ${next.label}`}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : onNext ? (
          <button
            type="button"
            disabled={blocked}
            aria-disabled={blocked}
            onClick={() => {
              if (blocked) return;
              onNext();
            }}
            className={nextClass}
          >
            <span className="truncate">{nextLabel ?? "Envoyer"}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {blocker ? (
        <p role="status" className="mt-4 text-center text-xs font-semibold text-sawaz">
          {blocker}
        </p>
      ) : null}
      <p className="mt-2 text-center text-xs text-muted-foreground">{note}</p>
    </footer>
  );
}
