import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, HelpCircle, Table2 } from "lucide-react";

import { ChoiceGroup, MultiChoiceGroup } from "@/components/ChoiceGroup";
import { FileUploader } from "@/components/FileUploader";
import { MetricCard } from "@/components/MetricCard";
import { NavigationFooter } from "@/components/NavigationFooter";
import { OptionToggle } from "@/components/OptionToggle";
import { PathHint, ThreeSeconds, WhyNote } from "@/components/PathHint";
import { QuestionCard } from "@/components/QuestionCard";
import { SawazCallout } from "@/components/SawazCallout";
import { StepLayout } from "@/components/StepLayout";

import { stepNeighbours } from "@/lib/steps";

export const Route = createFileRoute("/meta")({
  head: () => ({
    meta: [
      { title: "Meta — Comprendre le moteur de volume | LFTC" },
      {
        name: "description",
        content:
          "Période, objectif de campagne, destination, résultats et suivi des conversions dans le gestionnaire de publicités Meta.",
      },
      { property: "og:title", content: "Meta — Comprendre le moteur de volume" },
      {
        property: "og:description",
        content: "Collecte des données Meta Ads pour comprendre le rôle réel de Meta chez LFTC.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MetaScreen,
});

const lexique = [
  {
    term: "Amount Spent — Montant dépensé",
    meaning: "Combien as-tu réellement investi sur la période ?",
  },
  {
    term: "Impressions",
    meaning: "Combien de fois tes publicités ont été affichées ?",
  },
  {
    term: "Reach — Couverture",
    meaning: "Combien de personnes différentes ont vu tes publicités ?",
  },
  {
    term: "CTR — Click-Through Rate (taux de clic)",
    meaning: "Combien de personnes cliquent après avoir vu la publicité ?",
  },
  {
    term: "CPC — Cost Per Click (coût par clic)",
    meaning: "Combien coûte un clic en moyenne ?",
  },
  {
    term: "CPM — Cost Per Mille (coût pour mille impressions)",
    meaning: "Combien coûte 1 000 affichages ?",
  },
  {
    term: "Frequency — Fréquence",
    meaning: "Combien de fois une même personne voit ta publicité en moyenne ?",
  },
  {
    term: "Link Clicks — Clics sur le lien",
    meaning: "Combien de personnes ont cliqué sur ton lien ?",
  },
  {
    term: "Landing Page Views — Vues de page de destination",
    meaning: "Combien de personnes ont réellement chargé ta page après le clic ?",
  },
  {
    term: "Cost per Result — Coût par résultat",
    meaning: "Combien te coûte en moyenne chaque résultat obtenu ?",
  },
];

function MetaScreen() {
  const { previous, next } = stepNeighbours("meta");
  const [periode, setPeriode] = useState<string | null>(null);
  const [objectifs, setObjectifs] = useState<string[]>([]);
  const [destination, setDestination] = useState<string[]>([]);
  const [mode, setMode] = useState<string | null>(null);
  const [exportImpossible, setExportImpossible] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [tracking, setTracking] = useState<string | null>(null);
  
  const [resultsMissing, setResultsMissing] = useState(false);

  const showExport = mode === "export" && !exportImpossible;
  const showCaptures =
    mode === "captures" || mode === "guide" || (mode === "export" && exportImpossible);

  return (
    <StepLayout
      step="meta"
      title="Meta — Comprendre le moteur de volume"
      intro="Nous allons regarder ce que les chiffres disent réellement."
    >
      <section className="surface-panel space-y-4 p-5 sm:p-6">
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Nous cherchons à comprendre :</p>
          <ul className="space-y-1">
            <li>→ combien de personnes Meta t'apporte réellement ;</li>
            <li>→ à quel coût ;</li>
            <li>→ et si ces personnes correspondent au profil que tu recherches.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-4">
          <p className="text-eyebrow text-sawaz">Outil · Meta Ads Manager</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Le gestionnaire de publicités Meta (Meta Ads Manager) est l'interface officielle pour
            gérer et analyser tes campagnes Facebook et Instagram.
          </p>
        </div>
      </section>

      <QuestionCard
        number="Question 01"
        title="Sur quelle période souhaites-tu que nous analysions Meta ?"
      >
        <ChoiceGroup
          label="Période Meta"
          value={periode}
          onChange={setPeriode}
          options={[
            { value: "12m", label: "12 derniers mois" },
            { value: "6m", label: "6 derniers mois" },
            { value: "autre", label: "Autre" },
          ]}
        />
      </QuestionCard>

      <QuestionCard
        number="Question 02"
        title="Quel était l'objectif principal de tes campagnes ?"
        description="Dans Meta, cela s'appelle : Campaign Objective — Objectif de campagne."
        help={{
          title: "Où trouver la donnée",
          body: "Gestionnaire de publicités Meta → colonne Objective — Objectif.",
        }}
      >
        <div className="space-y-4">
          <MultiChoiceGroup
            label="Objectif de campagne"
            values={objectifs}
            onToggle={(v) =>
              setObjectifs((prev) =>
                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
              )
            }
            options={[
              { value: "trafic", label: "Trafic" },
              { value: "engagement", label: "Engagement" },
              { value: "messages", label: "Messages" },
              { value: "leads", label: "Leads — Prospects" },
              { value: "ventes", label: "Ventes-conversions" },
              { value: "plusieurs", label: "Plusieurs objectifs selon les campagnes" },
              { value: "autre", label: "Autre" },
              { value: "inconnu", label: "Je ne sais pas" },
            ]}
            columns={2}
          />
          <WhyNote>
            L'objectif choisi influence directement le type de personnes que Meta t'envoie.
          </WhyNote>
        </div>
      </QuestionCard>

      <QuestionCard
        number="Question 03"
        title="Où envoyais-tu les personnes après le clic ?"
      >
        <MultiChoiceGroup
          label="Destination après le clic"
          values={destination}
          onToggle={(v) =>
            setDestination((prev) =>
              prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
            )
          }
          options={[
            { value: "landing", label: "Landing page LFTC" },
            { value: "telegram", label: "Telegram public directement" },
            { value: "conversation", label: "Conversation-message" },
            { value: "autre-page", label: "Autre page" },
            { value: "plusieurs", label: "Plusieurs destinations" },
            { value: "inconnu", label: "Je ne sais pas" },
          ]}
          columns={2}
        />
      </QuestionCard>

      <QuestionCard
        number="Question 04"
        title="Comment préfères-tu nous transmettre les données Meta ?"
      >
        <ChoiceGroup
          label="Méthode de transmission Meta"
          value={mode}
          onChange={(v) => {
            setMode(v);
            setExportImpossible(false);
          }}
          options={[
            { value: "export", label: "Je peux faire un export", icon: <Table2 /> },
            { value: "captures", label: "Je préfère envoyer des captures d'écran", icon: <Camera /> },
            { value: "guide", label: "Guidez-moi étape par étape", icon: <HelpCircle /> },
          ]}
        />
      </QuestionCard>

      {showExport ? (
        <QuestionCard
          number="Option recommandée"
          title="Option recommandée — Export Meta"
          description="Dans le gestionnaire de publicités : Reports — Rapports, puis Export. Sélectionne la période choisie, puis télécharge le fichier en CSV ou Excel."
        >
          <div className="space-y-4">
            <PathHint steps={["Gestionnaire de publicités", "Reports — Rapports", "Export"]} />
            <FileUploader
              label="Dépose ton export Meta ici"
              hint="Formats acceptés : CSV, XLS, XLSX"
            />
            <OptionToggle
              label="Je n'arrive finalement pas à exporter"
              checked={exportImpossible}
              onToggle={() => setExportImpossible((v) => !v)}
            />
          </div>
        </QuestionCard>
      ) : null}

      {showCaptures ? (
        <QuestionCard
          number="Captures Meta"
          title="Envoie-nous simplement l'écran principal"
          description="Ouvre le gestionnaire de publicités, sélectionne la période choisie, puis fais une capture du tableau des campagnes avec les colonnes de performance visibles."
        >
          <div className="space-y-4">
            <PathHint
              steps={["Gestionnaire de publicités", "Campaigns — Campagnes", "Période choisie"]}
            />
            <ThreeSeconds>
              Le tableau qui montre, campagne par campagne, ce que tu as dépensé et ce que tu as
              obtenu.
            </ThreeSeconds>
            <FileUploader label="Dépose tes captures Meta ici" />
          </div>
        </QuestionCard>
      ) : null}

      <QuestionCard
        number="Mini-lexique Meta"
        title="Ce que nous allons regarder dans tes données Meta"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {lexique.map((item) => (
            <MetricCard key={item.term} term={item.term} meaning={item.meaning} />
          ))}
        </div>
      </QuestionCard>

      <QuestionCard
        number="Results"
        title="Results — Résultats"
        description="Dans Meta, la colonne Results — Résultats indique le nombre d'actions obtenues selon l'objectif de la campagne."
      >
        <div className="space-y-4">
          <ThreeSeconds>
            Ce que tu as réellement obtenu : des prospects, des clics, des messages ou des ventes.
          </ThreeSeconds>
          <MultiChoiceGroup
            label="Que compte exactement la colonne Results dans tes campagnes ?"
            values={results}
            onToggle={(v) =>
              setResults((prev) =>
                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
              )
            }
            options={[
              { value: "clic", label: "Un clic" },
              { value: "vue-landing", label: "Une vue de landing page" },
              { value: "message", label: "Un message" },
              { value: "lead", label: "Un lead" },
              { value: "formulaire", label: "Un formulaire rempli" },
              { value: "achat", label: "Un achat-conversion" },
              { value: "plusieurs", label: "Plusieurs résultats selon les campagnes" },
              { value: "autre", label: "Autre" },
              { value: "inconnu", label: "Je ne sais pas" },
            ]}
            columns={2}
          />
          <WhyNote>
            Sans cette précision, un « résultat » peut signifier des choses très différentes d'une
            campagne à l'autre.
          </WhyNote>
          <OptionToggle
            label="Je ne trouve pas cette donnée"
            checked={resultsMissing}
            onToggle={() => setResultsMissing((v) => !v)}
          />
        </div>
      </QuestionCard>

      <QuestionCard number="Suivi" title="Suivi des conversions">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-foreground">
            Un outil de suivi est-il installé (Meta Pixel, Conversions API) ?
          </p>
          <ChoiceGroup
            label="Suivi des conversions Meta"
            value={tracking}
            onChange={setTracking}
            options={[
              { value: "oui", label: "Oui" },
              { value: "non", label: "Non" },
              { value: "pas-sur", label: "Je pense que oui mais je ne suis pas sûr" },
              { value: "inconnu", label: "Je ne sais pas" },
            ]}
          />
          <WhyNote>
            Pour savoir si les résultats affichés par Meta sont fiables ou seulement déclaratifs.
          </WhyNote>
        </div>
      </QuestionCard>


      <SawazCallout title="Rappel">
        Tu ne trouves pas une donnée ? Ne perds pas de temps. Indique simplement qu'elle n'est pas
        disponible et continue.
      </SawazCallout>

      <NavigationFooter previous={previous} next={next} nextLabel="Continuer" />
    </StepLayout>
  );
}
