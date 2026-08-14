-- legal_documents has a public-read policy that calls is_legal_admin().
-- PostgreSQL evaluates every policy expression, so public reads fail unless
-- the caller can execute this boolean guard. The function itself remains the
-- authority for deciding whether the caller is an administrator.

DO $$
BEGIN
  IF to_regprocedure('public.is_legal_admin()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.is_legal_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION public.is_legal_admin() TO anon, authenticated;
  END IF;
END
$$;
