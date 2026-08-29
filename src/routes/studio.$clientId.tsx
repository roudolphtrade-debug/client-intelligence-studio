import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Download,
  ExternalLink,
  FileSpreadsheet,
  Image as ImageIcon,
  Lightbulb,
  Link2,
  Send,
  Target,
} from "lucide-react";

import { DataStatusBadge, Panel, StudioShell } from "@/components/studio/StudioShell";
import { RealSubmissionsPanel } from "@/components/studio/RealSubmissionsPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { getClient } from "@/lib/tenant/clients";
import { getDossier } from "@/lib/tenant/dossiers";
import type { AnalysisNote, ReceivedFile } from "@/lib/tenant/types";

export const Route = createFileRoute("/studio/$clientId")({
  head: () => ({
    meta: [
      { title: "Dossier client — Results Studio Sawaz" },
      {
        name: "description",
        content:
          "Détail d'une collecte client : réponses, fichiers reçus, données manquantes et analyse interne Sawaz.",
      },
      { property: "og:title", content: "Dossier client — Results Studio Sawaz" },
      {
        property: "og:description",
        content: "Réponses, fichiers, données manquantes et analyse interne.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ params }) => {
    const client = getClient(params.clientId);
    const dossier = getDossier(params.clientId);
    if (!client || !dossier) throw notFound();
    return { clientId: params.clientId };
  },
  component: StudioClient,
});

const noteMeta: Record<AnalysisNote["type"], { label: string; icon: typeof Lightbulb }> = {
  constat: { label: "Constat", icon: Target },
  hypothese: { label: "Hypothèse", icon: Lightbulb },
  recommandation: { label: "Recommandation", icon: Send },
};

function formatSize(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

function FileRow({ file }: { file: ReceivedFile }) {
  const Icon = file.kind === "image" ? ImageIcon : FileSpreadsheet;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised px-3 py-2.5">
      {file.kind === "image" ? (
        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-surface">
          {file.previewUrl ? (
            <img src={file.previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
      ) : (
        <span className="grid size-12 shrink-0 place-items-center rounded-md border border-border bg-surface">
          <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{file.name}</span>
        <span className="block text-xs text-muted-foreground">
          {formatSize(file.size)} · reçu le {file.receivedAt}
        </span>
      </span>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
      >
        <Download className="size-3.5" aria-hidden="true" />
        Télécharger
      </button>
    </li>
  );
}

function StudioClient() {
  const { clientId } = Route.useLoaderData();
  const client = getClient(clientId)!;
  const dossier = getDossier(clientId)!;
  const [tab, setTab] = useState<"youtube" | "meta">("youtube");
  const [analysis, setAnalysis] = useState("");
  const [published, setPublished] = useState(dossier.review.published);

  const sections = dossier.sections.filter((s) => s.source === tab);
  const reviewPath = `/review/${dossier.review.token}`;

  return (
    <StudioShell
      title={`${client.name} — dossier de collecte`}
      subtitle={`Contact ${client.contact} · dernière réception le ${dossier.collectedAt}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={published ? "gold" : "neutral"}>
            {published ? "Strategic Review publiée" : "Strategic Review non publiée"}
          </StatusBadge>
          <button
            type="button"
            onClick={() => setPublished((p) => !p)}
            className="rounded-md bg-sawaz px-3.5 py-2 text-sm font-semibold text-sawaz-foreground hover:opacity-90"
          >
            {published ? "Dépublier" : "Valider et publier"}
          </button>
        </div>
      }
    >
      <Panel eyebrow="Lien sécurisé" title="Accès client (envoyé par email)">
        <div className="flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate rounded-md border border-border bg-surface-raised px-3 py-2 text-xs text-muted-foreground">
            https://sawaz.review{reviewPath}
          </code>
          <Link
            to="/review/$token"
            params={{ token: dossier.review.token }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border-strong px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
          >
            <ExternalLink className="size-3.5" aria-hidden="true" />
            Prévisualiser
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="size-3.5" aria-hidden="true" />
            Publication manuelle uniquement
          </span>
        </div>
      </Panel>

      <RealSubmissionsPanel clientSlug={clientId} />

      <div className="flex gap-2">
        {(["youtube", "meta"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={
              tab === key
                ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                : "rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            }
          >
            {key === "youtube" ? "YouTube" : "Meta"}
          </button>
        ))}
      </div>

      {sections.map((section) => (
        <Panel
          key={section.id}
          title={section.title}
          eyebrow={section.source}
          aside={<DataStatusBadge status={section.status} />}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-eyebrow text-muted-foreground">Réponses</p>
              <dl className="mt-3 space-y-2">
                {section.answers.map((a) => (
                  <div
                    key={a.question}
                    className="rounded-lg border border-border bg-surface-raised px-3 py-2.5"
                  >
                    <dt className="text-xs text-muted-foreground">
                      {a.question}
                      {a.optional ? " · facultatif" : ""}
                    </dt>
                    <dd className="text-sm font-medium text-foreground">{a.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-eyebrow text-muted-foreground">Fichiers reçus</p>
                {section.files.length ? (
                  <ul className="mt-3 space-y-2">
                    {section.files.map((f) => (
                      <FileRow key={f.id} file={f} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Aucun fichier reçu.</p>
                )}
              </div>
              <div>
                <p className="text-eyebrow text-muted-foreground">Données manquantes</p>
                {section.missing.length ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    {section.missing.map((m) => (
                      <li key={m} className="flex items-start gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        {m}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Section complète.</p>
                )}
              </div>
            </div>
          </div>
        </Panel>
      ))}

      <Panel eyebrow="Analyse interne" title="Constats, hypothèses et recommandations">
        <div className="space-y-3">
          {dossier.notes.map((note) => {
            const meta = noteMeta[note.type];
            const Icon = meta.icon;
            return (
              <article
                key={note.id}
                className="rounded-lg border border-border bg-surface-raised p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className="size-4 text-sawaz" aria-hidden="true" />
                  <span className="text-eyebrow text-sawaz">{meta.label}</span>
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-foreground">{note.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-5">
          <label
            htmlFor="analysis"
            className="text-eyebrow text-muted-foreground"
          >
            Zone d'analyse interne (non visible par le client)
          </label>
          <textarea
            id="analysis"
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            rows={5}
            placeholder="Notes de travail, pistes à creuser, questions à poser lors du point…"
            className="mt-2 w-full rounded-lg border border-input bg-surface-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </Panel>
    </StudioShell>
  );
}
