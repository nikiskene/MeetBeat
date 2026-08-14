-- Production automation for scheduled broadcasts and the Daily Beat lifecycle.
-- All schedulers are database-native, idempotent, retryable and observable.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE TABLE public.ops_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  invocation_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  processed_count integer NOT NULL DEFAULT 0,
  succeeded_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text
);

ALTER TABLE public.ops_automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins inspect automation runs"
  ON public.ops_automation_runs FOR SELECT TO authenticated
  USING (public.is_super_admin());

ALTER TABLE public.ops_broadcast_deliveries
  ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  ADD COLUMN locked_at timestamptz,
  ADD COLUMN locked_by text,
  ADD COLUMN external_delivery_id text;

ALTER TABLE public.daily_beat_ops_jobs
  DROP CONSTRAINT daily_beat_ops_jobs_job_type_check,
  ADD CONSTRAINT daily_beat_ops_jobs_job_type_check
    CHECK (job_type IN ('generate_daily', 'regenerate_member', 'rerun_failed', 'refresh_diagnostics')),
  ALTER COLUMN requested_by DROP NOT NULL,
  ADD COLUMN target_date date,
  ADD COLUMN attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN locked_at timestamptz,
  ADD COLUMN locked_by text,
  ADD COLUMN request_source text NOT NULL DEFAULT 'operator'
    CHECK (request_source IN ('operator', 'scheduler'));

UPDATE public.daily_beat_ops_jobs
SET target_date = created_at::date
WHERE target_date IS NULL;

CREATE UNIQUE INDEX daily_beat_ops_jobs_daily_member_idx
  ON public.daily_beat_ops_jobs(job_type, target_member_id, target_date)
  WHERE job_type = 'generate_daily';
CREATE INDEX ops_broadcasts_schedule_idx
  ON public.ops_broadcasts(scheduled_at, id)
  WHERE status = 'scheduled';
DROP INDEX IF EXISTS public.ops_broadcast_deliveries_queue_idx;
CREATE INDEX ops_broadcast_deliveries_due_idx
  ON public.ops_broadcast_deliveries(next_attempt_at, queued_at)
  WHERE status IN ('queued', 'processing');
CREATE INDEX daily_beat_ops_jobs_due_idx
  ON public.daily_beat_ops_jobs(next_attempt_at, created_at)
  WHERE status IN ('queued', 'running', 'failed');
CREATE INDEX ops_automation_runs_recent_idx
  ON public.ops_automation_runs(job_name, started_at DESC);
CREATE INDEX profiles_active_eligible_idx
  ON public.profiles(last_active_at DESC)
  WHERE is_banned = false;

CREATE OR REPLACE FUNCTION public.process_scheduled_ops_broadcasts(p_limit integer DEFAULT 25)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_run_id uuid;
  v_broadcast record;
  v_processed integer := 0;
  v_queued integer := 0;
  v_count integer;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtextextended('beat:scheduled-broadcasts', 0)) THEN
    RETURN jsonb_build_object('status', 'already_running', 'processed', 0, 'queued_deliveries', 0);
  END IF;

  INSERT INTO public.ops_automation_runs(job_name, status)
  VALUES ('scheduled_broadcasts', 'running') RETURNING id INTO v_run_id;

  FOR v_broadcast IN
    SELECT * FROM public.ops_broadcasts
    WHERE status = 'scheduled' AND scheduled_at <= now()
    ORDER BY scheduled_at, id
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 25), 100))
  LOOP
    INSERT INTO public.ops_broadcast_deliveries(broadcast_id, member_id)
    SELECT v_broadcast.id, p.id
    FROM public.profiles p
    WHERE NOT p.is_banned
      AND CASE v_broadcast.audience
        WHEN 'verified' THEN p.is_verified
        WHEN 'recently_active' THEN p.last_active_at >= now() - interval '30 days'
        ELSE true
      END
    ON CONFLICT (broadcast_id, member_id) DO NOTHING;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    UPDATE public.ops_broadcasts
    SET status = 'published', published_at = now(), updated_at = now()
    WHERE id = v_broadcast.id;

    PERFORM public.log_ops_event(
      'broadcast.scheduled_published', 'broadcast', NULL, 'system', 'broadcast',
      v_broadcast.id, NULL, NULL, 'info', 'Scheduled broadcast published',
      jsonb_build_object('queued_deliveries', v_count, 'scheduled_at', v_broadcast.scheduled_at)
    );
    v_processed := v_processed + 1;
    v_queued := v_queued + v_count;
  END LOOP;

  UPDATE public.ops_automation_runs
  SET status = 'succeeded', finished_at = now(), processed_count = v_processed,
      succeeded_count = v_processed,
      details = jsonb_build_object('queued_deliveries', v_queued)
  WHERE id = v_run_id;
  RETURN jsonb_build_object('status', 'succeeded', 'processed', v_processed, 'queued_deliveries', v_queued);
EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    UPDATE public.ops_automation_runs
    SET status = 'failed', finished_at = now(), error_message = SQLERRM
    WHERE id = v_run_id;
  END IF;
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.recover_stale_ops_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v_deliveries integer; v_beats integer;
BEGIN
  UPDATE public.ops_broadcast_deliveries
  SET status = 'queued', locked_at = NULL, locked_by = NULL,
      next_attempt_at = now(), last_error = 'Worker lock expired', updated_at = now()
  WHERE status = 'processing' AND locked_at < now() - interval '15 minutes';
  GET DIAGNOSTICS v_deliveries = ROW_COUNT;

  UPDATE public.daily_beat_ops_jobs
  SET status = 'queued', locked_at = NULL, locked_by = NULL,
      next_attempt_at = now(), error_message = 'Worker lock expired'
  WHERE status = 'running' AND locked_at < now() - interval '15 minutes';
  GET DIAGNOSTICS v_beats = ROW_COUNT;

  IF v_deliveries + v_beats > 0 THEN
    PERFORM public.log_ops_event(
      'automation.stale_locks_recovered', 'automation', NULL, 'system', 'automation',
      NULL, NULL, NULL, 'warning', 'Stale automation locks recovered',
      jsonb_build_object('broadcast_deliveries', v_deliveries, 'daily_beat_jobs', v_beats)
    );
  END IF;
  RETURN jsonb_build_object('broadcast_deliveries', v_deliveries, 'daily_beat_jobs', v_beats);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_ops_broadcast_deliveries(
  p_worker_id text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  delivery_id uuid,
  broadcast_id uuid,
  member_id uuid,
  title text,
  body text,
  audience text,
  attempt integer,
  idempotency_key text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public
AS $$
  WITH claimed AS (
    SELECT d.id
    FROM public.ops_broadcast_deliveries d
    WHERE d.status = 'queued'
      AND d.next_attempt_at <= now()
      AND d.attempts < d.max_attempts
    ORDER BY d.next_attempt_at, d.queued_at, d.id
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 100), 500))
  ), updated AS (
    UPDATE public.ops_broadcast_deliveries d
    SET status = 'processing', attempts = d.attempts + 1,
        locked_at = now(), locked_by = nullif(btrim(p_worker_id), ''), updated_at = now()
    FROM claimed c
    WHERE d.id = c.id
    RETURNING d.*
  )
  SELECT u.id, u.broadcast_id, u.member_id, b.title, b.body, b.audience,
         u.attempts, u.broadcast_id::text || ':' || u.member_id::text
  FROM updated u
  JOIN public.ops_broadcasts b ON b.id = u.broadcast_id
  ORDER BY u.queued_at, u.id;
$$;

CREATE OR REPLACE FUNCTION public.complete_ops_broadcast_delivery(
  p_delivery_id uuid,
  p_success boolean,
  p_external_delivery_id text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v_row public.ops_broadcast_deliveries%ROWTYPE; v_terminal boolean;
BEGIN
  SELECT * INTO v_row FROM public.ops_broadcast_deliveries
  WHERE id = p_delivery_id FOR UPDATE;
  IF NOT FOUND OR v_row.status <> 'processing' THEN
    RAISE EXCEPTION 'Delivery is not currently claimed';
  END IF;

  v_terminal := NOT p_success AND v_row.attempts >= v_row.max_attempts;
  UPDATE public.ops_broadcast_deliveries
  SET status = CASE WHEN p_success THEN 'delivered' WHEN v_terminal THEN 'failed' ELSE 'queued' END,
      delivered_at = CASE WHEN p_success THEN now() ELSE NULL END,
      external_delivery_id = CASE WHEN p_success THEN nullif(btrim(p_external_delivery_id), '') ELSE external_delivery_id END,
      last_error = CASE WHEN p_success THEN NULL ELSE left(coalesce(p_error, 'Delivery failed'), 1000) END,
      next_attempt_at = CASE WHEN p_success OR v_terminal THEN next_attempt_at
        ELSE now() + make_interval(secs => least(3600, 30 * (2 ^ greatest(0, attempts - 1))::integer)) END,
      locked_at = NULL, locked_by = NULL, updated_at = now()
  WHERE id = p_delivery_id;

  IF v_terminal THEN
    PERFORM public.log_ops_event(
      'broadcast.delivery_failed', 'broadcast', NULL, 'system', 'broadcast_delivery',
      p_delivery_id, NULL, v_row.member_id, 'error', 'Broadcast delivery exhausted retries',
      jsonb_build_object('broadcast_id', v_row.broadcast_id, 'attempts', v_row.attempts, 'error', p_error)
    );
  END IF;
  RETURN jsonb_build_object('delivery_id', p_delivery_id, 'success', p_success,
    'terminal', v_terminal, 'attempts', v_row.attempts);
END;
$$;

CREATE OR REPLACE FUNCTION public.run_daily_beat_automation(p_limit integer DEFAULT 500)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_run_id uuid;
  v_job record;
  v_beat_id uuid;
  v_enqueued integer := 0;
  v_processed integer := 0;
  v_succeeded integer := 0;
  v_failed integer := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtextextended('beat:daily-generation:' || current_date::text, 0)) THEN
    RETURN jsonb_build_object('status', 'already_running', 'date', current_date);
  END IF;

  INSERT INTO public.ops_automation_runs(job_name, status, details)
  VALUES ('daily_beat_generation', 'running', jsonb_build_object('date', current_date))
  RETURNING id INTO v_run_id;

  INSERT INTO public.daily_beat_ops_jobs(
    job_type, target_member_id, target_date, status, requested_by, request_source
  )
  SELECT 'generate_daily', p.id, current_date, 'queued', NULL, 'scheduler'
  FROM public.profiles p
  WHERE NOT p.is_banned
  ON CONFLICT (job_type, target_member_id, target_date)
    WHERE job_type = 'generate_daily' DO NOTHING;
  GET DIAGNOSTICS v_enqueued = ROW_COUNT;

  FOR v_job IN
    SELECT * FROM public.daily_beat_ops_jobs
    WHERE job_type = 'generate_daily'
      AND target_date = current_date
      AND status IN ('queued', 'failed')
      AND attempts < max_attempts
      AND next_attempt_at <= now()
    ORDER BY next_attempt_at, created_at, id
    FOR UPDATE SKIP LOCKED
    LIMIT greatest(1, least(coalesce(p_limit, 500), 2000))
  LOOP
    UPDATE public.daily_beat_ops_jobs
    SET status = 'running', attempts = attempts + 1, started_at = coalesce(started_at, now()),
        locked_at = now(), locked_by = 'pg_cron', error_message = NULL
    WHERE id = v_job.id;
    v_processed := v_processed + 1;
    BEGIN
      v_beat_id := public.create_daily_beat_for_user(v_job.target_member_id);
      UPDATE public.daily_beat_ops_jobs
      SET status = 'succeeded', result = jsonb_build_object(
            'beat_id', v_beat_id, 'candidate_found', v_beat_id IS NOT NULL, 'date', current_date),
          finished_at = now(), locked_at = NULL, locked_by = NULL
      WHERE id = v_job.id;
      v_succeeded := v_succeeded + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.daily_beat_ops_jobs
      SET status = 'failed', error_message = left(SQLERRM, 1000),
          next_attempt_at = now() + make_interval(secs => least(21600, 60 * (2 ^ greatest(0, attempts - 1))::integer)),
          finished_at = CASE WHEN attempts >= max_attempts THEN now() ELSE NULL END,
          locked_at = NULL, locked_by = NULL
      WHERE id = v_job.id;
      v_failed := v_failed + 1;
    END;
  END LOOP;

  UPDATE public.ops_automation_runs
  SET status = CASE WHEN v_failed > 0 THEN 'failed' ELSE 'succeeded' END,
      finished_at = now(), processed_count = v_processed,
      succeeded_count = v_succeeded, failed_count = v_failed,
      details = details || jsonb_build_object('enqueued', v_enqueued)
  WHERE id = v_run_id;

  IF v_failed > 0 THEN
    PERFORM public.log_ops_event(
      'daily_beat.automation_partial_failure', 'daily_beat', NULL, 'system', 'daily_beat_jobs',
      v_run_id, NULL, NULL, 'error', 'Daily Beat automation had failures',
      jsonb_build_object('processed', v_processed, 'succeeded', v_succeeded, 'failed', v_failed)
    );
  END IF;
  RETURN jsonb_build_object('status', CASE WHEN v_failed > 0 THEN 'partial_failure' ELSE 'succeeded' END,
    'date', current_date, 'enqueued', v_enqueued, 'processed', v_processed,
    'succeeded', v_succeeded, 'failed', v_failed);
EXCEPTION WHEN OTHERS THEN
  IF v_run_id IS NOT NULL THEN
    UPDATE public.ops_automation_runs
    SET status = 'failed', finished_at = now(), error_message = SQLERRM
    WHERE id = v_run_id;
  END IF;
  RAISE;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_ops_automation_history()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE v_runs integer; v_jobs integer; v_deliveries integer;
BEGIN
  DELETE FROM public.ops_automation_runs
  WHERE finished_at < now() - interval '90 days' AND status = 'succeeded';
  GET DIAGNOSTICS v_runs = ROW_COUNT;
  DELETE FROM public.daily_beat_ops_jobs
  WHERE finished_at < now() - interval '90 days' AND status IN ('succeeded', 'cancelled');
  GET DIAGNOSTICS v_jobs = ROW_COUNT;
  DELETE FROM public.ops_broadcast_deliveries
  WHERE delivered_at < now() - interval '90 days' AND status = 'delivered';
  GET DIAGNOSTICS v_deliveries = ROW_COUNT;
  RETURN jsonb_build_object('automation_runs', v_runs, 'daily_beat_jobs', v_jobs,
    'broadcast_deliveries', v_deliveries);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ops_automation_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN jsonb_build_object(
    'generated_at', now(),
    'running', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY started_at DESC), '[]'::jsonb)
      FROM (SELECT id, job_name, started_at, details FROM public.ops_automation_runs
            WHERE status = 'running' ORDER BY started_at DESC LIMIT 20) r),
    'recent_failures', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY started_at DESC), '[]'::jsonb)
      FROM (SELECT id, job_name, started_at, finished_at, failed_count, error_message, details
            FROM public.ops_automation_runs WHERE status = 'failed'
            ORDER BY started_at DESC LIMIT 25) r),
    'broadcasts', jsonb_build_object(
      'scheduled', (SELECT count(*) FROM public.ops_broadcasts WHERE status = 'scheduled'),
      'overdue', (SELECT count(*) FROM public.ops_broadcasts WHERE status = 'scheduled' AND scheduled_at <= now()),
      'queued', (SELECT count(*) FROM public.ops_broadcast_deliveries WHERE status = 'queued'),
      'processing', (SELECT count(*) FROM public.ops_broadcast_deliveries WHERE status = 'processing'),
      'terminal_failures', (SELECT count(*) FROM public.ops_broadcast_deliveries WHERE status = 'failed')),
    'daily_beat', jsonb_build_object(
      'today', (SELECT count(*) FROM public.daily_beats WHERE active_date = current_date),
      'eligible_members', (SELECT count(*) FROM public.profiles WHERE NOT is_banned),
      'queued', (SELECT count(*) FROM public.daily_beat_ops_jobs WHERE status = 'queued'),
      'running', (SELECT count(*) FROM public.daily_beat_ops_jobs WHERE status = 'running'),
      'retryable_failures', (SELECT count(*) FROM public.daily_beat_ops_jobs
        WHERE status = 'failed' AND attempts < max_attempts),
      'terminal_failures', (SELECT count(*) FROM public.daily_beat_ops_jobs
        WHERE status = 'failed' AND attempts >= max_attempts)),
    'recent_runs', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY started_at DESC), '[]'::jsonb)
      FROM (SELECT id, job_name, status, started_at, finished_at, processed_count,
                   succeeded_count, failed_count, details, error_message
            FROM public.ops_automation_runs ORDER BY started_at DESC LIMIT 50) r));
END;
$$;

REVOKE ALL ON TABLE public.ops_automation_runs FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.ops_automation_runs TO authenticated;

REVOKE ALL ON FUNCTION public.process_scheduled_ops_broadcasts(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.recover_stale_ops_jobs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_ops_broadcast_deliveries(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_ops_broadcast_delivery(uuid, boolean, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.run_daily_beat_automation(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_ops_automation_history() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ops_automation_status() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.process_scheduled_ops_broadcasts(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.recover_stale_ops_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_ops_broadcast_deliveries(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_ops_broadcast_delivery(uuid, boolean, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_daily_beat_automation(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_ops_automation_history() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ops_automation_status() TO authenticated;

DO $$
DECLARE v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname IN (
      'beat-scheduled-broadcasts', 'beat-stale-lock-recovery',
      'beat-daily-generation', 'beat-daily-retries', 'beat-automation-cleanup'
    )
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'beat-scheduled-broadcasts', '* * * * *',
  'SELECT public.process_scheduled_ops_broadcasts(25);'
);
SELECT cron.schedule(
  'beat-stale-lock-recovery', '*/5 * * * *',
  'SELECT public.recover_stale_ops_jobs();'
);
SELECT cron.schedule(
  'beat-daily-generation', '5 0 * * *',
  'SELECT public.run_daily_beat_automation(2000);'
);
SELECT cron.schedule(
  'beat-daily-retries', '*/15 * * * *',
  'SELECT public.run_daily_beat_automation(500);'
);
SELECT cron.schedule(
  'beat-automation-cleanup', '30 3 * * *',
  'SELECT public.cleanup_ops_automation_history();'
);
