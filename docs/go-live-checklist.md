# Go / No-Go — Sawaz Client Intelligence (Release Candidate LFTC)

Passe finale : aucun refactor, aucune UI modifiée, aucune fonctionnalité ajoutée.
Seules deux corrections de blocage en base ont été appliquées (voir §5).

---

## 1. Premier compte équipe owner

Mécanisme en place (allowlist, aucune élévation possible depuis l'application) :

1. Table `team_invites` : email autorisé + rôle, non modifiable depuis l'application.
2. Fonction `claim_team_access()` : au premier accès authentifié, si l'email correspond à une
   invitation non consommée, elle crée la ligne `users`, attribue le rôle, marque l'invitation
   consommée et journalise `team.access_claimed`. Sans invitation : aucun rôle accordé.
3. Appelée automatiquement à l'entrée des routes authentifiées.

Procédure d'activation (3 étapes, une seule donnée manquante) :

| Étape | Où | Donnée requise |
| --- | --- | --- |
| 1. Créer l'invitation | base, table `team_invites` (`email`, `role='owner'`) | **email de l'owner Sawaz — non fourni** |
| 2. Créer le compte | page `/auth`, inscription avec ce même email | mot de passe choisi par l'owner |
| 3. Confirmer + se connecter | email de confirmation puis `/studio` | — |

Tests : sans invitation → aucun rôle ; insertion d'invitation depuis l'app → refusée ;
invitation consommable une seule fois. **Aucun email owner n'a été inventé ni pré-inséré.**

## 2. Email transactionnel (Resend)

Le code est complet et inchangé : `EmailProvider` abstrait, adaptateur Resend avec 3 tentatives,
backoff, statuts retryables et clé d'idempotence ; sans configuration, le provider `log` reste
actif (rien n'est envoyé, tout est tracé). Aucune dépendance métier au fournisseur.

Manquants — uniquement des données externes :

| Élément | Emplacement exact | Valeur |
| --- | --- | --- |
| `EMAIL_PROVIDER` | secrets serveur du projet | `resend` |
| `RESEND_API_KEY` | secrets serveur du projet | clé fournie par Resend |
| `EMAIL_FROM` | secrets serveur du projet | ex. `Sawaz <review@ton-domaine.tld>` |
| `EMAIL_REPLY_TO` | secrets serveur (optionnel) | adresse de réponse |
| SPF | DNS du domaine expéditeur, enregistrement TXT `@` | `v=spf1 include:_spf.resend.com ~all` |
| DKIM | DNS, CNAME/TXT fournis par Resend à la vérification du domaine | valeurs générées par Resend |
| DMARC | DNS, TXT `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@ton-domaine.tld` |

Tant que ces valeurs manquent, les notifications sont journalisées et non envoyées : aucun
comportement simulé.

## 3. Conformité RGPD opérationnelle

| Exigence | État |
| --- | --- |
| Minimisation, stockage privé, chiffrement au repos, liens révocables | ✅ en place |
| Rétention : `purge_rate_limits`, `purge_expired_sessions`, `purge_audit_logs` | ✅ outillé, ⚠️ **planification à activer** |
| Effacement : `erase_client_data(client_id, drop_client)` + trace anonymisée | ✅ vérifié en test |
| Journal d'audit append-only | ✅ |
| Export des données d'un client | ⚠️ possible en base par un owner, **pas de procédure ni d'écran dédié** |
| Information utilisateur (mention de confidentialité / politique) | ⛔ **absente des écrans** — texte juridique à fournir |

Les deux derniers points sont des manques assumés à ce stade : ils demandent un contenu
juridique et une décision produit, pas du code supplémentaire.

## 4. Parcours E2E métier complet — `supabase/tests/pass-3h.sql`

18 assertions, **18/18 vertes** : bootstrap owner sécurisé (3 cas) → création client + thème →
contact → projet → collecte → lien de collecte haché → soumission → immuabilité des réponses →
extraction des métriques → revue humaine → analyses (dont note interne) →
draft → in_review → approved → published (owner) → notification idempotente →
lien de review + session → aucune fuite interne → révocation lien + sessions →
effacement RGPD complet avec trace conservée. Données de test intégralement supprimées
(base à zéro : 0 client, 0 utilisateur, 0 fichier, 0 lien, 0 invitation).

Suites réutilisées sans modification : `rls-tests.sql` (24), `pass-3d` (15), `pass-3e` (19),
`pass-3f` (19), `pass-3g` (10), `upload-policy.test.ts` (14).

## 5. Deux blocages réels corrigés

Le parcours E2E a révélé que les triggers d'immuabilité s'appliquaient aussi à
`extracted_metrics` : une fois la collecte envoyée, **aucune métrique ne pouvait être créée ni
revue**, ce qui rendait le Results Studio inopérant en production. Corrections minimales :

1. `trg_metrics_immutable` et `trg_metrics_insert_open` retirés de `extracted_metrics`
   (données dérivées produites après soumission). Réponses, fichiers et collectes envoyées
   restent strictement immuables.
2. `erase_client_data` mise à jour en conséquence.

## 6. Verdict

**GO conditionnel.** La plateforme est techniquement prête et vérifiée de bout en bout.

Blockers restants, tous externes :

1. Email owner à fournir, puis invitation + inscription (§1).
2. Clé Resend, `EMAIL_FROM` et enregistrements SPF/DKIM/DMARC (§2).

Actions manuelles recommandées avant ouverture : planifier les purges quotidiennes,
publier une mention d'information RGPD et définir la procédure d'export client.
