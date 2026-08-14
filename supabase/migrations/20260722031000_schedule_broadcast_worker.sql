-- Invoke the deployed broadcast worker once per minute when its two runtime
-- secrets have been provisioned in Supabase Vault. Secret values are never
-- stored in migrations.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
DECLARE
  v_job_id bigint;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'beat-broadcast-delivery-worker'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;

  IF EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'beat_edge_anon_key')
     AND EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'beat_broadcast_worker_secret') THEN
    PERFORM cron.schedule(
      'beat-broadcast-delivery-worker',
      '* * * * *',
      $command$
        SELECT net.http_post(
          url := 'https://iwvdnvryzyvvstahqqqu.supabase.co/functions/v1/process-broadcast-queue',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'beat_edge_anon_key'),
            'x-worker-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'beat_broadcast_worker_secret')
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 55000
        );
      $command$
    );
  END IF;
END;
$$;
