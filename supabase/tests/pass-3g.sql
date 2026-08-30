-- Pass 3G — Durcissement production : rate limiting, rétention, effacement RGPD.
-- Exécution : les assertions lèvent une exception au premier échec.
DO $$
DECLARE
  ok boolean;
  n integer;
  c uuid;
  p uuid;
  t uuid;
  col uuid;
  sub uuid;
  passed integer := 0;

  PROCEDURE_NAME text := 'pass-3g';
BEGIN
  -- 1. Le compteur autorise sous la limite puis refuse au-dessus.
  FOR n IN 1..3 LOOP
    ok := public.consume_rate_limit('test_bucket', 'subject-a', 3, 60);
    IF NOT ok THEN RAISE EXCEPTION 'rate limit refusé trop tôt (%)', n; END IF;
  END LOOP;
  passed := passed + 1;

  ok := public.consume_rate_limit('test_bucket', 'subject-a', 3, 60);
  IF ok THEN RAISE EXCEPTION 'rate limit non appliqué au-delà de la limite'; END IF;
  passed := passed + 1;

  -- 2. Le compteur est cloisonné par sujet.
  ok := public.consume_rate_limit('test_bucket', 'subject-b', 3, 60);
  IF NOT ok THEN RAISE EXCEPTION 'rate limit fuit entre sujets'; END IF;
  passed := passed + 1;

  DELETE FROM public.rate_limits WHERE bucket = 'test_bucket';

  -- 3. Purge des compteurs anciens.
  INSERT INTO public.rate_limits (bucket, subject_hash, window_start, hits)
  VALUES ('test_bucket', 'old', now() - interval '3 days', 1);
  n := public.purge_rate_limits(24);
  IF n < 1 THEN RAISE EXCEPTION 'purge_rate_limits inopérante'; END IF;
  passed := passed + 1;

  -- 4. Jeu de données isolé pour la rétention et l'effacement.
  INSERT INTO public.clients (slug, name, brand, theme_tokens, is_demo)
  VALUES ('pass3g-' || substr(gen_random_uuid()::text, 1, 8), 'Pass3G', '{}', '{}', true)
  RETURNING id INTO c;
  INSERT INTO public.projects (client_id, name, status) VALUES (c, 'P', 'active') RETURNING id INTO p;
  INSERT INTO public.collection_templates (client_id, version, schema) VALUES (c, 1, '{}') RETURNING id INTO t;
  INSERT INTO public.collections (client_id, project_id, template_id, template_version, status)
  VALUES (c, p, t, 1, 'open') RETURNING id INTO col;
  INSERT INTO public.submissions (collection_id, client_id, status) VALUES (col, c, 'working') RETURNING id INTO sub;
  INSERT INTO public.answers (submission_id, collection_id, client_id, question_key, value)
  VALUES (sub, col, c, 'yt.mode', '"export"');
  INSERT INTO public.files (submission_id, collection_id, client_id, slot_key, storage_path, original_name, mime, size_bytes)
  VALUES (sub, col, c, 'yt.export', c || '/x.csv', 'x.csv', 'text/csv', 10);
  UPDATE public.submissions SET status = 'submitted' WHERE id = sub;

  -- 5. La submission soumise reste immuable avant effacement.
  BEGIN
    DELETE FROM public.submissions WHERE id = sub;
    RAISE EXCEPTION 'submission soumise supprimable : immuabilité cassée';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM LIKE '%immuabilité cassée%' THEN RAISE; END IF;
  END;
  passed := passed + 1;

  -- 6. Purge des sessions expirées.
  INSERT INTO public.secure_links (client_id, scope, target_id, token_hash, expires_at)
  VALUES (c, 'collection', col, 'hash-pass3g', now() + interval '1 day');
  INSERT INTO public.link_sessions (secure_link_id, client_id, session_token_hash, expires_at)
  SELECT id, c, 'sess-pass3g', now() - interval '30 days' FROM public.secure_links WHERE token_hash = 'hash-pass3g';
  n := public.purge_expired_sessions(7);
  IF n < 1 THEN RAISE EXCEPTION 'purge_expired_sessions inopérante'; END IF;
  passed := passed + 1;

  -- 7. Effacement RGPD complet malgré les triggers d'immuabilité.
  PERFORM public.erase_client_data(c, true);
  IF EXISTS (SELECT 1 FROM public.submissions WHERE client_id = c)
     OR EXISTS (SELECT 1 FROM public.answers WHERE client_id = c)
     OR EXISTS (SELECT 1 FROM public.files WHERE client_id = c)
     OR EXISTS (SELECT 1 FROM public.clients WHERE id = c) THEN
    RAISE EXCEPTION 'effacement RGPD incomplet';
  END IF;
  passed := passed + 1;

  -- 8. Trace d'audit d'effacement conservée (anonymisée : client_id nul).
  IF NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE action = 'gdpr.erasure' AND entity_id = c) THEN
    RAISE EXCEPTION 'trace d''effacement manquante';
  END IF;
  passed := passed + 1;

  -- 9. Les triggers d'immuabilité sont bien réarmés après l'effacement.
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_submissions_immutable' AND tgenabled <> 'D'
  ) THEN
    RAISE EXCEPTION 'trigger d''immuabilité laissé désactivé';
  END IF;
  passed := passed + 1;

  -- 10. rate_limits reste inaccessible aux rôles clients (aucune policy).
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rate_limits') THEN
    RAISE EXCEPTION 'rate_limits ne doit exposer aucune policy';
  END IF;
  passed := passed + 1;

  RAISE NOTICE '% : % assertions passées', PROCEDURE_NAME, passed;
END $$;
