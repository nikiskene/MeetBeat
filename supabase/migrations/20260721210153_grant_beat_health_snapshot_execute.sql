-- Allow the anon-key frontend client (and signed-in users) to call the
-- existing SECURITY DEFINER health snapshot RPC. The function definition
-- and schema are unchanged; this only adjusts EXECUTE permissions.
GRANT EXECUTE ON FUNCTION public.get_beat_health_snapshot() TO anon, authenticated;
