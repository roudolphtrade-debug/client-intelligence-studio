import type { ReactNode } from "react";

import { BrandHeader } from "@/components/BrandHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { SawazMark } from "@/components/brand/Logos";
import { getStep, type StepId } from "@/lib/steps";

export function StepLayout({
  step,
  title,
  intro,
  children,
}: {
  step: StepId;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const current = getStep(step);

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader />

      <main className="mx-auto w-full max-w-3xl px-5 pt-8 pb-16 sm:px-8 sm:pt-12">
        <ProgressBar current={step} />

        <div className="mt-10">
          <p className="text-eyebrow text-muted-foreground">{current.label}</p>
          <h1 className="mt-3 font-display text-2xl leading-tight font-extrabold text-balance sm:text-4xl">
            {title}
          </h1>
          {intro ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {intro}
            </p>
          ) : null}
        </div>

        <div className="mt-8 space-y-5">{children}</div>
      </main>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-5 py-8 text-center sm:px-8">
          <SawazMark />
          <p className="text-xs text-muted-foreground">
            Sawaz Client Intelligence · Dispositif de diagnostic pour LFTC
          </p>
        </div>
      </div>
    </div>
  );
}
