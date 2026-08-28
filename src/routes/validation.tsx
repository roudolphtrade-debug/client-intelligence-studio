import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StepLayout } from "@/components/StepLayout";

import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation — Fin de la première vague | LFTC" },
      {
        name: "description",
        content:
          "Récapitulatif de la première vague de données YouTube et Meta, puis envoi des éléments à l'équipe Sawaz.",
      },
      { property: "og:title", content: "Validation — Fin de la première vague" },
      {
        property: "og:description",
        content: "Vérifie et envoie tes éléments YouTube et Meta pour LFTC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ValidationScreen,
});

function ValidationScreen() {
  const { previous } = stepNeighbours("validation");
  
  const [sent, setSent] = useState(false);

  return (
    <StepLayout
      step="validation"
      title="Première vague terminée"
      intro="Merci. Nous avons maintenant les éléments nécessaires pour commencer à comparer YouTube et Meta sur autre chose que le volume brut."
    >
      <QuestionCard number="Récapitulatif" title="Ce que nous allons chercher à comprendre">
        <div className="space-y-4">
          <ol className="grid list-decimal gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            <li>Quel canal génère réellement de la découverte ?</li>
            <li>Quel canal crée le plus d'attention ?</li>
            <li>Quel canal semble produire les profils les plus qualitatifs ?</li>
            <li>Quel rôle jouent les différents types de contenus YouTube ?</li>
            <li>Où les campagnes Meta envoient réellement les personnes ?</li>
            <li>Pourquoi l'acquisition peut varier fortement d'un jour ou d'une campagne à l'autre ?</li>
          </ol>
          <div className="space-y-2 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              Nous ne tirerons pas encore de conclusion stratégique à partir de ces données seules.
            </p>
            <p>
              Elles seront croisées avec ton questionnaire et avec ce que nous avons déjà observé
              sur l'écosystème LFTC.
            </p>
          </div>
        </div>
      </QuestionCard>


      <SawazCallout title="Rappel">
        Si une donnée manque, ce n'est pas bloquant. Nous travaillerons avec ce que tu as pu
        rassembler.
      </SawazCallout>

      {sent ? (
        <section className="surface-panel flex items-start gap-3 border-primary/40 p-5 sm:p-6">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">C'est reçu.</h2>
            <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <p>
                Cette première collecte va nous permettre de commencer à remplacer certaines
                intuitions par des faits.
              </p>
              <p>
                Prochaine étape : analyser ce que YouTube et Meta racontent réellement sur ton
                acquisition avant de poursuivre l'exploration du reste du parcours LFTC.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <NavigationFooter
        previous={previous}
        next={null}
        nextLabel="Envoyer les éléments"
        onNext={() => setSent(true)}
      />
    </StepLayout>
  );
}
