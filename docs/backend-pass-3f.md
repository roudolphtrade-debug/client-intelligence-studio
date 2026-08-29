# Pass 3F — Strategic Review Publication & Client Access

Objectif : à la publication d'une version `approved` par un **owner**, ouvrir un accès client
sécurisé, révocable et thémé, sans jamais exposer de contenu interne.

## 1. Chaîne de publication

`transitionReviewVersion` (`src/lib/studio/review.functions.ts`) :

1. Vérifie la transition légale et le rôle (`published` / `archived` → owner uniquement).
2. Passe la version en `published` — le trigger `enforce_review_version_rules` la rend immuable.
3. Journalise `review_version.published` dans `audit_logs`.
4. `issueReviewLink()` : révoque les liens actifs de la review, crée un `secure_links`
   `scope = review`, `target_id = review_version_id`, TTL 60 jours, **hash SHA-256 uniquement**.
5. `notifyReviewPublished()` : file une notification `review.published` par destinataire.
6. `archived` → `revokeReviewLinks()` ferme immédiatement tous les accès.

Le secret n'existe qu'une fois, en mémoire, et est retourné une seule fois à l'owner (toast +
panneau Publication). Il n'est jamais relisible.

## 2. Lien sécurisé → session temporaire

`src/lib/review-access/review-link.server.ts`

| Étape | Comportement |
| --- | --- |
| `/review/:token` | `openReviewLink` valide le hash, l'expiration, la révocation et le quota |
| Session | `link_sessions` (hash SHA-256), TTL 8 h, cookie `HttpOnly; Secure; SameSite=Lax` |
| URL | Redirection immédiate vers `/review` : le secret disparaît de l'URL et de l'historique |
| Rotation | `regenerateReviewLink` révoque l'ancien lien **et ses sessions ouvertes** |
| Révocation | `revokeReviewAccess` ferme lien + sessions, accès coupé au prochain appel |
| Audit | `review_link.issued`, `review_link.revoked`, `review.opened` (IP hashée) |

## 3. Anti-fuite interne

`loadPublishedReview` ne sert que la version ciblée **et** `status = published`. Il re-normalise
le contenu côté serveur :

- métriques limitées à `review_status = 'valide'` ;
- analyses limitées à `type <> 'note'` et `visibility <> 'internal'` ;
- `sourceMetricIds` et `analysisId` vidés avant sortie ;
- aucun fichier brut, aucun draft, aucune ancienne version, aucun accès Studio.

## 4. Abstraction email

`src/lib/notifications/email.server.ts` définit `EmailProvider` (`send()`), un renderer thémé au
tenant (logo, couleur primaire, CTA) et un provider par défaut **log-only** : aucun email réel
n'est envoyé tant qu'un provider n'est pas injecté via `setEmailProvider()`. Aucune dépendance
forte à un fournisseur.

Idempotence : `notifications.idempotency_key` est dérivée par trigger de
`type + review_version_id + related + recipient` et est unique. Republier la même version
n'envoie pas de second email ; une nouvelle version génère bien une nouvelle notification.

## 5. Results Studio

`src/components/studio/PublicationPanel.tsx` (dans le builder) affiche :
statut Published + version, date de publication, destinataires, état du lien
(actif / révoqué / expiré, ouvertures, expiration), historique des publications, historique des
notifications et liste des liens émis. Boutons **Régénérer le lien** et **Révoquer l'accès**
réservés au rôle owner.

## 6. Surface client

- `src/routes/review.$token.tsx` : sas d'ouverture (validation + redirection sans secret).
- `src/routes/review.index.tsx` : rendu `ReviewPreview` thémé par tenant, sans provenance
  interne, responsive mobile, `noindex, nofollow`.

## 7. Tests (`supabase/tests/pass-3f.sql`) — 19/19

Publication owner ; refus analyst ; refus/invisibilité viewer d'un autre tenant ; immutabilité de
la version publiée ; nouvelle version `version_no + 1` ; aucun secret en clair ; rotation
(un seul lien actif, sessions anciennes révoquées) ; lien expiré inexploitable ; idempotence
email pour une même version ; distinction par `review_version_id` ; isolation cross-tenant du
lien ; éligibilité aux seules métriques validées ; aucune note interne éligible ; anonyme sans
accès aux liens, sessions, versions et notifications. Données de test entièrement supprimées.
