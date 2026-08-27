import { createFileRoute } from "@tanstack/react-router";
import { Facebook, Instagram, Megaphone, Target } from "lucide-react";

import { ChoiceCard } from "@/components/ChoiceCard";
import { FileUploader } from "@/components/FileUploader";
import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StepLayout } from "@/components/StepLayout";
import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/meta")({
  head: () => ({
    meta: [
      { title: "Meta — Diagnostic LFTC" },
      {
        name: "description",
        content: "Pages Facebook, Instagram et diffusion payante de LFTC : quatrième étape du diagnostic.",
      },
      { property: "og:title", content: "Meta — Diagnostic LFTC" },
      {
        property: "og:description",
        content: "Évaluer la présence Facebook, Instagram et publicitaire de LFTC.",
      },
    ],
  }),
  component: MetaScreen,
});

function MetaScreen() {
  const { previous, next } = stepNeighbours("meta");

  return (
    <StepLayout
      step="meta"
      title="Comment se comporte votre présence sur Facebook et Instagram ?"
      intro="Dernière étape de collecte : la diffusion sociale et publicitaire. Elle détermine la manière dont vos contenus atteignent réellement leur audience."
    >
      <QuestionCard
        number="Question 01"
        title="Quels comptes Meta sont actifs pour LFTC ?"
        description="Sélectionnez tous les comptes réellement animés."
        help={{
          title: "Compte actif",
          body: "Un compte est considéré actif s'il a reçu au moins une publication au cours des 60 derniers jours.",
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard label="Page Facebook" description="Page professionnelle publique." icon={<Facebook />} selected />
          <ChoiceCard label="Compte Instagram" description="Profil professionnel ou créateur." icon={<Instagram />} selected />
          <ChoiceCard label="Business Manager" description="Gestion centralisée des actifs." icon={<Target />} />
          <ChoiceCard label="Aucun compte actif" description="Présence à créer entièrement." icon={<Megaphone />} />
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 02"
        title="Avez-vous déjà investi en publicité Meta ?"
        help={{
          title: "Budget indicatif",
          body: "Aucun montant précis n'est attendu. L'ordre de grandeur suffit à calibrer les recommandations.",
        }}
      >
        <div className="grid gap-3">
          <ChoiceCard label="Oui, de façon continue" description="Campagnes toujours actives." icon={<Megaphone />} />
          <ChoiceCard
            label="Oui, ponctuellement"
            description="Quelques boosts de publications ou campagnes saisonnières."
            icon={<Megaphone />}
            selected
            hint="Le cas le plus courant chez les PME locales"
          />
          <ChoiceCard label="Jamais" description="Uniquement de la portée organique." icon={<Megaphone />} />
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 03"
        title="Ajoutez un aperçu de vos performances Meta."
        optional
        description="Capture de Meta Business Suite ou export des 90 derniers jours."
        help={{
          title: "Où le trouver",
          body: "Meta Business Suite → Statistiques → Exporter les données. Une capture d'écran lisible convient également.",
        }}
      >
        <FileUploader label="Déposez votre export Meta" />
      </QuestionCard>

      <SawazCallout>
        Sur Meta, la régularité de diffusion pèse davantage que le budget. Un petit budget constant
        surpasse presque toujours une campagne unique mieux dotée.
      </SawazCallout>

      <NavigationFooter previous={previous} next={next} nextLabel="Passer à la validation" />
    </StepLayout>
  );
}
