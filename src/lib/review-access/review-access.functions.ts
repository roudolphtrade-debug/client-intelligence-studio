import { createServerFn } from "@tanstack/react-start";

import type { ReviewClientPayload } from "./review-client";

/**
 * Pass 3F — Surface client de la Strategic Review.
 * Ces fonctions sont publiques par nature (le client n'est pas authentifié),
 * mais elles n'exposent qu'une version publiée, validée par un secret puis par
 * une session temporaire httpOnly.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

/** Valide le secret du lien et ouvre la session. Le secret peut ensuite quitter l'URL. */
export const openReviewLink = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input.token ?? "") }))
  .handler(async ({ data }): Promise<Result<ReviewClientPayload>> => {
    const s = await import("./review-link.server");
    try {
      const session = await s.openReviewSession(data.token);
      return { ok: true, data: await s.loadPublishedReview(session) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Lien invalide" };
    }
  });

/** Recharge la restitution depuis la session (refresh, autre onglet, mobile). */
export const getReviewFromSession = createServerFn({ method: "POST" }).handler(
  async (): Promise<Result<ReviewClientPayload>> => {
    const s = await import("./review-link.server");
    try {
      const session = await s.requireReviewSession();
      return { ok: true, data: await s.loadPublishedReview(session) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Session invalide" };
    }
  },
);
