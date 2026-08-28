import { K, SLOT } from "./keys";
import type { CollectionState } from "./types";

export type ItemStatus = "transmis" | "partiel" | "indisponible" | "facultatif" | "attente";

export type SummaryItem = {
  label: string;
  status: ItemStatus;
  detail?: string;
};

export type SectionSummary = {
  title: string;
  items: SummaryItem[];
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  transmis: "Transmis",
  partiel: "Partiel",
  indisponible: "Non disponible",
  facultatif: "Facultatif non transmis",
  attente: "En attente",
};

const count = (s: CollectionState, slot: string) => (s.files[slot] ?? []).length;
const bool = (s: CollectionState, key: string) => s.answers[key] === true;
const str = (s: CollectionState, key: string) =>
  typeof s.answers[key] === "string" ? (s.answers[key] as string) : null;
const arr = (s: CollectionState, key: string) =>
  Array.isArray(s.answers[key]) ? (s.answers[key] as string[]) : [];

const filesDetail = (n: number) => (n === 1 ? "1 fichier" : `${n} fichiers`);

/* ---------- YouTube ---------- */

export function youtubeSummary(s: CollectionState): SectionSummary {
  const mode = str(s, K.yt.mode);
  const items: SummaryItem[] = [];

  items.push({
    label: "Méthode de transmission",
    status: mode ? "transmis" : "attente",
    ...(mode
      ? {
          detail:
            mode === "export"
              ? "Export YouTube Studio"
              : mode === "captures"
                ? "Captures d'écran"
                : "Procédure guidée",
        }
      : {}),
  });

  const exportCount = count(s, SLOT.ytExport);
  const impossible = bool(s, K.yt.exportImpossible);
  if (mode === "export") {
    items.push({
      label: "Export YouTube (365 jours)",
      status: exportCount > 0 ? "transmis" : impossible ? "indisponible" : "attente",
      ...(exportCount > 0 ? { detail: filesDetail(exportCount) } : {}),
    });
  }

  if (mode === "captures" || mode === "guide" || (mode === "export" && impossible)) {
    const captures: Array<[string, string, string]> = [
      ["Capture Overview — Vue d'ensemble", SLOT.ytOverview, K.yt.missingOverview],
      ["Capture Content — Contenu", SLOT.ytContent, K.yt.missingContent],
      ["Capture Audience", SLOT.ytAudience, K.yt.missingAudience],
    ];
    for (const [label, slot, missingKey] of captures) {
      const n = count(s, slot);
      items.push({
        label,
        status: n > 0 ? "transmis" : bool(s, missingKey) ? "indisponible" : "attente",
        ...(n > 0 ? { detail: filesDetail(n) } : {}),
      });
    }
  }

  return { title: "YouTube", items };
}

/* ---------- Contenus ---------- */

export function contenusSummary(s: CollectionState): SectionSummary {
  const membres = str(s, K.contenus.membresVideos);
  const detail = str(s, K.contenus.membresDetail) ?? "";
  const traffic = str(s, K.contenus.traffic);
  const newRet = str(s, K.contenus.newReturning);
  const vip = count(s, SLOT.guideVip);
  const dix = count(s, SLOT.dixVideos);

  const items: SummaryItem[] = [
    {
      label: "Vidéos destinées aux membres",
      status: !membres
        ? "attente"
        : membres === "inconnu"
          ? "indisponible"
          : membres === "oui" && detail.trim() === ""
            ? "partiel"
            : "transmis",
    },
    {
      label: "Zoom Guide VIP (facultatif)",
      status:
        vip > 0 ? "transmis" : bool(s, K.contenus.guideVipMissing) ? "indisponible" : "facultatif",
      ...(vip > 0 ? { detail: filesDetail(vip) } : {}),
    },
    {
      label: "Captures des 10 vidéos (facultatif)",
      status:
        dix > 0 ? "transmis" : bool(s, K.contenus.skipDixVideos) ? "indisponible" : "facultatif",
      ...(dix > 0 ? { detail: filesDetail(dix) } : {}),
    },
    {
      label: "Traffic Sources",
      status: !traffic
        ? "attente"
        : traffic === "oui"
          ? count(s, SLOT.traffic) > 0
            ? "transmis"
            : "partiel"
          : "indisponible",
    },
    {
      label: "New vs Returning Viewers",
      status: !newRet
        ? "attente"
        : newRet === "oui"
          ? count(s, SLOT.newReturning) > 0
            ? "transmis"
            : "partiel"
          : "indisponible",
    },
  ];

  return { title: "Contenus YouTube", items };
}

/* ---------- Meta ---------- */

export function metaSummary(s: CollectionState): SectionSummary {
  const periode = str(s, K.meta.periode);
  const periodeAutre = (str(s, K.meta.periodeAutre) ?? "").trim();
  const objectifs = arr(s, K.meta.objectifs);
  const destination = arr(s, K.meta.destination);
  const mode = str(s, K.meta.mode);
  const impossible = bool(s, K.meta.exportImpossible);
  const results = arr(s, K.meta.results);
  const tracking = str(s, K.meta.tracking);

  const items: SummaryItem[] = [
    {
      label: "Période transmise",
      status: !periode
        ? "attente"
        : periode === "autre" && periodeAutre === ""
          ? "partiel"
          : "transmis",
    },
    {
      label: "Objectifs de campagne",
      status:
        objectifs.length === 0
          ? "attente"
          : objectifs.includes("inconnu")
            ? "indisponible"
            : objectifs.includes("autre") && (str(s, K.meta.objectifAutre) ?? "").trim() === ""
              ? "partiel"
              : "transmis",
    },
    {
      label: "Destination après le clic",
      status:
        destination.length === 0
          ? "attente"
          : destination.includes("inconnu")
            ? "indisponible"
            : destination.includes("autre-page") &&
                (str(s, K.meta.destinationAutre) ?? "").trim() === ""
              ? "partiel"
              : "transmis",
    },
    {
      label: "Méthode de transmission Meta",
      status: mode ? "transmis" : "attente",
    },
  ];

  if (mode === "export") {
    const n = count(s, SLOT.metaExport);
    items.push({
      label: "Export Meta",
      status: n > 0 ? "transmis" : impossible ? "indisponible" : "attente",
      ...(n > 0 ? { detail: filesDetail(n) } : {}),
    });
  }
  if (mode === "captures" || mode === "guide" || (mode === "export" && impossible)) {
    const n = count(s, SLOT.metaCaptures);
    items.push({
      label: "Captures Meta",
      status: n > 0 ? "transmis" : "attente",
      ...(n > 0 ? { detail: filesDetail(n) } : {}),
    });
  }

  const resultsCapture = count(s, SLOT.metaResults);
  items.push({
    label: "Results — Résultats",
    status:
      results.length === 0
        ? bool(s, K.meta.resultsMissing)
          ? "indisponible"
          : "attente"
        : results.includes("inconnu")
          ? resultsCapture > 0
            ? "transmis"
            : "partiel"
          : results.includes("autre") && (str(s, K.meta.resultsAutre) ?? "").trim() === ""
            ? "partiel"
            : "transmis",
  });

  items.push({
    label: "Suivi Meta sur la landing page",
    status: !tracking ? "attente" : tracking === "inconnu" ? "indisponible" : "transmis",
  });

  return { title: "Meta", items };
}

export function allSummaries(s: CollectionState): SectionSummary[] {
  return [youtubeSummary(s), contenusSummary(s), metaSummary(s)];
}

/* ---------- Blocage minimal ---------- */

/** YouTube : méthode choisie + au moins un élément transmis OU une indisponibilité signalée. */
export function youtubeBlocker(s: CollectionState): string | null {
  const mode = str(s, K.yt.mode);
  if (!mode) return "Choisis d'abord une méthode de transmission YouTube.";

  const anyFile =
    count(s, SLOT.ytExport) + count(s, SLOT.ytOverview) + count(s, SLOT.ytContent) + count(s, SLOT.ytAudience) >
    0;
  const anyUnavailable =
    bool(s, K.yt.exportImpossible) ||
    bool(s, K.yt.missingOverview) ||
    bool(s, K.yt.missingContent) ||
    bool(s, K.yt.missingAudience);

  if (!anyFile && !anyUnavailable) {
    return "Ajoute au moins un fichier, ou indique qu'une donnée n'est pas disponible.";
  }
  return null;
}

/** Meta : période + méthode choisies, puis au moins un élément ou une indisponibilité. */
export function metaBlocker(s: CollectionState): string | null {
  if (!str(s, K.meta.periode)) return "Indique la période que tu vas nous transmettre.";
  if (!str(s, K.meta.mode)) return "Choisis une méthode de transmission Meta.";

  const anyFile = count(s, SLOT.metaExport) + count(s, SLOT.metaCaptures) + count(s, SLOT.metaResults) > 0;
  const anyUnavailable =
    bool(s, K.meta.exportImpossible) ||
    bool(s, K.meta.resultsMissing) ||
    str(s, K.meta.tracking) === "inconnu" ||
    arr(s, K.meta.results).includes("inconnu");

  if (!anyFile && !anyUnavailable) {
    return "Ajoute au moins un fichier, ou indique qu'une donnée n'est pas disponible.";
  }
  return null;
}
