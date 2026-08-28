import type { ClientDossier } from "./types";

/**
 * Données fictives de démonstration (aucun backend).
 * À remplacer par un service de lecture lors de l'intégration.
 */

export const DOSSIERS: ClientDossier[] = [
  {
    clientId: "lftc",
    collectedAt: "2026-08-26",
    progress: { received: 7, expected: 10 },
    sections: [
      {
        id: "yt-collecte",
        title: "YouTube — Vue d'ensemble",
        source: "youtube",
        status: "disponible",
        answers: [
          { question: "Méthode de transmission", answer: "Export YouTube Studio" },
          { question: "Période transmise", answer: "365 derniers jours" },
          { question: "Vidéos réservées aux membres", answer: "Oui" },
          {
            question: "Peux-tu nous indiquer les principales ?",
            answer: "Sessions live mensuelles, replays d'ateliers",
          },
        ],
        files: [
          {
            id: "f1",
            name: "Chart data - Overview 365j.csv",
            size: 48200,
            kind: "csv",
            receivedAt: "2026-08-26",
          },
          {
            id: "f2",
            name: "Table data - Content 365j.xlsx",
            size: 91400,
            kind: "xlsx",
            receivedAt: "2026-08-26",
          },
        ],
        missing: [],
      },
      {
        id: "yt-contenus",
        title: "YouTube — Contenus & audience",
        source: "youtube",
        status: "partiel",
        answers: [
          { question: "Traffic Sources transmis", answer: "Oui" },
          { question: "New vs Returning Viewers transmis", answer: "Non — donnée introuvable" },
          { question: "Guide VIP", answer: "Capture transmise", optional: true },
          { question: "Captures des 10 vidéos", answer: "6 sur 10", optional: true },
        ],
        files: [
          {
            id: "f3",
            name: "traffic-sources.png",
            size: 384000,
            kind: "image",
            previewUrl: "",
            receivedAt: "2026-08-26",
          },
          {
            id: "f4",
            name: "guide-vip-analytics.png",
            size: 291000,
            kind: "image",
            previewUrl: "",
            receivedAt: "2026-08-26",
          },
        ],
        missing: ["New vs Returning Viewers", "4 captures vidéos sur 10"],
      },
      {
        id: "meta-moteur",
        title: "Meta — Comprendre le moteur de volume",
        source: "meta",
        status: "partiel",
        answers: [
          { question: "Période transmise", answer: "12 derniers mois" },
          { question: "Objectifs principaux", answer: "Trafic, Leads — Prospects" },
          { question: "Destination principale", answer: "Landing page LFTC" },
          { question: "Mode de transmission", answer: "Exporter le tableau Meta" },
          { question: "Results", answer: "Clic, lead" },
          {
            question: "Système de suivi sur la landing page",
            answer: "Je pense que oui mais je ne suis pas sûr",
          },
        ],
        files: [
          {
            id: "f5",
            name: "meta-ads-12m.csv",
            size: 132000,
            kind: "csv",
            receivedAt: "2026-08-27",
          },
        ],
        missing: ["Cost per Result par campagne", "Landing Page Views"],
      },
      {
        id: "meta-captures",
        title: "Meta — Captures complémentaires",
        source: "meta",
        status: "facultatif",
        answers: [{ question: "Captures Ads Manager", answer: "Non transmises", optional: true }],
        files: [],
        missing: ["Captures de la colonne Results"],
      },
    ],
    notes: [
      {
        id: "n1",
        type: "constat",
        title: "Le volume Meta ne se retrouve pas dans les vues YouTube",
        body: "Les pics de dépense Meta ne coïncident pas avec des hausses de vues YouTube sur la même semaine.",
      },
      {
        id: "n2",
        type: "hypothese",
        title: "Deux audiences distinctes plutôt qu'un tunnel",
        body: "Meta alimenterait directement la landing page, sans passage par la chaîne. À confirmer avec Traffic Sources.",
      },
      {
        id: "n3",
        type: "recommandation",
        title: "Fiabiliser la mesure avant d'arbitrer le budget",
        body: "Vérifier le suivi installé sur la landing page avant toute conclusion sur le coût par résultat.",
      },
    ],
    review: {
      published: true,
      publishedAt: "2026-08-28",
      token: "lftc-2f9d41",
      synthesis:
        "Meta produit aujourd'hui la majorité du volume entrant, mais la découverte durable reste portée par YouTube. Les deux canaux ne jouent pas le même rôle et ne doivent pas être comparés sur le même indicateur.",
      facts: [
        "365 jours de données YouTube transmises, dont Traffic Sources.",
        "12 mois de campagnes Meta exportés, majoritairement orientés Trafic et Leads.",
        "La destination principale des campagnes Meta est la landing page, pas la chaîne.",
        "New vs Returning Viewers n'a pas pu être récupéré.",
      ],
      interpretations: [
        "Le volume Meta est un volume d'entrée, pas un volume d'attention.",
        "YouTube alimente une audience qui revient, Meta une audience qui découvre.",
        "L'absence de suivi confirmé limite la lecture du coût par résultat réel.",
      ],
      hypotheses: [
        "Une partie des leads Meta n'a jamais été exposée au contenu YouTube.",
        "Les contenus longs YouTube portent la conversion différée.",
        "La fréquence Meta élevée pourrait user l'audience froide.",
      ],
      recommendations: [
        {
          title: "Séparer les indicateurs par rôle de canal",
          body: "Mesurer YouTube sur l'attention et la récurrence, Meta sur le coût d'entrée.",
        },
        {
          title: "Fiabiliser le suivi de la landing page",
          body: "Confirmer ce qui est réellement installé avant tout arbitrage budgétaire.",
        },
        {
          title: "Compléter la donnée manquante",
          body: "Récupérer New vs Returning Viewers pour valider l'hypothèse des deux audiences.",
        },
      ],
      nextActions: [
        { title: "Point de restitution commenté", owner: "Sawaz", horizon: "Semaine 1" },
        { title: "Vérification du tracking landing page", owner: "LFTC", horizon: "Semaine 1" },
        { title: "Seconde vague de collecte", owner: "Sawaz × LFTC", horizon: "Semaine 3" },
      ],
      charts: {
        acquisition: [
          { label: "Mars", youtube: 42, meta: 61 },
          { label: "Avril", youtube: 48, meta: 74 },
          { label: "Mai", youtube: 45, meta: 88 },
          { label: "Juin", youtube: 58, meta: 79 },
          { label: "Juillet", youtube: 63, meta: 95 },
          { label: "Août", youtube: 71, meta: 90 },
        ],
        retention: [
          { label: "Nouveaux", value: 68 },
          { label: "Récurrents", value: 32 },
        ],
      },
    },
  },
  {
    clientId: "northline",
    collectedAt: "2026-08-20",
    progress: { received: 3, expected: 10 },
    sections: [
      {
        id: "yt-collecte",
        title: "YouTube — Vue d'ensemble",
        source: "youtube",
        status: "partiel",
        answers: [{ question: "Méthode de transmission", answer: "Captures d'écran" }],
        files: [
          {
            id: "n-f1",
            name: "overview.png",
            size: 220000,
            kind: "image",
            receivedAt: "2026-08-20",
          },
        ],
        missing: ["Content", "Audience"],
      },
      {
        id: "meta-moteur",
        title: "Meta — Comprendre le moteur de volume",
        source: "meta",
        status: "indisponible",
        answers: [{ question: "Mode de transmission", answer: "Je ne sais pas comment faire" }],
        files: [],
        missing: ["Export Meta", "Results", "Tracking"],
      },
    ],
    notes: [
      {
        id: "n-n1",
        type: "constat",
        title: "Collecte encore incomplète",
        body: "Seule la vue d'ensemble YouTube est exploitable à ce stade.",
      },
    ],
    review: {
      published: false,
      publishedAt: null,
      token: "northline-7c1a03",
      synthesis: "Analyse en cours de préparation.",
      facts: [],
      interpretations: [],
      hypotheses: [],
      recommendations: [],
      nextActions: [],
      charts: { acquisition: [], retention: [] },
    },
  },
];

export function getDossier(clientId: string) {
  return DOSSIERS.find((d) => d.clientId === clientId);
}

export function getDossierByToken(token: string) {
  return DOSSIERS.find((d) => d.review.token === token);
}
