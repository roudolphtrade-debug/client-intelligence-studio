# Pass 3B — Base de données, RLS, Auth, Storage

Base unique (Lovable Cloud / PostgreSQL). Aucune UI modifiée, aucun branchement du formulaire.

## 1. Migrations appliquées

1. **Fondations** — enums (`app_role`, `collection_status`, `submission_status`, `file_scan_status`, `review_status`, `secure_link_scope`, `recipient_status`, `analysis_type`, `metric_provenance`, `notification_status`, `actor_type`), tables `users`, `user_roles`, `user_clients`, `clients`, `contacts`, `projects`, `collection_templates`, fonctions de permission `security definer`.
2. **Durcissement** — `REVOKE EXECUTE` des fonctions de permission pour `anon`/`public`.
3. **Chaîne de collecte** — `collections`, `submissions`, `answers`, `files`, `extracted_metrics`, `analyses` + triggers de dérivation et d'immutabilité.
4. **Review & liens** — `secure_links`, `link_sessions`, `collection_recipients`, `reviews`, `review_versions`, `notifications`, `audit_logs`.
5. **Storage** — policies sur `storage.objects` pour le bucket privé `collection-files`.

## 2. Permissions

- `user_roles` = **unique source de vérité** (`owner` / `analyst` / `viewer`).
- `has_role(uuid, app_role)`, `is_team_member()`, `can_write()`, `is_owner()` — toutes `security definer`, `search_path = public`, exécution retirée à `anon`.
- `user_clients` : affectation d'un membre d'équipe à un client. `has_client_access(client_id)` = owner (tous) ou membre affecté. `can_write_client(client_id)` = `owner|analyst` + accès client.
- Aucun rôle stocké sur `users` ni ailleurs.

## 3. Triggers P0

| Trigger | Effet |
| --- | --- |
| `derive_tenant_from_submission` (answers, files, extracted_metrics) | `collection_id` et `client_id` sont **écrasés** par les valeurs lues depuis `submissions` — une valeur envoyée par le frontend est ignorée |
| `derive_tenant_from_collection` (submissions, collection_recipients) | `client_id` dérivé de la collecte |
| `derive_tenant_from_review` (review_versions) | `client_id` dérivé de la review |
| `enforce_submission_immutable` | `UPDATE`/`DELETE` refusés dès `status = submitted` ; `submitted_at` posé automatiquement |
| `enforce_child_immutable` / `enforce_child_insert_open` | réponses, fichiers et métriques figés sous une submission soumise (insertion comprise) |
| `enforce_review_version_rules` | publication réservée à `owner`, seulement depuis `approved` ; version publiée immuable (seul `published → archived` par un owner) ; suppression refusée |
| `build_notification_idempotency_key` | clé = `type : review_version_id : related_type : related_id : recipient`, unique en base |
| `block_audit_mutation` | `audit_logs` en append-only |

## 4. Policies RLS (résumé)

- Toutes les tables métier : lecture `has_client_access(client_id)`, écriture `can_write_client(client_id)`, suppression `owner`.
- `analyses` : jamais exposée à `anon` — lecture réservée à l'équipe affectée au client.
- `review_versions` : `UPDATE` bloqué sur une version publiée sauf `owner` (double garde avec le trigger).
- `secure_links` : lecture/écriture équipe uniquement (le secret n'est jamais stocké, seul `token_hash`).
- `link_sessions` : **aucune policy** → table accessible uniquement au serveur (`service_role`). Les surfaces client par lien passeront exclusivement par des server functions Pass 3C.
- `notifications` : lecture équipe, écriture serveur uniquement.
- `audit_logs` : lecture `owner`, insertion équipe, mutation impossible.
- `anon` : aucun accès à aucune table métier.

## 5. Auth

- Inscription publique **désactivée** (comptes d'équipe créés côté administration).
- Comptes anonymes désactivés, confirmation d'email requise, vérification des mots de passe compromis (HIBP) activée.
- `public.users.id` = identifiant du compte d'authentification ; rôles dans `user_roles`.

## 6. Storage

- Bucket **privé** `collection-files`, 50 Mo max par fichier.
- Convention de chemin : `client_id/collection_id/submission_id/slot_key/file_id-nom`.
- Policies : lecture/écriture par membre d'équipe ayant accès au `client_id` du **premier segment du chemin** ; suppression `owner` uniquement. Aucun accès `anon`, aucune URL publique — uniquement des URLs signées côté serveur.

## 7. Tests exécutés (24/24 verts)

Script rejouable : `supabase/tests/rls-tests.sql` (crée deux tenants et quatre comptes fictifs, assert, puis nettoie intégralement).

- **P0** : `client_id`/`collection_id` forgés côté client écrasés par la dérivation serveur.
- **Collection Experience** : submission soumise non modifiable / non supprimable ; réponses figées ; insertion refusée sous une submission soumise.
- **Results Studio** : lecture positive du tenant affecté ; négatifs cross-tenant sur clients, collectes, réponses, analyses internes et reviews ; écriture cross-tenant refusée ; viewer en lecture seule ; `link_sessions` invisibles côté authentifié.
- **Strategic Review** : publication refusée à un analyste, réussie pour un owner, version publiée immuable ; anonyme sans aucun accès aux reviews ni aux liens sécurisés.
- **Notifications** : deux versions de review distinctes produisent deux notifications ; le doublon strict est rejeté.

## 8. Écarts assumés

- Le linter signale que les fonctions de permission `security definer` sont exécutables par les utilisateurs connectés : c'est **nécessaire** pour que les policies RLS s'évaluent. Elles ne renvoient qu'un booléen et sont interdites à `anon`.
- `link_sessions` sans policy est **volontaire** : accès serveur uniquement.

## 9. Suite (Pass 3C)

Couche serveur : validation de token → session de lien en cookie httpOnly, gardes tenant, URLs signées d'upload, branchement de `collectionService`.
