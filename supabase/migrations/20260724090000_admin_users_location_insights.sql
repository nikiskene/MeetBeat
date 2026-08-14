-- Production Admin user accuracy, normalized location capture, and regional insights.
-- All operator endpoints remain authenticated and super-admin guarded.

create or replace function public.get_admin_users(
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  display_name text,
  email text,
  avatar_url text,
  is_banned boolean,
  last_active_at timestamptz,
  city text,
  country text,
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_super_admin() then
    raise exception 'super admin access required' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    coalesce(p.display_name, split_part(u.email, '@', 1))::text,
    u.email::text,
    p.avatar_url::text,
    coalesce(p.is_banned, false),
    greatest(p.last_active_at, u.last_sign_in_at),
    p.city::text,
    p.country::text,
    coalesce(p.created_at, u.created_at),
    count(*) over ()
  from auth.users u
  left join public.profiles p on p.id = u.id
  where nullif(trim(p_search), '') is null
     or coalesce(p.display_name, '') ilike '%' || trim(p_search) || '%'
     or coalesce(u.email, '') ilike '%' || trim(p_search) || '%'
     or coalesce(p.city, '') ilike '%' || trim(p_search) || '%'
     or coalesce(p.country, '') ilike '%' || trim(p_search) || '%'
  order by coalesce(p.created_at, u.created_at) desc
  limit greatest(1, least(coalesce(p_limit, 20), 100))
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.get_admin_users(text, integer, integer) from public;
revoke all on function public.get_admin_users(text, integer, integer) from anon;
grant execute on function public.get_admin_users(text, integer, integer) to authenticated;

alter table public.profiles
  add column if not exists region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_place_id bigint,
  add column if not exists location_updated_at timestamptz;

create index if not exists profiles_country_region_idx
  on public.profiles (country, region)
  where is_banned = false;

create or replace function public.get_my_region_community()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.region is null or v_profile.country is null then
    return jsonb_build_object('available', false, 'reason', 'location_required');
  end if;

  select count(*) into v_count
  from public.profiles
  where is_banned = false
    and region = v_profile.region
    and country = v_profile.country;

  return jsonb_build_object(
    'available', true,
    'region', v_profile.region,
    'country', v_profile.country,
    'member_count', case when v_count >= 3 then v_count else null end,
    'privacy_threshold_met', v_count >= 3
  );
end;
$$;

revoke all on function public.get_my_region_community() from public;
revoke all on function public.get_my_region_community() from anon;
grant execute on function public.get_my_region_community() to authenticated;

create or replace function public.get_admin_region_counts()
returns table (region text, country text, member_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'super admin access required' using errcode = '42501';
  end if;
  return query
  select p.region, p.country, count(*)
  from public.profiles p
  where p.is_banned = false and p.region is not null and p.country is not null
  group by p.region, p.country
  order by count(*) desc, p.country, p.region;
end;
$$;

revoke all on function public.get_admin_region_counts() from public;
revoke all on function public.get_admin_region_counts() from anon;
grant execute on function public.get_admin_region_counts() to authenticated;

create or replace function public.get_ops_center_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'users', jsonb_build_object(
      'total', (select count(*) from auth.users),
      'new_today', (select count(*) from auth.users where created_at >= current_date),
      'active_today', (select count(*) from auth.users where last_sign_in_at >= current_date),
      'blocked', (select count(*) from public.profiles where is_banned)
    ),
    'activity', jsonb_build_object(
      'matches_today', (select count(*) from public.matches where created_at >= current_date),
      'messages_today', (select count(*) from public.messages where created_at >= current_date),
      'reports_total', (select count(*) from public.reports),
      'reports_today', (select count(*) from public.reports where created_at >= current_date),
      'blocks_total', (select count(*) from public.blocks)
    ),
    'daily_beat', jsonb_build_object(
      'today', (select count(*) from public.daily_beats where active_date = current_date),
      'failed_jobs', (select count(*) from public.daily_beat_ops_jobs where status = 'failed')
    ),
    'cases', jsonb_build_object(
      'open', (select count(*) from public.ops_cases where status not in ('resolved','closed')),
      'critical', (select count(*) from public.ops_cases where status not in ('resolved','closed') and priority in ('critical','urgent'))
    ),
    'alerts', jsonb_build_object(
      'critical_today', (select count(*) from public.ops_event_log where created_at >= current_date and severity in ('critical','error'))
    ),
    'generated_at', now()
  );
end;
$$;

revoke all on function public.get_ops_center_dashboard() from public;
revoke all on function public.get_ops_center_dashboard() from anon;
grant execute on function public.get_ops_center_dashboard() to authenticated;
