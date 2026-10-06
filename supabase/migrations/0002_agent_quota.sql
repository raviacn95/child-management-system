-- Request counters for the willow-agent Edge Function. Buckets hold a hashed client key, never an IP or request text.
create table if not exists public.agent_quota (
  bucket text primary key,
  hits integer not null default 0,
  expires_at timestamptz not null
);

alter table public.agent_quota enable row level security;

create or replace function public.agent_take(p_bucket text, p_ttl interval)
returns integer language sql security definer set search_path = public
as $$
  insert into public.agent_quota as q (bucket, hits, expires_at)
  values (p_bucket, 1, now() + p_ttl)
  on conflict (bucket) do update set hits = q.hits + 1
  returning q.hits
$$;

create or replace function public.agent_allow(
  p_client text,
  p_minute_limit integer,
  p_client_daily_limit integer,
  p_daily_limit integer
)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  stamp_day text := to_char(now() at time zone 'utc', 'YYYYMMDD');
  stamp_minute text := to_char(now() at time zone 'utc', 'YYYYMMDDHH24MI');
begin
  if p_client is null or length(p_client) not between 8 and 80 then
    return false;
  end if;
  if random() < 0.02 then
    delete from public.agent_quota where expires_at < now();
  end if;
  if public.agent_take('m:' || p_client || ':' || stamp_minute, interval '2 minutes') > p_minute_limit then
    return false;
  end if;
  if public.agent_take('d:' || p_client || ':' || stamp_day, interval '2 days') > p_client_daily_limit then
    return false;
  end if;
  return public.agent_take('g:' || stamp_day, interval '2 days') <= p_daily_limit;
end;
$$;

revoke all on function public.agent_take(text, interval) from public, anon, authenticated;
revoke all on function public.agent_allow(text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.agent_take(text, interval) to service_role;
grant execute on function public.agent_allow(text, integer, integer, integer) to service_role;
