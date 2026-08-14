create or replace function public.get_admin_location_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.is_super_admin() then
    raise exception 'Admin access required';
  end if;
  return jsonb_build_object(
    'coverage', (
      select jsonb_build_object(
        'total', count(*),
        'mapped', count(*) filter (where latitude is not null and longitude is not null),
        'country_only', count(*) filter (where country is not null and (city is null or latitude is null or longitude is null)),
        'missing', count(*) filter (where country is null and city is null),
        'ambiguous', count(*) filter (where city is not null and (country is null or latitude is null or longitude is null))
      ) from public.profiles where coalesce(is_banned,false)=false
    ),
    'points', coalesce((
      select jsonb_agg(jsonb_build_object(
        'city', city, 'region', region, 'country', country,
        'latitude', latitude, 'longitude', longitude, 'member_count', member_count
      ) order by member_count desc, country, city)
      from (
        select city, region, country, round(latitude::numeric,4)::double precision latitude,
          round(longitude::numeric,4)::double precision longitude, count(*)::integer member_count
        from public.profiles
        where coalesce(is_banned,false)=false and latitude is not null and longitude is not null
        group by city, region, country, round(latitude::numeric,4), round(longitude::numeric,4)
      ) grouped
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.get_admin_location_snapshot() from public, anon;
grant execute on function public.get_admin_location_snapshot() to authenticated;
