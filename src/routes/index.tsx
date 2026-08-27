import { createFileRoute } from "@tanstack/react-router";
import { Clock, FileCheck2, ShieldCheck, Users } from "lucide-react";

import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StatusBadge } from "@/components/StatusBadge";
import { StepLayout } from "@/components/StepLayout";
import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Diagnostic LFTC — Sawaz Client Intelligence" },
      {
        name: "description",
        content:
          "Diagnostic digital LFTC en 5 étapes : introduction, YouTube, contenus, Meta et validation. Accompagné par Sawaz.",
      },
      { property: "og:title", content: "Diagnostic LFTC — Sawaz Client Intelligence" },
      {
        property: "og:description",
        content: "Le point de départ du diagnostic digital LFTC, accompagné par Sawaz.",
      },
    ],
  }),
  component: IntroductionScreen,
});

const facts = [
  { icon: Clock, label: "Durée estimée", value: "18 à 25 minutes" },
  { icon: FileCheck2, label: "Sections", value: "5 étapes guidées" },
  { icon: Users, label: "Destinataire", value: "Raphaël · LFTC" },
  { icon: ShieldCheck, label: "Confidentialité", value: "Usage interne Sawaz" },
];

function IntroductionScreen() {
  const { previous, next } = stepNeighbours("introduction");

  return (
    <StepLayout
      step="introduction"
      title="Bienvenue Raphaël, cadrons ensemble la présence digitale de LFTC."
      intro="Ce diagnostic rassemble les informations dont l'équipe a besoin pour construire une stratégie de contenu solide. Répondez à votre rythme : chaque section est courte, illustrée et accompagnée d'une aide contextuelle."
    >
      <section className="surface-panel p-5 sm:p-6">
        <p className="text-eyebrow text-primary">Le cadre</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {facts.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 items-start gap-3">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-raised text-primary"
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate text-sm font-semibold text-foreground">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <QuestionCard
        number="Ce que nous allons couvrir"
        title="Quatre volets, une seule lecture de votre écosystème."
        description="Chaîne YouTube, bibliothèque de contenus, présence Meta, puis relecture finale avant transmission."
        help={{
          title: "Pourquoi cet ordre",
          body: "Nous partons du média le plus structurant (YouTube) pour ensuite qualifier les formats et la diffusion sociale. Cela évite les redites et accélère la restitution.",
        }}
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="gold">YouTube</StatusBadge>
          <StatusBadge tone="gold">Contenus</StatusBadge>
          <StatusBadge tone="gold">Meta</StatusBadge>
          <StatusBadge tone="neutral">Validation</StatusBadge>
        </div>
      </QuestionCard>

      <SawazCallout title="Avant de commencer">
        Rassemblez si possible les accès analytiques et deux ou trois exemples de contenus dont
        vous êtes fier. Ce sont les éléments les plus utiles à l'analyse.
      </SawazCallout>

      <NavigationFooter previous={previous} next={next} nextLabel="Commencer le diagnostic" />
    </StepLayout>
  );
}
