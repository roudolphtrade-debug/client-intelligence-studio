import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Mail, ShieldCheck } from "lucide-react";

import { CompletionSummary } from "@/components/CompletionSummary";
import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StatusBadge } from "@/components/StatusBadge";
import { StepLayout } from "@/components/StepLayout";
import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation — Diagnostic LFTC" },
      {
        name: "description",
        content: "Relecture finale du diagnostic LFTC avant transmission à l'équipe Sawaz.",
      },
      { property: "og:title", content: "Validation — Diagnostic LFTC" },
      {
        property: "og:description",
        content: "Récapitulatif complet du diagnostic digital LFTC avant envoi.",
      },
    ],
  }),
  component: ValidationScreen,
});

const summary = [
  { stepId: "introduction", answered: 2, total: 2, state: "complete" as const },
  { stepId: "youtube", answered: 3, total: 3, state: "complete" as const },
  { stepId: "contenus", answered: 3, total: 3, state: "complete" as const },
  { stepId: "meta", answered: 2, total: 3, state: "partial" as const },
];

const nextSteps = [
  { icon: ShieldCheck, title: "Relecture Sawaz", detail: "Analyse interne sous 48 heures ouvrées." },
  { icon: CalendarCheck, title: "Restitution", detail: "Session de 45 minutes avec Raphaël." },
  { icon: Mail, title: "Livrable", detail: "Feuille de route éditoriale sur 6 mois." },
];

function ValidationScreen() {
  const { previous, next } = stepNeighbours("validation");

  return (
    <StepLayout
      step="validation"
      title="Tout est prêt, Raphaël. Une dernière relecture avant transmission."
      intro="Vérifiez le récapitulatif ci-dessous. Vous pouvez revenir sur n'importe quelle section : rien n'est envoyé tant que vous ne validez pas."
    >
      <CompletionSummary items={summary} />

      <QuestionCard
        number="Suite du parcours"
        title="Ce qui se passe après votre validation."
        description="Trois étapes, une seule interlocutrice côté Sawaz."
      >
        <ol className="grid gap-3">
          {nextSteps.map(({ icon: Icon, title, detail }, i) => (
            <li
              key={title}
              className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-xl border border-border bg-surface-raised p-4"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-sawaz/35 bg-sawaz/10 text-sawaz"
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {i + 1}. {title}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </QuestionCard>

      <section className="surface-panel p-5 sm:p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <p className="text-eyebrow text-primary">Transmission</p>
            <h2 className="mt-2 font-display text-lg font-bold text-foreground">
              Envoyer le diagnostic à l'équipe Sawaz
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cette version de démonstration n'envoie aucune donnée. Le bouton illustre l'action
              finale du parcours.
            </p>
          </div>
          <StatusBadge tone="sawaz">Maquette</StatusBadge>
        </div>
        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Valider et transmettre
        </button>
      </section>

      <SawazCallout title="Merci">
        Votre précision à cette étape conditionne la qualité de la restitution. Nous revenons vers
        vous rapidement avec une lecture claire de vos priorités.
      </SawazCallout>

      <NavigationFooter previous={previous} next={next} />
    </StepLayout>
  );
}
