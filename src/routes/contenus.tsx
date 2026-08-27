import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Camera, FileText, Layers, PenLine } from "lucide-react";

import { ChoiceCard } from "@/components/ChoiceCard";
import { FileUploader } from "@/components/FileUploader";
import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StatusBadge } from "@/components/StatusBadge";
import { StepLayout } from "@/components/StepLayout";
import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/contenus")({
  head: () => ({
    meta: [
      { title: "Contenus — Diagnostic LFTC" },
      {
        name: "description",
        content: "Formats, rythme de publication et bibliothèque existante de LFTC.",
      },
      { property: "og:title", content: "Contenus — Diagnostic LFTC" },
      {
        property: "og:description",
        content: "Cartographier les formats et le rythme éditorial de LFTC.",
      },
    ],
  }),
  component: ContenusScreen,
});

function ContenusScreen() {
  const { previous, next } = stepNeighbours("contenus");

  return (
    <StepLayout
      step="contenus"
      title="Quels contenus produisez-vous déjà, et à quel rythme ?"
      intro="Cette étape sert à cartographier l'existant : ce que vous savez produire facilement, ce qui vous coûte, et ce que vous aimeriez tester."
    >
      <QuestionCard
        number="Question 01"
        title="Quels formats produisez-vous aujourd'hui ?"
        description="Plusieurs réponses possibles. Sélectionnez uniquement ce qui existe réellement."
        help={{
          title: "Existant, pas souhaité",
          body: "Nous listerons les formats à explorer plus tard. Ici, décrivez seulement ce qui est déjà produit.",
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard label="Vidéos longues" description="Formats de 5 à 20 minutes." icon={<Layers />} selected />
          <ChoiceCard label="Formats courts verticaux" description="Shorts, Reels, TikTok." icon={<Camera />} selected />
          <ChoiceCard label="Photos et visuels" description="Chantiers, produits, équipe." icon={<Camera />} />
          <ChoiceCard label="Articles et newsletters" description="Contenus écrits réguliers." icon={<PenLine />} />
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 02"
        title="À quelle fréquence publiez-vous, toutes plateformes confondues ?"
        help={{
          title: "Rythme réel",
          body: "Indiquez le rythme tenu sur les trois derniers mois, pas le rythme idéal.",
        }}
      >
        <div className="grid gap-3">
          <ChoiceCard label="Plusieurs fois par semaine" icon={<CalendarDays />} />
          <ChoiceCard label="Une à deux fois par semaine" icon={<CalendarDays />} selected />
          <ChoiceCard label="Une à deux fois par mois" icon={<CalendarDays />} />
          <ChoiceCard label="Publication ponctuelle" icon={<CalendarDays />} />
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 03"
        title="Ajoutez deux ou trois contenus représentatifs."
        optional
        description="Ceux dont vous êtes le plus satisfait, et si possible un qui n'a pas fonctionné."
        help={{
          title: "Pourquoi un échec",
          body: "Un contenu qui n'a pas marché est souvent plus informatif qu'un succès : il révèle un écart entre intention et perception.",
        }}
      >
        <FileUploader
          label="Déposez vos contenus de référence"
          hint="PDF, PNG, JPG ou lien exporté · 20 Mo maximum"
          files={[
            { name: "reportage-chantier-mars.jpg", meta: "JPG · 2,4 Mo" },
            { name: "presentation-equipe.pdf", meta: "PDF · 1,1 Mo" },
          ]}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge tone="neutral" icon={<FileText />}>
            2 fichiers ajoutés
          </StatusBadge>
          <StatusBadge tone="sawaz">Analyse Sawaz incluse</StatusBadge>
        </div>
      </QuestionCard>

      <SawazCallout title="Méthode">
        Nous croisons vos formats existants avec vos ressources internes réelles. L'objectif n'est
        pas de produire plus, mais de produire ce qui se répète sans effort.
      </SawazCallout>

      <NavigationFooter previous={previous} next={next} />
    </StepLayout>
  );
}
