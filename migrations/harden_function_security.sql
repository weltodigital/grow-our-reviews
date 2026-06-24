-- Resolve Supabase Security Advisor WARNINGS:
--   (1) function_search_path_mutable  - 16 functions with an unset search_path
--   (2) anon/authenticated_security_definer_function_executable - 7 SECURITY
--       DEFINER functions callable through the public REST API
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- (1) Pin a fixed search_path on every function in the public schema.
--
-- An unset search_path means the function resolves object names using the
-- CALLER's search_path, which a malicious caller can manipulate. Pinning it to
-- a fixed value closes that.
--
-- We use `public, extensions` (NOT just `public`) on purpose: generate_review_token()
-- calls gen_random_bytes() from the pgcrypto extension, which lives in the
-- `extensions` schema on Supabase. A bare `public` search_path would break
-- review-token creation. pg_catalog is always searched implicitly, so built-ins
-- (now(), encode(), count(), ...) keep working. Listing a schema that doesn't
-- exist is harmless, so this is safe whichever schema pgcrypto sits in.
--
-- Looping over pg_proc with oid::regprocedure builds the exact signature for
-- each function automatically, so overloads and trigger functions are handled
-- without hand-writing argument lists.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'          -- plain functions only (skip aggregates/procs)
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, extensions', r.sig);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- (2) Stop the public API roles (anon, authenticated) from calling internal
-- SECURITY DEFINER functions. These run as their owner (elevated privileges)
-- and are only ever invoked by server-side code using the service-role key, so
-- nobody should be able to hit them via /rest/v1/rpc/*. We revoke from PUBLIC
-- (the implicit default grant) plus the two API roles, then re-grant to
-- service_role so the app keeps working.
DO $$
DECLARE
  fn TEXT;
  fns TEXT[] := ARRAY[
    'public.analyze_risk_patterns(integer)',
    'public.calculate_bulk_upload_risk_score(uuid, integer, numeric, integer)',
    'public.get_abuse_summary_stats(integer)',
    'public.get_top_risk_users(integer)',
    'public.get_user_risk_timeline(uuid, integer)',
    'public.increment_health_metric(text, integer)',
    'public.user_has_active_restriction(uuid, character varying)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
