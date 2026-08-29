import { createServerFn } from "@tanstack/react-start";

import type { RemoteFile, RemoteSnapshot } from "./remote-types";

/**
 * Points d'entrée serveur de la Collection Experience.
 * Le frontend ne voit jamais la clé service_role ni le bucket : tout passe par ces fonctions.
 */

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export const openCollectionLink = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: String(input.token ?? "") }))
  .handler(async ({ data }): Promise<Result<RemoteSnapshot>> => {
    const s = await import("./session.server");
    try {
      if (!data.token) return { ok: false, error: "Lien invalide" };
      const session = await s.openLinkSession(data.token);
      const snapshot = await s.buildSnapshot(session);
      return { ok: true, data: snapshot };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Lien invalide" };
    }
  });

export const getCollectionSnapshot = createServerFn({ method: "POST" }).handler(
  async (): Promise<Result<RemoteSnapshot>> => {
    const s = await import("./session.server");
    try {
      const session = await s.requireLinkSession();
      return { ok: true, data: await s.buildSnapshot(session) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Session invalide" };
    }
  },
);

export const saveCollectionAnswers = createServerFn({ method: "POST" })
  .inputValidator((input: { answers: Record<string, unknown> }) => ({
    answers: input.answers ?? {},
  }))
  .handler(async ({ data }): Promise<Result<{ saved: number }>> => {
    const s = await import("./session.server");
    try {
      const session = await s.requireLinkSession();
      const saved = await s.persistAnswers(session, data.answers);
      return { ok: true, data: { saved } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Sauvegarde impossible" };
    }
  });

export const requestFileUpload = createServerFn({ method: "POST" })
  .inputValidator((input: { slot: string; name: string; mime: string; size: number }) => ({
    slot: String(input.slot ?? ""),
    name: String(input.name ?? ""),
    mime: String(input.mime ?? ""),
    size: Number(input.size ?? 0),
  }))
  .handler(async ({ data }): Promise<Result<{ path: string; token: string }>> => {
    const s = await import("./session.server");
    try {
      const session = await s.requireLinkSession();
      return await s.createUploadTicket(session, data);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Envoi impossible" };
    }
  });

export const confirmFileUpload = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { slot: string; path: string; name: string; mime: string; size: number }) => ({
      slot: String(input.slot ?? ""),
      path: String(input.path ?? ""),
      name: String(input.name ?? ""),
      mime: String(input.mime ?? ""),
      size: Number(input.size ?? 0),
    }),
  )
  .handler(async ({ data }): Promise<Result<RemoteFile>> => {
    const s = await import("./session.server");
    try {
      const session = await s.requireLinkSession();
      return await s.registerUploadedFile(session, data);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Envoi impossible" };
    }
  });

export const deleteCollectionFile = createServerFn({ method: "POST" })
  .inputValidator((input: { fileId: string }) => ({ fileId: String(input.fileId ?? "") }))
  .handler(async ({ data }): Promise<Result<{ deleted: true }>> => {
    const s = await import("./session.server");
    try {
      const session = await s.requireLinkSession();
      return await s.removeFile(session, data.fileId);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Suppression impossible" };
    }
  });

export const submitCollection = createServerFn({ method: "POST" }).handler(
  async (): Promise<Result<{ submittedAt: string }>> => {
    const s = await import("./session.server");
    try {
      const session = await s.requireLinkSession();
      return await s.submitCurrentSubmission(session);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Envoi impossible" };
    }
  },
);
