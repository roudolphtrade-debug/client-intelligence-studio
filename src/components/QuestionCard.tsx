import type { ReactNode } from "react";

import { HelpPopover } from "@/components/HelpPopover";
import { StatusBadge } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

export function QuestionCard({
  number,
  title,
  description,
  optional,
  help,
  children,
  className,
}: {
  number?: string;
  title: string;
  description?: string;
  optional?: boolean;
  help?: { title: string; body: ReactNode };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "surface-panel p-5 shadow-[var(--shadow-elevated)] sm:p-6",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {number ? (
              <span className="text-eyebrow text-primary">{number}</span>
            ) : null}
            {optional ? <StatusBadge tone="neutral">Facultatif</StatusBadge> : null}
          </div>
          <h2 className="font-display text-base leading-snug font-bold text-balance text-foreground sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {help ? (
          <HelpPopover title={help.title}>{help.body}</HelpPopover>
        ) : null}
      </div>

      {children ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}
