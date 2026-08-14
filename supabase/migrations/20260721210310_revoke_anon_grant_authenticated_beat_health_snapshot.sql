-- Revoke anonymous execution; keep authenticated access for signed-in users.
REVOKE EXECUTE ON FUNCTION public.get_beat_health_snapshot() FROM anon;
-- Ensure authenticated users can call it. (service_role/postgres retain existing access.)
GRANT EXECUTE ON FUNCTION public.get_beat_health_snapshot() TO authenticated;
