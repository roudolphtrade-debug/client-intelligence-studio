import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";

import type { Step } from "@/lib/steps";

export function NavigationFooter({
  previous,
  next,
  nextLabel,
  onNext,
  note = "Tes réponses ne sont pas encore enregistrées : cette version est une maquette.",
}: {
  previous?: Step | null;
  next?: Step | null;
  nextLabel?: string;
  onNext?: (() => void) | undefined;
  note?: string;
}) {
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
          <Link
            to={next.to}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span className="truncate">{nextLabel ?? `Continuer · ${next.label}`}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        ) : onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span className="truncate">{nextLabel ?? "Envoyer"}</span>
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : null}

      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{note}</p>
    </footer>
  );
}
