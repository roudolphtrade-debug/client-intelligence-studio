import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Panel } from "@/components/studio/StudioShell";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBytes } from "@/lib/collection/collectionService";
import { listRealSubmissions } from "@/lib/studio/studio.functions";

/** Lecture des collectes réellement reçues (backend), sans modifier l'analyse ni la review. */
export function RealSubmissionsPanel({ clientSlug }: { clientSlug: string }) {
  const fetchSubmissions = useServerFn(listRealSubmissions);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["real-submissions", clientSlug],
    queryFn: () => fetchSubmissions({ data: { clientSlug } }),
  });

  return (
    <Panel eyebrow="Backend" title="Collectes réelles reçues">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : isError || !data?.ok ? (
        <p className="text-sm text-muted-foreground">
          Connecte-toi à l'espace Sawaz pour afficher les collectes réelles.
        </p>
      ) : data.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune collecte enregistrée pour ce client.</p>
      ) : (
        <ul className="space-y-4">
          {data.data.map((s) => (
            <li key={s.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={s.status === "submitted" ? "gold" : "neutral"}>
                  {s.status === "submitted" ? "Soumise" : "En cours"}
                </StatusBadge>
                <span className="text-xs text-muted-foreground">
                  {s.answers} réponse{s.answers > 1 ? "s" : ""} · {s.files.length} fichier
                  {s.files.length > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.submittedAt
                    ? `Envoyée le ${new Date(s.submittedAt).toLocaleDateString("fr-FR")}`
                    : `Mise à jour le ${new Date(s.updatedAt).toLocaleDateString("fr-FR")}`}
                </span>
              </div>
              {s.files.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {s.files.map((f) => (
                    <li
                      key={f.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"
                    >
                      <span className="truncate text-foreground">{f.name}</span>
                      <span>
                        {f.slot} · {formatBytes(f.size)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
