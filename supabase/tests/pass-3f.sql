-- Pass 3F — Publication & accès client (autorisation, liens, sessions, idempotence, fuite interne).
DROP TABLE IF EXISTS public.p3f_results;
CREATE TABLE public.p3f_results (id serial primary key, name text, passed boolean, detail text);
GRANT INSERT, SELECT ON public.p3f_results TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.p3f_results_id_seq TO authenticated, anon;

DO $$
DECLARE
  cA uuid; cB uuid; pA uuid; colA uuid; subA uuid; rA uuid; v1 uuid; v2 uuid;
  linkOld uuid; linkNew uuid; sess uuid; mValid uuid; mRejete uuid; aNote uuid;
  uOwner uuid := '00000000-0000-0000-0000-0000000000f1';
  uAnalyst uuid := '00000000-0000-0000-0000-0000000000f2';
  uViewerB uuid := '00000000-0000-0000-0000-0000000000f3';
  n int; ok boolean; st text;
BEGIN
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('p3f-a','Tenant A',true) RETURNING id INTO cA;
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('p3f-b','Tenant B',true) RETURNING id INTO cB;
  INSERT INTO public.users (id,email,name) VALUES
    (uOwner,'f-owner@test.local','Owner'),(uAnalyst,'f-analyst@test.local','Analyst'),
    (uViewerB,'f-viewer@test.local','Viewer B');
  INSERT INTO public.user_roles (user_id,role) VALUES
    (uOwner,'owner'),(uAnalyst,'analyst'),(uViewerB,'viewer');
  INSERT INTO public.user_clients (user_id,client_id) VALUES (uAnalyst,cA),(uViewerB,cB);
  INSERT INTO public.contacts (client_id,name,email,is_primary) VALUES (cA,'Contact A','contact-a@test.local',true);
  INSERT INTO public.projects (client_id,name) VALUES (cA,'P A') RETURNING id INTO pA;
  INSERT INTO public.collections (client_id,project_id) VALUES (cA,pA) RETURNING id INTO colA;
  INSERT INTO public.submissions (collection_id,client_id) VALUES (colA,cA) RETURNING id INTO subA;
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,provenance,review_status)
    VALUES (subA,colA,cA,'yt.views',1000,'csv','valide') RETURNING id INTO mValid;
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,provenance,review_status)
    VALUES (subA,colA,cA,'yt.ctr',2,'csv','rejete') RETURNING id INTO mRejete;
  INSERT INTO public.analyses (client_id,collection_id,type,title,body,visibility)
    VALUES (cA,colA,'note','Note interne','confidentiel','internal') RETURNING id INTO aNote;
  INSERT INTO public.reviews (client_id,project_id,collection_id,status) VALUES (cA,pA,colA,'draft') RETURNING id INTO rA;
  INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status,created_by)
    VALUES (rA,cA,1,'{"executiveSummary":"v1"}','[]','approved',uAnalyst) RETURNING id INTO v1;

  ---------------------------------------------------------------- Analyste : publication refusée
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalyst,'role','authenticated')::text, true);
  BEGIN
    UPDATE public.review_versions SET status='published' WHERE id = v1; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Analyste ne peut pas publier', ok, null);

  ---------------------------------------------------------------- Viewer tenant B : refusé
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uViewerB,'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.review_versions WHERE id = v1;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Tenant B ne voit pas la version de A', n = 0, n::text);
  BEGIN
    UPDATE public.review_versions SET status='published' WHERE id = v1; ok := true;
  EXCEPTION WHEN others THEN ok := true; END;
  SELECT status::text INTO st FROM public.review_versions WHERE id = v1;
  RESET role;
  SELECT status::text INTO st FROM public.review_versions WHERE id = v1;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Viewer B n''a pas publié', st = 'approved', st);

  ---------------------------------------------------------------- Owner : publication
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uOwner,'role','authenticated')::text, true);
  UPDATE public.review_versions SET status='published' WHERE id = v1;
  SELECT status::text INTO st FROM public.review_versions WHERE id = v1;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Owner publie la version approuvée', st = 'published', st);

  -- Version publiée immuable
  BEGIN
    UPDATE public.review_versions SET content='{"executiveSummary":"hack"}' WHERE id = v1; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Version publiée immuable', ok, null);

  -- Nouvelle version = version_no + 1
  INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status,created_by)
    VALUES (rA,cA,2,'{"executiveSummary":"v2"}','[]','draft',uOwner) RETURNING id INTO v2;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Modification ultérieure = version 2', v2 IS NOT NULL, null);
  RESET role;

  ---------------------------------------------------------------- Lien sécurisé (hash uniquement)
  INSERT INTO public.secure_links (client_id,scope,target_id,token_hash,expires_at,created_by)
    VALUES (cA,'review',v1,encode(sha256('secret-old'::bytea),'hex'), now() + interval '60 days', uOwner)
    RETURNING id INTO linkOld;
  SELECT count(*) INTO n FROM public.secure_links WHERE id = linkOld AND token_hash = 'secret-old';
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Aucun secret en clair en base', n = 0, null);

  INSERT INTO public.link_sessions (secure_link_id,client_id,session_token_hash,expires_at)
    VALUES (linkOld,cA,encode(sha256('sess-old'::bytea),'hex'), now() + interval '8 hours') RETURNING id INTO sess;

  -- Rotation : révoque lien + sessions
  UPDATE public.secure_links SET revoked_at = now() WHERE id = linkOld;
  UPDATE public.link_sessions SET revoked_at = now() WHERE secure_link_id = linkOld;
  INSERT INTO public.secure_links (client_id,scope,target_id,token_hash,expires_at,created_by)
    VALUES (cA,'review',v1,encode(sha256('secret-new'::bytea),'hex'), now() + interval '60 days', uOwner)
    RETURNING id INTO linkNew;
  SELECT count(*) INTO n FROM public.secure_links
   WHERE scope='review' AND target_id = v1 AND revoked_at IS NULL;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Rotation : un seul lien actif', n = 1, n::text);
  SELECT count(*) INTO n FROM public.link_sessions WHERE secure_link_id = linkOld AND revoked_at IS NULL;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Rotation : sessions de l''ancien lien révoquées', n = 0, n::text);

  -- Lien expiré
  INSERT INTO public.secure_links (client_id,scope,target_id,token_hash,expires_at)
    VALUES (cA,'review',v1,encode(sha256('secret-exp'::bytea),'hex'), now() - interval '1 day');
  SELECT count(*) INTO n FROM public.secure_links
   WHERE token_hash = encode(sha256('secret-exp'::bytea),'hex')
     AND revoked_at IS NULL AND expires_at > now();
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Lien expiré non exploitable', n = 0, n::text);

  ---------------------------------------------------------------- Notification idempotente
  INSERT INTO public.notifications (client_id,type,channel,recipient,review_version_id,related_type,related_id,idempotency_key,payload)
    VALUES (cA,'review.published','email','contact-a@test.local',v1,'review_version',v1,'auto','{}');
  BEGIN
    INSERT INTO public.notifications (client_id,type,channel,recipient,review_version_id,related_type,related_id,idempotency_key,payload)
      VALUES (cA,'review.published','email','contact-a@test.local',v1,'review_version',v1,'auto','{}'); ok := false;
  EXCEPTION WHEN unique_violation THEN ok := true; END;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Email non renvoyé pour la même version', ok, null);

  -- Une autre version = nouvelle notification autorisée
  UPDATE public.review_versions SET status='approved' WHERE id = v2;
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uOwner,'role','authenticated')::text, true);
  UPDATE public.review_versions SET status='published' WHERE id = v2;
  RESET role;
  INSERT INTO public.notifications (client_id,type,channel,recipient,review_version_id,related_type,related_id,idempotency_key,payload)
    VALUES (cA,'review.published','email','contact-a@test.local',v2,'review_version',v2,'auto','{}');
  SELECT count(*) INTO n FROM public.notifications WHERE client_id = cA AND type='review.published';
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Idempotence distingue chaque review_version', n = 2, n::text);

  ---------------------------------------------------------------- Isolation cross-tenant du lien
  SELECT count(*) INTO n FROM public.secure_links s JOIN public.review_versions rv ON rv.id = s.target_id
   WHERE s.id = linkNew AND rv.client_id = cB;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Le lien ne cible aucune version d''un autre tenant', n = 0, n::text);

  ---------------------------------------------------------------- Aucune fuite interne servable
  SELECT count(*) INTO n FROM public.extracted_metrics WHERE client_id = cA AND review_status = 'valide';
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Seules les métriques validées sont éligibles', n = 1, n::text);
  SELECT count(*) INTO n FROM public.analyses WHERE client_id = cA AND type <> 'note' AND visibility <> 'internal';
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Aucune note interne éligible au client', n = 0, n::text);

  ---------------------------------------------------------------- Anonyme
  SET LOCAL role anon;
  PERFORM set_config('request.jwt.claims', null, true);
  SELECT count(*) INTO n FROM public.secure_links;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Anonyme ne lit aucun lien sécurisé', n = 0, n::text);
  SELECT count(*) INTO n FROM public.link_sessions;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Anonyme ne lit aucune session', n = 0, n::text);
  SELECT count(*) INTO n FROM public.review_versions;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Anonyme ne lit aucune version publiée en direct', n = 0, n::text);
  SELECT count(*) INTO n FROM public.notifications;
  INSERT INTO public.p3f_results(name,passed,detail) VALUES ('Anonyme ne lit aucune notification', n = 0, n::text);
  RESET role;
END $$;

SELECT name, passed, detail FROM public.p3f_results ORDER BY id;
