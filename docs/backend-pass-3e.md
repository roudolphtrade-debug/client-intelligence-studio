# Pass 3E — Sawaz Strategic Review Workflow

Objectif : transformer le Strategic Review Builder en workflow éditorial réel.
La Collection Experience et le Results Studio validés ne sont pas modifiés
(seul le panneau « Strategic Review » du dossier client est remplacé par la
liste des Reviews).

## 1. Modèle utilisé

Aucune migration nécessaire : `reviews` et `review_versions` (Pass 3B) portent
déjà `status`, `version_no`, `content jsonb`, `charts jsonb`, l'unicité
`(review_id, version_no)` et le trigger `enforce_review_version_rules`.

Structure d'une version (`content`) — `src/lib/studio/review-content.ts` :

- `title`, `periodLabel`, `executiveSummary`
- `blocks[]` : `kind` ∈ `fait | interpretation | hypothese | recommandation`,
  `title`, `body`, `sourceMetricIds[]`, `analysisId`
- `actions[]` : prochaines actions (`label`, `detail`, `owner`, `horizon`)
- `cta` : `aucun | etape_suivante | contact | rendez_vous | personnalise`
  + `label`, `url`, `helper`

`charts[]` : `type` (bar/line), `sourceMetricIds[]`, `periodStart/End`,
`generatedAt`, `points[]` — chaque point peut pointer vers son `metricId`
(traçabilité jusqu'à la métrique source).

## 2. Serveur — `src/lib/studio/review.functions.ts`

| Fonction | Rôle |
| --- | --- |
| `listClientReviews` | Reviews + versions d'un client (RLS tenant) |
| `createReview` | Review `draft` depuis une collecte + version 1 |
| `getReviewWorkspace` | Version ciblée, matériaux éligibles, thème tenant |
| `saveReviewVersion` | Sauvegarde, ou fork `version_no + 1` si publiée |
| `transitionReviewVersion` | Draft → In Review → Approved → Published (→ Archived) |

Garde-fous serveur (en plus de la RLS et des triggers) :

- `normalizeReviewContent` / `normalizeReviewCharts` retirent toute référence à
  une métrique non `valide` ou à une analyse `internal` / de type `note` —
  au chargement **et** à l'enregistrement. Une fuite interne est donc
  impossible même si le client envoie un payload forgé.
- Un graphique sans métrique validée source est supprimé.
- `published` / `archived` : réservés au rôle `owner` (vérification serveur +
  trigger base).
- Toute écriture est tracée dans `audit_logs`
  (`review.created`, `review_version.saved|forked|in_review|approved|published`).

## 3. Interface

- `/studio/$clientId` : panneau « Strategic Review » = liste des Reviews,
  statut, nombre de versions, création depuis une collecte.
- `/studio/$clientId/review/$reviewId` : builder complet
  - barre de workflow (transitions autorisées uniquement, publication grisée
    hors owner, badge « version publiée — immuable »),
  - navigation entre versions,
  - Executive Summary, blocs Fait / Interprétation / Hypothèse /
    Recommandation distingués visuellement (couleur, puce, aide sémantique),
  - import d'analyses éligibles (jamais les notes internes),
  - rattachement des métriques validées à chaque bloc,
  - graphiques générés depuis les métriques validées,
  - actions et CTA configurable,
  - **Preview Client** (`ReviewPreview`) : rendu exact de la future Strategic
    Review, thème dynamique lu depuis `clients.theme_tokens` / `clients.brand`,
    aucun client codé en dur, provenance affichée côté interne.

Aucun email n'est envoyé et aucun accès client final n'est créé à ce stade.

## 4. Versionnement

- Sauvegarde sur une version `draft` / `in_review` / `approved` → mise à jour.
- Sauvegarde sur une version `published` / `archived` → création automatique
  d'une nouvelle version `version_no + 1` en `draft` (l'originale reste
  intacte, garantie par le trigger base).

## 5. Tests — `supabase/tests/pass-3e.sql`

19 tests, tous verts :

1. Création Review draft + version 1 par un analyste
2. Draft → In Review → Approved autorisé à l'analyste
3. Publication refusée à l'analyste, autorisée à l'owner, `published_at` posé
4. Version publiée immuable (contenu) et non supprimable
5. Nouvelle version `version_no + 1`, unicité `(review_id, version_no)`
6. Éligibilité : 1 seule métrique validée, 1 seule analyse client, note
   toujours interne
7. Cross-tenant : lecture Review/versions impossible, écriture refusée
8. Anonyme : aucune Review, aucune version, aucune analyse lisible

Les tenants, utilisateurs et tables temporaires de test ont été supprimés
après exécution.
