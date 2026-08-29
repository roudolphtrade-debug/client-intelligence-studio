-- Pass 3D — Tests d'autorisation du Results Studio (analyses, métriques, fichiers).
-- Exécuté avec un rôle superutilisateur ; chaque bloc simule un utilisateur authentifié.
DROP TABLE IF EXISTS public.p3d_results;
CREATE TABLE public.p3d_results (id serial primary key, name text, passed boolean, detail text);
GRANT INSERT, SELECT ON public.p3d_results TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.p3d_results_id_seq TO authenticated, anon;

DO $$
DECLARE
  cA uuid; cB uuid; pA uuid; pB uuid; colA uuid; colB uuid; subA uuid; mA uuid; aA uuid;
  uOwner uuid := '00000000-0000-0000-0000-0000000000d1';
  uAnalystA uuid := '00000000-0000-0000-0000-0000000000d2';
  uViewerA uuid := '00000000-0000-0000-0000-0000000000d3';
  uAnalystB uuid := '00000000-0000-0000-0000-0000000000d4';
  n int; ok boolean; st text;
BEGIN
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('p3d-a','Tenant A',true) RETURNING id INTO cA;
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('p3d-b','Tenant B',true) RETURNING id INTO cB;
  INSERT INTO public.users (id,email,name) VALUES
    (uOwner,'d-owner@test.local','Owner'),(uAnalystA,'d-a@test.local','Analyst A'),
    (uViewerA,'d-v@test.local','Viewer A'),(uAnalystB,'d-b@test.local','Analyst B');
  INSERT INTO public.user_roles (user_id,role) VALUES
    (uOwner,'owner'),(uAnalystA,'analyst'),(uViewerA,'viewer'),(uAnalystB,'analyst');
  INSERT INTO public.user_clients (user_id,client_id) VALUES (uAnalystA,cA),(uViewerA,cA),(uAnalystB,cB);
  INSERT INTO public.projects (client_id,name) VALUES (cA,'P A') RETURNING id INTO pA;
  INSERT INTO public.projects (client_id,name) VALUES (cB,'P B') RETURNING id INTO pB;
  INSERT INTO public.collections (client_id,project_id) VALUES (cA,pA) RETURNING id INTO colA;
  INSERT INTO public.collections (client_id,project_id) VALUES (cB,pB) RETURNING id INTO colB;
  INSERT INTO public.submissions (collection_id,client_id) VALUES (colA,cA) RETURNING id INTO subA;
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,unit,provenance,confidence)
    VALUES (subA,colA,cA,'yt.views',1000,'vues','csv',0.8) RETURNING id INTO mA;
  INSERT INTO public.analyses (client_id,collection_id,submission_id,type,title,body,visibility)
    VALUES (cA,colA,subA,'note','Note interne','confidentiel','internal') RETURNING id INTO aA;

  -- Une note interne ne peut jamais être marquée visible côté client (contrainte base)
  BEGIN
    INSERT INTO public.analyses (client_id,collection_id,type,title,body,visibility)
      VALUES (cA,colA,'note','fuite','x','client'); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Note interne jamais exposée au client', ok, null);

  -- Analyste du tenant A : lecture métriques + analyses
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalystA,'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.extracted_metrics WHERE id = mA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Analyste A lit ses métriques', n = 1, null);
  SELECT count(*) INTO n FROM public.analyses WHERE id = aA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Analyste A lit ses analyses', n = 1, null);

  -- Revue de métrique : correction traçable autorisée pour l'analyste
  UPDATE public.extracted_metrics
     SET review_status='valide', original_value_num=1000, value_num=1200,
         corrected_by=uAnalystA, corrected_at=now(), reviewed_by=uAnalystA, reviewed_at=now()
   WHERE id = mA;
  SELECT review_status::text INTO st FROM public.extracted_metrics WHERE id = mA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Analyste A valide et corrige une métrique', st = 'valide', st);

  -- Création d'analyse par l'analyste
  INSERT INTO public.analyses (client_id,collection_id,type,title,body,visibility)
    VALUES (cA,colA,'constat','Constat','texte','client');
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Analyste A crée un constat', true, null);

  -- Viewer du tenant A : lecture seule
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uViewerA,'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.extracted_metrics WHERE id = mA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Viewer A lit les métriques', n = 1, null);
  BEGIN
    UPDATE public.extracted_metrics SET review_status='rejete' WHERE id = mA;
    GET DIAGNOSTICS n = ROW_COUNT; ok := n = 0;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Viewer A ne peut pas réviser une métrique', ok, null);
  BEGIN
    INSERT INTO public.analyses (client_id,collection_id,type,title,body)
      VALUES (cA,colA,'note','x','y'); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Viewer A ne peut pas créer d''analyse', ok, null);

  -- Analyste du tenant B : isolation stricte
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalystB,'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.extracted_metrics WHERE id = mA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Cross-tenant : métriques A invisibles pour B', n = 0, null);
  SELECT count(*) INTO n FROM public.analyses WHERE client_id = cA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Cross-tenant : analyses internes A invisibles pour B', n = 0, null);
  SELECT count(*) INTO n FROM public.submissions WHERE client_id = cA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Cross-tenant : soumissions A invisibles pour B', n = 0, null);
  SELECT count(*) INTO n FROM public.files WHERE client_id = cA;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Cross-tenant : fichiers A invisibles pour B', n = 0, null);
  BEGIN
    UPDATE public.extracted_metrics SET review_status='valide' WHERE id = mA;
    GET DIAGNOSTICS n = ROW_COUNT; ok := n = 0;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Cross-tenant : revue de métrique A refusée à B', ok, null);

  -- Anonyme : aucun accès aux surfaces internes
  SET LOCAL role anon;
  PERFORM set_config('request.jwt.claims', NULL, true);
  SELECT count(*) INTO n FROM public.analyses;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Anonyme : aucune analyse lisible', n = 0, null);
  SELECT count(*) INTO n FROM public.extracted_metrics;
  INSERT INTO public.p3d_results(name,passed,detail) VALUES ('Anonyme : aucune métrique lisible', n = 0, null);
  RESET role;
END $$;

SELECT name, passed, detail FROM public.p3d_results ORDER BY id;
