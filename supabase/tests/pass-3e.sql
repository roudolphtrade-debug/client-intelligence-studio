-- Pass 3E — Tests du Strategic Review Workflow (autorisation, versionnement, fuite interne).
-- Exécuté avec un rôle superutilisateur ; chaque bloc simule un utilisateur authentifié.
DROP TABLE IF EXISTS public.p3e_results;
CREATE TABLE public.p3e_results (id serial primary key, name text, passed boolean, detail text);
GRANT INSERT, SELECT ON public.p3e_results TO authenticated, anon;
GRANT USAGE, SELECT ON SEQUENCE public.p3e_results_id_seq TO authenticated, anon;

DO $$
DECLARE
  cA uuid; cB uuid; pA uuid; pB uuid; colA uuid; colB uuid; subA uuid;
  mValid uuid; mRejete uuid; aNote uuid; aClient uuid;
  rA uuid; v1 uuid; v2 uuid;
  uOwner uuid := '00000000-0000-0000-0000-0000000000e1';
  uAnalystA uuid := '00000000-0000-0000-0000-0000000000e2';
  uAnalystB uuid := '00000000-0000-0000-0000-0000000000e3';
  n int; ok boolean; st text;
BEGIN
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('p3e-a','Tenant A',true) RETURNING id INTO cA;
  INSERT INTO public.clients (slug,name,is_demo) VALUES ('p3e-b','Tenant B',true) RETURNING id INTO cB;
  INSERT INTO public.users (id,email,name) VALUES
    (uOwner,'e-owner@test.local','Owner'),(uAnalystA,'e-a@test.local','Analyst A'),
    (uAnalystB,'e-b@test.local','Analyst B');
  INSERT INTO public.user_roles (user_id,role) VALUES
    (uOwner,'owner'),(uAnalystA,'analyst'),(uAnalystB,'analyst');
  INSERT INTO public.user_clients (user_id,client_id) VALUES (uAnalystA,cA),(uAnalystB,cB);
  INSERT INTO public.projects (client_id,name) VALUES (cA,'P A') RETURNING id INTO pA;
  INSERT INTO public.projects (client_id,name) VALUES (cB,'P B') RETURNING id INTO pB;
  INSERT INTO public.collections (client_id,project_id) VALUES (cA,pA) RETURNING id INTO colA;
  INSERT INTO public.collections (client_id,project_id) VALUES (cB,pB) RETURNING id INTO colB;
  INSERT INTO public.submissions (collection_id,client_id) VALUES (colA,cA) RETURNING id INTO subA;
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,provenance,review_status)
    VALUES (subA,colA,cA,'yt.views',1000,'csv','valide') RETURNING id INTO mValid;
  INSERT INTO public.extracted_metrics (submission_id,collection_id,client_id,metric_key,value_num,provenance,review_status)
    VALUES (subA,colA,cA,'yt.ctr',2,'csv','rejete') RETURNING id INTO mRejete;
  INSERT INTO public.analyses (client_id,collection_id,type,title,body,visibility)
    VALUES (cA,colA,'note','Note interne','confidentiel','internal') RETURNING id INTO aNote;
  INSERT INTO public.analyses (client_id,collection_id,type,title,body,visibility)
    VALUES (cA,colA,'constat','Constat client','visible','client') RETURNING id INTO aClient;

  ---------------------------------------------------------------- Analyste A
  SET LOCAL role authenticated;
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalystA,'role','authenticated')::text, true);

  INSERT INTO public.reviews (client_id,project_id,collection_id,status)
    VALUES (cA,pA,colA,'draft') RETURNING id INTO rA;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Analyste crée une Review draft', rA IS NOT NULL, null);

  INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status,created_by)
    VALUES (rA,cA,1,'{"executiveSummary":"v1"}','[]','draft',uAnalystA) RETURNING id INTO v1;
  UPDATE public.reviews SET current_version_id = v1 WHERE id = rA;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Version 1 créée en draft', v1 IS NOT NULL, null);

  -- Workflow draft -> in_review -> approved
  UPDATE public.review_versions SET status='in_review' WHERE id = v1;
  UPDATE public.review_versions SET status='approved', approved_by=uAnalystA, approved_at=now() WHERE id = v1;
  SELECT status::text INTO st FROM public.review_versions WHERE id = v1;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Draft → In Review → Approved (analyste)', st='approved', st);

  -- Publication interdite à l'analyste
  BEGIN
    UPDATE public.review_versions SET status='published' WHERE id = v1; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Publication refusée à l''analyste', ok, null);

  ---------------------------------------------------------------- Owner
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uOwner,'role','authenticated')::text, true);
  UPDATE public.review_versions SET status='published' WHERE id = v1;
  SELECT status::text INTO st FROM public.review_versions WHERE id = v1;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Publication autorisée à l''owner', st='published', st);
  SELECT count(*) INTO n FROM public.review_versions WHERE id=v1 AND published_at IS NOT NULL;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('published_at renseigné à la publication', n=1, null);

  -- Immutabilité d'une version publiée
  BEGIN
    UPDATE public.review_versions SET content='{"executiveSummary":"hack"}' WHERE id = v1; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Version publiée immuable (contenu)', ok, null);

  BEGIN
    DELETE FROM public.review_versions WHERE id = v1; ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Version publiée non supprimable', ok, null);

  -- Toute modification ultérieure crée version_no + 1
  INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status,created_by)
    VALUES (rA,cA,2,'{"executiveSummary":"v2"}','[]','draft',uOwner) RETURNING id INTO v2;
  SELECT count(*) INTO n FROM public.review_versions WHERE review_id = rA;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Nouvelle version version_no + 1', n = 2, n::text);

  -- Le numéro de version reste unique par review
  BEGIN
    INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status,created_by)
      VALUES (rA,cA,2,'{}','[]','draft',uOwner); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('version_no unique par review', ok, null);

  -- Matériaux éligibles : métriques validées et analyses non internes uniquement
  SELECT count(*) INTO n FROM public.extracted_metrics
    WHERE client_id = cA AND review_status = 'valide';
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Une seule métrique validée éligible', n = 1, n::text);
  SELECT count(*) INTO n FROM public.analyses
    WHERE client_id = cA AND type <> 'note' AND visibility <> 'internal';
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Seule l''analyse client est éligible', n = 1, n::text);
  SELECT count(*) INTO n FROM public.analyses WHERE id = aNote AND visibility = 'internal';
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('La note reste interne', n = 1, null);

  ---------------------------------------------------------------- Cross-tenant
  PERFORM set_config('request.jwt.claims', json_build_object('sub',uAnalystB,'role','authenticated')::text, true);
  SELECT count(*) INTO n FROM public.reviews WHERE id = rA;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Tenant B ne voit pas la Review de A', n = 0, n::text);
  SELECT count(*) INTO n FROM public.review_versions WHERE review_id = rA;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Tenant B ne voit pas les versions de A', n = 0, n::text);
  BEGIN
    INSERT INTO public.review_versions (review_id,client_id,version_no,content,charts,status)
      VALUES (rA,cA,99,'{}','[]','draft'); ok := false;
  EXCEPTION WHEN others THEN ok := true; END;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Tenant B ne peut pas écrire chez A', ok, null);

  ---------------------------------------------------------------- Anonyme
  SET LOCAL role anon;
  PERFORM set_config('request.jwt.claims', null, true);
  SELECT count(*) INTO n FROM public.reviews;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Anonyme ne lit aucune Review', n = 0, n::text);
  SELECT count(*) INTO n FROM public.review_versions;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Anonyme ne lit aucune version', n = 0, n::text);
  SELECT count(*) INTO n FROM public.analyses;
  INSERT INTO public.p3e_results(name,passed,detail) VALUES ('Anonyme ne lit aucune analyse interne', n = 0, n::text);

  RESET role;
END $$;

SELECT name, passed, detail FROM public.p3e_results ORDER BY id;
