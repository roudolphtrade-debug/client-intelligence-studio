/**
 * Pass 3F — Contrat client-safe de la surface Strategic Review.
 * Ce module est importable côté navigateur : il ne contient que des types.
 * Tout ce qui n'apparaît pas ici ne peut pas atteindre le client (analyses
 * internes, notes, métriques rejetées, fichiers bruts, versions non publiées).
 */

import type { ReviewChart, ReviewContent } from "@/lib/studio/review-content";

export type ReviewClientTheme = {
  name: string;
  brand: Record<string, string>;
  tokens: Record<string, string>;
};

export type ReviewClientPayload = {
  reviewTitle: string;
  versionNo: number;
  publishedAt: string;
  content: ReviewContent;
  charts: ReviewChart[];
  theme: ReviewClientTheme;
};
