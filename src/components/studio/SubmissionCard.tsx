import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Panel } from "@/components/studio/StudioShell";
import { StatusBadge } from "@/components/StatusBadge";
import { getStudioFileUrl, type StudioSubmission } from "@/lib/studio/studio.functions";

function formatSize(bytes: number) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function renderValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** Fiche de collecte : répondant, état, réponses, données indisponibles, fichiers. */
export function SubmissionCard({ submission }: { submission: StudioSubmission }) {
  const fileUrl = useServerFn(getStudioFileUrl);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const provided = submission.answers.filter((a) => !a.notFound);
  const missing = submission.answers.filter((a) => a.notFound);

  async function open(fileId: string, mode: "download" | "preview") {
    const res = await fileUrl({ data: { fileId } });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (mode === "preview") setPreviews((p) => ({ ...p, [fileId]: res.data.url }));
    else window.open(res.data.url, "_blank", "noopener");
  }

  return (
    <Panel
      eyebrow={submission.projectName}
      title={`Collecte — ${submission.respondent ?? "Répondant inconnu"}`}
      aside={
        <StatusBadge tone={submission.status === "submitted" ? "gold" : "sawaz"}>
          {submission.status === "submitted" ? "Soumise" : "En cours"}
        </StatusBadge>
      }
    >
      <p className="text-xs text-muted-foreground">
        {submission.respondentEmail ?? "—"} · soumise le {formatDate(submission.submittedAt)} ·
        dernière activité {formatDate(submission.updatedAt)}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-eyebrow text-sawaz">Réponses transmises</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {provided.length === 0 ? (
              <li className="text-muted-foreground">Aucune réponse enregistrée.</li>
            ) : (
              provided.map((a) => (
                <li key={a.key} className="flex justify-between gap-4 border-b border-border py-1">
                  <span className="text-muted-foreground">{a.key}</span>
                  <span className="text-right text-foreground">{renderValue(a.value)}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-eyebrow text-sawaz">Données indisponibles</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {missing.length === 0 ? (
              <li className="text-muted-foreground">Aucune donnée déclarée introuvable.</li>
            ) : (
              missing.map((a) => (
                <li key={a.key} className="text-muted-foreground">
                  {a.key}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-eyebrow text-sawaz">Fichiers reçus ({submission.files.length})</h3>
        {error ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <ul className="mt-2 space-y-2">
          {submission.files.map((f) => (
            <li key={f.id} className="rounded-lg border border-border bg-surface-raised p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.slot} · {formatSize(f.size)} · {f.mime || "type inconnu"} ·{" "}
                    {formatDate(f.uploadedAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {f.isImage ? (
                    <button
                      type="button"
                      onClick={() => open(f.id, "preview")}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Aperçu
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => open(f.id, "download")}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Télécharger
                  </button>
                </div>
              </div>
              {previews[f.id] ? (
                <img
                  src={previews[f.id]}
                  alt={`Aperçu de ${f.name}`}
                  className="mt-3 max-h-80 w-full rounded-lg border border-border object-contain"
                />
              ) : null}
            </li>
          ))}
          {submission.files.length === 0 ? (
            <li className="text-sm text-muted-foreground">Aucun fichier reçu.</li>
          ) : null}
        </ul>
      </div>
    </Panel>
  );
}
