-- BEAT connection discovery and reactions.
-- Validated against the live iwvdnvryzyvvstahqqqu schema on 2026-07-30.
-- Shared copy is seeded separately into the existing public.app_content table.

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (emoji in ('❤️','👍','😂','😮','😢','👎')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

alter table public.message_reactions enable row level security;

drop policy if exists "match members read reactions" on public.message_reactions;
create policy "match members read reactions" on public.message_reactions
for select to authenticated using (
  exists (
    select 1
    from public.messages m
    join public.matches mt on mt.id = m.match_id
    where m.id = message_id
      and mt.unmatched_at is null
      and auth.uid() in (mt.user1_id, mt.user2_id)
  )
);

create or replace function public.set_message_reaction(
  p_message_id uuid,
  p_emoji text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1
    from messages m
    join matches mt on mt.id = m.match_id
    where m.id = p_message_id
      and mt.unmatched_at is null
      and auth.uid() in (mt.user1_id, mt.user2_id)
  ) then
    raise exception 'Message is unavailable';
  end if;
  if p_emoji is null then
    delete from message_reactions
    where message_id = p_message_id and user_id = auth.uid();
  elsif p_emoji not in ('❤️','👍','😂','😮','😢','👎') then
    raise exception 'Unsupported reaction';
  else
    insert into message_reactions(message_id, user_id, emoji)
    values (p_message_id, auth.uid(), p_emoji)
    on conflict (message_id, user_id) do update
      set emoji = excluded.emoji, updated_at = now();
  end if;
end
$$;

create or replace function public.connection_compatibility(a jsonb, b jsonb)
returns numeric
language plpgsql
immutable
as $$
declare
  dimension text;
  weights numeric[] := array[0.25, 0.25, 0.20, 0.15, 0.15];
  names text[] := array['depth', 'directness', 'focus', 'structure', 'pace'];
  score numeric := 0;
  i integer;
begin
  if a is null or b is null then return 0.5; end if;
  for i in 1..5 loop
    dimension := names[i];
    if not (a ? dimension and b ? dimension)
       or (a->>dimension) !~ '^[0-4]$'
       or (b->>dimension) !~ '^[0-4]$' then
      return 0.5;
    end if;
    score := score + (
      1 - abs((a->>dimension)::numeric - (b->>dimension)::numeric) / 4
    ) * weights[i];
  end loop;
  return score;
end
$$;

create or replace function public.get_discovery_candidates_v2(
  p_limit integer default 50,
  p_offset integer default 0
) returns table (
  id uuid,
  display_name text,
  birthdate date,
  gender text,
  relationship_intention text,
  bio text,
  city text,
  country text,
  location_label text,
  avatar_url text,
  selected_beat text
)
language sql
stable
security definer
set search_path = public
as $$
  with caller as (
    select
      p.*,
      coalesce(ds.interested_in::text[], p.interested_in::text[], array[]::text[]) wanted,
      coalesce(ds.min_age, 18) min_age,
      coalesce(ds.max_age, 120) max_age,
      coalesce(ds.max_distance_km, 100) max_distance,
      ab.beat,
      cp.profile->'dimensions' dimensions
    from profiles p
    join active_beats ab on ab.user_id = p.id and ab.expires_at > now()
    left join discovery_settings ds on ds.user_id = p.id
    left join connection_profiles cp on cp.user_id = p.id
    where p.id = auth.uid() and not coalesce(p.is_banned, false)
  ),
  eligible as (
    select
      candidate.*,
      c.beat selected_beat,
      connection_compatibility(
        c.dimensions,
        candidate_cp.profile->'dimensions'
      ) compatibility,
      case
        when c.latitude is null or c.longitude is null
          or candidate.latitude is null or candidate.longitude is null then null
        else 6371 * 2 * asin(sqrt(
          power(sin(radians(candidate.latitude - c.latitude) / 2), 2) +
          cos(radians(c.latitude)) * cos(radians(candidate.latitude)) *
          power(sin(radians(candidate.longitude - c.longitude) / 2), 2)
        ))
      end distance_km
    from caller c
    join active_beats candidate_beat
      on candidate_beat.beat = c.beat
      and candidate_beat.expires_at > now()
      and candidate_beat.user_id <> c.id
    join profiles candidate on candidate.id = candidate_beat.user_id
    join auth.users candidate_user
      on candidate_user.id = candidate.id and candidate_user.deleted_at is null
    left join discovery_settings candidate_ds on candidate_ds.user_id = candidate.id
    left join connection_profiles candidate_cp on candidate_cp.user_id = candidate.id
    where not coalesce(candidate.is_banned, false)
      and candidate.birthdate is not null
      and candidate.gender is not null
      and (cardinality(c.wanted) = 0 or candidate.gender::text = any(c.wanted))
      and (
        cardinality(coalesce(
          candidate_ds.interested_in::text[],
          candidate.interested_in::text[],
          array[]::text[]
        )) = 0
        or c.gender::text = any(coalesce(
          candidate_ds.interested_in::text[],
          candidate.interested_in::text[]
        ))
      )
      and extract(year from age(candidate.birthdate)) between c.min_age and c.max_age
      and extract(year from age(c.birthdate)) between
        coalesce(candidate_ds.min_age, 18) and coalesce(candidate_ds.max_age, 120)
      and not exists (
        select 1 from blocks b
        where (b.blocker_id = c.id and b.blocked_id = candidate.id)
           or (b.blocker_id = candidate.id and b.blocked_id = c.id)
      )
      and not exists (
        select 1 from discovery_decisions d
        where d.actor_id = c.id and d.target_id = candidate.id
      )
  )
  select
    e.id, e.display_name, e.birthdate, e.gender::text, e.relationship_intention,
    e.bio, e.city, e.country, e.location_label, e.avatar_url, e.selected_beat
  from eligible e
  cross join caller c
  where e.distance_km is not null
    and e.distance_km <= c.max_distance
    and e.distance_km <= coalesce(
      (select max_distance_km from discovery_settings where user_id = e.id),
      100
    )
  order by
    e.compatibility desc,
    e.last_active_at desc nulls last,
    e.distance_km asc,
    e.id
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0)
$$;

revoke all on table public.message_reactions from public, anon;
grant select on table public.message_reactions to authenticated;
revoke all on function public.set_message_reaction(uuid, text) from public, anon;
grant execute on function public.set_message_reaction(uuid, text) to authenticated;
revoke all on function public.get_discovery_candidates_v2(integer, integer) from public, anon;
grant execute on function public.get_discovery_candidates_v2(integer, integer) to authenticated;
