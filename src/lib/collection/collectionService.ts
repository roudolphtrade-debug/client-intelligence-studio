import { emptyState, type CollectionState, type FileMeta } from "./types";

/**
 * Couche de persistance remplaçable.
 * V2 (Pass 2) : localStorage uniquement, aucun serveur.
 * Lors de l'intégration LWS, il suffira de remplacer les implémentations
 * de `load`, `save` et `submit` par des appels réseau.
 */

const STORAGE_KEY = "sawaz.lftc.collecte.v1";

/** Les objets File ne sont pas sérialisables : ils vivent en mémoire pour la session. */
const blobs = new Map<string, File>();

export const collectionService = {
  load(): CollectionState {
    if (typeof window === "undefined") return emptyState;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState;
      const parsed = JSON.parse(raw) as Partial<CollectionState>;
      if (!parsed || parsed.version !== 1) return emptyState;
      return {
        version: 1,
        answers: parsed.answers ?? {},
        files: parsed.files ?? {},
        submittedAt: parsed.submittedAt ?? null,
      };
    } catch {
      return emptyState;
    }
  },

  save(state: CollectionState) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota ou mode privé : on ignore silencieusement */
    }
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
    blobs.clear();
  },

  registerFile(meta: FileMeta, file: File) {
    blobs.set(meta.id, file);
  },

  getFile(id: string) {
    return blobs.get(id);
  },

  hasFile(id: string) {
    return blobs.has(id);
  },

  forgetFile(id: string) {
    blobs.delete(id);
  },

  /**
   * Pass 2 : aucune donnée n'est envoyée à un serveur.
   * Point d'entrée unique à brancher sur LWS plus tard.
   */
  async submit(state: CollectionState): Promise<{ ok: true; submittedAt: number }> {
    void state;
    return { ok: true, submittedAt: Date.now() };
  },
};

export function formatBytes(size: number) {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}
