import { createFileRoute } from "@tanstack/react-router";
import { Clapperboard, Mic, Radio, Users } from "lucide-react";

import { ChoiceCard } from "@/components/ChoiceCard";
import { FileUploader } from "@/components/FileUploader";
import { NavigationFooter } from "@/components/NavigationFooter";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StepLayout } from "@/components/StepLayout";
import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/youtube")({
  head: () => ({
    meta: [
      { title: "YouTube — Diagnostic LFTC" },
      {
        name: "description",
        content: "Chaîne, audience et objectifs vidéo de LFTC : deuxième étape du diagnostic Sawaz.",
      },
      { property: "og:title", content: "YouTube — Diagnostic LFTC" },
      {
        property: "og:description",
        content: "Qualifier la chaîne YouTube de LFTC : maturité, rythme et objectifs.",
      },
    ],
  }),
  component: YoutubeScreen,
});

function YoutubeScreen() {
  const { previous, next } = stepNeighbours("youtube");

  return (
    <StepLayout
      step="youtube"
      title="Où en est la chaîne YouTube de LFTC aujourd'hui ?"
      intro="Trois questions pour situer la maturité de la chaîne, son rythme réel et l'ambition que vous lui donnez pour les douze prochains mois."
    >
      <QuestionCard
        number="Question 01"
        title="Comment décririez-vous la maturité actuelle de la chaîne ?"
        description="Choisissez la situation la plus proche de la réalité, même approximative."
        help={{
          title: "Comment répondre",
          body: "Nous cherchons un ordre de grandeur, pas une donnée exacte. Une chaîne « en sommeil » est aussi une réponse utile.",
        }}
      >
        <div className="grid gap-3">
          <ChoiceCard
            label="Chaîne active et régulière"
            description="Publication au moins bimensuelle, audience installée."
            icon={<Radio />}
            selected
          />
          <ChoiceCard
            label="Chaîne existante mais irrégulière"
            description="Des vidéos en ligne, sans cadence stable depuis plusieurs mois."
            icon={<Clapperboard />}
          />
          <ChoiceCard
            label="Chaîne en création"
            description="Peu ou pas de contenus publiés, tout reste à structurer."
            icon={<Mic />}
            hint="Cas le plus fréquent en démarrage d'accompagnement"
          />
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 02"
        title="Quelle audience souhaitez-vous prioriser sur la vidéo ?"
        description="Un seul choix principal : c'est lui qui orientera les formats recommandés."
        help={{
          title: "Une seule priorité",
          body: "Une chaîne qui parle à tout le monde ne parle à personne. Nous garderons les autres cibles en objectif secondaire.",
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ChoiceCard label="Clients particuliers" description="Grand public, découverte." icon={<Users />} selected />
          <ChoiceCard label="Partenaires et prescripteurs" description="Réseau professionnel." icon={<Users />} />
          <ChoiceCard label="Futurs collaborateurs" description="Marque employeur." icon={<Users />} />
          <ChoiceCard label="Communauté existante" description="Fidélisation et rétention." icon={<Users />} />
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 03"
        title="Partagez un export de vos statistiques YouTube."
        optional
        description="Un export CSV ou une simple capture d'écran des 90 derniers jours suffit."
        help={{
          title: "Où le trouver",
          body: "YouTube Studio → Analytics → Avancé → Exporter. Si l'accès n'est pas disponible, passez cette question sans souci.",
        }}
      >
        <FileUploader
          label="Déposez votre export d'audience"
          files={[{ name: "lftc-youtube-90j.csv", meta: "CSV · 84 Ko · ajouté à l'instant" }]}
        />
      </QuestionCard>

      <SawazCallout>
        Les chaînes qui progressent le plus rapidement sont rarement les plus produites : ce sont
        celles qui tiennent un rythme lisible sur six mois.
      </SawazCallout>

      <NavigationFooter previous={previous} next={next} />
    </StepLayout>
  );
}
