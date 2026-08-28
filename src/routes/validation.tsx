import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { CompletionSummary } from "@/components/CompletionSummary";
import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StepLayout } from "@/components/StepLayout";
import { TextAnswer } from "@/components/TextAnswer";
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
  const [remarque, setRemarque] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <StepLayout
      step="validation"
      title="Fin de la première vague"
      intro="Merci Raphaël. Avec ces éléments, nous allons pouvoir commencer à vérifier concrètement tes intuitions."
    >
      <QuestionCard number="Récapitulatif" title="Ce que nous allons pouvoir vérifier">
        <ul className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
          <li>→ si YouTube et Meta jouent réellement deux rôles différents ;</li>
          <li>→ quels contenus attirent les bonnes personnes ;</li>
          <li>→ quels contenus servent surtout à accompagner les membres déjà présents ;</li>
          <li>→ et où se situent aujourd'hui les vrais leviers de stabilité.</li>
        </ul>
      </QuestionCard>

      <CompletionSummary />

      <QuestionCard number="Facultatif" title="Une dernière remarque à nous transmettre ?" optional>
        <TextAnswer
          long
          label="Ta remarque"
          placeholder="Tout élément de contexte utile avant que nous commencions l'analyse."
          value={remarque}
          onChange={setRemarque}
        />
      </QuestionCard>

      <SawazCallout title="Rappel">
        Si une donnée manque, ce n'est pas bloquant. Nous travaillerons avec ce que tu as pu
        rassembler.
      </SawazCallout>

      {sent ? (
        <section className="surface-panel flex items-start gap-3 border-primary/40 p-5 sm:p-6">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Éléments envoyés — merci Raphaël.
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Nous revenons vers toi dès que l'analyse de cette première vague est prête.
            </p>
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
