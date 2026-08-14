-- Protected notes and normalized CRM snapshot for web administrators only.
create table if not exists public.admin_member_crm_notes (
  member_id uuid primary key references auth.users(id) on delete cascade,
  crm_status text,
  crm_owner uuid references auth.users(id) on delete set null,
  crm_tags text[] not null default '{}',
  admin_notes text,
  last_admin_contact_at timestamptz,
  next_admin_action_at timestamptz,
  updated_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.admin_member_crm_notes enable row level security;
revoke all on table public.admin_member_crm_notes from public, anon, authenticated;

create or replace function public.get_admin_member_crm(p_member_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('admin', 'super_admin')
  ) then
    raise exception 'Administrator access required';
  end if;
  select jsonb_build_object(
    'identity', jsonb_build_object(
      'user_id', p.id, 'display_name', p.display_name, 'full_name', p.first_name,
      'email', u.email, 'email_confirmed_at', u.email_confirmed_at,
      'created_at', p.created_at, 'updated_at', p.updated_at,
      'last_active_at', p.last_active_at, 'deleted_at', u.deleted_at,
      'account_status', case when u.deleted_at is not null then 'deleted'
        when p.is_banned then 'suspended' else 'active' end,
      'is_active', u.deleted_at is null and not coalesce(p.is_banned, false)
    ),
    'profile', jsonb_build_object(
      'gender', p.gender, 'birthdate', p.birthdate,
      'age', extract(year from age(p.birthdate)), 'city', p.city, 'country', p.country,
      'latitude', p.latitude, 'longitude', p.longitude, 'bio', p.bio,
      'relationship_intention', p.relationship_intention,
      'photo_count', (select count(*) from profile_photos ph where ph.user_id = p.id),
      'primary_photo_url', p.avatar_url, 'profile_verified', p.is_verified
    ),
    'discovery_settings', to_jsonb(ds),
    'connection_interview', case when cp.user_id is null then null else jsonb_build_object(
      'questionnaire_version', cp.questionnaire_version, 'answers', cp.answers,
      'profile_identifier', cp.profile->>'identifier',
      'dimensions', cp.profile->'dimensions', 'labels', cp.profile->'labels',
      'completed_at', cp.completed_at, 'updated_at', cp.updated_at
    ) end,
    'current_beat', case when ab.user_id is null then null else jsonb_build_object(
      'beat', ab.beat, 'selected_at', ab.selected_at, 'expires_at', ab.expires_at,
      'is_expired', ab.expires_at <= now()
    ) end,
    'engagement', jsonb_build_object(
      'likes_sent_count', (select count(*) from discovery_decisions d where d.actor_id = p.id and d.decision = 'like'),
      'passes_count', (select count(*) from discovery_decisions d where d.actor_id = p.id and d.decision = 'skip'),
      'matches_count', (select count(*) from matches m where p.id in (m.user1_id, m.user2_id)),
      'active_matches_count', (select count(*) from matches m where p.id in (m.user1_id, m.user2_id) and m.unmatched_at is null),
      'messages_sent_count', (select count(*) from messages m where m.sender_id = p.id),
      'last_message_at', (select max(m.created_at) from messages m where m.sender_id = p.id)
    ),
    'safety', jsonb_build_object(
      'reports_received_count', (select count(*) from reports r where r.reported_id = p.id),
      'reports_submitted_count', (select count(*) from reports r where r.reporter_id = p.id),
      'blocks_created_count', (select count(*) from blocks b where b.blocker_id = p.id),
      'blocks_received_count', (select count(*) from blocks b where b.blocked_id = p.id),
      'is_banned', p.is_banned
    ),
    'crm', to_jsonb(crm)
  )
  into result
  from profiles p
  join auth.users u on u.id = p.id
  left join discovery_settings ds on ds.user_id = p.id
  left join connection_profiles cp on cp.user_id = p.id
  left join active_beats ab on ab.user_id = p.id
  left join admin_member_crm_notes crm on crm.member_id = p.id
  where p.id = p_member_id;
  return result;
end
$$;

revoke all on function public.get_admin_member_crm(uuid) from public, anon, authenticated;
grant execute on function public.get_admin_member_crm(uuid) to authenticated;
