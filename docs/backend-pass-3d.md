# Pass 3D — Production Results Studio

Le Results Studio ne lit plus aucune donnée de démonstration : tout provient de
`clients`, `projects`, `collections`, `submissions`, `answers`, `files`,
`extracted_metrics` et `analyses`. Aucun dataset client n'est codé en dur ; LFTC
n'est qu'un tenant parmi d'autres.

## Migrations

1. **Revue des métriques extraites**
   - enum `metric_review_status` (`a_verifier`, `valide`, `rejete`)
   - `extracted_metrics.review_status` (défaut `a_verifier`), `original_value_num`,
     `original_value_text`, `corrected_by`, `corrected_at`, `review_note`
   - index `(client_id, review_status)`
2. **Visibilité des analyses**
   - `analyses_visibility_check` : `visibility ∈ {internal, client}` et
     `type = 'note' ⇒ visibility = 'internal'`. Une note interne ne peut donc
     jamais devenir visible côté client, même par erreur applicative.

Les policies RLS existantes sont inchangées : lecture via `has_client_access`,
écriture via `can_write_client` (owner/analyst), viewer en lecture seule.

## Accès et authentification

- Les écrans internes vivent sous `src/routes/_authenticated/` : la garde
  `_authenticated/route.tsx` (`ssr: false`) redirige vers `/auth` sans session.
- `/auth` : connexion / création d'accès équipe par email + mot de passe.
- `studioBootstrap` rattache le compte authentifié à `public.users` et attribue
  le rôle `owner` au tout premier utilisateur (amorçage). Les accès suivants
  doivent recevoir rôle et périmètre (`user_roles`, `user_clients`) d'un owner.

## Server functions (`src/lib/studio/studio.functions.ts`)

Toutes protégées par `requireSupabaseAuth` — la RLS s'applique en tant
qu'utilisateur Sawaz, jamais en service_role.

| Fonction | Rôle |
| --- | --- |
| `studioBootstrap` | rattachement du compte, amorçage owner |
| `listStudioClients` | clients accessibles + compteurs projets/collectes/soumissions/fichiers/métriques |
| `getStudioDossier` | dossier complet : projets, collectes, soumissions (répondant, réponses, indisponibilités, fichiers), métriques, analyses, rôle |
| `getStudioFileUrl` | URL signée 5 min sur le bucket privé `collection-files`, après contrôle RLS du fichier |
| `saveStudioAnalysis` / `deleteStudioAnalysis` | CRUD analyses + trace `audit_logs` |
| `reviewStudioMetric` | statut de revue, correction humaine, conservation de la valeur d'origine, `audit_logs` |

## Écrans

- `/studio` : liste réelle des clients accessibles, compteurs, métriques à
  vérifier, état de publication de la review.
- `/studio/$clientId` : périmètre projets/collectes, une fiche par collecte
  (répondant, date, état, réponses, données indisponibles, fichiers avec aperçu
  image et téléchargement signé), revue des métriques, analyses
  (constat / hypothèse / recommandation) et **bloc séparé** pour les notes
  internes, puis le **Strategic Review Builder** alimenté uniquement par les
  métriques validées et les analyses destinées au client. Aucune publication
  client n'est possible à ce stade.

## Tests d'autorisation (`supabase/tests/pass-3d.sql`)

15 tests exécutés puis données supprimées — tous verts :
lecture analyste, lecture viewer, revue/correction analyste, création d'analyse
analyste, refus de revue et de création pour le viewer, invisibilité
cross-tenant des métriques, analyses, soumissions et fichiers, refus de revue
cross-tenant, refus total en anonyme, et impossibilité d'exposer une note
interne au client.

## Points ouverts (Pass 3E)

- Extraction automatique des métriques depuis les fichiers reçus.
- Génération, versionnement et publication de la Strategic Review + email client.
