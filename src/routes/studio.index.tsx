import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FolderOpen } from "lucide-react";

import { DataStatusBadge, Panel, StudioShell } from "@/components/studio/StudioShell";
import { StatusBadge } from "@/components/StatusBadge";
import { CLIENTS } from "@/lib/tenant/clients";
import { DOSSIERS } from "@/lib/tenant/dossiers";

export const Route = createFileRoute("/studio/")({
  head: () => ({
    meta: [
      { title: "Results Studio — Espace interne Sawaz" },
      {
        name: "description",
        content:
          "Espace interne Sawaz : suivi multi-client des collectes, fichiers reçus, données manquantes et analyses.",
      },
      { property: "og:title", content: "Results Studio — Espace interne Sawaz" },
      {
        property: "og:description",
        content: "Suivi multi-client des collectes et des analyses Sawaz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudioIndex,
});

function StudioIndex() {
  return (
    <StudioShell
      title="Dossiers clients"
      subtitle="Vue interne Sawaz. L'interface reste identique quel que soit le client consulté."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {CLIENTS.map((client) => {
          const dossier = DOSSIERS.find((d) => d.clientId === client.id);
          const pct = dossier
            ? Math.round((dossier.progress.received / dossier.progress.expected) * 100)
            : 0;
          return (
            <Panel key={client.id} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-eyebrow text-sawaz">{client.sector}</p>
                  <h2 className="font-display text-lg font-extrabold text-foreground">
                    {client.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">Contact : {client.contact}</p>
                </div>
                <StatusBadge tone={dossier?.review.published ? "gold" : "neutral"}>
                  {dossier?.review.published ? "Review publiée" : "Non publiée"}
                </StatusBadge>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Collecte {dossier?.progress.received ?? 0}/{dossier?.progress.expected ?? 0}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                  <div className="gold-rule h-full" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {dossier?.sections.map((s) => <DataStatusBadge key={s.id} status={s.status} />)}
              </div>

              <Link
                to="/studio/$clientId"
                params={{ clientId: client.id }}
                className="mt-auto inline-flex items-center gap-2 self-start rounded-md bg-sawaz px-3.5 py-2 text-sm font-semibold text-sawaz-foreground transition-opacity hover:opacity-90"
              >
                <FolderOpen className="size-4" aria-hidden="true" />
                Ouvrir le dossier
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Panel>
          );
        })}
      </div>
    </StudioShell>
  );
}
