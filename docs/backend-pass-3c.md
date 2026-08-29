# Pass 3C — Real Collection Submission

Le backend devient la source de vérité de la collecte. `localStorage` reste uniquement un
cache UX de secours (affichage immédiat + mode dégradé réseau). Aucune UX/UI ni contenu
métier n'a été modifié.

## Flux implémenté

1. **Lien sécurisé** — `?t=<secret>` sur n'importe quelle étape. Le serveur compare le
   SHA-256 au `token_hash`, vérifie scope, révocation, expiration et `max_uses`, incrémente
   `use_count`, crée une `link_sessions` (12 h) et pose un cookie httpOnly/SameSite=Lax.
   Le secret est immédiatement retiré de l'URL côté client (`history.replaceState`).
2. **Reprise** — sans token, la session cookie est revalidée : la progression est rechargée
   depuis le serveur (refresh, nouvel onglet, autre appareil).
3. **Submission** — création ou reprise d'une submission `working` rattachée à la collection
   et au lien.
4. **Autosave** — réponses envoyées en lot après 700 ms d'inactivité et au `beforeunload`.
5. **Uploads** — URL signée générée serveur, upload direct navigateur vers le bucket **privé**
   `collection-files`, puis enregistrement du fichier. Validation serveur : slot autorisé,
   MIME autorisé, taille ≤ 20 Mo, chemin obligatoirement
   `clientId/collectionId/submissionId/slot/…`. Aucune clé `service_role` ni bucket public
   côté client.
6. **Envoi** — « Envoyer les éléments » applique la validation minimale (mode YouTube,
   période Meta, au moins un élément transmis ou signalé introuvable) puis passe la
   submission à `submitted` de façon conditionnelle (`status = 'working'`), avec écriture
   d'un `audit_logs`. Ensuite, triggers d'immutabilité : réponses et fichiers sont figés.

## Fichiers

- `src/lib/collection/session.server.ts` — logique serveur (liens, sessions, snapshot,
  answers, uploads, submission).
- `src/lib/collection/collection.functions.ts` — server functions TanStack Start.
- `src/lib/collection/remote-types.ts` — types partagés client/serveur.
- `src/lib/collection/collectionService.ts` — couche d'accès (backend + cache local).
- `src/lib/collection/store.tsx` — hydratation serveur, autosave, uploads, statuts fichiers.
- `src/lib/studio/studio.functions.ts` + `src/components/studio/RealSubmissionsPanel.tsx` —
  lecture des collectes réelles dans le Results Studio (RLS en tant qu'utilisateur Sawaz).
  Aucune fonction d'analyse ou de review n'a été modifiée.

## Tests exécutés (navigateur + base)

| Cas | Résultat |
| --- | --- |
| Ouverture du lien valide, secret retiré de l'URL | OK (`/youtube`, session créée, `use_count` incrémenté) |
| Autosave d'une réponse | OK (`yt.mode = "export"` en base) |
| Upload autorisé (CSV 8 o) | OK (badge « Reçu », fichier rattaché à `submission_id`, chemin tenant/collection/submission/slot) |
| Reprise après refresh (source serveur) | OK (réponse + fichier restaurés) |
| Envoi final | OK (`status = submitted`, `submitted_at`, `audit_logs` écrit) |
| Immutabilité après envoi | OK (tentative de modification de réponse rejetée, 3 réponses inchangées) |
| Lien invalide / révoqué | OK (aucune session créée, aucune écriture) |
| Chemin ou slot hors périmètre, MIME/taille non conformes | Refusés côté serveur avant signature |
| Cross-tenant | Impossible : chaque requête est bornée par `client_id`/`submission_id` de la session |

## Non inclus (Pass 3D)

Génération de la Strategic Review et emails client.
