-- Complete the production Operations Center using the existing admin helper,
-- audit log, member, moderation, messaging and Daily Beat structures.

-- Photo moderation. Existing rows remain approved; new uploads enter pending.
ALTER TABLE public.profile_photos
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
  ADD COLUMN moderated_by uuid REFERENCES auth.users(id),
  ADD COLUMN moderated_at timestamptz,
  ADD COLUMN moderation_reason text;
ALTER TABLE public.profile_photos ALTER COLUMN moderation_status SET DEFAULT 'pending';

ALTER TABLE public.photos
  ADD COLUMN moderation_status text NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'hidden')),
  ADD COLUMN moderated_by uuid REFERENCES auth.users(id),
  ADD COLUMN moderated_at timestamptz,
  ADD COLUMN moderation_reason text;
ALTER TABLE public.photos ALTER COLUMN moderation_status SET DEFAULT 'pending';

DROP POLICY IF EXISTS "Users can read profile photos" ON public.profile_photos;
CREATE POLICY "Members can read approved or own profile photos"
  ON public.profile_photos FOR SELECT TO public
  USING (moderation_status = 'approved' OR auth.uid() = user_id);
CREATE POLICY "Admins can read all profile photos"
  ON public.profile_photos FOR SELECT TO authenticated
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Photos are viewable by everyone" ON public.photos;
CREATE POLICY "Members can read approved or own photos"
  ON public.photos FOR SELECT TO public
  USING ((moderation_status = 'approved' OR auth.uid() = user_id)
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = photos.user_id AND p.is_banned = false));
CREATE POLICY "Admins can read all photos"
  ON public.photos FOR SELECT TO authenticated
  USING (public.is_super_admin());

CREATE OR REPLACE FUNCTION public.enforce_photo_moderation_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF public.is_super_admin() THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.moderation_status := 'pending';
    NEW.moderated_by := NULL;
    NEW.moderated_at := NULL;
    NEW.moderation_reason := NULL;
  ELSIF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderated_by IS DISTINCT FROM OLD.moderated_by
     OR NEW.moderated_at IS DISTINCT FROM OLD.moderated_at
     OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason THEN
    RAISE EXCEPTION 'Photo moderation fields are operator-managed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_enforce_profile_photo_moderation BEFORE INSERT OR UPDATE ON public.profile_photos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_photo_moderation_fields();
CREATE TRIGGER trg_enforce_photo_moderation BEFORE INSERT OR UPDATE ON public.photos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_photo_moderation_fields();

-- Broadcast queue. Delivery is queued for a worker and never written into
-- member-to-member messages by the frontend.
CREATE TABLE public.ops_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 600),
  audience text NOT NULL CHECK (audience IN ('all_active', 'verified', 'recently_active')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ops_broadcast_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.ops_broadcasts(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'delivered', 'failed', 'cancelled')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  queued_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (broadcast_id, member_id)
);
CREATE INDEX ops_broadcast_deliveries_queue_idx ON public.ops_broadcast_deliveries(status, queued_at);

ALTER TABLE public.ops_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ops_broadcast_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage broadcasts" ON public.ops_broadcasts FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Admins inspect broadcast deliveries" ON public.ops_broadcast_deliveries FOR SELECT TO authenticated
  USING (public.is_super_admin());

-- Feature flags and persisted homepage slides.
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name ~ '^[a-z][a-z0-9_]*$'),
  description text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated members read feature flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage feature flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE TABLE public.homepage_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL UNIQUE,
  alt_text text NOT NULL DEFAULT '',
  position integer NOT NULL CHECK (position >= 0),
  visible boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX homepage_slides_position_idx ON public.homepage_slides(position);
ALTER TABLE public.homepage_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published homepage slides" ON public.homepage_slides FOR SELECT TO public
  USING (visible AND published);
CREATE POLICY "Admins manage homepage slides" ON public.homepage_slides FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

INSERT INTO public.homepage_slides(image_url, alt_text, position, visible, published)
VALUES
 ('https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Hero%201.png', 'BEAT homepage image 1', 0, true, true),
 ('https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Hero%202.png', 'BEAT homepage image 2', 1, true, true),
 ('https://iwvdnvryzyvvstahqqqu.supabase.co/storage/v1/object/public/Marketing/Hero%203.png', 'BEAT homepage image 3', 2, true, true)
ON CONFLICT (image_url) DO NOTHING;

-- Daily Beat operations queue/history.
CREATE TABLE public.daily_beat_ops_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL CHECK (job_type IN ('regenerate_member', 'rerun_failed', 'refresh_diagnostics')),
  target_member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);
CREATE INDEX daily_beat_ops_jobs_status_idx ON public.daily_beat_ops_jobs(status, created_at DESC);
ALTER TABLE public.daily_beat_ops_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins inspect Daily Beat jobs" ON public.daily_beat_ops_jobs FOR SELECT TO authenticated
  USING (public.is_super_admin());

ALTER TABLE public.ops_event_log
  ADD COLUMN reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN reviewed_at timestamptz;

CREATE OR REPLACE FUNCTION public.moderate_profile_photo(
  p_source text,
  p_photo_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_member uuid; v_previous text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_source NOT IN ('profile_photos','photos') THEN RAISE EXCEPTION 'Unsupported photo source'; END IF;
  IF p_status NOT IN ('pending','approved','rejected','hidden') THEN RAISE EXCEPTION 'Invalid moderation status'; END IF;
  IF p_status IN ('rejected','hidden') AND coalesce(btrim(p_reason),'') = '' THEN RAISE EXCEPTION 'A moderation reason is required'; END IF;
  IF p_source = 'profile_photos' THEN
    SELECT user_id, moderation_status INTO v_member, v_previous FROM public.profile_photos WHERE id=p_photo_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Photo not found'; END IF;
    UPDATE public.profile_photos SET moderation_status=p_status, moderated_by=auth.uid(), moderated_at=now(), moderation_reason=nullif(btrim(p_reason),'') WHERE id=p_photo_id;
  ELSE
    SELECT user_id, moderation_status INTO v_member, v_previous FROM public.photos WHERE id=p_photo_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Photo not found'; END IF;
    UPDATE public.photos SET moderation_status=p_status, moderated_by=auth.uid(), moderated_at=now(), moderation_reason=nullif(btrim(p_reason),'') WHERE id=p_photo_id;
  END IF;
  PERFORM public.log_ops_event('photo.'||p_status,'moderation',auth.uid(),NULL,'photo',p_photo_id,NULL,v_member,
    CASE WHEN p_status IN ('rejected','hidden') THEN 'warning' ELSE 'info' END,'Photo moderation decision recorded',
    jsonb_build_object('source',p_source,'previous_status',v_previous,'status',p_status,'reason',p_reason));
  RETURN jsonb_build_object('id',p_photo_id,'source',p_source,'status',p_status,'moderated_by',auth.uid(),'moderated_at',now());
END $$;

CREATE OR REPLACE FUNCTION public.create_ops_broadcast(p_title text, p_body text, p_audience text, p_scheduled_at timestamptz DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_id uuid; v_status text := CASE WHEN p_scheduled_at IS NULL THEN 'draft' ELSE 'scheduled' END;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_audience NOT IN ('all_active','verified','recently_active') THEN RAISE EXCEPTION 'Invalid audience'; END IF;
  IF coalesce(btrim(p_title),'')='' OR coalesce(btrim(p_body),'')='' THEN RAISE EXCEPTION 'Title and message are required'; END IF;
  IF p_scheduled_at IS NOT NULL AND p_scheduled_at <= now() THEN RAISE EXCEPTION 'Scheduled time must be in the future'; END IF;
  INSERT INTO public.ops_broadcasts(title,body,audience,status,scheduled_at,created_by,updated_by)
  VALUES (btrim(p_title),btrim(p_body),p_audience,v_status,p_scheduled_at,auth.uid(),auth.uid()) RETURNING id INTO v_id;
  PERFORM public.log_ops_event('broadcast.created','broadcast',auth.uid(),NULL,'broadcast',v_id,NULL,NULL,'info','Broadcast created',jsonb_build_object('audience',p_audience,'status',v_status,'scheduled_at',p_scheduled_at));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.publish_ops_broadcast(p_broadcast_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_row public.ops_broadcasts%ROWTYPE; v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO v_row FROM public.ops_broadcasts WHERE id=p_broadcast_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Broadcast not found'; END IF;
  IF v_row.status NOT IN ('draft','scheduled') THEN RAISE EXCEPTION 'Only draft or scheduled broadcasts can be published'; END IF;
  INSERT INTO public.ops_broadcast_deliveries(broadcast_id,member_id)
  SELECT v_row.id,p.id FROM public.profiles p
  WHERE NOT p.is_banned AND CASE v_row.audience WHEN 'verified' THEN p.is_verified WHEN 'recently_active' THEN p.last_active_at >= now()-interval '30 days' ELSE true END
  ON CONFLICT (broadcast_id,member_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  UPDATE public.ops_broadcasts SET status='published',published_at=now(),updated_at=now(),updated_by=auth.uid() WHERE id=v_row.id;
  PERFORM public.log_ops_event('broadcast.published','broadcast',auth.uid(),NULL,'broadcast',v_row.id,NULL,NULL,'info','Broadcast published and delivery queued',jsonb_build_object('audience',v_row.audience,'queued_deliveries',v_count));
  RETURN jsonb_build_object('id',v_row.id,'status','published','queued_deliveries',v_count,'published_at',now());
END $$;

CREATE OR REPLACE FUNCTION public.cancel_ops_broadcast(p_broadcast_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.ops_broadcasts SET status='cancelled',cancelled_at=now(),updated_at=now(),updated_by=auth.uid()
  WHERE id=p_broadcast_id AND status IN ('draft','scheduled');
  IF NOT FOUND THEN RAISE EXCEPTION 'Broadcast is not cancellable'; END IF;
  UPDATE public.ops_broadcast_deliveries SET status='cancelled',updated_at=now() WHERE broadcast_id=p_broadcast_id AND status='queued';
  PERFORM public.log_ops_event('broadcast.cancelled','broadcast',auth.uid(),NULL,'broadcast',p_broadcast_id,NULL,NULL,'warning','Broadcast cancelled','{}'::jsonb);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_feature_flag(p_name text,p_description text,p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_id uuid; v_previous boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_name !~ '^[a-z][a-z0-9_]*$' THEN RAISE EXCEPTION 'Flag name must use lowercase letters, numbers and underscores'; END IF;
  SELECT enabled INTO v_previous FROM public.feature_flags WHERE name=p_name FOR UPDATE;
  INSERT INTO public.feature_flags(name,description,enabled,updated_by)
  VALUES(p_name,coalesce(p_description,''),p_enabled,auth.uid())
  ON CONFLICT(name) DO UPDATE SET description=excluded.description,enabled=excluded.enabled,updated_by=auth.uid(),updated_at=now()
  RETURNING id INTO v_id;
  PERFORM public.log_ops_event('feature_flag.changed','configuration',auth.uid(),NULL,'feature_flag',v_id,NULL,NULL,'info','Feature flag changed',jsonb_build_object('name',p_name,'previous_enabled',v_previous,'enabled',p_enabled));
  RETURN jsonb_build_object('id',v_id,'name',p_name,'description',coalesce(p_description,''),'enabled',p_enabled,'updated_at',now());
END $$;

CREATE OR REPLACE FUNCTION public.replace_homepage_slides(p_slides jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_item jsonb; v_ids uuid[] := ARRAY[]::uuid[]; v_id uuid; v_count integer := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF jsonb_typeof(p_slides) <> 'array' THEN RAISE EXCEPTION 'Slides must be an array'; END IF;
  IF jsonb_array_length(p_slides) > 20 THEN RAISE EXCEPTION 'A maximum of 20 slides is supported'; END IF;
  UPDATE public.homepage_slides SET position=position+1000;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_slides) LOOP
    IF coalesce(btrim(v_item->>'image_url'),'')='' THEN RAISE EXCEPTION 'Every slide requires an image URL'; END IF;
    v_id := nullif(v_item->>'id','')::uuid;
    IF v_id IS NULL THEN
      INSERT INTO public.homepage_slides(image_url,alt_text,position,visible,published,created_by,updated_by)
      VALUES(v_item->>'image_url',coalesce(v_item->>'alt_text',''),v_count,coalesce((v_item->>'visible')::boolean,true),coalesce((v_item->>'published')::boolean,false),auth.uid(),auth.uid()) RETURNING id INTO v_id;
    ELSE
      UPDATE public.homepage_slides SET image_url=v_item->>'image_url',alt_text=coalesce(v_item->>'alt_text',''),position=v_count,
        visible=coalesce((v_item->>'visible')::boolean,true),published=coalesce((v_item->>'published')::boolean,false),updated_by=auth.uid(),updated_at=now()
      WHERE id=v_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Homepage slide not found'; END IF;
    END IF;
    v_ids := array_append(v_ids,v_id); v_count := v_count+1;
  END LOOP;
  DELETE FROM public.homepage_slides WHERE NOT (id=ANY(v_ids));
  PERFORM public.log_ops_event('homepage_slides.changed','configuration',auth.uid(),NULL,'homepage_slides',NULL,NULL,NULL,'info','Homepage slides updated',jsonb_build_object('slide_count',v_count));
  RETURN jsonb_build_object('slide_count',v_count,'updated_at',now());
END $$;

CREATE OR REPLACE FUNCTION public.admin_regenerate_daily_beat(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_job uuid; v_beat uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id) THEN RAISE EXCEPTION 'Member not found'; END IF;
  INSERT INTO public.daily_beat_ops_jobs(job_type,target_member_id,status,requested_by,started_at)
  VALUES('regenerate_member',p_user_id,'running',auth.uid(),now()) RETURNING id INTO v_job;
  BEGIN
    v_beat := public.create_daily_beat_for_user(p_user_id);
    UPDATE public.daily_beat_ops_jobs SET status='succeeded',result=jsonb_build_object('beat_id',v_beat),finished_at=now() WHERE id=v_job;
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.daily_beat_ops_jobs SET status='failed',error_message=SQLERRM,finished_at=now() WHERE id=v_job;
    PERFORM public.log_ops_event('daily_beat.regeneration_failed','daily_beat',auth.uid(),NULL,'daily_beat_job',v_job,NULL,p_user_id,'error','Daily Beat regeneration failed',jsonb_build_object('error',SQLERRM));
    RAISE;
  END;
  PERFORM public.log_ops_event('daily_beat.regenerated','daily_beat',auth.uid(),NULL,'daily_beat_job',v_job,NULL,p_user_id,'info','Daily Beat regenerated',jsonb_build_object('beat_id',v_beat));
  RETURN jsonb_build_object('job_id',v_job,'beat_id',v_beat,'member_id',p_user_id,'generated_at',now());
END $$;

CREATE OR REPLACE FUNCTION public.rerun_failed_daily_beat_jobs()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_row record; v_total integer:=0; v_succeeded integer:=0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  FOR v_row IN SELECT DISTINCT ON (target_member_id) target_member_id FROM public.daily_beat_ops_jobs WHERE status='failed' AND target_member_id IS NOT NULL ORDER BY target_member_id,created_at DESC LIMIT 100 LOOP
    v_total:=v_total+1;
    BEGIN PERFORM public.admin_regenerate_daily_beat(v_row.target_member_id); v_succeeded:=v_succeeded+1; EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
  PERFORM public.log_ops_event('daily_beat.failures_rerun','daily_beat',auth.uid(),NULL,'daily_beat_jobs',NULL,NULL,NULL,'info','Failed Daily Beat jobs rerun',jsonb_build_object('attempted',v_total,'succeeded',v_succeeded));
  RETURN jsonb_build_object('attempted',v_total,'succeeded',v_succeeded,'failed',v_total-v_succeeded);
END $$;

CREATE OR REPLACE FUNCTION public.get_daily_beat_ops_snapshot()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN jsonb_build_object(
    'queue',jsonb_build_object('queued',(SELECT count(*) FROM public.daily_beat_ops_jobs WHERE status='queued'),'running',(SELECT count(*) FROM public.daily_beat_ops_jobs WHERE status='running'),'failed',(SELECT count(*) FROM public.daily_beat_ops_jobs WHERE status='failed')),
    'history',(SELECT coalesce(jsonb_agg(to_jsonb(j) ORDER BY j.created_at DESC),'[]'::jsonb) FROM (SELECT * FROM public.daily_beat_ops_jobs ORDER BY created_at DESC LIMIT 50)j),
    'today',(SELECT count(*) FROM public.daily_beats WHERE active_date=current_date),
    'generated_at',now());
END $$;

CREATE OR REPLACE FUNCTION public.set_member_banned(p_member_id uuid,p_banned boolean,p_reason text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_previous boolean;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF p_banned AND coalesce(btrim(p_reason),'')='' THEN RAISE EXCEPTION 'A suspension reason is required'; END IF;
  SELECT is_banned INTO v_previous FROM public.profiles WHERE id=p_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
  UPDATE public.profiles SET is_banned=p_banned,updated_at=now() WHERE id=p_member_id;
  PERFORM public.log_ops_event(CASE WHEN p_banned THEN 'member.suspended' ELSE 'member.activated' END,'moderation',auth.uid(),NULL,'profile',p_member_id,NULL,p_member_id,
    CASE WHEN p_banned THEN 'warning' ELSE 'info' END,CASE WHEN p_banned THEN 'Member suspended' ELSE 'Member activated' END,jsonb_build_object('previous_banned',v_previous,'banned',p_banned,'reason',p_reason));
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.mark_ops_event_reviewed(p_event_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  UPDATE public.ops_event_log SET reviewed_by=auth.uid(),reviewed_at=now() WHERE id=p_event_id AND reviewed_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found or already reviewed'; END IF;
  PERFORM public.log_ops_event('event.reviewed','audit',auth.uid(),NULL,'ops_event',p_event_id,NULL,NULL,'info','Operations event reviewed','{}'::jsonb);
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.get_member_ops_full_summary(p_member_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
DECLARE v_base jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  v_base:=public.get_member_ops_summary(p_member_id);
  RETURN v_base || jsonb_build_object(
    'reports',jsonb_build_object('received',(SELECT count(*) FROM public.reports WHERE reported_id=p_member_id),'submitted',(SELECT count(*) FROM public.reports WHERE reporter_id=p_member_id)),
    'blocks',jsonb_build_object('blocked_by_member',(SELECT count(*) FROM public.blocks WHERE blocker_id=p_member_id),'blocked_member',(SELECT count(*) FROM public.blocks WHERE blocked_id=p_member_id)),
    'matches',jsonb_build_object('total',(SELECT count(*) FROM public.matches WHERE user1_id=p_member_id OR user2_id=p_member_id),'active',(SELECT count(*) FROM public.matches WHERE (user1_id=p_member_id OR user2_id=p_member_id) AND unmatched_at IS NULL)),
    'daily_beats',jsonb_build_object('total',(SELECT count(*) FROM public.daily_beats WHERE user_id=p_member_id),'latest',(SELECT active_date FROM public.daily_beats WHERE user_id=p_member_id ORDER BY active_date DESC LIMIT 1)),
    'timeline',(SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY e.created_at DESC),'[]'::jsonb) FROM (SELECT id,event_type,event_category,severity,summary,created_at FROM public.ops_event_log WHERE related_member_id=p_member_id OR subject_id=p_member_id ORDER BY created_at DESC LIMIT 50)e));
END $$;

CREATE OR REPLACE FUNCTION public.get_ops_center_dashboard()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN jsonb_build_object(
    'users',jsonb_build_object('total',(SELECT count(*) FROM public.profiles),'new_today',(SELECT count(*) FROM public.profiles WHERE created_at>=current_date),'active_today',(SELECT count(*) FROM public.profiles WHERE last_active_at>=current_date),'blocked',(SELECT count(*) FROM public.profiles WHERE is_banned)),
    'activity',jsonb_build_object('matches_today',(SELECT count(*) FROM public.matches WHERE created_at>=current_date),'messages_today',(SELECT count(*) FROM public.messages WHERE created_at>=current_date),'reports_total',(SELECT count(*) FROM public.reports),'reports_today',(SELECT count(*) FROM public.reports WHERE created_at>=current_date),'blocks_total',(SELECT count(*) FROM public.blocks)),
    'daily_beat',jsonb_build_object('today',(SELECT count(*) FROM public.daily_beats WHERE active_date=current_date),'failed_jobs',(SELECT count(*) FROM public.daily_beat_ops_jobs WHERE status='failed')),
    'cases',jsonb_build_object('open',(SELECT count(*) FROM public.ops_cases WHERE status NOT IN ('resolved','closed')),'critical',(SELECT count(*) FROM public.ops_cases WHERE status NOT IN ('resolved','closed') AND priority IN ('critical','urgent'))),
    'alerts',jsonb_build_object('critical_today',(SELECT count(*) FROM public.ops_event_log WHERE created_at>=current_date AND severity IN ('critical','error'))),
    'generated_at',now());
END $$;

-- Explicit privilege boundary for every new operator function.
REVOKE ALL ON FUNCTION public.moderate_profile_photo(text,uuid,text,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.enforce_photo_moderation_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_ops_broadcast(text,text,text,timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_ops_broadcast(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_ops_broadcast(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.upsert_feature_flag(text,text,boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.replace_homepage_slides(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rerun_failed_daily_beat_jobs() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_daily_beat_ops_snapshot() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_member_banned(uuid,boolean,text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.mark_ops_event_reviewed(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_member_ops_full_summary(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ops_center_dashboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_regenerate_daily_beat(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.moderate_profile_photo(text,uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_ops_broadcast(text,text,text,timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_ops_broadcast(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_ops_broadcast(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_feature_flag(text,text,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_homepage_slides(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rerun_failed_daily_beat_jobs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_beat_ops_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_banned(uuid,boolean,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_ops_event_reviewed(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_ops_full_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ops_center_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_regenerate_daily_beat(uuid) TO authenticated;

GRANT SELECT ON public.ops_broadcasts,public.ops_broadcast_deliveries,public.feature_flags,public.homepage_slides,public.daily_beat_ops_jobs TO authenticated;
