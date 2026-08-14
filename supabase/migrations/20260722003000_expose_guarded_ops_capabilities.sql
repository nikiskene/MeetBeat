-- Expose existing operator capabilities and add only the guarded operations
-- supported by the current schema. All writes require an authenticated admin
-- or super_admin and are recorded in ops_event_log.

CREATE OR REPLACE FUNCTION public.update_ops_case_priority(
  p_case_id uuid,
  p_priority public.ops_case_priority
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_previous public.ops_case_priority;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT priority INTO v_previous
  FROM public.ops_cases
  WHERE id = p_case_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  UPDATE public.ops_cases
  SET priority = p_priority, updated_at = now()
  WHERE id = p_case_id;

  PERFORM public.log_ops_event(
    'case.priority_changed', 'moderation', auth.uid(), NULL, 'ops_case',
    p_case_id, p_case_id, NULL, 'info', 'Moderation case priority changed',
    jsonb_build_object('previous_priority', v_previous, 'priority', p_priority)
  );
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_ops_case(
  p_case_id uuid,
  p_status public.ops_case_status DEFAULT 'triage'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_previous public.ops_case_status;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_status IN ('resolved', 'closed') THEN
    RAISE EXCEPTION 'A reopened case must use an active status';
  END IF;

  SELECT status INTO v_previous
  FROM public.ops_cases
  WHERE id = p_case_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found';
  END IF;
  IF v_previous NOT IN ('resolved', 'closed') THEN
    RAISE EXCEPTION 'Only resolved or closed cases can be reopened';
  END IF;

  UPDATE public.ops_cases
  SET status = p_status,
      decision = NULL,
      resolution = NULL,
      resolved_by = NULL,
      resolved_at = NULL,
      closed_by = NULL,
      closed_at = NULL,
      updated_at = now()
  WHERE id = p_case_id;

  PERFORM public.log_ops_event(
    'case.reopened', 'moderation', auth.uid(), NULL, 'ops_case',
    p_case_id, p_case_id, NULL, 'info', 'Moderation case reopened',
    jsonb_build_object('previous_status', v_previous, 'status', p_status)
  );
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_existing_ops_setting(
  p_key text,
  p_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_previous jsonb;
  v_result jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF p_key IS NULL OR btrim(p_key) = '' OR p_value IS NULL THEN
    RAISE EXCEPTION 'Setting key and value are required';
  END IF;

  SELECT value INTO v_previous
  FROM public.ops_settings
  WHERE key = p_key
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown setting: %', p_key;
  END IF;

  UPDATE public.ops_settings
  SET value = p_value, updated_by = auth.uid(), updated_at = now()
  WHERE key = p_key
  RETURNING jsonb_build_object('key', key, 'value', value, 'updated_at', updated_at)
  INTO v_result;

  PERFORM public.log_ops_event(
    'setting.changed', 'configuration', auth.uid(), NULL, 'ops_setting',
    NULL, NULL, NULL, 'info', 'Operations setting changed',
    jsonb_build_object('key', p_key, 'previous_value', v_previous, 'value', p_value)
  );
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_regenerate_daily_beat(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_beat_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  v_beat_id := public.create_daily_beat_for_user(p_user_id);

  PERFORM public.log_ops_event(
    'daily_beat.regenerated', 'daily_beat', auth.uid(), NULL, 'daily_beat',
    v_beat_id, NULL, p_user_id, CASE WHEN v_beat_id IS NULL THEN 'warning' ELSE 'info' END,
    CASE WHEN v_beat_id IS NULL THEN 'Daily Beat regeneration produced no candidate' ELSE 'Daily Beat regenerated' END,
    jsonb_build_object('beat_id', v_beat_id, 'member_id', p_user_id)
  );
  RETURN jsonb_build_object('beat_id', v_beat_id, 'member_id', p_user_id, 'generated_at', now());
END;
$$;

CREATE OR REPLACE FUNCTION public.inspect_ops_case_messages(p_case_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_case_number bigint;
  v_primary_member uuid;
  v_match_ids uuid[];
  v_message_ids uuid[];
  v_messages jsonb;
  v_count integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT case_number, primary_member_id INTO v_case_number, v_primary_member
  FROM public.ops_cases
  WHERE id = p_case_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Case not found';
  END IF;

  SELECT coalesce(array_agg(DISTINCT linked_id) FILTER (WHERE linked_id IS NOT NULL), ARRAY[]::uuid[])
  INTO v_match_ids
  FROM public.ops_case_links
  WHERE case_id = p_case_id AND link_type IN ('match', 'conversation');

  SELECT coalesce(array_agg(DISTINCT linked_id) FILTER (WHERE linked_id IS NOT NULL), ARRAY[]::uuid[])
  INTO v_message_ids
  FROM public.ops_case_links
  WHERE case_id = p_case_id AND link_type = 'message';

  IF cardinality(v_match_ids) = 0 AND cardinality(v_message_ids) = 0 THEN
    RAISE EXCEPTION 'This case has no linked conversation or message';
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id,
    'match_id', m.match_id,
    'sender_id', m.sender_id,
    'type', m.type,
    'content', m.content,
    'created_at', m.created_at,
    'delivered_at', m.delivered_at,
    'read_at', m.read_at
  ) ORDER BY m.created_at), '[]'::jsonb), count(*)
  INTO v_messages, v_count
  FROM public.messages m
  WHERE m.match_id = ANY(v_match_ids) OR m.id = ANY(v_message_ids);

  PERFORM public.log_ops_event(
    'case.messages_inspected', 'moderation', auth.uid(), NULL, 'ops_case',
    p_case_id, p_case_id, v_primary_member, 'warning', 'Case-linked messages inspected',
    jsonb_build_object('case_number', v_case_number, 'message_count', v_count, 'match_ids', v_match_ids, 'message_ids', v_message_ids)
  );

  RETURN jsonb_build_object(
    'case_id', p_case_id,
    'case_number', v_case_number,
    'primary_member_id', v_primary_member,
    'match_ids', v_match_ids,
    'messages', v_messages,
    'inspected_at', now()
  );
END;
$$;

-- PostgreSQL grants EXECUTE to PUBLIC by default. Remove it explicitly for all
-- operator surfaces, then grant only to signed-in users. Each function also
-- performs its own admin check before reading or changing data.
REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_ops_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_beat_ops_dashboard() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_member_ops_summary(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ops_case_detail(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_beat_engine_health(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ops_setting(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.add_ops_case_note(uuid, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.assign_ops_case(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_ops_case_status(uuid, public.ops_case_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.resolve_ops_case(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.close_ops_case(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.refresh_beat_engine_metrics_for_date(date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_ops_case_priority(uuid, public.ops_case_priority) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reopen_ops_case(uuid, public.ops_case_status) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_existing_ops_setting(text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_regenerate_daily_beat(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.inspect_ops_case_messages(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_ops_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_beat_ops_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_member_ops_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ops_case_detail(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_beat_engine_health(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ops_setting(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_ops_case_note(uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_ops_case(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ops_case_status(uuid, public.ops_case_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_ops_case(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_ops_case(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_beat_engine_metrics_for_date(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ops_case_priority(uuid, public.ops_case_priority) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_ops_case(uuid, public.ops_case_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_existing_ops_setting(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_regenerate_daily_beat(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inspect_ops_case_messages(uuid) TO authenticated;
