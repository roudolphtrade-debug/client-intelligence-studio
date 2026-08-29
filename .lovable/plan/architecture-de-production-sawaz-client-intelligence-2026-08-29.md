# Architecture de production — Sawaz Client Intelligence

Document d'architecture uniquement. Aucun code backend, aucun service externe connecté.
La Collection Experience, le Results Studio et la Strategic Review existants ne sont pas modifiés.

## 1. Principes

- **Multi-tenant strict** : toute ligne métier porte un `client_id`. Aucune requête sans filtre tenant.
- **Theme-driven** : identité visuelle = données (`clients.theme_tokens`, `clients.brand`). LFTC = tenant de démonstration, seed uniquement, jamais de nom/couleur/branche conditionnelle en dur.
- **Trois surfaces, trois niveaux d'accès** : lien privé de collecte, équipe Sawaz authentifiée, lien sécurisé révocable de review.
- **Fichiers privés par défaut** : jamais d'URL publique, uniquement des URLs signées à durée courte.

## 2. Modèle de données

Identifiants : `uuid` v4 partout. Horodatages `created_at` / `updated_at`. Suppression logique (`archived_at`) sur clients, projects, collections, reviews.

| Table | Colonnes clés | Relations |
| --- | --- | --- |
| `clients` | `id`, `slug` (unique), `name`, `sector`, `brand` (jsonb), `theme_tokens` (jsonb), `is_demo`, `archived_at` | racine du tenant |
| `projects` | `id`, `client_id`, `name`, `period_label`, `status` | → clients |
| `collection_templates` | `id`, `client_id` (nullable = template global Sawaz), `version`, `schema` (jsonb : étapes, questions, options, slots), `published_at` | → clients |
| `collections` | `id`, `client_id`, `project_id`, `template_id`, `template_version`, `status`, `opened_at`, `closed_at` | → projects, templates |
| `submissions` | `id`, `collection_id`, `client_id`, `submitted_at`, `submitted_by_link_id`, `snapshot` (jsonb figé) | → collections, secure_links |
| `answers` | `id`, `collection_id`, `client_id`, `question_key`, `value` (jsonb), `is_optional`, `not_found` (bool), `updated_at` | → collections |
| `files` | `id`, `collection_id`, `client_id`, `slot_key`, `storage_path`, `original_name`, `mime`, `size_bytes`, `checksum`, `scan_status`, `uploaded_at` | → collections |
| `analyses` | `id`, `client_id`, `collection_id`, `author_user_id`, `type` (`constat`/`hypothese`/`recommandation`/`note`), `title`, `body`, `visibility` (`internal`) | → collections, users |
| `reviews` | `id`, `client_id`, `project_id`, `collection_id`, `current_version_id`, `status`, `published_at`, `archived_at` | → projects |
| `review_versions` | `id`, `review_id`, `client_id`, `version_no`, `content` (jsonb : synthèse, faits, interprétations, hypothèses, recommandations, prochaines actions), `charts` (jsonb), `status`, `created_by`, `approved_by`, `approved_at`, `published_at` | → reviews, users |
| `secure_links` | `id`, `client_id`, `scope` (`collection`/`review`), `target_id`, `token_hash`, `expires_at`, `revoked_at`, `max_uses`, `use_count`, `last_used_at`, `created_by` | polymorphe contrôlé par `scope` |
| `users` | `id`, `email`, `name`, `role` (`owner`/`analyst`/`viewer`), `is_active` | équipe Sawaz uniquement |
| `user_roles` | `id`, `user_id`, `role` (enum) — table séparée, source de vérité des rôles | → users |
| `notifications` | `id`, `client_id`, `type`, `channel` (`email`), `recipient`, `payload` (jsonb), `status` (`queued`/`sent`/`failed`), `sent_at`, `related_type`, `related_id` | → clients |
| `audit_logs` | `id`, `client_id`, `actor_type` (`user`/`link`/`system`), `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb), `ip_hash`, `created_at` | append-only |

Contraintes notables : unicité `(collection_id, question_key)` sur `answers`, `(review_id, version_no)` sur `review_versions`, index tenant `(client_id, ...)` sur toutes les tables métier.

## 3. Statuts

- `collections.status` : `draft → open → partially_submitted → submitted → closed`
- `files.scan_status` : `pending → clean | rejected`
- `reviews` / `review_versions.status` : `draft → in_review → approved → published → archived`
  - Seul un rôle `owner` ou `analyst` peut passer `in_review → approved`.
  - `published` fige la version : toute correction crée `version_no + 1` en `draft`.
  - `archived` retire l'accès public sans supprimer l'historique.
- `secure_links` : actif si `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()) AND use_count < max_uses`.

## 4. Isolation et permissions

| Acteur | Entrée | Portée | Peut |
| --- | --- | --- | --- |
| Client collecte | lien privé `scope=collection` | une seule `collection` | lire le template, écrire `answers`, uploader `files`, soumettre |
| Équipe Sawaz | session authentifiée | tous les clients, filtré par sélection | tout lire/écrire côté interne, publier |
| Client review | lien sécurisé `scope=review`, révocable | la dernière version `published` d'une `review` | lire uniquement |

Règles :
- Isolation appliquée côté base (RLS) **et** côté fonction serveur : le `client_id` est dérivé du lien ou de la session, jamais accepté depuis le client.
- Les liens ne donnent accès qu'à leur `target_id` : aucun listing, aucune énumération.
- `analyses` n'est jamais exposée à une surface client — table réservée à la session authentifiée.
- Rôles stockés dans `user_roles`, vérifiés par une fonction `security definer`, jamais sur le profil.
- Tout accès par lien écrit une ligne `audit_logs`.

## 5. Stockage fichiers

- Bucket **privé**, chemin `client_id/collection_id/slot_key/file_id-nom`.
- Upload via URL signée courte (~5 min) obtenue après validation du lien de collecte ; type MIME et taille contrôlés serveur.
- Téléchargement Studio via URL signée à usage court, tracé dans `audit_logs`.
- Aucun fichier de collecte n'est jamais servi à la surface Strategic Review : seules les données agrégées le sont.

## 6. Workflow Strategic Review

```text
draft ──submit──> in_review ──approve──> approved ──publish──> published ──archive──> archived
  ^                                                     |
  └────────────── nouvelle version (v+1) <──────────────┘
```
- Publication toujours manuelle, jamais automatique.
- À la publication : création/rotation du `secure_link`, notification email, `reviews.current_version_id` mis à jour.
- Révocation d'un lien = accès immédiatement refusé, l'historique reste intact.

## 7. Notifications email

Événements : collecte ouverte, relance collecte incomplète, collecte soumise (interne), review passée en `in_review` (interne), review publiée (client), lien révoqué/expiré.
Chaque envoi produit une ligne `notifications` (idempotence par `type + related_id`), avec statut et réessai. Templates paramétrés par les tokens du tenant, aucun contenu client en dur.

## 8. Graphiques data-driven

`review_versions.charts` décrit des séries typées (`{ id, type, title, unit, series[] }`) calculées à partir des `answers` et des fichiers analysés. Le rendu lit uniquement cette structure : aucun jeu de données de démonstration dans les composants, aucune couleur codée en dur — les couleurs proviennent des `theme_tokens` du tenant.

## 9. Décisions techniques

- Backend Lovable Cloud (Postgres + RLS + stockage privé), logique applicative en server functions TanStack Start ; endpoints publics réservés aux webhooks sous `/api/public/*`.
- Tokens de lien : secret aléatoire 32 octets, seul le **hash** est stocké ; le secret n'apparaît que dans l'email.
- Versionnement par lignes immuables plutôt que diff : traçabilité simple et restitution fidèle.
- Réponses stockées en `jsonb` par `question_key` pour absorber l'évolution des templates sans migration.
- `collections` fige `template_version` afin qu'une soumission reste lisible après évolution du questionnaire.

## 10. Étapes d'implémentation proposées (après validation)

1. Migrations schéma + grants + RLS + rôles.
2. Couche d'accès serveur (résolution de lien, session, garde tenant).
3. Branchement de `collectionService` sur le backend, sans changer l'UI.
4. Studio en lecture/écriture réelle + workflow de review.
5. Liens sécurisés, notifications, audit.
