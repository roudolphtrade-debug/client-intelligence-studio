import { createHash, randomBytes } from "node:crypto";

import { getRequest, setResponseHeader } from "@tanstack/react-start/server";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Couche serveur des sessions de collecte.
 * Le secret du lien n'est jamais stocké : seul son empreinte SHA-256 est comparée.
 * Après validation, une session temporaire (cookie httpOnly) remplace le secret.
 */

export const LINK_SESSION_COOKIE = "sawaz_link_session";
export const SESSION_TTL_HOURS = 12;

export const BUCKET = "collection-files";

export const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const ALLOWED_SLOTS = new Set([
  "yt.export",
  "yt.capture.overview",
  "yt.capture.content",
  "yt.capture.audience",
  "c.guideVip",
  "c.dixVideos",
  "c.traffic",
  "c.newReturning",
  "m.export",
  "m.captures",
  "m.results",
]);

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function newSessionSecret() {
  return randomBytes(32).toString("base64url");
}

function readCookie(name: string): string | null {
  const header = getRequest()?.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export function setSessionCookie(secret: string, maxAgeSeconds: number) {
  setResponseHeader(
    "Set-Cookie",
    `${LINK_SESSION_COOKIE}=${encodeURIComponent(secret)}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAgeSeconds}`,
  );
}

export function clearSessionCookie() {
  setResponseHeader(
    "Set-Cookie",
    `${LINK_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`,
  );
}

export function hashIp() {
  const req = getRequest();
  const ip =
    req?.headers.get("cf-connecting-ip") ??
    req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  return ip ? sha256(ip) : null;
}

export type LinkSession = {
  sessionId: string;
  linkId: string;
  clientId: string;
  collectionId: string;
};

export class SessionError extends Error {}

/** Valide le lien (empreinte, révocation, expiration, quota) et ouvre une session temporaire. */
export async function openLinkSession(token: string): Promise<LinkSession> {
  const tokenHash = sha256(token);

  const { data: link, error } = await supabaseAdmin
    .from("secure_links")
    .select("id, client_id, target_id, scope, expires_at, revoked_at, max_uses, use_count")
    .eq("token_hash", tokenHash)
    .eq("scope", "collection")
    .maybeSingle();

  if (error) throw new SessionError("Lien invalide");
  if (!link) throw new SessionError("Lien invalide");
  if (link.revoked_at) throw new SessionError("Lien révoqué");
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    throw new SessionError("Lien expiré");
  }
  if (link.use_count >= link.max_uses) throw new SessionError("Lien épuisé");

  const secret = newSessionSecret();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

  const { data: session, error: sErr } = await supabaseAdmin
    .from("link_sessions")
    .insert({
      secure_link_id: link.id,
      client_id: link.client_id,
      session_token_hash: sha256(secret),
      expires_at: expiresAt,
      created_ip_hash: hashIp(),
    })
    .select("id")
    .single();

  if (sErr || !session) throw new SessionError("Session impossible à créer");

  await supabaseAdmin
    .from("secure_links")
    .update({ use_count: link.use_count + 1, last_used_at: new Date().toISOString() })
    .eq("id", link.id);

  setSessionCookie(secret, SESSION_TTL_HOURS * 3600);

  return {
    sessionId: session.id,
    linkId: link.id,
    clientId: link.client_id,
    collectionId: link.target_id,
  };
}

/** Résout la session courante depuis le cookie httpOnly. */
export async function requireLinkSession(): Promise<LinkSession> {
  const secret = readCookie(LINK_SESSION_COOKIE);
  if (!secret) throw new SessionError("Aucune session de collecte");

  const { data, error } = await supabaseAdmin
    .from("link_sessions")
    .select(
      "id, client_id, secure_link_id, expires_at, revoked_at, secure_links!inner(id, target_id, scope, revoked_at, expires_at)",
    )
    .eq("session_token_hash", sha256(secret))
    .maybeSingle();

  if (error || !data) throw new SessionError("Session invalide");
  if (data.revoked_at) throw new SessionError("Session révoquée");
  if (new Date(data.expires_at).getTime() < Date.now()) throw new SessionError("Session expirée");

  const link = data.secure_links as unknown as {
    id: string;
    target_id: string;
    scope: string;
    revoked_at: string | null;
    expires_at: string | null;
  };
  if (link.revoked_at) throw new SessionError("Lien révoqué");
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    throw new SessionError("Lien expiré");
  }

  return {
    sessionId: data.id,
    linkId: data.secure_link_id,
    clientId: data.client_id,
    collectionId: link.target_id,
  };
}

/** Reprend la submission en cours du lien, ou en crée une. */
export async function getOrCreateSubmission(session: LinkSession) {
  const { data: existing } = await supabaseAdmin
    .from("submissions")
    .select("id, status, submitted_at")
    .eq("collection_id", session.collectionId)
    .eq("submitted_by_link_id", session.linkId)
    .order("created_at", { ascending: false })
    .limit(1);

  const current = existing?.[0];
  if (current) return current;

  const { data: created, error } = await supabaseAdmin
    .from("submissions")
    .insert({
      collection_id: session.collectionId,
      client_id: session.clientId,
      status: "working",
      submitted_by_link_id: session.linkId,
    })
    .select("id, status, submitted_at")
    .single();

  if (error || !created) throw new SessionError("Impossible de créer la collecte");
  return created;
}

export function validateUpload(input: { slot: string; mime: string; size: number }) {
  if (!ALLOWED_SLOTS.has(input.slot)) return "Emplacement de fichier inconnu";
  if (!ALLOWED_MIMES.has(input.mime)) return "Format de fichier non accepté";
  if (!Number.isFinite(input.size) || input.size <= 0) return "Fichier vide";
  if (input.size > MAX_FILE_BYTES) return "Fichier trop volumineux (20 Mo maximum)";
  return null;
}

export function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(-120);
}
