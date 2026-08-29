# Architecture de production — Sawaz Client Intelligence

Document d'architecture uniquement. Aucun code backend, aucun service externe connecté, aucune migration lancée.
La Collection Experience, le Results Studio et la Strategic Review existants ne sont pas modifiés.

Révision : corrections structurantes avant migration (ratachement par submission, contacts, rôles, métriques extraites, immutabilité, idempotence, sessions de lien, publication owner-only, projet Supabase unique).

## 1. Principes

- **Un seul projet Supabase** « Sawaz Client Intelligence » : Auth + PostgreSQL + RLS + Storage privé. L'isolation multi-client est assurée **exclusivement** par `client_id` + RLS, jamais par une séparation en plusieurs projets.
- **Multi-tenant strict** : toute ligne métier porte un `client_id`. Aucune requête sans filtre tenant, `client_id` dérivé du lien ou de la session côté serveur, jamais accepté depuis le client.
- **Theme-driven** : identité visuelle = données (`clients.theme_tokens`, `clients.brand`). LFTC = tenant de démonstration, seed uniquement, jamais de nom/couleur/branche conditionnelle en dur.
- **Trois surfaces, trois niveaux d'accès** : lien privé de collecte, équipe Sawaz authentifiée, lien sécurisé révocable de review.
- **Fichiers privés par défaut** : jamais d'URL publique, uniquement des URLs signées à durée courte.
- **Immutabilité** : une submission envoyée ne peut plus être modifiée ; une version publiée est figée.

## 2. Modèle de données

Identifiants : `uuid` v4 partout. Horodatages `created_at` / `updated_at`. Suppression logique (`archived_at`) sur clients, projects, collections, reviews.

| Table | Colonnes clés | Relations |
| --- | --- | --- |
| `clients` | `id`, `slug` (unique), `name`, `sector`, `brand` (jsonb), `theme_tokens` (jsonb), `is_demo`, `archived_at` | racine du tenant |
| `contacts` | `id`, `client_id`, `name`, `email`, `role_label`, `is_primary`, `archived_at` | → clients |
| `projects` | `id`, `client_id`, `name`, `period_label`, `status`, `archived_at` | → clients |
| `collection_templates` | `id`, `client_id` (nullable = template global Sawaz), `version`, `schema` (jsonb : étapes, questions, options, slots), `published_at` | → clients |
| `collections` | `id`, `client_id`, `project_id`, `template_id`, `template_version`, `status`, `opened_at`, `closed_at`, `archived_at` | → projects, templates |
| `collection_recipients` | `id`, `collection_id`, `client_id`, `contact_id`, `secure_link_id`, `status` (`pending`/`opened`/`submitted`/`bounced`), `notified_at` | → collections, contacts, secure_links |
| `submissions` | `id`, `collection_id`, `client_id`, `submitted_at`, `submitted_by_link_id`, `submitted_by_contact_id`, `snapshot` (jsonb figé), **immutable** (verrou applicatif + trigger DB) | → collections, secure_links, contacts |
| `answers` | `id`, **submission_id** (référence principale), `collection_id`, `client_id`, `question_key`, `value` (jsonb), `is_optional`, `not_found` (bool), `updated_at` | → **submissions**, collections |
| `files` | `id`, **submission_id** (référence principale, nullable tant que brouillon), `collection_id`, `client_id`, `slot_key`, `storage_path`, `original_name`, `mime`, `size_bytes`, `checksum`, `scan_status`, `uploaded_at` | → **submissions**, collections |
| `extracted_metrics` | `id`, **submission_id** (référence principale), `client_id`, `collection_id`, `metric_key`, `platform` (`youtube`/`meta`), `value_num`, `value_text`, `unit`, `period_start`, `period_end`, `provenance` (`manual`/`csv`/`capture_ocr`/`derived`), `source_file_id`, `confidence` (0–1), `extracted_at`, `reviewed_by`, `reviewed_at` | → **submissions**, files |
| `analyses` | `id`, `client_id`, `collection_id`, `submission_id`, `author_user_id`, `type` (`constat`/`hypothese`/`recommandation`/`note`), `title`, `body`, `visibility` (`internal`) | → collections, submissions, users |
| `reviews` | `id`, `client_id`, `project_id`, `collection_id`, `current_version_id`, `status`, `published_at`, `archived_at` | → projects |
| `review_versions` | `id`, `review_id`, `client_id`, `version_no`, `content` (jsonb : synthèse, faits, interprétations, hypothèses, recommandations, prochaines actions), `charts` (jsonb), `status`, `created_by`, `approved_by`, `approved_at`, `published_at` | → reviews, users |
| `secure_links` | `id`, `client_id`, `scope` (`collection`/`review`), `target_id`, `token_hash`, `expires_at`, `revoked_at`, `max_uses`, `use_count`, `last_used_at`, `created_by` | polymorphe contrôlé par `scope` |
| `link_sessions` | `id`, `secure_link_id`, `client_id`, `session_token_hash`, `expires_at`, `revoked_at`, `created_ip_hash` | → secure_links |
| `users` | `id`, `email`, `name`, `is_active` | équipe Sawaz uniquement — **aucune colonne de rôle** |
| `user_roles` | `id`, `user_id`, `role` (enum `owner`/`analyst`/`viewer`), unique `(user_id, role)` — **unique source de vérité des rôles** | → users |
| `notifications` | `id`, `client_id`, `idempotency_key` (unique), `type`, `channel` (`email`), `recipient`, `payload` (jsonb), `status` (`queued`/`sent`/`failed`), `sent_at`, `related_type`, `related_id`, `attempts` | → clients |
| `audit_logs` | `id`, `client_id`, `actor_type` (`user`/`link`/`system`), `actor_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb), `ip_hash`, `created_at` | append-only |

### Règles de rattachement par submission

- `answers`, `files` et `extracted_metrics` portent **`submission_id` comme référence principale** ; `collection_id` et `client_id` sont dénormalisés (copiés à l'insert, indexés) uniquement pour l'isolation tenant et les requêtes — jamais comme source de rattachement.
- Cycle de vie d'une collecte : brouillon courant = réponses/fichiers rattachés à la submission « working » de la collection ; à l'envoi, la submission passe `submitted` et **devient immuable** (trigger DB : `UPDATE`/`DELETE` refusés sur `submissions` soumises et sur leurs `answers`/`files`/`extracted_metrics`).
- Toute correction après envoi = nouvelle submission (nouvelle vague), jamais une édition.

### Métriques extraites

- `extracted_metrics` centralise toute donnée chiffrée issue des fichiers ou saisies : **provenance** (`manual`, `csv`, `capture_ocr`, `derived`), **période** (`period_start`/`period_end`), **unité**, **`source_file_id`**, **confidence** (0–1).
- Aucune métrique ne devient « fiable » sans `reviewed_by` (workflow de revue interne) ; `confidence < seuil` impose revue humaine.

### Provenance des graphiques

`review_versions.charts` étend chaque série : `{ id, type, title, unit, series[], source_metric_ids[], period_start, period_end, generated_at }`. Tout graphique publié est traçable jusqu'aux `extracted_metrics` qui l'alimentent — régénération reproductible, audit possible.

Contraintes notables :
- Unicité `(submission_id, question_key)` sur `answers`, `(review_id, version_no)` sur `review_versions`, `(collection_id, contact_id)` sur `collection_recipients`.
- `notifications.idempotency_key` unique : `type + related_id (+ recipient)` — un événement ne produit jamais deux emails.
- Index tenant `(client_id, ...)` sur toutes les tables métier, index `(submission_id)` sur answers/files/extracted_metrics.
- **GRANT explicite** sur chaque table `public` (authenticated / service_role, anon uniquement si politique publique) dans la même migration que le `CREATE TABLE`.

## 3. Statuts

- `collections.status` : `draft → open → partially_submitted → submitted → closed`
- `submissions` : `working → submitted (immuable)`
- `files.scan_status` : `pending → clean | rejected`
- `reviews` / `review_versions.status` : `draft → in_review → approved → published → archived`
  - Seul un rôle `owner` ou `analyst` peut passer `in_review → approved`.
  - **Au lancement, seul le rôle `owner` peut publier** (`approved → published`). Élargissement à `analyst` = décision ultérieure explicite, changement de policy uniquement.
  - `published` fige la version : toute correction crée `version_no + 1` en `draft`.
  - `archived` retire l'accès public sans supprimer l'historique.
- `secure_links` : actif si `revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now()) AND use_count < max_uses`.
- `link_sessions` : active si `revoked_at IS NULL AND expires_at > now()` (durée courte, ex. 12 h).

## 4. Isolation et permissions

| Acteur | Entrée | Portée | Peut |
| --- | --- | --- | --- |
| Client collecte | lien privé `scope=collection` → **session temporaire** | une seule `collection` | lire le template, écrire `answers`, uploader `files`, soumettre |
| Équipe Sawaz | session authentifiée (Supabase Auth) | tous les clients, filtré par sélection | tout lire/écrire côté interne ; publier = `owner` uniquement |
| Client review | lien sécurisé `scope=review`, révocable → **session temporaire** | la dernière version `published` d'une `review` | lire uniquement |

### Rôles

- `user_roles` est l'**unique source de vérité** : aucun rôle sur `users` ni sur aucun profil.
- Vérification par fonction `security definer` (`has_role(user_id, role)`) utilisée dans les policies RLS et revérifiée dans les server functions.
- Enum : `owner` (administration, publication), `analyst` (analyse, préparation de review), `viewer` (lecture interne).

### Secure links → session temporaire

- Le token secret (32 octets aléatoires, seul le **hash** stocké) n'apparaît que dans l'email et n'est utilisé **qu'une fois à la validation**.
- À la validation du token : création d'une ligne `link_sessions` et émission d'un **cookie de session httpOnly, same-site, durée courte** — le secret **ne reste jamais dans l'URL** après le premier accès (redirect immédiat vers une URL propre).
- Toutes les requêtes suivantes s'authentifient par la session ; révocation du lien **ou** de la session = accès refusé immédiatement.
- Les liens ne donnent accès qu'à leur `target_id` : aucun listing, aucune énumération.
- Tout accès par lien écrit une ligne `audit_logs`.

### Autres règles

- Isolation appliquée côté base (RLS) **et** côté fonction serveur : le `client_id` est dérivé de la session/du lien, jamais accepté depuis le client.
- `analyses` n'est jamais exposée à une surface client — table réservée à la session authentifiée.
- `contacts` et `collection_recipients` ne sont lisibles que par l'équipe Sawaz (jamais par un lien client).

## 5. Stockage fichiers

- Bucket **privé**, chemin `client_id/collection_id/submission_id/slot_key/file_id-nom`.
- Upload via URL signée courte (~5 min) obtenue après validation de la session de collecte ; type MIME et taille contrôlés serveur.
- Téléchargement Studio via URL signée à usage court, tracé dans `audit_logs`.
- Aucun fichier de collecte n'est jamais servi à la surface Strategic Review : seules les données agrégées (`extracted_metrics` revues, `charts`) le sont.

## 6. Workflow Strategic Review

```text
draft ──submit──> in_review ──approve──> approved ──publish (owner uniquement)──> published ──archive──> archived
  ^                                                     |
  └────────────── nouvelle version (v+1) <──────────────┘
```

- Publication **toujours manuelle** et, au lancement, **réservée au rôle `owner`** (policy RLS + garde serveur + UI masquée pour les autres rôles).
- À la publication : création/rotation du `secure_link`, notification email, `reviews.current_version_id` mis à jour.
- Révocation d'un lien = accès immédiatement refusé, l'historique reste intact.

## 7. Notifications email

Événements : collecte ouverte (par `collection_recipients`), relance collecte incomplète, collecte soumise (interne), review passée en `in_review` (interne), review publiée (client), lien révoqué/expiré.

- Chaque envoi produit une ligne `notifications` avec **`idempotency_key` unique** (`type + related_id + recipient`) : un envoi déjà `sent` n'est jamais rejoué ; un `failed` peut être retenté (`attempts++`, backoff).
- Templates paramétrés par les tokens du tenant, aucun contenu client en dur.

## 8. Graphiques data-driven

- `review_versions.charts` décrit des séries typées calculées **uniquement à partir des `extracted_metrics` revues**, avec `source_metric_ids`, `period_start`/`period_end` et `generated_at` par série.
- Le rendu lit uniquement cette structure : aucun jeu de données de démonstration dans les composants, aucune couleur codée en dur — les couleurs proviennent des `theme_tokens` du tenant.
- Toute modification des métriques sources après publication impose une nouvelle `review_version` (les versions publiées restent figées avec leurs charts).

## 9. Décisions techniques

- **Un seul projet Supabase** « Sawaz Client Intelligence » (Auth + Postgres + RLS + Storage privé) ; isolation stricte par `client_id` + RLS, revérifiée dans chaque server function.
- Logique applicative en server functions TanStack Start ; endpoints publics réservés aux webhooks sous `/api/public/*`.
- Tokens de lien : secret aléatoire 32 octets, seul le **hash** est stocké ; validation unique → **session temporaire en cookie httpOnly**, secret jamais conservé dans l'URL.
- Immutabilité des submissions envoyées garantie par trigger DB (refus d'`UPDATE`/`DELETE`) en plus du verrou applicatif.
- Rôles : table `user_roles` + fonction `security definer` — aucune colonne de rôle ailleurs.
- Versionnement par lignes immuables plutôt que diff : traçabilité simple et restitution fidèle.
- Réponses stockées en `jsonb` par `question_key` pour absorber l'évolution des templates sans migration ; métriques chiffrées dans `extracted_metrics` (typées, avec provenance et confidence).
- `collections` fige `template_version` afin qu'une soumission reste lisible après évolution du questionnaire.

## 10. Étapes d'implémentation proposées (après validation)

1. Migrations schéma + grants + RLS + rôles + triggers d'immutabilité.
2. Couche d'accès serveur (validation de lien → session temporaire, session Auth, garde tenant).
3. Branchement de `collectionService` sur le backend, sans changer l'UI.
4. Studio en lecture/écriture réelle + extraction/revue des métriques + workflow de review (publish owner-only).
5. Liens sécurisés, notifications idempotentes, audit.
