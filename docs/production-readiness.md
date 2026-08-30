# Sawaz Client Intelligence — Production Readiness (Release Candidate LFTC)

Périmètre : durcissement production uniquement. Aucun workflow, contenu métier, UX/UI
ni architecture fonctionnelle validée n'a été modifié. Aucune fonctionnalité ajoutée.

---

## 1. Ce qui a été renforcé

### 1.1 Sécurité des uploads (`src/lib/security/upload-policy.ts`)

- Slot obligatoire et vérifié contre la liste serveur (aucun slot libre).
- MIME autorisés : PDF, PNG, JPEG, WEBP, CSV, XLS, XLSX. Tout le reste est refusé.
- Extension contrôlée et cohérente avec le MIME annoncé ; la **chaîne complète**
  d'extensions est inspectée (`rapport.pdf.exe` refusé).
- Extensions dangereuses bloquées (exécutables, scripts, archives autoextractibles).
- Taille : 8 octets minimum, 20 Mio maximum. Nom de fichier validé (pas de
  traversée de chemin, pas de caractères de contrôle).
- **Nom de stockage généré côté serveur** : `client/collection/submission/slot/uuid.ext`.
  Le nom d'origine n'est plus jamais utilisé comme chemin, seulement comme métadonnée.
- Inspection du contenu réellement stocké (magic bytes) : signature PDF/PNG/JPEG/WEBP/XLSX
  vérifiée, exécutables déguisés (MZ, ELF) refusés, CSV/texte rejeté s'il contient du
  script, du HTML actif ou des octets nuls. Un fichier refusé est supprimé du bucket
  et n'est jamais rattaché à la submission.

### 1.2 Rate limiting (`src/lib/security/rate-limit.server.ts` + table `rate_limits`)

Compteurs persistés en base (fonction `consume_rate_limit`, fenêtre glissante,
sujet haché) : ouverture de lien de collecte, ouverture de lien de review,
autosave, upload, soumission. En cas d'indisponibilité du compteur, la politique
est *fail open* mais l'incident est journalisé (une panne de compteur ne coupe
pas la collecte d'un client).

### 1.3 Erreurs, journalisation et monitoring (`src/lib/observability/server-log.ts`)

- Toutes les surfaces publiques passent par `toPublicError` : les erreurs attendues
  gardent leur message métier, les erreurs inattendues sont masquées derrière un
  identifiant d'incident (aucune fuite de détail interne au client).
- Événements de sécurité structurés : token invalide/expiré/révoqué, upload refusé,
  dépassement de quota, échec d'envoi email.
- Journal d'audit applicatif conservé en base (`audit_logs`, append-only).

### 1.4 Email transactionnel

- Abstraction inchangée (`EmailProvider`) : aucune dépendance métier au fournisseur.
- Adaptateur Resend (`src/lib/notifications/providers/resend.server.ts`) : activé par
  variables d'environnement, 3 tentatives, backoff exponentiel, gestion des statuts
  retryables, clé d'idempotence transmise au fournisseur.
- Sans configuration, le provider `log` reste actif : rien n'est envoyé, tout est tracé.

### 1.5 RGPD, rétention, sauvegarde

- `purge_rate_limits(heures)` — compteurs techniques.
- `purge_expired_sessions(jours)` — sessions de liens sécurisés expirées.
- `purge_audit_logs(jours)` — journal d'audit (365 jours par défaut).
- `erase_client_data(client_id, drop_client)` — effacement complet d'un client
  (réponses, fichiers, métriques, analyses, reviews, liens, contacts), malgré les
  triggers d'immuabilité, avec trace d'effacement anonymisée conservée.
- Sauvegarde : sauvegardes managées de la base par la plateforme. Le bucket
  `collection-files` reste privé (aucun accès public, URLs signées à durée courte).

---

## 2. Tests exécutés

| Test | Méthode | Résultat |
| --- | --- | --- |
| Politique d'upload (14 cas : MIME, extension, double extension, taille, nom, magic bytes, exécutable déguisé, script en CSV) | `bun src/lib/security/upload-policy.test.ts` | 14/14 |
| Rate limiting (sous limite, au-dessus, cloisonnement par sujet), purges, immuabilité, effacement RGPD, trace d'audit, triggers réarmés, `rate_limits` sans policy | `supabase/tests/pass-3g.sql` | 10/10 |
| Collecte réelle bout en bout : ouverture du lien sécurisé, retrait du secret de l'URL, autosave, upload légitime accepté | Playwright (Chromium) | OK |
| Upload piégé (CSV contenant un script, CSV avec signature exécutable) | Playwright + vérification base | Refusés, absents de `files` et du bucket |
| Soumission finale en viewport mobile (390×844) | Playwright | `submitted`, audit `collection.submitted` |
| Compteurs de quota effectivement écrits (`collectionLink`, `autosave`, `upload`, `submit`) | Base | OK |
| Isolation tenant, RLS, immuabilité, workflow review, publication owner, liens expirés/révoqués, absence de fuite interne | `rls-tests.sql`, `pass-3d/3e/3f.sql` (passes précédentes) | 77 assertions, toutes vertes |
| Typage complet du projet | `tsgo --noEmit` | 0 erreur |
| Pages clés (`/`, `/review`, `/auth`) | HTTP | 200 |

Nettoyage : **toutes** les données fictives ont été supprimées de la production
(clients de démonstration, submissions, réponses, fichiers, liens sécurisés) ainsi
que les objets correspondants dans le bucket privé. La base ne contient plus aucun
tenant ; seuls les journaux d'audit anonymisés subsistent.

---

## 3. Rapport P0 / P1 / P2

### P0 — traité

1. Noms de fichiers pilotés par le client → noms générés serveur.
2. Absence d'inspection du contenu → magic bytes + détection d'exécutables et de scripts.
3. Absence de rate limiting sur les surfaces publiques → quotas persistés.
4. Fuite potentielle de détails d'erreur serveur au client → masquage centralisé.
5. Données fictives en production → purge complète, base et stockage.

### P1 — traité, à finaliser côté exploitation

1. **Provider email non configuré.** L'adaptateur Resend est prêt ; il faut fournir
   `RESEND_API_KEY` et `EMAIL_FROM`, puis publier les enregistrements DNS
   SPF, DKIM et DMARC du domaine expéditeur. Tant que ce n'est pas fait, les
   notifications sont uniquement journalisées.
2. **Purges non planifiées.** Les fonctions de rétention existent mais doivent être
   déclenchées périodiquement (tâche planifiée quotidienne recommandée).
3. **Aucun compte équipe créé.** Le Results Studio exige un utilisateur authentifié
   avec un rôle `owner` ; à créer avant la mise en service.

### P2 — risques résiduels acceptés

1. Pas d'antivirus réel sur les fichiers : l'inspection est structurelle
   (type, signature, contenu suspect), pas comportementale. Les fichiers restent
   dans un bucket privé et ne sont jamais exécutés ni servis publiquement.
2. Le rate limiting est *fail open* si la table de compteurs est indisponible
   (choix assumé : disponibilité de la collecte client prioritaire).
3. Deux tables techniques (`rate_limits`, `link_sessions`) ont RLS activé sans
   policy : accès serveur uniquement, c'est l'effet recherché.
4. Six fonctions `SECURITY DEFINER` sont exécutables par les utilisateurs
   authentifiés (`has_role`, `is_owner`, `can_write`, …) : elles sont indispensables
   à l'évaluation des policies RLS et ne révèlent que les droits de l'appelant.
5. Tests navigateurs : Chromium vérifié en desktop et mobile. Safari et Edge n'ont
   pas pu être exécutés dans l'environnement ; l'application n'utilise aucune API
   spécifique à un moteur.
6. Les parcours authentifiés (Results Studio, publication, email client) sont
   couverts par les suites SQL d'autorisation mais pas par un parcours navigateur
   de bout en bout, faute de session équipe disponible.

---

## 4. Checklist GO / NO-GO — Release Candidate LFTC

| Point | État |
| --- | --- |
| Schéma, RLS, isolation multi-tenant | ✅ |
| Immuabilité submissions / versions publiées | ✅ |
| Publication réservée au rôle owner | ✅ |
| Bucket privé, URLs signées, aucun accès public | ✅ |
| Sécurité des uploads (type, taille, nom, contenu) | ✅ |
| Rate limiting des surfaces publiques | ✅ |
| Erreurs masquées + journal d'audit | ✅ |
| Rétention et effacement RGPD outillés | ✅ |
| Données fictives supprimées | ✅ |
| Typage, build et pages clés | ✅ |
| Provider email configuré (clé + SPF/DKIM/DMARC) | ⛔ à faire |
| Compte équipe owner créé | ⛔ à faire |
| Purges planifiées | ⚠️ recommandé |

**Verdict : GO conditionnel.** La plateforme est prête techniquement. Deux actions
d'exploitation restent bloquantes avant l'ouverture réelle à LFTC : configurer le
fournisseur email avec son domaine authentifié, et créer le compte équipe owner.
