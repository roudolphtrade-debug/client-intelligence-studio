import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { openReviewLink } from "@/lib/review-access/review-access.functions";

/**
 * Pass 3F — Entrée par lien sécurisé.
 * Le secret est validé côté serveur, échangé contre une session temporaire
 * httpOnly, puis immédiatement retiré de l'URL (redirection vers /review).
 */

export const Route = createFileRoute("/review/$token")({
  head: () => ({
    meta: [
      { title: "Sawaz Strategic Review — Accès sécurisé" },
      {
        name: "description",
        content: "Ouverture de ta restitution stratégique par lien sécurisé et révocable.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Sawaz Strategic Review" },
      { property: "og:description", content: "Accès sécurisé à ta restitution stratégique." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: ReviewTokenGate,
});

function ReviewTokenGate() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const open = useServerFn(openReviewLink);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await open({ data: { token } });
      if (cancelled) return;
      if (res.ok) {
        void navigate({ to: "/review", replace: true });
      } else {
        setError(res.error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, open, navigate]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="surface-panel max-w-md p-8 text-center">
        {error ? (
          <>
            <Lock className="mx-auto size-6 text-primary" aria-hidden="true" />
            <h1 className="mt-4 font-display text-xl font-extrabold text-foreground">{error}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ce lien n'ouvre plus d'accès. Contacte l'équipe Sawaz pour en recevoir un nouveau.
            </p>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto size-6 animate-spin text-primary" aria-hidden="true" />
            <h1 className="mt-4 font-display text-lg font-bold text-foreground">
              Ouverture de ta restitution…
            </h1>
          </>
        )}
      </div>
    </main>
  );
}
