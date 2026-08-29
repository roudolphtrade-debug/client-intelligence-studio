import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Lock } from "lucide-react";

import { ReviewPreview } from "@/components/studio/ReviewPreview";
import { getReviewFromSession } from "@/lib/review-access/review-access.functions";

/**
 * Pass 3F — Surface client de la Sawaz Strategic Review.
 * Aucun secret dans l'URL : la page lit la session temporaire httpOnly ouverte
 * par le lien. Seule la version publiée ciblée est servie.
 */

export const Route = createFileRoute("/review/")({
  head: () => ({
    meta: [
      { title: "Sawaz Strategic Review — Ta restitution stratégique" },
      {
        name: "description",
        content:
          "Synthèse, faits observés, interprétations, hypothèses, recommandations et prochaines actions de ta Strategic Review.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Sawaz Strategic Review" },
      {
        property: "og:description",
        content: "Ta restitution stratégique confidentielle, accessible par lien sécurisé.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ClientReviewScreen,
});

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="surface-panel max-w-md p-8 text-center">{children}</div>
    </main>
  );
}

function ClientReviewScreen() {
  const load = useServerFn(getReviewFromSession);
  const { data, isPending } = useQuery({
    queryKey: ["client-review"],
    queryFn: () => load({}),
    retry: false,
  });

  if (isPending) {
    return (
      <Shell>
        <Loader2 className="mx-auto size-6 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-lg font-bold text-foreground">Chargement…</h1>
      </Shell>
    );
  }

  if (!data?.ok) {
    return (
      <Shell>
        <Lock className="mx-auto size-6 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-xl font-extrabold text-foreground">
          {data && !data.ok ? data.error : "Accès expiré"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ouvre à nouveau le lien reçu par email pour rétablir ton accès sécurisé.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-sawaz hover:underline">
          Retour à l'accueil
        </Link>
      </Shell>
    );
  }

  const review = data.data;

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-3 py-6 sm:px-6 sm:py-10">
      <ReviewPreview
        content={review.content}
        charts={review.charts}
        theme={{ name: review.theme.name, slug: "", brand: review.theme.brand, tokens: review.theme.tokens }}
        metrics={[]}
        showProvenance={false}
      />
      <p className="mt-6 pb-6 text-center text-xs text-muted-foreground">
        Document confidentiel — Sawaz Strategic Review · {review.theme.name} · version{" "}
        {review.versionNo}
        {review.publishedAt
          ? ` · publiée le ${new Date(review.publishedAt).toLocaleDateString("fr-FR")}`
          : ""}
      </p>
    </main>
  );
}
