DROP TABLE IF EXISTS public.rls_test_results;
CREATE TABLE public.rls_test_results (id serial primary key, name text, passed boolean, detail text);
GRANT INSERT, SELECT ON public.rls_test_results TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.rls_test_results_id_seq TO authenticated, anon;

DO $$
DECLARE
  cA uuid; cB uuid; pA uuid; pB uuid; colA uuid; colB uuid; subA uuid; revA uuid; rvA uuid;
  uOwner uuid := '00000000-0000-0000-0000-0000000000a1';
  uAnalystA uuid := '00000000-0000-0000-0000-0000000000a2';
  uViewerA uuid := '00000000-0000-0000-0000-0000000000a3';
  uAnalystB uuid := '00000000-0000-0000-0000-0000000000a4';
  n int; ok boolean; got uuid;
BEGIN
  -- ---------- SEED (service_role / postgres, RLS bypass) ----------
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('test-a','Tenant A',true) RETURNING id INTO cA;
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('test-b','Tenant B',true) RETURNING id INTO cB;
  INSERT INTO public.users (id,email,name) VALUES
    (uOwner,'owner@test.local','Owner'),
    (uAnalystA,'analystA@test.local','Analyst A'),
    (uViewerA,'viewerA@test.local','Viewer A'),
    (uAnalystB,'analystB@test.local','Analyst B');
  INSERT INTO public.user_roles (user_id,role) VALUES
    (uOwner,'owner'),(uAnalystA,'analyst'),(uViewerA,'viewer'),(uAnalystB,'analyst');
  INSERT INTO public.user_clients (user_id,client_id) VALUES
    (uAnalystA,cA),(uViewerA,cA),(uAnalystB,cB);
  INSERT INTO public.projects (client_id,name) VALUES (cA,'P A') RETURNING id INTO pA;
  INSERT INTO public.projects (client_id,name) VALUES (cB,'P B') RETURNING id INTO pB;
  INSERT INTO public.collections (client_id,project_id) VALUES (cA,pA) RETURNING id INTO colA;
  INSERT INTO public.collections (client_id,project_id) VALUES (cB,pB) RETURNING id INTO colB;
  INSERT INTO public.submissions (collection_id,client_id) VALUES (colA,cA) RETURNING id INTO subA;
  INSERT INTO public.analyses (client_id,collection_id,title,body) VALUES (cA,colA,'interne','secret');
  INSERT INTO public.reviews (client_id,project_id,collection_id) VALUES (cA,pA,colA) RETURNING id INTO revA;
  INSERT INTO public.review_versions (review_id,client_id,version_no,status)
    VALUES (revA,cA,1,'approved') RETURNING id INTO rvA;

  -- ---------- COLLECTION EXPERIENCE ----------
  -- P0 : client_id/collection_id dénormalisés dérivés du submission_id, jamais du frontend
  INSERT INTO public.answers (submission_id, collection_id, client_id, question_key, value)
    VALUES (subA, colB, cB, 'yt_periode', '"365"'::jsonb);
  SELECT client_id INTO got FROM public.answers WHERE submission_id = subA AND question_key='yt_periode';
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES
    ('P0 client_id forgé écrasé par la dérivation serveur', got = cA, 'attendu tenant A');

  -- Immutabilité submission soumise
  UPDATE public.submissions SET status='submitted' WHERE id = subA;
  BEGIN
    UPDATE public.submissions SET snapshot='{"x":1}'::jsonb WHERE id = subA; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Submission soumise immuable (UPDATE refusé)', ok, null);
  BEGIN
    UPDATE public.answers SET value='"999"'::jsonb WHERE submission_id=subA; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Réponses d''une submission soumise immuables', ok, null);
  BEGIN
    INSERT INTO public.answers (submission_id,collection_id,client_id,question_key,value)
      VALUES (subA,colA,cA,'nouvelle','"x"'::jsonb); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Insertion sous submission soumise refusée', ok, null);
  BEGIN
    DELETE FROM public.submissions WHERE id = subA; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Submission soumise non supprimable', ok, null);

  -- Notifications : idempotency_key distingue chaque review_version_id
  INSERT INTO public.notifications (client_id,type,recipient,related_type,related_id,review_version_id)
    VALUES (cA,'review_published','raphael@test.local','review',revA,rvA);
  INSERT INTO public.review_versions (review_id,client_id,version_no,status) VALUES (revA,cA,2,'draft');
  INSERT INTO public.notifications (client_id,type,recipient,related_type,related_id,review_version_id)
    SELECT cA,'review_published','raphael@test.local','review',revA,id FROM public.review_versions WHERE review_id=revA AND version_no=2;
  SELECT count(*) INTO n FROM public.notifications WHERE related_id = revA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES
    ('Idempotence notifications par review_version_id', n = 2, 'lignes: '||n);
  BEGIN
    INSERT INTO public.notifications (client_id,type,recipient,related_type,related_id,review_version_id)
      VALUES (cA,'review_published','raphael@test.local','review',revA,rvA); ok := false;
  EXCEPTION WHEN unique_violation THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Doublon notification identique refusé', ok, null);

  -- ---------- RESULTS STUDIO : analyste A (tenant A) ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalystA,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;

  SELECT count(*) INTO n FROM public.clients WHERE id = cA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Positif: analyste A lit son client', n=1, null);
  SELECT count(*) INTO n FROM public.clients WHERE id = cB;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif cross-tenant: analyste A ne lit pas le client B', n=0, null);
  SELECT count(*) INTO n FROM public.collections WHERE client_id = cB;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif cross-tenant: collections B invisibles', n=0, null);
  SELECT count(*) INTO n FROM public.analyses WHERE client_id = cA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Positif: analyses internes lisibles par analyste A', n=1, null);
  SELECT count(*) INTO n FROM public.link_sessions;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('link_sessions inaccessibles côté client authentifié', n=0, null);

  BEGIN
    INSERT INTO public.collections (client_id,project_id) VALUES (cB,pB); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif cross-tenant: écriture collection B refusée', ok, null);

  BEGIN
    UPDATE public.review_versions SET status='published' WHERE id = rvA;
    GET DIAGNOSTICS n = ROW_COUNT; ok := (n = 0);
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Publish Strategic Review refusé à un analyste', ok, null);

  RESET ROLE;

  -- ---------- Analyste B : cross-tenant sur les données de A ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalystB,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.analyses WHERE client_id = cA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif cross-tenant: analyses de A invisibles pour B', n=0, null);
  SELECT count(*) INTO n FROM public.answers WHERE client_id = cA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif cross-tenant: réponses de A invisibles pour B', n=0, null);
  SELECT count(*) INTO n FROM public.review_versions WHERE client_id = cA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif cross-tenant: reviews de A invisibles pour B', n=0, null);
  RESET ROLE;

  -- ---------- Viewer : lecture seule ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uViewerA,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  SELECT count(*) INTO n FROM public.collections WHERE client_id = cA;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Positif: viewer A lit les collectes de A', n=1, null);
  BEGIN
    INSERT INTO public.analyses (client_id,collection_id,title,body) VALUES (cA,colA,'x','y'); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif: viewer ne peut pas écrire une analyse', ok, null);
  RESET ROLE;

  -- ---------- Owner : publication + immutabilité version publiée ----------
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uOwner,'role','authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.review_versions SET status='published' WHERE id = rvA;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Positif: owner publie une version approuvée', n=1, null);
  BEGIN
    UPDATE public.review_versions SET content='{"a":1}'::jsonb WHERE id = rvA; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Version publiée immuable en base', ok, null);
  SELECT count(*) INTO n FROM public.clients WHERE id IN (cA,cB);
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Positif: owner voit tous les tenants', n=2, null);
  RESET ROLE;

  -- ---------- Strategic Review côté visiteur anonyme ----------
  PERFORM set_config('request.jwt.claims', '', true);
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO n FROM public.review_versions; ok := (n = 0);
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif: anonyme ne lit aucune review', ok, null);
  BEGIN
    SELECT count(*) INTO n FROM public.secure_links; ok := (n = 0);
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.rls_test_results(name,passed,detail) VALUES ('Négatif: anonyme ne lit aucun lien sécurisé', ok, null);
  RESET ROLE;

  -- ---------- CLEANUP ----------
  ALTER TABLE public.review_versions DISABLE TRIGGER trg_review_versions_rules;
  ALTER TABLE public.submissions DISABLE TRIGGER trg_submissions_immutable;
  ALTER TABLE public.answers DISABLE TRIGGER trg_answers_immutable;
  ALTER TABLE public.files DISABLE TRIGGER trg_files_immutable;
  ALTER TABLE public.extracted_metrics DISABLE TRIGGER trg_metrics_immutable;
  DELETE FROM public.notifications WHERE client_id IN (cA,cB);
  UPDATE public.reviews SET current_version_id = NULL WHERE client_id IN (cA,cB);
  DELETE FROM public.clients WHERE id IN (cA,cB);
  DELETE FROM public.user_roles WHERE user_id IN (uOwner,uAnalystA,uViewerA,uAnalystB);
  DELETE FROM public.users WHERE id IN (uOwner,uAnalystA,uViewerA,uAnalystB);
  ALTER TABLE public.review_versions ENABLE TRIGGER trg_review_versions_rules;
  ALTER TABLE public.submissions ENABLE TRIGGER trg_submissions_immutable;
  ALTER TABLE public.answers ENABLE TRIGGER trg_answers_immutable;
  ALTER TABLE public.files ENABLE TRIGGER trg_files_immutable;
  ALTER TABLE public.extracted_metrics ENABLE TRIGGER trg_metrics_immutable;
END $$;

SELECT id, name, passed, detail FROM public.rls_test_results ORDER BY id;
