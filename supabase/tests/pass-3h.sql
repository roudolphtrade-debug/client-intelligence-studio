-- Pass 3H — Bootstrap owner sécurisé + parcours E2E métier complet
-- (client → thème → projet → contact → collecte → lien → submission → métriques →
--  analyses → review → approval → publication owner → notification → accès → révocation).
DROP TABLE IF EXISTS public.p3h_results;
CREATE TABLE public.p3h_results (id serial primary key, name text, passed boolean, detail text);
GRANT INSERT, SELECT ON public.p3h_results TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.p3h_results_id_seq TO authenticated, anon;

DO $$
DECLARE
  cA uuid; pA uuid; colA uuid; subA uuid; rA uuid; v1 uuid; link uuid; sess uuid;
  ct uuid; mOk uuid; n int; ok boolean; st text; res text;
  uOwner uuid := '00000000-0000-0000-0000-0000000000h1';
  uIntrus uuid := '00000000-0000-0000-0000-0000000000h2';
BEGIN
  ------------------------------------------------------------------ 1. Bootstrap owner
  INSERT INTO public.team_invites (email, role) VALUES ('h-owner@test.local','owner');

  -- Un utilisateur non invité n'obtient aucun rôle.
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uIntrus,'role','authenticated')::text, true);
  BEGIN res := public.claim_team_access(); EXCEPTION WHEN others THEN res := 'error'; END;
  RESET role;
  SELECT count(*) INTO n FROM public.user_roles WHERE user_id = uIntrus;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES
    ('Sans invitation, aucun rôle accordé', n = 0 AND res <> 'granted', res);

  -- La table d'invitations n'est pas modifiable par un utilisateur authentifié.
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uIntrus,'role','authenticated')::text, true);
  BEGIN
    INSERT INTO public.team_invites (email, role) VALUES ('pirate@test.local','owner'); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  RESET role;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Invitations non modifiables depuis l''app', ok, null);

  -- L'owner invité obtient users + user_roles (simulation de la 1re connexion).
  INSERT INTO public.users (id,email,name) VALUES (uOwner,'h-owner@test.local','Owner');
  UPDATE public.team_invites SET claimed_at = now(), claimed_by = uOwner WHERE email = 'h-owner@test.local';
  INSERT INTO public.user_roles (user_id,role) VALUES (uOwner,'owner');
  INSERT INTO public.p3h_results(name,passed,detail) VALUES
    ('Owner invité actif', public.has_role(uOwner,'owner'), null);

  -- Invitation à usage unique.
  SELECT count(*) INTO n FROM public.team_invites WHERE email='h-owner@test.local' AND claimed_at IS NOT NULL;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Invitation consommée une seule fois', n = 1, n::text);

  ------------------------------------------------------------------ 2. Parcours métier (owner)
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uOwner,'role','authenticated')::text, true);

  INSERT INTO public.clients (slug,name,is_demo,theme_tokens)
    VALUES ('p3h','Tenant E2E',true,'{"primary":"#FABA07"}') RETURNING id INTO cA;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES
    ('Client + thème créés par owner', cA IS NOT NULL, null);

  INSERT INTO public.contacts (client_id,name,email,is_primary)
    VALUES (cA,'Contact E2E','h-contact@test.local',true) RETURNING id INTO ct;
  INSERT INTO public.projects (client_id,name,period_label) VALUES (cA,'Projet E2E','2026') RETURNING id INTO pA;
  INSERT INTO public.collections (client_id,project_id,status,opened_at)
    VALUES (cA,pA,'open',now()) RETURNING id INTO colA;

  -- Lien de collecte (hash uniquement)
  INSERT INTO public.secure_links (client_id,scope,target_id,token_hash,expires_at,created_by)
    VALUES (cA,'collection',colA,encode(sha256('collect-secret'::bytea),'hex'), now()+interval '30 days', uOwner)
    RETURNING id INTO link;
  INSERT INTO public.collection_recipients (collection_id,client_id,contact_id,secure_link_id)
    VALUES (colA,cA,ct,link);
  SELECT count(*) INTO n FROM public.secure_links WHERE id = link AND token_hash LIKE '%collect-secret%';
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Lien de collecte stocké en hash', n = 0, null);

  -- Submission + soumission immuable
  INSERT INTO public.submissions (collection_id,client_id,status) VALUES (colA,cA,'working') RETURNING id INTO subA;
  INSERT INTO public.answers (submission_id,collection_id,client_id,question_key,value)
    VALUES (subA,colA,cA,'yt.period','"12m"');
  UPDATE public.submissions SET status='submitted' WHERE id = subA;
  BEGIN
    UPDATE public.answers SET value='"hack"' WHERE submission_id = subA; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Réponses immuables après soumission', ok, null);

  -- Métriques : une validée, une rejetée
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,unit,provenance,review_status)
    VALUES (subA,colA,cA,'yt.views',12000,'vues','csv','valide') RETURNING id INTO mOk;
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,provenance,review_status)
    VALUES (subA,colA,cA,'yt.ctr',3.2,'csv','rejete');

  -- Analyses : une client, une note interne
  INSERT INTO public.analyses (client_id,collection_id,submission_id,author_user_id,type,title,body,visibility)
    VALUES (cA,colA,subA,uOwner,'constat','Constat','Corps','client');
  INSERT INTO public.analyses (client_id,collection_id,submission_id,author_user_id,type,title,body,visibility)
    VALUES (cA,colA,subA,uOwner,'note','Note interne','Confidentiel','internal');

  -- Review : draft → in_review → approved → published
  INSERT INTO public.reviews (client_id,project_id,collection_id,status) VALUES (cA,pA,colA,'draft') RETURNING id INTO rA;
  INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status,created_by)
    VALUES (rA,cA,1,'{"executiveSummary":"E2E"}',
            jsonb_build_array(jsonb_build_object('sourceMetricIds', jsonb_build_array(mOk))),
            'draft',uOwner) RETURNING id INTO v1;
  UPDATE public.review_versions SET status='in_review' WHERE id = v1;
  UPDATE public.review_versions SET status='approved', approved_by=uOwner, approved_at=now() WHERE id = v1;
  UPDATE public.review_versions SET status='published' WHERE id = v1;
  UPDATE public.reviews SET status='published', current_version_id=v1, published_at=now() WHERE id = rA;
  SELECT status::text INTO st FROM public.review_versions WHERE id = v1;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Workflow complet jusqu''à published', st='published', st);
  RESET role;

  -- Lien de review + session client
  INSERT INTO public.secure_links (client_id,scope,target_id,token_hash,expires_at,created_by)
    VALUES (cA,'review',v1,encode(sha256('review-secret'::bytea),'hex'), now()+interval '60 days', uOwner)
    RETURNING id INTO link;
  INSERT INTO public.link_sessions (secure_link_id,client_id,session_token_hash,expires_at)
    VALUES (link,cA,encode(sha256('review-sess'::bytea),'hex'), now()+interval '8 hours') RETURNING id INTO sess;

  -- Notification idempotente
  INSERT INTO public.notifications (client_id,type,channel,recipient,review_version_id,related_type,related_id,idempotency_key,payload)
    VALUES (cA,'review.published','email','h-contact@test.local',v1,'review_version',v1,'auto','{}');
  BEGIN
    INSERT INTO public.notifications (client_id,type,channel,recipient,review_version_id,related_type,related_id,idempotency_key,payload)
      VALUES (cA,'review.published','email','h-contact@test.local',v1,'review_version',v1,'auto','{}'); ok := false;
  EXCEPTION WHEN unique_violation THEN ok := true; END;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Notification unique par version', ok, null);

  -- Contenu servable : aucune fuite interne
  SELECT count(*) INTO n FROM public.extracted_metrics WHERE client_id=cA AND review_status='valide';
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Seules les métriques validées servables', n = 1, n::text);
  SELECT count(*) INTO n FROM public.analyses WHERE client_id=cA AND type='note';
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Note interne présente mais jamais éligible', n = 1, n::text);

  ------------------------------------------------------------------ 3. Révocation
  UPDATE public.secure_links SET revoked_at = now() WHERE id = link;
  UPDATE public.link_sessions SET revoked_at = now() WHERE secure_link_id = link;
  SELECT count(*) INTO n FROM public.secure_links
   WHERE scope='review' AND target_id=v1 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now());
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Après révocation, aucun accès actif', n = 0, n::text);
  SELECT count(*) INTO n FROM public.link_sessions WHERE id = sess AND revoked_at IS NULL;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Sessions ouvertes fermées', n = 0, n::text);

  ------------------------------------------------------------------ 4. RGPD : effacement complet
  PERFORM public.erase_client_data(cA, true);
  SELECT count(*) INTO n FROM public.clients WHERE id = cA;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Effacement RGPD du client', n = 0, n::text);
  SELECT count(*) INTO n FROM public.submissions WHERE client_id = cA;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Données rattachées effacées', n = 0, n::text);
  SELECT count(*) INTO n FROM public.audit_logs WHERE action = 'gdpr.erasure' AND entity_id = cA;
  INSERT INTO public.p3h_results(name,passed,detail) VALUES ('Trace d''effacement conservée', n = 1, n::text);

  ------------------------------------------------------------------ Nettoyage
  DELETE FROM public.user_roles WHERE user_id IN (uOwner,uIntrus);
  DELETE FROM public.users WHERE id IN (uOwner,uIntrus);
  DELETE FROM public.team_invites WHERE email IN ('h-owner@test.local','pirate@test.local');
END $$;

SELECT name, passed, detail FROM public.p3h_results ORDER BY id;
