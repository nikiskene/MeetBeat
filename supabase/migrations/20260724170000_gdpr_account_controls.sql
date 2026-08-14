begin;

insert into public.legal_document_versions (document_id, version, title, body_md, effective_at, requires_reacceptance, status, published_at, summary)
select d.id, '2026.07.23', d.title,
  'Canonical BEAT legal text published in the application and effective 23 July 2026.',
  timestamptz '2026-07-23 00:00:00+00', true, 'active', timestamptz '2026-07-23 00:00:00+00',
  'Initial production legal version.'
from public.legal_documents d
where d.slug in ('privacy-policy', 'terms-of-service')
  and not exists (
    select 1 from public.legal_document_versions v
    where v.document_id = d.id and v.version = '2026.07.23'
  );

create table if not exists public.data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_type text not null check (request_type in ('export', 'deletion')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  reason text,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  cancelled_at timestamptz
);

create unique index if not exists data_subject_requests_one_pending_deletion
  on public.data_subject_requests(user_id)
  where request_type = 'deletion' and status = 'pending';
create index if not exists data_subject_requests_user_created
  on public.data_subject_requests(user_id, created_at desc);

alter table public.data_subject_requests enable row level security;
drop policy if exists "Users can view own data requests" on public.data_subject_requests;
create policy "Users can view own data requests" on public.data_subject_requests
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.record_signup_legal_acceptances(p_user uuid, p_metadata jsonb)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if coalesce((p_metadata ->> 'age_confirmed_18')::boolean, false) is not true
    or coalesce((p_metadata ->> 'privacy_accepted')::boolean, false) is not true
    or coalesce((p_metadata ->> 'eula_accepted')::boolean, false) is not true then
    return;
  end if;

  insert into public.user_legal_acceptances
    (user_id, document_version_id, accepted_at, language, user_agent, acceptance_source, metadata)
  select p_user, v.id,
    coalesce((p_metadata ->> 'legal_accepted_at')::timestamptz, now()),
    'en', p_metadata ->> 'legal_user_agent', 'signup',
    jsonb_build_object(
      'age_confirmed_18', true,
      'privacy_version', p_metadata ->> 'privacy_version',
      'eula_version', p_metadata ->> 'eula_version'
    )
  from public.legal_document_versions v
  join public.legal_documents d on d.id = v.document_id
  where d.slug in ('privacy-policy', 'terms-of-service')
    and v.version = '2026.07.23'
    and not exists (
      select 1 from public.user_legal_acceptances a
      where a.user_id = p_user and a.document_version_id = v.id
    );
end;
$$;

create or replace function public.capture_auth_user_legal_acceptances()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.record_signup_legal_acceptances(new.id, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end;
$$;

drop trigger if exists capture_auth_user_legal_acceptances on auth.users;
create trigger capture_auth_user_legal_acceptances
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.capture_auth_user_legal_acceptances();

create or replace function public.get_my_privacy_status()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'acceptances', coalesce((
      select jsonb_agg(jsonb_build_object(
        'document', d.slug,
        'title', d.title,
        'version', v.version,
        'accepted_at', a.accepted_at
      ) order by a.accepted_at desc)
      from public.user_legal_acceptances a
      left join public.legal_document_versions v on v.id = a.document_version_id
      left join public.legal_documents d on d.id = v.document_id
      where a.user_id = v_user
    ), '[]'::jsonb),
    'deletion_request', (
      select to_jsonb(r) from public.data_subject_requests r
      where r.user_id = v_user and r.request_type = 'deletion' and r.status = 'pending'
      order by r.created_at desc limit 1
    )
  );
end;
$$;

create or replace function public.request_account_deletion(p_reason text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_request public.data_subject_requests;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  select * into v_request from public.data_subject_requests
  where user_id = v_user and request_type = 'deletion' and status = 'pending'
  limit 1;
  if v_request.id is null then
    insert into public.data_subject_requests
      (user_id, request_type, status, reason, scheduled_for)
    values (v_user, 'deletion', 'pending', nullif(trim(p_reason), ''), now() + interval '7 days')
    returning * into v_request;
  end if;
  return to_jsonb(v_request);
end;
$$;

create or replace function public.cancel_account_deletion()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_request public.data_subject_requests;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  update public.data_subject_requests
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where user_id = v_user and request_type = 'deletion' and status = 'pending'
  returning * into v_request;
  return case when v_request.id is null then null else to_jsonb(v_request) end;
end;
$$;

create or replace function public.get_my_data_export()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
  v_rows jsonb;
  v_table record;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  v_result := jsonb_build_object(
    'generated_at', now(),
    'account', (select jsonb_build_object(
      'id', u.id, 'email', u.email, 'created_at', u.created_at,
      'last_sign_in_at', u.last_sign_in_at, 'metadata', u.raw_user_meta_data
    ) from auth.users u where u.id = v_user),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_user),
    'matches', coalesce((select jsonb_agg(to_jsonb(m)) from public.matches m
      where m.user1_id = v_user or m.user2_id = v_user), '[]'::jsonb),
    'messages', coalesce((select jsonb_agg(to_jsonb(msg)) from public.messages msg
      where msg.sender_id = v_user or msg.match_id in (
        select m.id from public.matches m where m.user1_id = v_user or m.user2_id = v_user
      )), '[]'::jsonb)
  );
  for v_table in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'user_id'
      and table_name not in ('legal_admins')
    order by table_name
  loop
    execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where user_id = $1', v_table.table_name)
      into v_rows using v_user;
    v_result := v_result || jsonb_build_object(v_table.table_name, v_rows);
  end loop;
  insert into public.data_subject_requests
    (user_id, request_type, status, completed_at)
  values (v_user, 'export', 'completed', now());
  return v_result;
end;
$$;

revoke all on function public.record_signup_legal_acceptances(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.get_my_privacy_status() from public, anon;
revoke all on function public.request_account_deletion(text) from public, anon;
revoke all on function public.cancel_account_deletion() from public, anon;
revoke all on function public.get_my_data_export() from public, anon;
grant execute on function public.get_my_privacy_status() to authenticated;
grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
grant execute on function public.get_my_data_export() to authenticated;

commit;