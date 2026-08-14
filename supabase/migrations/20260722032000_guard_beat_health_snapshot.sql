CREATE OR REPLACE FUNCTION public.get_beat_health_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb := '[]'::jsonb;
  today_count integer := 0;
  legal_count integer := 0;
  webhook_count integer := 0;
  message_count integer := 0;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  result := result || jsonb_build_array(jsonb_build_object(
    'feature', 'Profiles',
    'status', CASE WHEN to_regclass('public.profiles') IS NOT NULL THEN 'green' ELSE 'red' END,
    'message', CASE WHEN to_regclass('public.profiles') IS NOT NULL THEN 'Profiles table available' ELSE 'Profiles table missing' END,
    'checked_at', now()
  ));

  result := result || jsonb_build_array(jsonb_build_object(
    'feature', 'Photos',
    'status', CASE WHEN to_regclass('public.photos') IS NOT NULL THEN 'green' ELSE 'red' END,
    'message', CASE WHEN to_regclass('public.photos') IS NOT NULL THEN 'Photos table available' ELSE 'Photos table missing' END,
    'checked_at', now()
  ));

  IF to_regclass('public.daily_beats') IS NOT NULL THEN
    EXECUTE 'select count(*) from public.daily_beats where created_at::date = current_date'
    INTO today_count;

    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Daily Beats',
      'status', CASE WHEN today_count > 0 THEN 'green' ELSE 'orange' END,
      'message', CASE WHEN today_count > 0 THEN today_count || ' daily beat records today' ELSE 'No daily beats generated today' END,
      'checked_at', now()
    ));
  ELSE
    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Daily Beats',
      'status', 'red',
      'message', 'daily_beats table missing',
      'checked_at', now()
    ));
  END IF;

  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'select count(*) from public.messages where created_at > now() - interval ''24 hours'''
    INTO message_count;

    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Messaging',
      'status', CASE WHEN message_count > 0 THEN 'green' ELSE 'orange' END,
      'message', CASE WHEN message_count > 0 THEN message_count || ' messages in last 24h' ELSE 'No messages in last 24h' END,
      'checked_at', now()
    ));
  ELSE
    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Messaging',
      'status', 'red',
      'message', 'messages table missing',
      'checked_at', now()
    ));
  END IF;

  IF to_regclass('public.legal_documents') IS NOT NULL THEN
    EXECUTE 'select count(*) from public.legal_documents'
    INTO legal_count;

    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Legal',
      'status', CASE WHEN legal_count > 0 THEN 'green' ELSE 'orange' END,
      'message', CASE WHEN legal_count > 0 THEN legal_count || ' legal documents available' ELSE 'No legal documents found' END,
      'checked_at', now()
    ));
  ELSE
    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Legal',
      'status', 'red',
      'message', 'legal_documents table missing',
      'checked_at', now()
    ));
  END IF;

  result := result || jsonb_build_array(jsonb_build_object(
    'feature', 'Beat Ops',
    'status', CASE WHEN to_regclass('public.ops_cases') IS NOT NULL THEN 'green' ELSE 'red' END,
    'message', CASE WHEN to_regclass('public.ops_cases') IS NOT NULL THEN 'Ops cases table available' ELSE 'ops_cases table missing' END,
    'checked_at', now()
  ));

  IF to_regclass('public.payment_events') IS NOT NULL THEN
    EXECUTE 'select count(*) from public.payment_events where created_at > now() - interval ''7 days'''
    INTO webhook_count;

    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Payments',
      'status', CASE WHEN webhook_count > 0 THEN 'green' ELSE 'orange' END,
      'message', CASE WHEN webhook_count > 0 THEN webhook_count || ' payment events in last 7 days' ELSE 'No payment events in last 7 days' END,
      'checked_at', now()
    ));
  ELSE
    result := result || jsonb_build_array(jsonb_build_object(
      'feature', 'Payments',
      'status', 'red',
      'message', 'payment_events table missing',
      'checked_at', now()
    ));
  END IF;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_beat_health_snapshot() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_beat_health_snapshot() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_beat_health_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_beat_health_snapshot() TO service_role;
