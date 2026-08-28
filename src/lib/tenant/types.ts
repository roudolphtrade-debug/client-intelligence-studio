/**
 * Architecture multi-client, theme-driven.
 * Aucun client n'est codé en dur dans l'UI : tout passe par ClientConfig.
 */

export type ThemeTokens = {
  /** Fond principal (oklch ou hex) */
  background: string;
  surface: string;
  surfaceRaised: string;
  foreground: string;
  mutedForeground: string;
  /** Couleur d'accent dominante du client (CTA, titres, jauges) */
  primary: string;
  primaryForeground: string;
  /** Accent secondaire */
  accent: string;
  accentForeground: string;
  border: string;
  borderStrong: string;
  /** Familles typographiques */
  fontSans: string;
  fontDisplay: string;
  /** Rayon global */
  radius: string;
};

export type ClientBrand = {
  /** URL du logo fourni par le client */
  logoUrl: string;
  logoAlt: string;
  /** Hauteur d'affichage du logo (classe utilitaire) */
  logoClassName?: string;
  /** Plaque claire nécessaire sur fond sombre ? */
  logoNeedsPlate?: boolean;
};

export type ClientConfig = {
  id: string;
  name: string;
  sector: string;
  contact: string;
  brand: ClientBrand;
  theme: ThemeTokens;
  /** Libellé du CTA principal côté espace client */
  ctaLabel: string;
};

export type DataStatus = "disponible" | "partiel" | "indisponible" | "facultatif";

export type ReceivedFile = {
  id: string;
  name: string;
  size: number;
  kind: "csv" | "xlsx" | "image";
  /** Aperçu (captures) */
  previewUrl?: string;
  receivedAt: string;
};

export type AnswerEntry = {
  question: string;
  answer: string;
  optional?: boolean;
};

export type DossierSection = {
  id: string;
  title: string;
  source: "youtube" | "meta";
  status: DataStatus;
  answers: AnswerEntry[];
  files: ReceivedFile[];
  missing: string[];
};

export type AnalysisNote = {
  id: string;
  type: "constat" | "hypothese" | "recommandation";
  title: string;
  body: string;
};

export type ReviewChartPoint = { label: string; youtube: number; meta: number };

export type StrategicReview = {
  published: boolean;
  publishedAt: string | null;
  /** Lien sécurisé (token) transmis par email */
  token: string;
  synthesis: string;
  facts: string[];
  interpretations: string[];
  hypotheses: string[];
  recommendations: { title: string; body: string }[];
  nextActions: { title: string; owner: string; horizon: string }[];
  charts: {
    acquisition: ReviewChartPoint[];
    retention: { label: string; value: number }[];
  };
};

export type ClientDossier = {
  clientId: string;
  collectedAt: string;
  progress: { received: number; expected: number };
  sections: DossierSection[];
  notes: AnalysisNote[];
  review: StrategicReview;
};
